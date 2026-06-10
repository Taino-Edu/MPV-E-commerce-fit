"use client"

import Link from "next/link"
import Image from "next/image"
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import type { Metadata } from "next"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center space-y-4">
        <ShoppingBag size={64} className="mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground">Adicione produtos para continuar</p>
        <Button asChild>
          <Link href="/produtos">Ver Produtos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Meu Carrinho</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 rounded-xl border bg-card p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src={item.image || "/placeholder-product.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.attributeValue}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center border rounded-lg overflow-hidden text-sm">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 space-y-4 sticky top-24">
            <h2 className="font-bold text-lg">Resumo do pedido</h2>

            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between text-muted-foreground">
                  <span className="truncate max-w-[180px]">{item.name} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatPrice(total())}</span>
            </div>

            <p className="text-xs text-muted-foreground">Frete calculado no checkout</p>

            <Button className="w-full gap-2" size="lg" asChild>
              <Link href="/checkout">
                Finalizar Compra <ArrowRight size={16} />
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/produtos">Continuar Comprando</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
