import { defineMiddleware } from 'astro:middleware'

const PROTECTED_ROUTES: string[] = []

// CSP routes for /u and /chat surfaces.
// - script-src 'unsafe-inline': Astro injects inline scripts for island hydration,
//   theme init, and view transitions. The nonce approach requires every inline
//   <script> in Layout.astro and Astro's runtime to carry data-astro-cid-nonce —
//   not yet wired across the codebase, so we accept inline scripts.
// - style-src 'unsafe-inline': Tailwind emits inline styles
// - img-src data:: required for QR codes (wallet receive)
// - connect-src: substrate gateway + Sui RPC + price oracles + Cloudflare RUM beacon
// - frame-ancestors 'none': prevents clickjacking
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
  const needsCsp = CSP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  if (needsCsp) {
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://charts.googleapis.com",
      "connect-src 'self' https://api.one.ie wss://api.one.ie https://pay.one.ie https://fullnode.testnet.sui.io https://fullnode.mainnet.sui.io https://hermes.pyth.network https://api.coingecko.com https://cloudflareinsights.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
    response.headers.set('Content-Security-Policy', cspHeader)
  }

  return response
})
