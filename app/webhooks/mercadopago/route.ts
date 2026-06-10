import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { confirmStock } from "@/lib/inventory"
import { MercadoPagoConfig, Payment } from "mercadopago"
import crypto from "crypto"

function validateSignature(req: NextRequest, rawBody: string): boolean {
  const xSignature = req.headers.get("x-signature")
  const xRequestId = req.headers.get("x-request-id")
  const dataId = req.nextUrl.searchParams.get("data.id")

  if (!xSignature) return false

  const parts = xSignature.split(",")
  const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1]
  const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1]

  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto
    .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET!)
    .update(manifest)
    .digest("hex")

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!validateSignature(req, rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { type, data } = JSON.parse(rawBody)

  if (type !== "payment") return NextResponse.json({ ok: true })

  const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! })
  const paymentClient = new Payment(mp)
  const mpPayment = await paymentClient.get({ id: data.id })

  const orderId = mpPayment.external_reference
  if (!orderId) return NextResponse.json({ ok: true })

  const payment = await db.payment.findFirst({ where: { orderId } })
  if (!payment) return NextResponse.json({ ok: true })

  const status = mpPayment.status

  if (status === "approved" && payment.status === "PENDING") {
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "APPROVED", externalId: String(mpPayment.id), paidAt: new Date() },
      })
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", expiresAt: null },
      })
    })

    const orderItems = await db.orderItem.findMany({ where: { orderId } })
    await confirmStock(orderItems.map((i) => ({ variantId: i.variantId, qty: i.quantity })))
  }

  if (["cancelled", "rejected", "refunded", "charged_back"].includes(status ?? "")) {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: status === "cancelled" ? "CANCELLED" : status === "refunded" ? "REFUNDED" : "REJECTED" },
    })
  }

  return NextResponse.json({ ok: true })
}
