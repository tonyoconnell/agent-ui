import { defineMiddleware } from 'astro:middleware'

const PROTECTED_ROUTES: string[] = []

// CSP for /u/* and /chat/* — wallet and chat surfaces
// - style-src 'unsafe-inline': required by Tailwind CSS
// - img-src data:: required for QR codes (wallet receive)
// - connect-src: substrate gateway + TypeDB proxy + Sui testnet RPC
// - wss://api.one.ie: live task updates via WsHub Durable Object
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://charts.googleapis.com",
  "connect-src 'self' https://api.one.ie wss://api.one.ie https://fullnode.testnet.sui.io",
  "font-src 'self'",
  "frame-ancestors 'none'",
].join("; ")

const CSP_ROUTES = ['/u', '/chat']

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  // Check session cookie for protected routes
  const sessionData = context.cookies.get('better-auth.session_data')?.value

  let user = null
  if (sessionData) {
    try {
      const decoded = JSON.parse(atob(sessionData))
      if (decoded.expiresAt > Date.now()) {
        user = decoded.session?.user ?? null
      }
    } catch {
      // Invalid cookie, ignore
    }
  }

  context.locals.user = user

  // Redirect to signin if accessing protected route without auth
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  if (isProtected && !user) {
    return context.redirect(`/signin?returnTo=${encodeURIComponent(pathname)}`)
  }

  const response = await next()

  // Add CSP header for wallet (/u/*) and chat (/chat/*) surfaces
  const needsCsp = CSP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  if (needsCsp) {
    response.headers.set("Content-Security-Policy", CSP_HEADER)
  }

  return response
})
