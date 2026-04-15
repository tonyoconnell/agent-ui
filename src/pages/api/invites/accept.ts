import type { APIRoute } from 'astro'
import { auth } from '@/lib/auth'
import { write } from '@/lib/typedb'

export const prerender = false

const INVITE_SECRET = import.meta.env.INVITE_SECRET || 'dev-secret'

async function hmacSign(payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(INVITE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}

export const POST: APIRoute = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null)
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  let token: string
  try {
    ;({ token } = (await request.json()) as { token: string })
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }
  if (!token || typeof token !== 'string') return new Response('Missing token', { status: 400 })

  const dotIdx = token.lastIndexOf('.')
  if (dotIdx === -1) return new Response('Malformed token', { status: 400 })

  const payloadBase64 = token.slice(0, dotIdx)
  const signatureBase64 = token.slice(dotIdx + 1)

  const expectedSig = await hmacSign(payloadBase64)
  if (!timingSafeEqual(expectedSig, signatureBase64)) return new Response('Invalid token', { status: 403 })

  let payload: { gid: string; exp: number }
  try {
    payload = JSON.parse(atob(payloadBase64))
  } catch {
    return new Response('Malformed payload', { status: 400 })
  }

  if (payload.exp < Date.now()) return new Response('Token expired', { status: 410 })

  const uid = session.user.id.replace(/"/g, '')
  const gid = payload.gid.replace(/"/g, '')

  try {
    await write(`
      match $u isa unit, has uid "${uid}"; $g isa group, has group-id "${gid}";
      insert (member: $u, group: $g) isa membership;
    `)
  } catch (err) {
    console.error('[invites/accept] TypeDB write failed:', err)
    return new Response('Internal Server Error', { status: 500 })
  }

  return Response.json({ ok: true, gid: payload.gid })
}
