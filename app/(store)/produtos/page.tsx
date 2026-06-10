import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Produtos" }
export const dynamic = "force-dynamic"

type SearchParams = Promise<{ categoria?: string; busca?: string; pagina?: string }>

async function getVariants(categoria?: string, busca?: string, pagina = 1) {
  const PAGE_SIZE = 24
  const skip = (pagina - 1) * PAGE_SIZE

  const where = {
    isActive: true,
    product: {
      isActive: true,
      ...(busca ? { name: { contains: busca, mode: "insensitive" as const } } : {}),
      ...(categoria ? { category: { slug: categoria } } : {}),
    },
  }

  const [variants, total] = await Promise.all([
    db.productVariant.findMany({
      where,
      include: {
        product: { include: { category: true } },
        images: { where: { isPrimary: true }, take: 1 },
        inventory: true,
      },
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
    }),
    db.productVariant.count({ where }),
  ])

  return { variants, total, pages: Math.ceil(total / PAGE_SIZE) }
}

async function getCategories() {
  return db.category.findMany({ where: { parentId: null }, orderBy: { name: "asc" } })
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const pagina = Number(params.pagina ?? 1)
  const [{ variants, total, pages }, categories] = await Promise.all([
    getVariants(params.categoria, params.busca, pagina),
    getCategories(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filtros */}
        <aside className="w-full lg:w-56 shrink-0 space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Categorias</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href="/produtos"
                  className={`block px-2 py-1.5 rounded-md transition-colors ${
                    !params.categoria ? "bg-primary text-white" : "hover:bg-muted"
                  }`}
                >
                  Todos
                </a>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/produtos?categoria=${cat.slug}`}
                    className={`block px-2 py-1.5 rounded-md transition-colors ${
                      params.categoria === cat.slug
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                    }`}
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid produtos */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} produto{total !== 1 ? "s" : ""}
              {params.categoria ? ` em ${params.categoria}` : ""}
              {params.busca ? ` para "${params.busca}"` : ""}
            </p>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-medium">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {variants.map((v) => (
                <ProductCard
                  key={v.id}
                  variantId={v.id}
                  slug={v.product.slug}
                  name={v.product.name}
                  attributeValue={v.attributeValue}
                  price={v.price.toNumber()}
                  image={v.images[0]?.url ?? ""}
                  stockAvailable={v.inventory?.stockAvailable ?? 0}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/produtos?${new URLSearchParams({ ...params, pagina: String(p) })}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-md text-sm border transition-colors ${
                    p === pagina
                      ? "bg-primary text-white border-primary"
                      : "hover:bg-muted border-border"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
