import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAdmin = req.auth?.user?.role === "ADMIN"

  if (pathname.startsWith("/admin") && !isAdmin) {
    const loginUrl = new URL("/entrar", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/minha-conta/:path*", "/pedidos/:path*"],
}
