"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn("credentials", {
      ...form,
      redirect: false,
      callbackUrl,
    })
    setLoading(false)
    if (res?.error) {
      toast.error("E-mail ou senha incorretos.")
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">START</span> FITNESS
          </h1>
          <p className="text-muted-foreground text-sm">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-primary font-medium hover:underline">
            Cadastre-se
          </Link>
        </p>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            ← Continuar comprando sem cadastro
          </Link>
        </p>
      </div>
    </div>
  )
}
