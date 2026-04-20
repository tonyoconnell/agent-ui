/**
 * GET /api/auth/zklogin/callback?id_token=...  (id_token in fragment; see below)
 * or POST with { id_token } body.
 *
 * Completes zkLogin sign-in:
 *   1. read ephemeral state cookie (one.zk.state)
 *   2. parse id_token (header.payload.sig) — MVP trust-on-parse; verify via JWKS in prod
 *   3. derive user salt deterministically from sub (MVP; swap for salt service later)
 *   4. compute Sui address via jwtToAddress(jwt, salt)
 *   5. ensureHumanUnit("human:sui:<addr>", {id: addr, email: jwt.email})
 *   6. set one.sui.session cookie and record front-door=zklogin identity-link
 *
 * NOTE: Google sends id_token in URL fragment (response_type=id_token).
 * The fragment is NOT sent to the server — we need a tiny client bounce that reads
 * location.hash and POSTs it. The GET handler below returns that bounce HTML;
 * the POST handler does the real work.
 */

import { jwtToAddress } from '@mysten/sui/zklogin'
import type { APIRoute } from 'astro'
import { ensureHumanUnit } from '@/lib/api-auth'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function b64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecodeString(s: string): string {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  return atob(b64)
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

async function deriveSalt(sub: string, secret: string): Promise<string> {
  // MVP: deterministic salt = HMAC(secret, sub) truncated to BigInt < 2^128
  // Production: replace with a salt service (OpenID-style).
  const mac = await hmac(secret, `salt:${sub}`)
  const bytes = new Uint8Array(
    atob(mac.replace(/-/g, '+').replace(/_/g, '/') + '==')
      .split('')
      .map((c) => c.charCodeAt(0)),
  ).slice(0, 16)
  let big = 0n
  for (const b of bytes) big = (big << 8n) + BigInt(b)
  return big.toString()
}

export const GET: APIRoute = async () => {
  // Client-side bounce: reads id_token from fragment, POSTs it back.
  const html = `<!doctype html><html><head><meta charset=utf-8><title>Signing in…</title></head>
<body style="font-family:system-ui;background:#0a0a0f;color:#cbd5e1;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Completing sign-in…</p>
<script>
(async () => {
  const hash = new URLSearchParams(location.hash.slice(1));
  const idToken = hash.get('id_token');
  if (!idToken) { document.body.innerText = 'No id_token in response'; return; }
  const res = await fetch('/api/auth/zklogin/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  if (res.ok) { location.replace('/chairman'); }
  else { const { error } = await res.json().catch(() => ({})); document.body.innerText = 'Sign-in failed: ' + (error || res.status); }
})();
</script></body></html>`
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env =
    (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env ?? (process.env as Record<string, string>)
  const nonceSecret = env.WALLET_NONCE_SECRET
  const sessionSecret = env.SUI_SESSION_SECRET ?? nonceSecret
  if (!nonceSecret || !sessionSecret) {
    return Response.json({ error: 'server not configured' }, { status: 500 })
  }

  let idToken: string
  try {
    const body = (await request.json()) as { id_token?: string }
    idToken = body.id_token ?? ''
  } catch {
    return Response.json({ error: 'invalid JSON' }, { status: 400 })
  }
  if (!idToken) return Response.json({ error: 'id_token required' }, { status: 400 })

  // 1. Ephemeral state cookie
  const cookie = request.headers.get('Cookie') || ''
  const stateMatch = cookie.match(/(?:^|;\s*)one\.zk\.state=([^;]+)/)
  if (!stateMatch) return Response.json({ error: 'no ephemeral state' }, { status: 401 })

  const [statePayload, stateSig] = stateMatch[1].split('.')
  if (!statePayload || !stateSig) return Response.json({ error: 'malformed state' }, { status: 400 })
  const expectedStateSig = await hmac(nonceSecret, statePayload)
  if (expectedStateSig !== stateSig) return Response.json({ error: 'state signature invalid' }, { status: 401 })

  let ephState: { sk: string; me: number; rn: string; xk: string; e: number }
  try {
    ephState = JSON.parse(b64urlDecodeString(statePayload))
  } catch {
    return Response.json({ error: 'state payload invalid' }, { status: 400 })
  }
  if (ephState.e < Date.now()) return Response.json({ error: 'state expired' }, { status: 401 })

  // 2. Parse JWT (MVP: trust-on-parse; production must verify via JWKS)
  const parts = idToken.split('.')
  if (parts.length !== 3) return Response.json({ error: 'bad jwt shape' }, { status: 400 })
  let jwtPayload: { sub?: string; email?: string; nonce?: string; aud?: string }
  try {
    jwtPayload = JSON.parse(b64urlDecodeString(parts[1]))
  } catch {
    return Response.json({ error: 'bad jwt payload' }, { status: 400 })
  }
  if (!jwtPayload.sub) return Response.json({ error: 'jwt missing sub' }, { status: 400 })

  // 3. Derive salt deterministically
  const salt = await deriveSalt(jwtPayload.sub, nonceSecret)

  // 4. Compute Sui address
  let address: string
  try {
    address = jwtToAddress(idToken, salt).toLowerCase()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'address derivation failed'
    return Response.json({ error: msg }, { status: 400 })
  }

  const uid = `human:sui:${address}`
  const displayName = jwtPayload.email ?? `${address.slice(0, 6)}…${address.slice(-4)}`
  await ensureHumanUnit(uid, { id: address, email: jwtPayload.email ?? null, name: displayName })

  // Record front-door provenance (fire-and-forget; schema addition in C2.4)
  writeSilent(`
    match $u isa unit, has uid "${uid}";
    insert $link (subject: $u) isa identity-link,
      has linked-at ${Date.now()},
      has front-door "zklogin";
  `)

  // 5. Mint Sui session cookie (same shape as /api/auth/wallet/verify)
  const sessionExp = Date.now() + SESSION_TTL_MS
  const sessionPayload = JSON.stringify({ u: uid, e: sessionExp })
  const sessionPayloadB64 = b64urlEncode(new TextEncoder().encode(sessionPayload))
  const sessionSig = await hmac(sessionSecret, sessionPayloadB64)
  const sessionToken = `${sessionPayloadB64}.${sessionSig}`

  const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000)
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.append(
    'Set-Cookie',
    `one.sui.session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`,
  )
  headers.append('Set-Cookie', `one.zk.state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`)

  return new Response(JSON.stringify({ uid, wallet: address, frontDoor: 'zklogin' }), { status: 200, headers })
}
