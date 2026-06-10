import { db } from "@/lib/db"
import { formatPrice } from "@/lib/format"
import { ShoppingBag, DollarSign, Package, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard — Admin" }
export const dynamic = "force-dynamic"

async function getStats() {
  const [totalOrders, paidOrders, lowStock, revenue] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: { in: ["PAID", "PICKING", "DISPATCHED", "DELIVERED"] } } }),
    db.inventory.count({ where: { stockAvailable: { lte: 5 } } }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED" },
    }),
  ])

  const recentOrders = await db.order.findMany({
    include: { user: { select: { name: true, email: true } }, payment: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return { totalOrders, paidOrders, lowStock, revenue: revenue._sum.amount?.toNumber() ?? 0, recentOrders }
}

export default async function AdminDashboard() {
  const { totalOrders, paidOrders, lowStock, revenue, recentOrders } = await getStats()

  const stats = [
    { title: "Receita Total", value: formatPrice(revenue), icon: DollarSign, color: "text-green-500" },
    { title: "Total de Pedidos", value: String(totalOrders), icon: ShoppingBag, color: "text-blue-500" },
    { title: "Pedidos Pagos", value: String(paidOrders), icon: Package, color: "text-primary" },
    { title: "Alertas de Estoque", value: String(lowStock), icon: AlertTriangle, color: "text-yellow-500" },
  ]

  const statusMap: Record<string, { label: string; class: string }> = {
    PENDING_PAYMENT: { label: "Ag. Pagamento", class: "bg-yellow-100 text-yellow-800" },
    PAID: { label: "Pago", class: "bg-green-100 text-green-800" },
    PICKING: { label: "Em Separação", class: "bg-blue-100 text-blue-800" },
    DISPATCHED: { label: "Despachado", class: "bg-purple-100 text-purple-800" },
    DELIVERED: { label: "Entregue", class: "bg-gray-100 text-gray-800" },
    CANCELLED: { label: "Cancelado", class: "bg-red-100 text-red-800" },
    EXPIRED: { label: "Expirado", class: "bg-gray-100 text-gray-600" },
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da loja</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon size={18} className={stat.color} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pedidos recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pedido</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3">{order.user.name ?? order.user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusMap[order.status]?.class}`}>
                        {statusMap[order.status]?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatPrice(order.total.toNumber())}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum pedido ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
