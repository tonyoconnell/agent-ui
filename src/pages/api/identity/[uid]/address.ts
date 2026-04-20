import type { APIRoute } from 'astro'
import { addressFor } from '@/lib/sui'

export const prerender = false

/**
 * GET /api/identity/:uid/address
 * Returns the deterministic Sui wallet address for a given uid.
 * Pure GET — no TypeDB read, no writes, no side effects.
 * Address is derived from SUI_SEED + uid (Ed25519 keypair, deterministic).
 */
export const GET: APIRoute = async ({ params }) => {
  const { uid } = params

  if (!uid) {
    return Response.json({ error: 'uid required' }, { status: 400 })
  }

  const address = await addressFor(uid)
  return Response.json({ uid, address, derivedAt: new Date().toISOString() })
}
