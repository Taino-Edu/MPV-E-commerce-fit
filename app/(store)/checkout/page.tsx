"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"
import { Loader2, QrCode, Barcode, CreditCard } from "lucide-react"

type FreightOption = { id: number; name: string; company: string; price: number; deadline: number }
type PaymentMethod = "PIX" | "CREDIT_CARD" | "BOLETO"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()

  const [step, setStep] = useState<"endereco" | "frete" | "pagamento">("endereco")
  const [loading, setLoading] = useState(false)

  // Endereço
  const [address, setAddress] = useState({
    cep: "", street: "", number: "", complement: "",
    district: "", city: "", state: "",
  })

  // Frete
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([])
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null)
  const [loadingFrete, setLoadingFrete] = useState(false)

  // Pagamento
  const [payMethod, setPayMethod] = useState<PaymentMethod>("PIX")
  const [cardData, setCardData] = useState({ number: "", name: "", expiry: "", cvv: "" })

  async function fetchCEP() {
    const cep = address.cep.replace(/\D/g, "")
    if (cep.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const d = await r.json()
      if (!d.erro) {
        setAddress((a) => ({
          ...a, street: d.logradouro, district: d.bairro, city: d.localidade, state: d.uf,
        }))
      }
    } catch {}
  }

  async function quoteFreight() {
    setLoadingFrete(true)
    try {
      const res = await fetch("/api/freight/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: address.cep.replace(/\D/g, ""),
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      setFreightOptions(data.options ?? [])
      setStep("frete")
    } catch {
      toast.error("Erro ao calcular frete. Tente novamente.")
    } finally {
      setLoadingFrete(false)
    }
  }

  async function placeOrder() {
    if (!selectedFreight) { toast.error("Selecione uma opção de frete"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          addressId: "temp", // será criado junto com o usuário
          freightProvider: selectedFreight.company,
          freightService: selectedFreight.name,
          freightPrice: selectedFreight.price,
          freightDeadline: selectedFreight.deadline,
          paymentMethod: payMethod,
          shippingAddress: address,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Erro ao criar pedido"); return }
      clearCart()
      router.push(`/checkout/confirmacao/${data.orderId}?method=${payMethod}`)
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    router.replace("/carrinho")
    return null
  }

  const subtotal = total()
  const orderTotal = subtotal + (selectedFreight?.price ?? 0)

  return (
    <div className="mx-auto max-w-6xl px-4 lg:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Finalizar Compra</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 text-sm font-medium">
        {(["endereco", "frete", "pagamento"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step === s || (i === 1 && step === "frete") || (i === 2 && step === "pagamento")
                ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </span>
            <span className={step === s ? "text-foreground" : "text-muted-foreground"}>
              {s === "endereco" ? "Endereço" : s === "frete" ? "Frete" : "Pagamento"}
            </span>
            {i < 2 && <span className="text-border">→</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          {step === "endereco" && (
            <div className="rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-lg">Endereço de entrega</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input
                    value={address.cep}
                    onChange={(e) => setAddress({ ...address, cep: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                    onBlur={fetchCEP}
                    placeholder="00000000"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rua / Logradouro</Label>
                  <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Rua das Flores" />
                </div>
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} placeholder="123" />
                </div>
                <div className="space-y-1.5">
                  <Label>Complemento</Label>
                  <Input value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} placeholder="Apto 42 (opcional)" />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} placeholder="Centro" />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="São Paulo" />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SP" maxLength={2} />
                </div>
              </div>
              <Button
                onClick={quoteFreight}
                disabled={loadingFrete || !address.cep || !address.street || !address.number}
                className="w-full gap-2"
              >
                {loadingFrete && <Loader2 size={16} className="animate-spin" />}
                Calcular Frete e Continuar
              </Button>
            </div>
          )}

          {step === "frete" && (
            <div className="rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-lg">Opções de Entrega</h2>
              <p className="text-sm text-muted-foreground">
                Entregando para: {address.street}, {address.number} — {address.city}/{address.state}
              </p>
              {freightOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma opção de frete disponível para este CEP.</p>
              ) : (
                <div className="space-y-2">
                  {freightOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                        selectedFreight?.id === opt.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="freight"
                          checked={selectedFreight?.id === opt.id}
                          onChange={() => setSelectedFreight(opt)}
                          className="accent-primary"
                        />
                        <div>
                          <p className="font-medium text-sm">{opt.name} — {opt.company}</p>
                          <p className="text-xs text-muted-foreground">{opt.deadline} dias úteis</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">{formatPrice(opt.price)}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("endereco")}>Voltar</Button>
                <Button className="flex-1" disabled={!selectedFreight} onClick={() => setStep("pagamento")}>
                  Continuar para Pagamento
                </Button>
              </div>
            </div>
          )}

          {step === "pagamento" && (
            <div className="rounded-xl border p-6 space-y-4">
              <h2 className="font-semibold text-lg">Forma de Pagamento</h2>

              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: "PIX", icon: QrCode, label: "PIX" },
                  { id: "CREDIT_CARD", icon: CreditCard, label: "Cartão" },
                  { id: "BOLETO", icon: Barcode, label: "Boleto" },
                ] as const).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setPayMethod(id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                      payMethod === id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                    }`}
                  >
                    <Icon size={24} className={payMethod === id ? "text-primary" : "text-muted-foreground"} />
                    <span className="text-sm font-medium">{label}</span>
                    {id === "PIX" && <span className="text-xs text-green-600 font-medium">5% OFF</span>}
                  </button>
                ))}
              </div>

              {payMethod === "PIX" && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                  <p className="font-semibold">Pague via PIX com 5% de desconto!</p>
                  <p className="mt-1 text-green-700">O QR Code será gerado após a confirmação. Válido por 30 minutos.</p>
                </div>
              )}

              {payMethod === "BOLETO" && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                  <p className="font-semibold">Boleto Bancário</p>
                  <p className="mt-1">Prazo de pagamento: 3 dias úteis. O pedido é reservado assim que você gera o boleto.</p>
                </div>
              )}

              {payMethod === "CREDIT_CARD" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Número do cartão</Label>
                    <Input
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nome no cartão</Label>
                    <Input
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                      placeholder="NOME SOBRENOME"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Validade</Label>
                      <Input
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CVV</Label>
                      <Input
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">A tokenização do cartão é processada pelo Mercado Pago.</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("frete")}>Voltar</Button>
                <Button className="flex-1 gap-2" onClick={placeOrder} disabled={loading}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Confirmar Pedido — {formatPrice(orderTotal)}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Resumo lateral */}
        <div className="rounded-xl border bg-card p-6 space-y-4 h-fit sticky top-24">
          <h2 className="font-semibold">Resumo</h2>
          <div className="space-y-2 text-sm">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between">
                <span className="text-muted-foreground truncate max-w-[160px]">{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete</span>
              <span>{selectedFreight ? formatPrice(selectedFreight.price) : "A calcular"}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span><span className="text-primary">{formatPrice(orderTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
