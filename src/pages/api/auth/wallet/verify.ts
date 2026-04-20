/**
 * POST /api/auth/wallet/verify
 *
 * Body: { address, signature, nonce }
 * 1. HMAC-verify nonce (must match WALLET_NONCE_SECRET, not expired, bound to address)
 * 2. Reconstruct the signed message from nonce payload
 * 3. Cryptographically verify signature via @mysten/sui/verify
 * 4. ensureHumanUnit("human:sui:<addr>", {id: addr, name: shortAddr})
 * 5. Set parallel one.sui.session cookie (HMAC-signed uid+exp)
 *
 * Returns: { uid, wallet }
 */

import { verifyPersonalMessageSignature } from '@mysten/sui/verify'
import type { APIRoute } from 'astro'
import { ensureHumanUnit } from '@/lib/api-auth'

export const prerender = false

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function b64urlEncode(bytes: Uint8Array): string {
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
  return b64urlEncode(new Uint8Array(sig))
}

export const POST: APIRoute = async ({ request, locals }) => {
  let address: string, signature: string, nonce: string
  try {
    const body = (await request.json()) as { address?: string; signature?: string; nonce?: string }
    address = (body.address ?? '').toLowerCase()
    signature = body.signature ?? ''
    nonce = body.nonce ?? ''
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }

  if (!address || !signature || !nonce) {
    return Response.json({ error: 'address, signature, nonce required' }, { status: 400 })
  }

  const env =
    (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env ?? (process.env as Record<string, string>)
  const nonceSecret = env.WALLET_NONCE_SECRET
  const sessionSecret = env.SUI_SESSION_SECRET ?? nonceSecret
  if (!nonceSecret || !sessionSecret) {
    return Response.json({ error: 'server not configured' }, { status: 500 })
  }

  // 1. HMAC-verify nonce
  const [payloadB64, sig] = nonce.split('.')
  if (!payloadB64 || !sig) {
    return Response.json({ error: 'malformed nonce' }, { status: 400 })
  }
  const expected = await hmac(nonceSecret, payloadB64)
  if (expected !== sig) {
    return Response.json({ error: 'nonce signature invalid' }, { status: 401 })
  }

  let payload: { a: string; r: string; e: number }
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)))
  } catch {
    return Response.json({ error: 'nonce payload invalid' }, { status: 400 })
  }

  if (payload.e < Date.now()) {
    return Response.json({ error: 'nonce expired' }, { status: 401 })
  }
  if (payload.a !== address) {
    return Response.json({ error: 'nonce address mismatch' }, { status: 401 })
  }

  // 2. Reconstruct signed message (must match what nonce.ts produced)
  const message =
    `Sign in to ONE as ${address}\n` + `Nonce: ${payload.r}\n` + `Expires: ${new Date(payload.e).toISOString()}`

  // 3. Cryptographic verification
  try {
    const verified = await verifyPersonalMessageSignature(new TextEncoder().encode(message), signature, { address })
    // verifyPersonalMessageSignature returns the public key; verify it maps to address
    if (verified.toSuiAddress().toLowerCase() !== address) {
      return Response.json({ error: 'signature address mismatch' }, { status: 401 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'verify failed'
    return Response.json({ error: `signature invalid: ${msg}` }, { status: 401 })
  }

  // 4. Ensure human unit exists
  const uid = `human:sui:${address}`
  const shortAddr = `${address.slice(0, 6)}…${address.slice(-4)}`
  await ensureHumanUnit(uid, { id: address, email: null, name: shortAddr })

  // 5. Mint parallel Sui session cookie
  const sessionExp = Date.now() + SESSION_TTL_MS
  const sessionPayload = JSON.stringify({ u: uid, e: sessionExp })
  const sessionPayloadB64 = b64urlEncode(new TextEncoder().encode(sessionPayload))
  const sessionSig = await hmac(sessionSecret, sessionPayloadB64)
  const sessionToken = `${sessionPayloadB64}.${sessionSig}`

  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000)
  const cookie = `one.sui.session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`

  return new Response(JSON.stringify({ uid, wallet: address }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  })
}
