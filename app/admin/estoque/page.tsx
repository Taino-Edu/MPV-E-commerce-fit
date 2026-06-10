import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Estoque — Admin" }
export const dynamic = "force-dynamic"

export default async function AdminStockPage() {
  const inventory = await db.inventory.findMany({
    include: {
      variant: {
        include: {
          product: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: { stockAvailable: "asc" },
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Controle de Estoque</h1>
        <p className="text-sm text-muted-foreground">{inventory.length} variações cadastradas</p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Variação</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Físico</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Disponível</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Reservado</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Alerta</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => {
                const reserved = inv.stockPhysical - inv.stockAvailable
                const isLow = inv.stockAvailable <= inv.minAlertQty
                const isEmpty = inv.stockAvailable <= 0

                return (
                  <tr key={inv.variantId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{inv.variant.product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.variant.attributeValue}</td>
                    <td className="px-4 py-3 text-center">{inv.stockPhysical}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      <span className={isEmpty ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-600"}>
                        {inv.stockAvailable}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{reserved}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{inv.minAlertQty}</td>
                    <td className="px-4 py-3 text-center">
                      {isEmpty ? (
                        <Badge variant="destructive">Esgotado</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">⚠ Baixo</Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum produto no estoque ainda.
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
