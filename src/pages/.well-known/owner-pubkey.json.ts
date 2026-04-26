/**
 * GET /.well-known/owner-pubkey.json
 *
 * Federation V3 — publishes THIS substrate's owner Sui address + COSE
 * public keys so peer substrates can verify bridge assertions both by
 * address and by cryptographic signature.
 *
 * Response shape:
 *
 * V3 (keys from D1 owner_pubkeys table — schema 0034):
 * {
 *   "address":     "0x...",
 *   "version":     1,
 *   "publishedAt": 1715000000,
 *   "schema":      "owner-pubkey-v3",
 *   "keys": [{ "credId": "...", "pubKey": "...", "alg": "ES256", "registeredAt": 1715000000 }]
 * }
 *
 * V2 fallback (keys from OWNER_PUBKEYS_JSON env var — V2.2 behaviour preserved):
 * {
 *   "address":     "0x...",
 *   "version":     1,
 *   "publishedAt": 1715000000,
 *   "schema":      "owner-pubkey-v2",
 *   "keys": [...]
 * }
 *
 * Source priority:
 *   1. D1 `owner_pubkeys` WHERE revoked_at IS NULL — schema="owner-pubkey-v3".
 *   2. If D1 unavailable OR table empty → OWNER_PUBKEYS_JSON env var — schema="owner-pubkey-v2".
 *
 * Discovery clients accept both schemas. V2.2 substrates that only set the env var
 * continue to work without any change.
 *
 * No auth. Public by design — peers fetch this during bridge handshake.
 * Cache-Control: public, max-age=300 (5 minutes).
 *
 * Operator workflow (V3 — preferred, no redeploy needed):
 *   1. POST /api/auth/owner-pubkeys { credId, pubKey, alg } with owner bearer.
 *   2. Keys are live immediately in the next well-known response.
 *   3. To revoke: DELETE /api/auth/owner-pubkeys { credId }.
 *
 * Operator workflow (V2 fallback — backwards compatible):
 *   1. Set OWNER_PUBKEYS_JSON env var to a JSON array.
 *   2. Re-deploy.
 *
 * Gap 6 V3 — D1-backed COSE public key discovery (replaces env-var OWNER_PUBKEYS_JSON).
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

  // ── Step 1: try D1 owner_pubkeys table (V3 — schema 0034) ───────────────────
  let keys: OwnerKeyEntry[] = []
  let schema = 'owner-pubkey-v2'

  try {
    const db = await getD1(locals as App.Locals)
    if (db) {
      const d1Result = await db
        .prepare(
          `SELECT cred_id AS credId, pub_key AS pubKey, alg, registered_at AS registeredAt
             FROM owner_pubkeys
            WHERE revoked_at IS NULL
            ORDER BY registered_at`,
        )
        .all<OwnerKeyEntry>()
      if (d1Result?.results && d1Result.results.length > 0) {
        keys = d1Result.results
        schema = 'owner-pubkey-v3'
      }
    }
  } catch {
    // D1 unavailable — fall through to env fallback (non-fatal)
  }

  // ── Step 2: env fallback (V2.2 backwards compat) ─────────────────────────────
  if (schema === 'owner-pubkey-v2') {
    const ownerPubkeysRaw: string | undefined =
      ((import.meta.env as Record<string, unknown>).OWNER_PUBKEYS_JSON as string | undefined) ??
      (process.env.OWNER_PUBKEYS_JSON as string | undefined)
    keys = parseOwnerPubkeysJson(ownerPubkeysRaw)
  }

  const body = JSON.stringify({
    address,
    version,
    publishedAt: Math.floor(Date.now() / 1000),
    schema,
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
