import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { checkAuthLimit } from '@/lib/auth-rate-limit'

export const POST: APIRoute = async ({ request }) => {
  const clientIp = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'

  let body: { email?: string; password?: string }
  try {
    body = await request.clone().json()
  } catch {
    body = {}
  }

  const email = typeof body.email === 'string' ? body.email.toLowerCase() : ''

  // Pre-check lockout
  const limit = await checkAuthLimit({ ip: clientIp, email, action: '/sign-in/email' })
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        error: 'Too many attempts. Try again later or use a magic link.',
        retryAfter: limit.retryAfter,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(limit.retryAfter) },
      },
    )
  }

  // Forward to Better Auth's built-in handler
  const response = await auth.handler(request)

  // On auth failure, the rate-limit bucket was already incremented in checkAuthLimit.
  // On success (2xx), nothing to do — the KV bucket resets naturally via TTL.
  return response
}
