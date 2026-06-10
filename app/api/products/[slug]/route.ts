import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await db.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
        include: {
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
          inventory: true,
        },
        orderBy: { attributeValue: "asc" },
      },
    },
  })

  if (!product) return NextResponse.json(null, { status: 404 })

  return NextResponse.json({
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      price: v.price.toNumber(),
      weightKg: v.weightKg.toNumber(),
    })),
  })
}
