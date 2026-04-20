/**
 * Better Auth Plugin: zkLogin (Google OAuth → Sui address)
 *
 * OAuth-to-blockchain identity via Mysten's zkLogin.
 * User signs in with Google; we derive a Sui address they control.
 * No wallet extension needed.
 *
 * Flow:
 *   1. GET /api/auth/zklogin/start → ephemeral keypair + nonce → 302 Google
 *   2. Google redirects back with id_token in URL FRAGMENT (#id_token=...)
 *   3. HTML bounce (Astro route) reads fragment, POSTs to /api/auth/zklogin/verify
 *   4. POST /api/auth/zklogin/verify → JWKS verify + state → derive address → session
 *
 * Governance integration:
 *   - Calls ensureHumanUnit() which creates unit + personal group + chairman role
 *   - Session includes wallet + frontDoor fields for unified identity
 *
 * Security (C3):
 *   - JWKS verification via jose (Google's public keys)
 *   - State cookie HMAC protects against replay within TTL
 *   - Nonce KV tracker deferred (requires Worker env access)
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { generateNonce, generateRandomness, getExtendedEphemeralPublicKey, jwtToAddress } from '@mysten/sui/zklogin'
import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthEndpoint } from 'better-auth/api'
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose'
import { z } from 'zod'
import { ensureHumanUnit } from '../human-unit'
import { writeSilent } from '../typedb'

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

const EPHEMERAL_TTL_MS = 10 * 60 * 1000 // 10 min
const SUI_FULLNODE = 'https://fullnode.mainnet.sui.io:443'

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): string {
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
  return b64url(new Uint8Array(sig))
}

async function deriveSalt(sub: string, secret: string): Promise<string> {
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

export interface ZkLoginOptions {
  nonceSecret: string
  sessionSecret?: string
  googleClientId: string
  googleRedirectUri: string
}

export const zkLogin = (opts: ZkLoginOptions): BetterAuthPlugin => ({
  id: 'zklogin',

  schema: {
    user: {
      fields: {
        wallet: { type: 'string', required: false },
        frontDoor: { type: 'string', required: false },
        legacyAddress: { type: 'boolean', required: false },
        maxEpoch: { type: 'number', required: false },
        zkSalt: { type: 'string', required: false },
      },
    },
  },

  endpoints: {
    zkLoginStart: createAuthEndpoint('/zklogin/start', { method: 'GET' }, async (ctx) => {
      if (!opts.nonceSecret) {
        throw new APIError('INTERNAL_SERVER_ERROR', { message: 'WALLET_NONCE_SECRET not configured' })
      }
      if (!opts.googleClientId || !opts.googleRedirectUri) {
        throw new APIError('INTERNAL_SERVER_ERROR', { message: 'Google OAuth not configured' })
      }

      // Fetch current epoch from Sui fullnode
      let currentEpoch = 0
      try {
        const res = await fetch(SUI_FULLNODE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'suix_getLatestSuiSystemState', params: [] }),
        })
        const data = (await res.json()) as { result?: { epoch?: string } }
        currentEpoch = Number(data.result?.epoch ?? 0)
      } catch {
        // Default to 0 if fullnode unreachable — address derivation still works
      }
      const maxEpoch = currentEpoch + 2

      // Generate ephemeral keypair
      const ephKeypair = new Ed25519Keypair()
      const ephSecretKey = ephKeypair.getSecretKey()
      const extendedPk = getExtendedEphemeralPublicKey(ephKeypair.getPublicKey())
      const randomness = generateRandomness()
      const nonce = generateNonce(ephKeypair.getPublicKey(), maxEpoch, randomness)

      // Sign ephemeral state for cookie
      const exp = Date.now() + EPHEMERAL_TTL_MS
      const statePayload = JSON.stringify({ sk: ephSecretKey, me: maxEpoch, rn: randomness, xk: extendedPk, e: exp })
      const statePayloadB64 = b64url(new TextEncoder().encode(statePayload))
      const stateSig = await hmac(opts.nonceSecret, statePayloadB64)

      // Build Google OAuth URL
      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      oauthUrl.searchParams.set('client_id', opts.googleClientId)
      oauthUrl.searchParams.set('response_type', 'id_token')
      oauthUrl.searchParams.set('redirect_uri', opts.googleRedirectUri)
      oauthUrl.searchParams.set('scope', 'openid email')
      oauthUrl.searchParams.set('nonce', nonce)

      // Return redirect with state cookie
      return new Response(null, {
        status: 302,
        headers: {
          Location: oauthUrl.toString(),
          'Set-Cookie': `one.zk.state=${statePayloadB64}.${stateSig}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      })
    }),

    zkLoginVerify: createAuthEndpoint(
      '/zklogin/verify',
      {
        method: 'POST',
        body: z.object({
          id_token: z.string(),
        }),
      },
      async (ctx) => {
        const { id_token: idToken } = ctx.body
        const nonceSecret = opts.nonceSecret
        const sessionSecret = opts.sessionSecret ?? nonceSecret

        if (!nonceSecret || !sessionSecret) {
          throw new APIError('INTERNAL_SERVER_ERROR', { message: 'Server not configured' })
        }

        // 1. Verify state cookie
        const cookie = ctx.request?.headers.get('Cookie') || ''
        const stateMatch = cookie.match(/(?:^|;\s*)one\.zk\.state=([^;]+)/)
        if (!stateMatch) {
          throw new APIError('UNAUTHORIZED', { message: 'No ephemeral state' })
        }

        const [statePayload, stateSig] = stateMatch[1].split('.')
        if (!statePayload || !stateSig) {
          throw new APIError('BAD_REQUEST', { message: 'Malformed state' })
        }

        const expectedStateSig = await hmac(nonceSecret, statePayload)
        if (expectedStateSig !== stateSig) {
          throw new APIError('UNAUTHORIZED', { message: 'State signature invalid' })
        }

        let ephState: { sk: string; me: number; rn: string; xk: string; e: number }
        try {
          ephState = JSON.parse(b64urlDecode(statePayload))
        } catch {
          throw new APIError('BAD_REQUEST', { message: 'State payload invalid' })
        }

        if (ephState.e < Date.now()) {
          throw new APIError('UNAUTHORIZED', { message: 'State expired' })
        }

        // 2. Cryptographically verify JWT via Google's JWKS
        let jwtPayload: { sub?: string; email?: string; email_verified?: boolean; nonce?: string; aud?: string }
        try {
          const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
            issuer: 'https://accounts.google.com',
            audience: opts.googleClientId,
          })
          jwtPayload = payload as typeof jwtPayload
        } catch (e) {
          if (e instanceof joseErrors.JWTExpired) {
            throw new APIError('UNAUTHORIZED', { message: 'JWT expired' })
          }
          if (e instanceof joseErrors.JWTClaimValidationFailed) {
            throw new APIError('UNAUTHORIZED', { message: 'JWT claim validation failed' })
          }
          throw new APIError('UNAUTHORIZED', { message: 'JWT signature invalid' })
        }

        if (!jwtPayload.sub) {
          throw new APIError('BAD_REQUEST', { message: 'JWT missing sub' })
        }

        // 3. Derive salt and address
        const salt = await deriveSalt(jwtPayload.sub, nonceSecret)
        let address: string
        try {
          address = jwtToAddress(idToken, salt).toLowerCase()
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'address derivation failed'
          throw new APIError('BAD_REQUEST', { message: msg })
        }

        // 4. Ensure human unit exists (governance integration)
        const uid = `human:sui:${address}`
        const displayName = jwtPayload.email ?? `${address.slice(0, 6)}…${address.slice(-4)}`
        await ensureHumanUnit(uid, { id: address, email: jwtPayload.email ?? null, name: displayName })

        // Record identity-link (fire-and-forget)
        writeSilent(`
          match $u isa unit, has uid "${uid}";
          insert $link (subject: $u) isa identity-link,
            has linked-at ${Date.now()},
            has front-door "zklogin";
        `)

        // 5. Find or create user in Better Auth
        let user = await ctx.context.adapter.findOne({
          model: 'user',
          where: [{ field: 'wallet', value: address }],
        })

        if (!user) {
          user = await ctx.context.internalAdapter.createUser({
            name: displayName,
            email: jwtPayload.email || `${address.slice(0, 10)}@zklogin.one.ie`,
            emailVerified: true,
            wallet: address,
            frontDoor: 'zklogin',
            maxEpoch: ephState.me,
            zkSalt: 'hmac',
          })
        } else {
          // Update frontDoor and maxEpoch
          await ctx.context.adapter.update({
            model: 'user',
            where: [{ field: 'id', value: user.id }],
            update: { frontDoor: 'zklogin', maxEpoch: ephState.me, zkSalt: 'hmac' },
          })
        }

        // 6. Create session
        const session = await ctx.context.internalAdapter.createSession(user.id, ctx.request)

        // Clear state cookie
        const headers = new Headers({ 'Content-Type': 'application/json' })
        headers.append('Set-Cookie', 'one.zk.state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')

        return new Response(
          JSON.stringify({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              wallet: address,
              frontDoor: 'zklogin',
            },
            session: {
              token: session.token,
              expiresAt: session.expiresAt,
            },
            uid,
          }),
          { status: 200, headers },
        )
      },
    ),
  },
})
