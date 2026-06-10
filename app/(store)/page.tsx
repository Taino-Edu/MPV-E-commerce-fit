import Link from "next/link"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Truck, ShieldCheck, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"

async function getFeaturedProducts() {
  try {
    return await db.productVariant.findMany({
    where: { isActive: true, product: { isActive: true } },
    include: {
      product: { include: { category: true } },
      images: { where: { isPrimary: true }, take: 1 },
      inventory: true,
    },
      orderBy: { createdAt: "desc" },
      take: 8,
    })
  } catch (error) {
    console.error("[getFeaturedProducts]", error)
    return []
  }
}

const categories = [
  { name: "Esteiras", slug: "cardio", emoji: "🏃", desc: "Caminhada e corrida em casa" },
  { name: "Bicicletas", slug: "cardio", emoji: "🚴", desc: "Ergométricas e spinning" },
  { name: "Elípticos", slug: "cardio", emoji: "⚡", desc: "Cardio completo sem impacto" },
  { name: "Musculação", slug: "musculacao", emoji: "🏋️", desc: "Racks, bancos e equipamentos" },
]

const benefits = [
  { icon: Truck, title: "Frete para todo Brasil", desc: "Calculamos o melhor frete para você" },
  { icon: ShieldCheck, title: "Compra Segura", desc: "Pagamento criptografado e protegido" },
  { icon: RotateCcw, title: "7 dias para trocar", desc: "Garantia de satisfação total" },
  { icon: Zap, title: "PIX com desconto", desc: "Pague via PIX e economize" },
]

export default async function HomePage() {
  const variants = await getFeaturedProducts()

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#111] to-[#1a1a1a] text-white py-20 px-4">
        <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-block rounded-full bg-primary/20 px-4 py-1 text-sm font-medium text-primary">
              🔥 Equipamentos de Alta Performance
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
              Treine como um{" "}
              <span className="text-primary">profissional</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl">
              Halteres, anilhas, estações de treino e muito mais. Monte sua academia em casa ou profissional com os melhores equipamentos do mercado.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="gap-2 text-base" asChild>
                <Link href="/produtos">
                  Ver Todos os Produtos <ArrowRight size={18} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/produtos?categoria=estacoes">Estações de Treino</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-80 h-80 rounded-full bg-primary/10 flex items-center justify-center text-9xl">
              🏋️
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="border-b bg-white py-8 px-4">
        <div className="mx-auto max-w-7xl grid grid-cols-2 gap-4 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <b.icon size={24} className="text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Categorias</h2>
            <Link href="/produtos" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/produtos?categoria=${cat.slug}`}
                className="group flex flex-col items-center rounded-xl border bg-white p-6 text-center shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
              >
                <span className="text-4xl mb-3">{cat.emoji}</span>
                <p className="font-semibold text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Produtos em destaque */}
      <section className="py-14 px-4">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Produtos em Destaque</h2>
            <Link href="/produtos" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-5xl mb-4">📦</p>
              <p className="font-medium">Nenhum produto disponível ainda.</p>
              <p className="text-sm mt-1">Volte em breve ou acesse o painel para cadastrar produtos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {variants.map((variant) => (
                <ProductCard
                  key={variant.id}
                  variantId={variant.id}
                  slug={variant.product.slug}
                  name={variant.product.name}
                  attributeValue={variant.attributeValue}
                  price={variant.price.toNumber()}
                  image={variant.images[0]?.url ?? ""}
                  stockAvailable={variant.inventory?.stockAvailable ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary py-16 px-4 text-white">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <h2 className="text-3xl font-bold">Monte sua academia hoje mesmo</h2>
          <p className="text-primary-foreground/80">
            Equipamentos de qualidade, entrega rápida e suporte completo. Comece agora.
          </p>
          <Button size="lg" variant="secondary" className="text-base font-semibold" asChild>
            <Link href="/produtos">Explorar Produtos</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
