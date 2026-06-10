import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const variants = await db.productVariant.findMany({
      where: { isActive: true },
      take: 1,
      include: {
        product: true,
        images: { take: 1 },
        inventory: true,
      },
    })
    return NextResponse.json({ ok: true, count: variants.length, sample: variants[0] ?? null })
  } catch (error: unknown) {
    const e = error as { message?: string; code?: string; stack?: string; meta?: unknown }
    return NextResponse.json({
      ok: false,
      message: e.message,
      code: e.code,
      meta: e.meta,
      stack: e.stack?.split("\n").slice(0, 5).join("\n"),
    }, { status: 500 })
  }
}
