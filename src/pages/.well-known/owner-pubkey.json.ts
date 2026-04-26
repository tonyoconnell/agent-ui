/**
 * GET /.well-known/owner-pubkey.json
 *
 * Federation V2 — publishes THIS substrate's owner Sui address so peer
 * substrates can verify bridge assertions against a well-known endpoint.
 *
 * Response shape (owner-pubkey-v1):
 * {
 *   "address":     "0x...",   // owner's Sui address (OWNER_EXPECTED_ADDRESS env)
 *   "version":     1,         // owner key version from D1 owner_key table
 *   "publishedAt": 1715000000, // unix seconds, current time
 *   "schema":      "owner-pubkey-v1"
 * }
 *
 * No auth. Public by design — peers fetch this during bridge handshake.
 * Cache-Control: public, max-age=300 (5 minutes).
 *
 * Version lookup: D1 `owner_key` WHERE (expires_at IS NULL OR expires_at > now())
 *   ORDER BY version DESC LIMIT 1.
 * Falls back to version=1 when D1 is unavailable or the table is empty
 * (substrate not yet registered — still serves the pubkey so peers can at
 * least discover the address for out-of-band verification).
 *
 * Gap 6 V2 — federation discovery endpoint.
 * Gap 6 V2.2 will add a `jwks` field (COSE public keys) for full
 * WebAuthn assertion verification at bridge time.
 */

import type { APIRoute } from 'astro'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

export const GET: APIRoute = async ({ locals }) => {
  // Read owner address from env (set via OWNER_EXPECTED_ADDRESS)
  const address: string =
    ((import.meta.env as Record<string, unknown>).OWNER_EXPECTED_ADDRESS as string | undefined) ??
    (process.env.OWNER_EXPECTED_ADDRESS as string | undefined) ??
    ''

  if (!address) {
    return Response.json(
      { error: 'owner-not-configured', detail: 'OWNER_EXPECTED_ADDRESS env var not set' },
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // Look up the active owner key version from D1.
  // SELECT version FROM owner_key
  //   WHERE expires_at IS NULL OR expires_at > unixepoch()
  //   ORDER BY version DESC
  //   LIMIT 1
  let version = 1
  try {
    const db = await getD1(locals as App.Locals)
    if (db) {
      const row = await db
        .prepare(
          `SELECT version FROM owner_key
           WHERE (expires_at IS NULL OR expires_at > unixepoch())
           ORDER BY version DESC
           LIMIT 1`,
        )
        .first<{ version: number }>()
      if (row && typeof row.version === 'number') {
        version = row.version
      }
    }
  } catch {
    // D1 unavailable — serve version=1 (best-effort, non-fatal)
  }

  const body = JSON.stringify({
    address,
    version,
    publishedAt: Math.floor(Date.now() / 1000),
    schema: 'owner-pubkey-v1',
  })

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
