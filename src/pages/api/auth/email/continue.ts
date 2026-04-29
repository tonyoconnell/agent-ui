import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { validateRedirect } from '@/lib/auth-redirect'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const POST: APIRoute = async ({ request }) => {
  // CSRF: reject cross-origin posts (no auth cookie = no CSRF token exchange)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host) {
    try {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  let body: { email?: string; redirect?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { email, redirect } = body
  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const callbackURL = validateRedirect(redirect)

  const clientIp = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const { checkAuthLimit } = await import('@/lib/auth-rate-limit')
  const limit = await checkAuthLimit({ ip: clientIp, email: email.toLowerCase(), action: '/email/continue' })
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: limit.retryAfter }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(limit.retryAfter) },
    })
  }

  // Always send — Better Auth dedupes; never disclose registration status
  try {
    await auth.api.signInMagicLink({
      body: { email: email.toLowerCase(), callbackURL },
    })
  } catch {
    // Swallow error — never reveal whether email exists or magic-link failed
  }

  // Identical response for all emails — no enumeration
  return new Response(JSON.stringify({ sent: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
