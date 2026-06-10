import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import bcrypt from "bcryptjs"

const createSchema = z.object({
  categoryId: z.string(),
  slug: z.string().min(3),
  name: z.string().min(2),
  description: z.string().optional(),
  variants: z.array(
    z.object({
      sku: z.string(),
      attributeValue: z.string(),
      price: z.number().positive(),
      weightKg: z.number().positive(),
      heightCm: z.number().positive(),
      widthCm: z.number().positive(),
      depthCm: z.number().positive(),
      stockInitial: z.number().int().min(0).default(0),
    })
  ).min(1),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const categoria = searchParams.get("categoria") ?? undefined
  const busca = searchParams.get("busca") ?? undefined
  const page = Number(searchParams.get("pagina") ?? 1)
  const PAGE_SIZE = 24

  const where = {
    isActive: true,
    ...(categoria ? { category: { slug: categoria } } : {}),
    ...(busca ? { name: { contains: busca, mode: "insensitive" as const } } : {}),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          include: { images: { where: { isPrimary: true }, take: 1 }, inventory: true },
          take: 1,
          orderBy: { price: "asc" },
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ])

  return NextResponse.json({ products, total, pages: Math.ceil(total / PAGE_SIZE) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { categoryId, slug, name, description, variants } = parsed.data

  const product = await db.product.create({
    data: {
      categoryId,
      slug,
      name,
      description,
      variants: {
        create: variants.map((v) => ({
          sku: v.sku,
          attributeValue: v.attributeValue,
          price: v.price,
          weightKg: v.weightKg,
          heightCm: v.heightCm,
          widthCm: v.widthCm,
          depthCm: v.depthCm,
          inventory: {
            create: { stockPhysical: v.stockInitial, stockAvailable: v.stockInitial },
          },
        })),
      },
    },
    include: { variants: { include: { inventory: true } } },
  })

  return NextResponse.json(product, { status: 201 })
}
