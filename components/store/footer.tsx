import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-[#111] text-gray-400 mt-auto">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <p className="text-white font-bold text-lg">
              <span className="text-primary">START</span> FITNESS
            </p>
            <p className="text-sm leading-relaxed">
              Equipamentos fitness de alta performance para sua academia ou treino em casa.
            </p>
          </div>

          {/* Produtos */}
          <div className="space-y-3">
            <p className="text-white font-semibold text-sm uppercase tracking-wider">Produtos</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/produtos?categoria=halteres-anilhas" className="hover:text-primary transition-colors">Halteres & Anilhas</Link></li>
              <li><Link href="/produtos?categoria=estacoes" className="hover:text-primary transition-colors">Estações de Treino</Link></li>
              <li><Link href="/produtos?categoria=maquinarios" className="hover:text-primary transition-colors">Maquinários</Link></li>
              <li><Link href="/produtos?categoria=acessorios" className="hover:text-primary transition-colors">Acessórios</Link></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div className="space-y-3">
            <p className="text-white font-semibold text-sm uppercase tracking-wider">Atendimento</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-primary transition-colors">Dúvidas Frequentes</Link></li>
              <li><Link href="/trocas-devolucoes" className="hover:text-primary transition-colors">Trocas e Devoluções</Link></li>
              <li><Link href="/rastrear-pedido" className="hover:text-primary transition-colors">Rastrear Pedido</Link></li>
              <li><Link href="/contato" className="hover:text-primary transition-colors">Fale Conosco</Link></li>
            </ul>
          </div>

          {/* Pagamento */}
          <div className="space-y-3">
            <p className="text-white font-semibold text-sm uppercase tracking-wider">Pagamento</p>
            <p className="text-sm">PIX, Cartão de Crédito e Boleto Bancário</p>
            <p className="text-sm">Parcelamento em até 12x no cartão</p>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p>© {new Date().getFullYear()} START Fitness. Todos os direitos reservados.</p>
        <div className="flex gap-4">
          <Link href="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
          <Link href="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
        </div>
      </div>
    </footer>
  )
}
