/**
 * Better Auth Plugin: Sui Wallet Authentication
 *
 * SIWE-style plugin for native Sui wallet sign-in.
 * Replaces DIY /api/auth/wallet/{nonce,verify} endpoints.
 *
 * Flow:
 *   1. GET /api/auth/sui-wallet/nonce?addr=0x... → HMAC-signed challenge
 *   2. Wallet signs message
 *   3. POST /api/auth/sui-wallet/verify {address, signature, nonce} → session
 *
 * Governance integration:
 *   - Calls ensureHumanUnit() which creates unit + personal group + chairman role
 *   - Session includes wallet + frontDoor fields for unified identity
 */

import { verifyPersonalMessageSignature } from '@mysten/sui/verify'
import type { BetterAuthPlugin } from 'better-auth'
import { APIError, createAuthEndpoint } from 'better-auth/api'
import { z } from 'zod'
import { ensureHumanUnit } from '../human-unit'

const NONCE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
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

export interface SuiWalletOptions {
  nonceSecret: string
  sessionSecret?: string
}

export const suiWallet = (opts: SuiWalletOptions): BetterAuthPlugin => ({
  id: 'sui-wallet',

  schema: {
    user: {
      fields: {
        wallet: { type: 'string', required: false },
        frontDoor: { type: 'string', required: false },
        legacyAddress: { type: 'boolean', required: false },
        maxEpoch: { type: 'number', required: false },
      },
    },
  },

  endpoints: {
    suiWalletNonce: createAuthEndpoint(
      '/sui-wallet/nonce',
      {
        method: 'GET',
        query: z.object({
          addr: z.string().regex(/^0x[0-9a-fA-F]{1,64}$/, 'Invalid Sui address'),
        }),
      },
      async (ctx) => {
        const addr = ctx.query.addr.toLowerCase()

        if (!opts.nonceSecret) {
          throw new APIError('INTERNAL_SERVER_ERROR', { message: 'WALLET_NONCE_SECRET not configured' })
        }

        const exp = Date.now() + NONCE_TTL_MS
        const random = b64url(crypto.getRandomValues(new Uint8Array(16)))
        const payload = JSON.stringify({ a: addr, r: random, e: exp })
        const payloadB64 = b64url(new TextEncoder().encode(payload))
        const sig = await hmac(opts.nonceSecret, payloadB64)
        const nonce = `${payloadB64}.${sig}`

        const message = `Sign in to ONE as ${addr}\nNonce: ${random}\nExpires: ${new Date(exp).toISOString()}`

        return ctx.json({ nonce, message, exp })
      },
    ),

    suiWalletVerify: createAuthEndpoint(
      '/sui-wallet/verify',
      {
        method: 'POST',
        body: z.object({
          address: z.string(),
          signature: z.string(),
          nonce: z.string(),
        }),
      },
      async (ctx) => {
        const { address: rawAddress, signature, nonce } = ctx.body
        const address = rawAddress.toLowerCase()

        const nonceSecret = opts.nonceSecret
        const sessionSecret = opts.sessionSecret ?? nonceSecret

        if (!nonceSecret || !sessionSecret) {
          throw new APIError('INTERNAL_SERVER_ERROR', { message: 'Server not configured' })
        }

        // 1. HMAC-verify nonce
        const [payloadB64, sig] = nonce.split('.')
        if (!payloadB64 || !sig) {
          throw new APIError('BAD_REQUEST', { message: 'Malformed nonce' })
        }

        const expected = await hmac(nonceSecret, payloadB64)
        if (expected !== sig) {
          throw new APIError('UNAUTHORIZED', { message: 'Nonce signature invalid' })
        }

        let payload: { a: string; r: string; e: number }
        try {
          payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)))
        } catch {
          throw new APIError('BAD_REQUEST', { message: 'Nonce payload invalid' })
        }

        if (payload.e < Date.now()) {
          throw new APIError('UNAUTHORIZED', { message: 'Nonce expired' })
        }
        if (payload.a !== address) {
          throw new APIError('UNAUTHORIZED', { message: 'Nonce address mismatch' })
        }

        // 2. Reconstruct signed message
        const message = `Sign in to ONE as ${address}\nNonce: ${payload.r}\nExpires: ${new Date(payload.e).toISOString()}`

        // 3. Cryptographic verification
        try {
          const verified = await verifyPersonalMessageSignature(new TextEncoder().encode(message), signature, {
            address,
          })
          if (verified.toSuiAddress().toLowerCase() !== address) {
            throw new APIError('UNAUTHORIZED', { message: 'Signature address mismatch' })
          }
        } catch (e) {
          if (e instanceof APIError) throw e
          const msg = e instanceof Error ? e.message : 'verify failed'
          throw new APIError('UNAUTHORIZED', { message: `Signature invalid: ${msg}` })
        }

        // 4. Ensure human unit exists (governance integration)
        const uid = `human:sui:${address}`
        const shortAddr = `${address.slice(0, 6)}…${address.slice(-4)}`
        await ensureHumanUnit(uid, { id: address, email: null, name: shortAddr })

        // 5. Find or create user in Better Auth
        let user = await ctx.context.adapter.findOne({
          model: 'user',
          where: [{ field: 'wallet', value: address }],
        })

        if (!user) {
          user = await ctx.context.internalAdapter.createUser({
            name: shortAddr,
            email: `${address.slice(0, 10)}@sui.one.ie`,
            emailVerified: true,
            wallet: address,
            frontDoor: 'wallet',
          })
        } else {
          // Update frontDoor if needed
          if (!user.frontDoor) {
            await ctx.context.adapter.update({
              model: 'user',
              where: [{ field: 'id', value: user.id }],
              update: { frontDoor: 'wallet', wallet: address },
            })
          }
        }

        // 6. Create session
        const session = await ctx.context.internalAdapter.createSession(user.id, ctx.request)

        // Return user with session token
        return ctx.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            wallet: address,
            frontDoor: 'wallet',
          },
          session: {
            token: session.token,
            expiresAt: session.expiresAt,
          },
          uid,
        })
      },
    ),
  },
})
