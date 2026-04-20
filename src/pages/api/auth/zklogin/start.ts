/**
 * GET /api/auth/zklogin/start
 *
 * Step 1 of zkLogin:
 *   - generate ephemeral Ed25519 keypair
 *   - compute OAuth nonce = poseidon(eph_pk, max_epoch, jwt_randomness)
 *   - stash ephemeral secret + randomness in a signed short-lived cookie
 *   - redirect to Google with the nonce
 *
 * Google will redirect back to /api/auth/zklogin/callback?id_token=...
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { generateNonce, generateRandomness, getExtendedEphemeralPublicKey } from '@mysten/sui/zklogin'
import type { APIRoute } from 'astro'

export const prerender = false

const EPHEMERAL_TTL_MS = 10 * 60 * 1000 // 10 min

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
  const env =
    (locals as { runtime?: { env?: Record<string, string> } })?.runtime?.env ?? (process.env as Record<string, string>)
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI
  const secret = env.WALLET_NONCE_SECRET

  if (!clientId || !redirectUri || !secret) {
    return Response.json({ error: 'zklogin not configured' }, { status: 500 })
  }

  // Fetch current epoch (simple: read public Sui fullnode)
  const epochRes = await fetch('https://fullnode.mainnet.sui.io:443', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'suix_getLatestSuiSystemState', params: [] }),
  })
  const epochData = (await epochRes.json().catch(() => ({}))) as { result?: { epoch?: string } }
  const currentEpoch = Number(epochData.result?.epoch ?? 0)
  const maxEpoch = currentEpoch + 2 // valid for ~2 epochs

  const ephKeypair = new Ed25519Keypair()
  const ephSecretKey = ephKeypair.getSecretKey() // suiprivkey1...
  const extendedPk = getExtendedEphemeralPublicKey(ephKeypair.getPublicKey())
  const randomness = generateRandomness()
  const nonce = generateNonce(ephKeypair.getPublicKey(), maxEpoch, randomness)

  // Stash ephemeral state in a signed HTTP-only cookie (10 min)
  const exp = Date.now() + EPHEMERAL_TTL_MS
  const statePayload = JSON.stringify({ sk: ephSecretKey, me: maxEpoch, rn: randomness, xk: extendedPk, e: exp })
  const statePayloadB64 = b64url(new TextEncoder().encode(statePayload))
  const stateSig = await hmac(secret, statePayloadB64)
  const stateCookie = `one.zk.state=${statePayloadB64}.${stateSig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`

  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  oauthUrl.searchParams.set('client_id', clientId)
  oauthUrl.searchParams.set('response_type', 'id_token')
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', 'openid email')
  oauthUrl.searchParams.set('nonce', nonce)

  return new Response(null, {
    status: 302,
    headers: {
      Location: oauthUrl.toString(),
      'Set-Cookie': stateCookie,
    },
  })
}
