/**
 * GET /api/auth/wallet/nonce?addr=0x...
 *
 * Returns a short-lived signed nonce bound to the address.
 * Stateless: the HMAC IS the state. No KV/D1 write.
 *
 * Returns: { nonce, message, exp }
 *   nonce   — base64url-encoded signed payload {a:addr, r:random, e:exp}.sig
 *   message — human-readable message the wallet must sign
 *   exp     — unix ms expiry (5 min)
 */
import type { APIRoute } from 'astro'

export const prerender = false

const TTL_MS = 5 * 60 * 1000

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return b64url(new Uint8Array(sig))
}

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url)
  const addr = url.searchParams.get('addr')?.toLowerCase()
  if (!addr || !/^0x[0-9a-f]{1,64}$/.test(addr)) {
    return Response.json({ error: 'addr required (0x-prefixed hex)' }, { status: 400 })
  }

  const env =
    (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env ?? (process.env as Record<string, string>)
  const secret = env.WALLET_NONCE_SECRET
  if (!secret) {
    return Response.json({ error: 'WALLET_NONCE_SECRET not configured' }, { status: 500 })
  }

  const exp = Date.now() + TTL_MS
  const random = b64url(crypto.getRandomValues(new Uint8Array(16)))
  const payload = JSON.stringify({ a: addr, r: random, e: exp })
  const payloadB64 = b64url(new TextEncoder().encode(payload))
  const sig = await hmac(secret, payloadB64)
  const nonce = `${payloadB64}.${sig}`

  const message = `Sign in to ONE as ${addr}\n` + `Nonce: ${random}\n` + `Expires: ${new Date(exp).toISOString()}`

  return Response.json({ nonce, message, exp })
}
