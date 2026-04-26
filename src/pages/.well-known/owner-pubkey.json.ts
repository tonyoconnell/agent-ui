/**
 * GET /.well-known/owner-pubkey.json
 *
 * Federation V2.2 — publishes THIS substrate's owner Sui address + COSE
 * public keys so peer substrates can verify bridge assertions both by
 * address and by cryptographic signature.
 *
 * Response shape (owner-pubkey-v2):
 * {
 *   "address":     "0x...",        // owner's Sui address (OWNER_EXPECTED_ADDRESS env)
 *   "version":     1,              // owner key version from D1 owner_key table
 *   "publishedAt": 1715000000,     // unix seconds, current time
 *   "schema":      "owner-pubkey-v2",
 *   "keys": [
 *     {
 *       "credId":       "AAAA...", // base64url WebAuthn credential ID
 *       "pubKey":       "BBBB...", // base64url COSE public key bytes
 *       "alg":          "ES256",   // COSE alg name (informational)
 *       "registeredAt": 1715000000
 *     }
 *   ]
 * }
 *
 * When OWNER_PUBKEYS_JSON env var is absent, keys is [] and schema is
 * still "owner-pubkey-v2" — discovery clients treat v1 (no keys) and
 * v2 (keys present or empty) compatibly.
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
 * Operator workflow (runbook):
 *   1. Export your WebAuthn credential public key in COSE format (base64url).
 *   2. Set OWNER_PUBKEYS_JSON env var to a JSON array:
 *      '[{"credId":"<base64url>","pubKey":"<base64url>","alg":"ES256","registeredAt":<unix-s>}]'
 *   3. Re-deploy. The well-known endpoint will serve the keys array.
 *   4. Peer substrates can now verify bridge assertions cryptographically.
 *
 * Gap 6 V2.2 — COSE public key discovery for full WebAuthn assertion verification.
 */

import type { APIRoute } from 'astro'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

/** A single COSE public key entry */
export interface OwnerKeyEntry {
  credId: string
  pubKey: string
  alg: string
  registeredAt: number
}

function parseOwnerPubkeysJson(raw: string | undefined): OwnerKeyEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is OwnerKeyEntry =>
        entry !== null &&
        typeof entry === 'object' &&
        typeof entry.credId === 'string' &&
        typeof entry.pubKey === 'string' &&
        typeof entry.alg === 'string' &&
        typeof entry.registeredAt === 'number',
    )
  } catch {
    return []
  }
}

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

  // Read COSE public keys from env (operator-curated, see runbook above)
  const ownerPubkeysRaw: string | undefined =
    ((import.meta.env as Record<string, unknown>).OWNER_PUBKEYS_JSON as string | undefined) ??
    (process.env.OWNER_PUBKEYS_JSON as string | undefined)
  const keys = parseOwnerPubkeysJson(ownerPubkeysRaw)

  const body = JSON.stringify({
    address,
    version,
    publishedAt: Math.floor(Date.now() / 1000),
    schema: 'owner-pubkey-v2',
    keys,
  })

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
