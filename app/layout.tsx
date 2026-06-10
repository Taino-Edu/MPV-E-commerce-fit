import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: {
    default: "START Fitness | Equipamentos de Alta Performance",
    template: "%s | START Fitness",
  },
  description:
    "Halteres, anilhas, estações de treino e maquinários com entrega para todo o Brasil.",
  keywords: ["fitness", "halteres", "anilhas", "equipamentos fitness", "academia"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
