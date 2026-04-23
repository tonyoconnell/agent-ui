import { defineMiddleware } from 'astro:middleware'

const PROTECTED_ROUTES: string[] = []

// CSP routes that receive a per-request nonce-based CSP header.
// - script-src uses 'nonce-{value}' instead of 'unsafe-inline': Astro 6 propagates the
//   nonce to every emitted inline <script> tag via Astro.locals.cspNonce (set below).
//   Layout.astro carries the nonce on <html data-astro-csp-nonce> so Astro can inject it.
// - style-src keeps 'unsafe-inline': Tailwind emits inline styles; lower risk than scripts.
// - img-src data:: required for QR codes (wallet receive)
// - connect-src: substrate gateway + TypeDB proxy + Sui testnet RPC
// - frame-ancestors 'none': prevents clickjacking (key protection)
const CSP_ROUTES = ['/u', '/chat']

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  // Generate a per-request nonce for CSP script-src on protected surfaces.
  // btoa(randomUUID()) gives a base64 string (~24 chars) with 122 bits of entropy.
  const nonce = btoa(crypto.randomUUID())
  context.locals.cspNonce = nonce

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
  const needsCsp = CSP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (needsCsp) {
    const cspHeader = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://charts.googleapis.com",
      "connect-src 'self' https://api.one.ie wss://api.one.ie https://fullnode.testnet.sui.io https://hermes.pyth.network https://api.coingecko.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
    response.headers.set('Content-Security-Policy', cspHeader)
  }

  return response
})
