"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, User, Menu, X, Search } from "lucide-react"
import { useState } from "react"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Halteres & Anilhas", href: "/produtos?categoria=halteres-anilhas" },
  { label: "Estações de Treino", href: "/produtos?categoria=estacoes" },
  { label: "Maquinários", href: "/produtos?categoria=maquinarios" },
  { label: "Acessórios", href: "/produtos?categoria=acessorios" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { items } = useCartStore()
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full bg-[#111] text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-primary">START</span>
          <span className="text-white">FITNESS</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-gray-300 hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" asChild>
            <Link href="/busca" aria-label="Buscar">
              <Search size={20} />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" asChild>
            <Link href="/minha-conta" aria-label="Minha conta">
              <User size={20} />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-300 hover:text-white"
            asChild
          >
            <Link href="/carrinho" aria-label="Carrinho">
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-white/10 bg-[#111] px-4 py-4 flex flex-col gap-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-gray-300 hover:text-primary text-sm font-medium transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
