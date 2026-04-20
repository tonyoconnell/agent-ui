/**
 * @deprecated Use Better Auth plugin: POST /api/auth/sui-wallet/verify
 *
 * This DIY endpoint is retired. The sui-wallet plugin in auth.ts now handles
 * signature verification and session creation with proper Better Auth integration.
 */
import type { APIRoute } from 'astro'

export const prerender = false

export const POST: APIRoute = async () => {
  return Response.json(
    {
      error: 'deprecated',
      message: 'Use /api/auth/sui-wallet/verify instead',
      migration: 'WalletSignIn.tsx now calls the Better Auth plugin endpoints',
    },
    { status: 410 },
  )
}
