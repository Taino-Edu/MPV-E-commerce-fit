"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/format"
import { useCartStore } from "@/store/cart-store"

type Props = {
  slug: string
  name: string
  image: string
  price: number
  originalPrice?: number
  variantId: string
  attributeValue: string
  stockAvailable: number
}

export function ProductCard({
  slug,
  name,
  image,
  price,
  originalPrice,
  variantId,
  attributeValue,
  stockAvailable,
}: Props) {
  const { addItem } = useCartStore()
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null

  function handleAddToCart() {
    if (stockAvailable <= 0) return
    addItem({ variantId, name, attributeValue, price, image, quantity: 1 })
    toast.success(`${name} — ${attributeValue} adicionado ao carrinho!`)
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Imagem */}
      <Link href={`/produtos/${slug}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <Image
          src={image || "/placeholder-product.jpg"}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {discount && (
          <Badge className="absolute left-2 top-2 text-xs" variant="destructive">
            -{discount}%
          </Badge>
        )}
        {stockAvailable <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Badge variant="secondary" className="text-sm font-semibold">Esgotado</Badge>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        <Link href={`/produtos/${slug}`}>
          <h3 className="text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        <p className="text-xs text-muted-foreground">{attributeValue}</p>

        <div className="mt-auto space-y-1">
          {originalPrice && originalPrice > price && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </p>
          )}
          <p className="text-lg font-bold text-primary">{formatPrice(price)}</p>
          <p className="text-xs text-muted-foreground">
            ou 12x de {formatPrice(price / 12)} sem juros
          </p>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={stockAvailable <= 0}
          className="mt-2 w-full gap-2 text-sm"
          size="sm"
        >
          <ShoppingCart size={16} />
          {stockAvailable > 0 ? "Adicionar ao Carrinho" : "Esgotado"}
        </Button>
      </div>
    </article>
  )
}
