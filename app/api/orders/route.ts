import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { reserveStock } from "@/lib/inventory"
import { z } from "zod"
import { MercadoPagoConfig, Payment } from "mercadopago"

const orderSchema = z.object({
  items: z.array(z.object({ variantId: z.string(), quantity: z.number().int().min(1) })).min(1),
  addressId: z.string(),
  freightProvider: z.string(),
  freightService: z.string(),
  freightPrice: z.number().min(0),
  freightDeadline: z.number().int().min(0),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await req.json()
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { items, addressId, freightProvider, freightService, freightPrice, freightDeadline, paymentMethod, cardToken, installments } = parsed.data

  const variants = await db.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) }, isActive: true },
    include: { inventory: true },
  })

  if (variants.length !== items.length) {
    return NextResponse.json({ error: "Produto inválido no carrinho" }, { status: 400 })
  }

  const subtotal = items.reduce((acc, item) => {
    const v = variants.find((v) => v.id === item.variantId)!
    return acc + v.price.toNumber() * item.quantity
  }, 0)

  const total = subtotal + freightPrice

  // Reserva de estoque (atômica)
  try {
    await reserveStock(items.map((i) => ({ variantId: i.variantId, qty: i.quantity })))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }

  const pixExpiry = new Date(Date.now() + 30 * 60 * 1000)     // +30min
  const boletoExpiry = new Date(Date.now() + 3 * 24 * 3600 * 1000) // +3 dias
  const orderExpiry = paymentMethod === "PIX" ? pixExpiry : boletoExpiry

  // Cria pedido
  const order = await db.order.create({
    data: {
      userId: session.user.id,
      addressId,
      freightProvider,
      freightService,
      freightPrice,
      freightDeadline,
      subtotal,
      total,
      expiresAt: paymentMethod !== "CREDIT_CARD" ? orderExpiry : null,
      items: {
        create: items.map((i) => {
          const v = variants.find((v) => v.id === i.variantId)!
          return {
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: v.price,
            weightKg: v.weightKg,
          }
        }),
      },
    },
  })

  // Integração Mercado Pago
  const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
  const paymentClient = new Payment(mp)

  const user = await db.user.findUnique({ where: { id: session.user.id } })

  const paymentData: any = {
    transaction_amount: total,
    description: `Pedido #${order.id} — START Fitness`,
    payment_method_id: paymentMethod === "PIX" ? "pix" : paymentMethod === "BOLETO" ? "bolbradesco" : "credit_card",
    payer: { email: user!.email, first_name: user!.name ?? "Cliente" },
    external_reference: order.id,
    notification_url: `${process.env.NEXTAUTH_URL}/webhooks/mercadopago`,
  }

  if (paymentMethod === "CREDIT_CARD") {
    paymentData.token = cardToken
    paymentData.installments = installments ?? 1
  }

  let mpPayment: any
  try {
    mpPayment = await paymentClient.create({ body: paymentData })
  } catch (err) {
    await db.order.delete({ where: { id: order.id } })
    // Devolve estoque
    const { releaseStock } = await import("@/lib/inventory")
    await releaseStock(items.map((i) => ({ variantId: i.variantId, qty: i.quantity })))
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 502 })
  }

  // Salva pagamento
  await db.payment.create({
    data: {
      orderId: order.id,
      method: paymentMethod,
      externalId: String(mpPayment.id),
      amount: total,
      pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code ?? null,
      pixQrCodeB64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      pixExpiresAt: paymentMethod === "PIX" ? pixExpiry : null,
      boletoUrl: mpPayment.transaction_details?.external_resource_url ?? null,
      boletoExpiresAt: paymentMethod === "BOLETO" ? boletoExpiry : null,
    },
  })

  return NextResponse.json({
    orderId: order.id,
    status: paymentMethod === "CREDIT_CARD" ? mpPayment.status : "pending",
    pixQrCode: mpPayment.point_of_interaction?.transaction_data?.qr_code,
    pixQrCodeB64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
    boletoUrl: mpPayment.transaction_details?.external_resource_url,
    total,
  }, { status: 201 })
}
