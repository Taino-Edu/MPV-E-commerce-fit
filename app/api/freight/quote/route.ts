import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { calcBilledWeight } from "@/lib/cubagem"

type QuoteItem = { variantId: string; quantity: number }

export async function POST(req: NextRequest) {
  const { cep, items }: { cep: string; items: QuoteItem[] } = await req.json()

  if (!cep || cep.replace(/\D/g, "").length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 })
  }

  const variants = await db.productVariant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
  })

  const freightItems = items.flatMap((item) => {
    const v = variants.find((v) => v.id === item.variantId)
    if (!v) return []
    return [{
      weightKg: v.weightKg.toNumber(),
      heightCm: v.heightCm.toNumber(),
      widthCm: v.widthCm.toNumber(),
      depthCm: v.depthCm.toNumber(),
      quantity: item.quantity,
    }]
  })

  const totalWeight = freightItems.reduce(
    (acc, i) => acc + calcBilledWeight(i),
    0
  )

  const token = process.env.MELHOR_ENVIO_TOKEN!
  const cepOrigem = process.env.MELHOR_ENVIO_CEP_ORIGEM!
  const sandbox = process.env.MELHOR_ENVIO_SANDBOX === "true"
  const baseUrl = sandbox
    ? "https://sandbox.melhorenvio.com.br"
    : "https://melhorenvio.com.br"

  const body = {
    from: { postal_code: cepOrigem.replace(/\D/g, "") },
    to: { postal_code: cep.replace(/\D/g, "") },
    package: {
      height: Math.max(...freightItems.map((i) => i.heightCm)),
      width: Math.max(...freightItems.map((i) => i.widthCm)),
      length: Math.max(...freightItems.map((i) => i.depthCm)),
      weight: totalWeight,
    },
  }

  try {
    const res = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "START Fitness (startfitness.com.br)",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Erro ao cotar frete", details: data }, { status: 502 })
    }

    const options = data
      .filter((s: any) => !s.error && s.price)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        company: s.company?.name,
        price: parseFloat(s.price),
        deadline: s.delivery_time,
      }))
      .sort((a: any, b: any) => a.price - b.price)

    return NextResponse.json({ options })
  } catch {
    return NextResponse.json({ error: "Serviço de frete indisponível" }, { status: 503 })
  }
}
