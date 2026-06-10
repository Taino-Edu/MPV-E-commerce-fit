import { db } from "@/lib/db"

type ReserveItem = { variantId: string; qty: number }

export async function reserveStock(items: ReserveItem[]) {
  return db.$transaction(async (tx) => {
    for (const { variantId, qty } of items) {
      const updated = await tx.$executeRaw`
        UPDATE "Inventory"
        SET "stockAvailable" = "stockAvailable" - ${qty}
        WHERE "variantId" = ${variantId}
          AND "stockAvailable" >= ${qty}
      `
      if (updated === 0) {
        const inv = await tx.inventory.findUnique({ where: { variantId } })
        throw new Error(
          `Estoque insuficiente para ${variantId}. Disponível: ${inv?.stockAvailable ?? 0}`
        )
      }
    }
  })
}

export async function releaseStock(items: ReserveItem[]) {
  return db.$transaction(
    items.map(({ variantId, qty }) =>
      db.inventory.update({
        where: { variantId },
        data: { stockAvailable: { increment: qty } },
      })
    )
  )
}

export async function confirmStock(items: ReserveItem[]) {
  return db.$transaction(
    items.map(({ variantId, qty }) =>
      db.inventory.update({
        where: { variantId },
        data: { stockPhysical: { decrement: qty } },
      })
    )
  )
}
