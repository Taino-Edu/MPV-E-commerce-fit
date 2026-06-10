import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { releaseStock } from "@/lib/inventory"

export async function GET(req: NextRequest) {
  // Proteção básica do cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const expiredOrders = await db.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      expiresAt: { lt: new Date() },
    },
    include: { items: true },
  })

  let expired = 0
  for (const order of expiredOrders) {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "EXPIRED" },
      })
    })
    await releaseStock(order.items.map((i) => ({ variantId: i.variantId, qty: i.quantity })))
    expired++
  }

  return NextResponse.json({ expired, processedAt: new Date().toISOString() })
}
