export function formatPrice(price: number | string | { toNumber(): number }) {
  const value = typeof price === "object" ? price.toNumber() : Number(price)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function formatOrderStatus(status: string) {
  const map: Record<string, string> = {
    PENDING_PAYMENT: "Aguardando Pagamento",
    PAID: "Pago",
    PICKING: "Em Separação",
    DISPATCHED: "Despachado",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
    EXPIRED: "Expirado",
  }
  return map[status] ?? status
}

export function formatCEP(cep: string) {
  return cep.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2")
}
