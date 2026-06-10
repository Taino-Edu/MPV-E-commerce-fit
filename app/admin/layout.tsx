import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse, Settings, LogOut, Dumbbell,
} from "lucide-react"

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/produtos", icon: Package, label: "Produtos" },
  { href: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { href: "/admin/estoque", icon: Warehouse, label: "Estoque" },
  { href: "/admin/configuracoes", icon: Settings, label: "Configurações" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/entrar?callbackUrl=/admin")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <Dumbbell size={20} className="text-primary" />
          <span className="font-bold text-sm">START FITNESS</span>
          <span className="text-xs text-muted-foreground ml-1">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate mb-1">
            {session.user.email}
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
