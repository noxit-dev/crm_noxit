import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Next.js 16 renamed Middleware -> Proxy. Runs on the Node.js runtime.
// Refreshes the Supabase session every request and guards routes.
const AUTH_ROUTES = ["/login", "/signup"]

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // Unauthenticated user on a protected route -> /login
  if (!user && !isAuthRoute) {
    return redirectKeepingCookies(request, "/login", supabaseResponse)
  }

  // Authenticated user on an auth route -> /dashboard
  if (user && isAuthRoute) {
    return redirectKeepingCookies(request, "/dashboard", supabaseResponse)
  }

  return supabaseResponse
}

// A redirect creates a fresh response, so copy over any refreshed auth cookies.
function redirectKeepingCookies(
  request: NextRequest,
  to: string,
  from: NextResponse
) {
  const url = request.nextUrl.clone()
  url.pathname = to
  const response = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
