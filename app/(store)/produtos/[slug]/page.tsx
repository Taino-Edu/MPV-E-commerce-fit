"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import { useState, useEffect, use } from "react"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/cart-store"
import { toast } from "sonner"
import { ShoppingCart, Truck, ShieldCheck, RotateCcw } from "lucide-react"

// Dados do produto (buscados server-side via fetch interno é mais clean,
// mas para MVP usamos uma abordagem híbrida — dados via API route)

type Params = Promise<{ slug: string }>

export default function ProductDetailPage({ params }: { params: Params }) {
  const { slug } = use(params)
  const [product, setProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [cep, setCep] = useState("")
  const [freteResult, setFreteResult] = useState<any>(null)
  const [loadingFrete, setLoadingFrete] = useState(false)
  const [qty, setQty] = useState(1)
  const { addItem } = useCartStore()

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data) { notFound(); return }
        setProduct(data)
        setSelectedVariant(data.variants?.[0])
      })
  }, [slug])

  async function quoteFrete() {
    if (!cep || cep.replace(/\D/g, "").length !== 8 || !selectedVariant) return
    setLoadingFrete(true)
    try {
      const res = await fetch("/api/freight/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: cep.replace(/\D/g, ""),
          items: [{ variantId: selectedVariant.id, quantity: qty }],
        }),
      })
      setFreteResult(await res.json())
    } finally {
      setLoadingFrete(false)
    }
  }

  function handleAddToCart() {
    if (!selectedVariant) return
    addItem({
      variantId: selectedVariant.id,
      name: product.name,
      attributeValue: selectedVariant.attributeValue,
      price: selectedVariant.price,
      image: selectedVariant.images?.[0]?.url ?? "",
      quantity: qty,
    })
    toast.success(`${product.name} — ${selectedVariant.attributeValue} adicionado!`)
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64 mx-auto" />
          <div className="h-4 bg-muted rounded w-48 mx-auto" />
        </div>
      </div>
    )
  }

  const stock = selectedVariant?.inventory?.stockAvailable ?? 0

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Imagens */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            <Image
              src={selectedVariant?.images?.[0]?.url || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          {/* Thumbnails */}
          {selectedVariant?.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {selectedVariant.images.map((img: any) => (
                <div key={img.id} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{product.category?.name}</p>
            <h1 className="text-2xl font-bold">{product.name}</h1>
          </div>

          {/* Preço */}
          <div className="space-y-1">
            <p className="text-3xl font-extrabold text-primary">
              {formatPrice(selectedVariant?.price ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              ou 12x de {formatPrice((selectedVariant?.price ?? 0) / 12)} sem juros
            </p>
            <p className="text-sm font-medium text-green-600">
              {formatPrice((selectedVariant?.price ?? 0) * 0.95)} no PIX (5% off)
            </p>
          </div>

          {/* Variações */}
          {product.variants?.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Opção:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-primary bg-primary text-white"
                        : "border-border hover:border-primary/50"
                    } ${v.inventory?.stockAvailable <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={v.inventory?.stockAvailable <= 0}
                  >
                    {v.attributeValue}
                    {v.inventory?.stockAvailable <= 0 && " (Esgotado)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Estoque */}
          <div>
            {stock > 0 ? (
              <Badge variant="success">✓ Em estoque — {stock} unid.</Badge>
            ) : (
              <Badge variant="destructive">Esgotado</Badge>
            )}
          </div>

          {/* Quantidade + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center text-lg hover:bg-muted transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock, qty + 1))}
                className="w-10 h-10 flex items-center justify-center text-lg hover:bg-muted transition-colors"
                disabled={qty >= stock}
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={stock <= 0}
              className="flex-1 gap-2"
              size="lg"
            >
              <ShoppingCart size={18} />
              {stock > 0 ? "Adicionar ao Carrinho" : "Esgotado"}
            </Button>
          </div>

          {/* Calcular frete */}
          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Truck size={16} className="text-primary" /> Calcular frete
            </p>
            <div className="flex gap-2">
              <input
                value={cep}
                onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="00000000"
                maxLength={8}
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button onClick={quoteFrete} disabled={loadingFrete} variant="outline" size="sm">
                {loadingFrete ? "..." : "Calcular"}
              </Button>
            </div>
            {freteResult?.options && (
              <ul className="space-y-2">
                {freteResult.options.map((opt: any) => (
                  <li key={opt.id} className="flex justify-between text-sm">
                    <span>{opt.name} — {opt.deadline} dias úteis</span>
                    <span className="font-semibold text-primary">{formatPrice(opt.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Garantias */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-green-500" /> Compra 100% segura
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw size={16} className="text-blue-500" /> 7 dias para devolver
            </div>
          </div>

          {/* Descrição */}
          {product.description && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">Descrição</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
