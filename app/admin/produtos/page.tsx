import Link from "next/link"
import { db } from "@/lib/db"
import { formatPrice, formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Produtos — Admin" }

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: {
      category: true,
      variants: {
        include: { inventory: true },
        orderBy: { price: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button asChild className="gap-2">
          <Link href="/admin/produtos/novo">
            <Plus size={16} /> Novo Produto
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Variações</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estoque</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preço (a partir de)</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const totalStock = p.variants.reduce((acc, v) => acc + (v.inventory?.stockAvailable ?? 0), 0)
                const minPrice = p.variants[0]?.price?.toNumber() ?? 0
                const hasLowStock = p.variants.some(
                  (v) => (v.inventory?.stockAvailable ?? 0) <= (v.inventory?.minAlertQty ?? 5)
                )

                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/produtos/${p.id}`} className="font-medium hover:text-primary transition-colors">
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.variants.length}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${hasLowStock ? "text-yellow-600" : "text-green-600"}`}>
                        {totalStock} unid.
                      </span>
                      {hasLowStock && <span className="ml-1 text-xs text-yellow-600">⚠</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{formatPrice(minPrice)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.isActive ? "success" : "secondary"}>
                        {p.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                  </tr>
                )
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum produto cadastrado.{" "}
                    <Link href="/admin/produtos/novo" className="text-primary underline">Criar agora</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
