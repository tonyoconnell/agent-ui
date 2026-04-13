import { defineMiddleware } from 'astro:middleware'

const PROTECTED_ROUTES: string[] = []

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

  return next()
})
