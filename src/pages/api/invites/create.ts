/**
 * POST /api/invites/create — Generate a stateless HMAC-SHA256 invite token
 *
 * Body:    { gid: string, role?: string }  (role defaults to "member")
 * Returns: { token: string, url: string }  where url = /join?token=${token}
 *
 * Token format: ${payloadBase64}.${signatureBase64}
 * Payload: { gid, role, exp: now + 7d, nonce: uuid }
 * Signed with INVITE_SECRET env var (falls back to "dev-secret")
 */
import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new Response('Unauthorized', { status: 401 })

  let body: { gid?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { gid, role = 'member' } = body
  if (!gid || typeof gid !== 'string') {
    return Response.json({ error: 'gid is required' }, { status: 400 })
  }

  const secret = import.meta.env.INVITE_SECRET || 'dev-secret'

  const payloadBase64 = btoa(
    JSON.stringify({
      gid,
      role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      nonce: crypto.randomUUID(),
    }),
  )

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadBase64))
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(sig)))

  const token = `${payloadBase64}.${signatureBase64}`
  return Response.json({ token, url: `/join?token=${token}` })
}
