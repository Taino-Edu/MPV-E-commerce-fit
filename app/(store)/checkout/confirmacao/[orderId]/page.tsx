"use client"

import Link from "next/link"
import { use } from "react"
import { CheckCircle2, QrCode, Barcode, Home, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

type Params = Promise<{ orderId: string }>

export default function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<{ method?: string }>
}) {
  const { orderId } = use(params)
  const sp = use(searchParams)
  const method = sp.method ?? "PIX"
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then(setOrder)
  }, [orderId])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pedido realizado com sucesso!</h1>
        <p className="text-muted-foreground">
          Pedido <span className="font-mono font-medium">#{orderId.slice(-8).toUpperCase()}</span>
        </p>
      </div>

      {method === "PIX" && order?.payment?.pixQrCode && (
        <div className="rounded-xl border p-6 space-y-4 bg-green-50">
          <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
            <QrCode size={20} /> Pague via PIX
          </div>
          {order.payment.pixQrCodeB64 && (
            <img
              src={`data:image/png;base64,${order.payment.pixQrCodeB64}`}
              alt="QR Code PIX"
              className="mx-auto w-48 h-48"
            />
          )}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Ou copie o código PIX abaixo:</p>
            <code className="block text-xs bg-white border rounded-lg p-3 break-all text-left">
              {order.payment.pixQrCode}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigator.clipboard.writeText(order.payment.pixQrCode)}
            >
              Copiar código PIX
            </Button>
          </div>
          <p className="text-xs text-red-600">⏱ Válido por 30 minutos</p>
        </div>
      )}

      {method === "BOLETO" && order?.payment?.boletoUrl && (
        <div className="rounded-xl border p-6 space-y-4 bg-yellow-50">
          <div className="flex items-center justify-center gap-2 text-yellow-700 font-semibold">
            <Barcode size={20} /> Boleto Bancário
          </div>
          <p className="text-sm text-yellow-700">Vencimento em 3 dias úteis. Pague em qualquer banco ou lotérica.</p>
          <Button asChild className="bg-yellow-600 hover:bg-yellow-700 text-white">
            <a href={order.payment.boletoUrl} target="_blank" rel="noopener noreferrer">
              Visualizar Boleto
            </a>
          </Button>
        </div>
      )}

      {method === "CREDIT_CARD" && (
        <div className="rounded-xl border p-6 bg-blue-50 space-y-2">
          <p className="font-semibold text-blue-700">Pagamento no cartão processado!</p>
          <p className="text-sm text-blue-600">Você receberá um e-mail de confirmação em breve.</p>
        </div>
      )}

      <div className="text-sm text-muted-foreground space-y-1">
        <p>Um e-mail com os detalhes do pedido foi enviado para você.</p>
        <p>Acompanhe o status em <span className="text-primary font-medium">Minha Conta → Pedidos</span></p>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        <Button variant="outline" asChild className="gap-2">
          <Link href="/"><Home size={16} /> Início</Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/minha-conta/pedidos"><Package size={16} /> Meus Pedidos</Link>
        </Button>
      </div>
    </div>
  )
}
