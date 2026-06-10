import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { orderId } = await params

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, slug: true } },
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
      address: true,
      payment: true,
      shipment: true,
    },
  })

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

  // Apenas o próprio usuário ou admin pode ver
  if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    ...order,
    total: order.total.toNumber(),
    subtotal: order.subtotal.toNumber(),
    freightPrice: order.freightPrice?.toNumber() ?? null,
    payment: order.payment
      ? { ...order.payment, amount: order.payment.amount.toNumber() }
      : null,
    items: order.items.map((i) => ({
      ...i,
      unitPrice: i.unitPrice.toNumber(),
      weightKg: i.weightKg.toNumber(),
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { orderId } = await params
  const { status, trackingCode } = await req.json()

  const order = await db.order.update({
    where: { id: orderId },
    data: { status },
  })

  if (trackingCode) {
    await db.shipment.upsert({
      where: { orderId },
      create: { orderId, trackingCode, carrier: "Melhor Envio", dispatchedAt: new Date() },
      update: { trackingCode, dispatchedAt: new Date() },
    })
  }

  return NextResponse.json(order)
}
