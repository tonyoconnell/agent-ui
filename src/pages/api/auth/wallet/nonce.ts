/**
 * @deprecated Use Better Auth plugin: GET /api/auth/sui-wallet/nonce
 *
 * This DIY endpoint is retired. The sui-wallet plugin in auth.ts now handles
 * nonce generation with proper session management.
 */
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async () => {
  return Response.json(
    {
      error: 'deprecated',
      message: 'Use /api/auth/sui-wallet/nonce instead',
      migration: 'WalletSignIn.tsx now calls the Better Auth plugin endpoints',
    },
    { status: 410 },
  )
}
