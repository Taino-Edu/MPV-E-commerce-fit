import { db } from "@/lib/db"
import { formatPrice, formatDate, formatOrderStatus } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Pedidos — Admin" }

type SearchParams = Promise<{ status?: string; pagina?: string }>

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  PENDING_PAYMENT: "warning",
  PAID: "success",
  PICKING: "default",
  DISPATCHED: "default",
  DELIVERED: "secondary",
  CANCELLED: "destructive",
  EXPIRED: "secondary",
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const pagina = Number(params.pagina ?? 1)
  const PAGE_SIZE = 20

  const where = params.status ? { status: params.status as any } : {}

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        payment: true,
        shipment: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ])

  const statuses = ["PENDING_PAYMENT", "PAID", "PICKING", "DISPATCHED", "DELIVERED", "CANCELLED", "EXPIRED"]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Pedidos</h1>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/pedidos"
          className={`rounded-full px-3 py-1 text-sm border transition-colors ${!params.status ? "bg-primary text-white border-primary" : "hover:border-primary/50"}`}
        >
          Todos ({total})
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={`/admin/pedidos?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm border transition-colors ${params.status === s ? "bg-primary text-white border-primary" : "hover:border-primary/50"}`}
          >
            {formatOrderStatus(s)}
          </a>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pedido</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Itens</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/admin/pedidos/${order.id}`} className="font-mono text-xs hover:text-primary transition-colors">
                      #{order.id.slice(-8).toUpperCase()}
                    </a>
                    {order.shipment?.trackingCode && (
                      <p className="text-xs text-muted-foreground mt-0.5">{order.shipment.trackingCode}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.user.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.items.length} iten{order.items.length !== 1 ? "s" : ""}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[order.status] ?? "secondary"}>
                      {formatOrderStatus(order.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(order.total.toNumber())}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
