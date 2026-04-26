/**
 * POST /api/agents/register — Owner-only agent wallet registration (Gap 1)
 *
 * The WRAP happens in the owner's BROWSER (where the WebAuthn PRF lives).
 * This endpoint accepts the already-wrapped ciphertext + iv and stores
 * it in D1, then mints a bearer token returned once for the agent to use.
 *
 * Auth: Bearer <owner-bearer> — role === 'owner' only.
 *
 * Body:
 *   uid:            string   — agent uid e.g. "marketing:scout"
 *   address:        string   — Sui address derived from agent_seed (public)
 *   ciphertextB64:  string   — base64url(AES-GCM(seed, agent_kek))
 *   ivB64:          string   — base64url(12-byte AES-GCM nonce)
 *   kdfVersion?:    number   — default 1
 *   kind?:          string   — optional, e.g. "autonomous"
 *   expiresAt?:     number   — unix epoch; null = no expiry
 *
 * Response 200:
 *   { uid, address, bearer, keyId, kdfVersion }
 *
 * bearer is returned ONCE — agent stores in worker secret.
 *
 * Errors:
 *   401 unauthenticated
 *   403 not-owner
 *   400 bad-input
 *   409 already-registered
 *   500 d1-failed / typedb-failed
 */

import type { APIRoute } from 'astro'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { generateApiKey, getKeyPrefix, hashKey } from '@/lib/api-key'
import { getD1 } from '@/lib/cf-env'
import { write } from '@/lib/typedb'

export const prerender = false

// ─── validation helpers ───────────────────────────────────────────────────────

const UID_RE = /^[a-zA-Z0-9_:.-]+$/
const ADDRESS_RE = /^0x[0-9a-fA-F]{64}$/

/**
 * Decode a base64url string to Uint8Array using Web Crypto / atob.
 * Returns null if the string is not valid base64url.
 */
function decodeBase64url(s: string): Uint8Array | null {
  try {
    // Normalise base64url → standard base64
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? 0 : 4 - (b64.length % 4)
    const padded = b64 + '='.repeat(pad)
    const bin = atob(padded)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// ─── endpoint ─────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  // ── 1. Resolve auth ──────────────────────────────────────────────────────────
  const auth = await resolveUnitFromSession(request, locals)

  if (!auth.isValid) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (auth.role !== 'owner') {
    return new Response(JSON.stringify({ error: 'not-owner' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────────
  let body: {
    uid?: unknown
    address?: unknown
    ciphertextB64?: unknown
    ivB64?: unknown
    kdfVersion?: unknown
    kind?: unknown
    expiresAt?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return new Response(JSON.stringify({ error: 'bad-input', detail: 'body must be JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 3. Validate fields ───────────────────────────────────────────────────────
  const uid = typeof body.uid === 'string' ? body.uid : null
  if (!uid || !UID_RE.test(uid) || uid.length > 255) {
    return new Response(
      JSON.stringify({ error: 'bad-input', detail: 'uid must match /^[a-zA-Z0-9_:.-]+$/ and be ≤255 chars' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const address = typeof body.address === 'string' ? body.address : null
  if (!address || !ADDRESS_RE.test(address)) {
    return new Response(JSON.stringify({ error: 'bad-input', detail: 'address must match /^0x[0-9a-fA-F]{64}$/' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const ciphertextB64 = typeof body.ciphertextB64 === 'string' ? body.ciphertextB64 : null
  if (!ciphertextB64) {
    return new Response(JSON.stringify({ error: 'bad-input', detail: 'ciphertextB64 is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const ciphertextBytes = decodeBase64url(ciphertextB64)
  if (!ciphertextBytes || ciphertextBytes.length < 48) {
    // AES-GCM: 32-byte seed + 16-byte auth tag = 48 bytes minimum
    return new Response(
      JSON.stringify({ error: 'bad-input', detail: 'ciphertextB64 must decode to ≥48 bytes (seed + GCM auth tag)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const ivB64 = typeof body.ivB64 === 'string' ? body.ivB64 : null
  if (!ivB64) {
    return new Response(JSON.stringify({ error: 'bad-input', detail: 'ivB64 is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const ivBytes = decodeBase64url(ivB64)
  if (!ivBytes || ivBytes.length !== 12) {
    return new Response(
      JSON.stringify({ error: 'bad-input', detail: 'ivB64 must decode to exactly 12 bytes (AES-GCM nonce)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const kdfVersionRaw = body.kdfVersion
  const kdfVersion =
    kdfVersionRaw === undefined || kdfVersionRaw === null
      ? 1
      : typeof kdfVersionRaw === 'number' && Number.isInteger(kdfVersionRaw) && kdfVersionRaw >= 1
        ? kdfVersionRaw
        : null
  if (kdfVersion === null) {
    return new Response(JSON.stringify({ error: 'bad-input', detail: 'kdfVersion must be an integer ≥1' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // kind is accepted and stored in the future (agent TypeDB unit) — validated but not echoed
  const _kind = typeof body.kind === 'string' ? body.kind : 'agent'
  const expiresAt =
    body.expiresAt === undefined || body.expiresAt === null
      ? null
      : typeof body.expiresAt === 'number'
        ? body.expiresAt
        : null

  // ── 4. Acquire D1 ───────────────────────────────────────────────────────────
  const db = await getD1(locals)
  if (!db) {
    return new Response(JSON.stringify({ error: 'd1-failed', detail: 'D1 binding unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 5. Duplicate check ───────────────────────────────────────────────────────
  try {
    const existing = await db
      .prepare('SELECT count(*) AS n FROM agent_wallet WHERE uid = ?')
      .bind(uid)
      .first<{ n: number }>()
    if (existing && existing.n > 0) {
      return new Response(JSON.stringify({ error: 'already-registered', uid }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    console.error('[agents/register] D1 count check failed', err)
    return new Response(JSON.stringify({ error: 'd1-failed', detail: 'count check failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 6. Mint bearer FIRST (cleaner failure state) ─────────────────────────────
  //
  // If D1 INSERT fails after bearer mint, the bearer is unused (the agent has
  // no ciphertext row to unlock; /unlock would 404). Clean state — operator
  // can re-run register with the same uid (duplicate check passes only if the
  // D1 row exists). This is safer than minting after D1: that order leaves a
  // row with no key, which is harder to reason about.
  let bearer: string
  let keyId: string
  let keyHash: string
  try {
    bearer = generateApiKey()
    keyHash = await hashKey(bearer)
    keyId = `key-${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
  } catch (err) {
    console.error('[agents/register] bearer mint failed', err)
    return new Response(JSON.stringify({ error: 'typedb-failed', detail: 'key generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 7. Persist api-key to TypeDB (same pattern as /api/auth/agent lines 181-198) ──
  try {
    const now = new Date().toISOString().replace('Z', '')
    const keyPrefix = getKeyPrefix(bearer)
    // Agent wallet keys have no expiry — rotate by re-registering (DELETE + re-POST)
    await write(`
      insert $k isa api-key,
        has api-key-id "${esc(keyId)}",
        has key-hash "${esc(keyHash)}",
        has user-id "${esc(uid)}",
        has key-prefix "${keyPrefix}",
        has permissions "read,write",
        has key-status "active",
        has created ${now};
    `)
    // Link key to unit (best-effort — key still resolves via user-id)
    await write(`
      match
        $k isa api-key, has api-key-id "${esc(keyId)}";
        $u isa unit, has uid "${esc(uid)}";
      insert
        (api-key: $k, authorized-unit: $u) isa api-authorization;
    `).catch(() => {
      /* unit may not exist in TypeDB yet — acceptable; key resolves via user-id */
    })
  } catch (err) {
    console.error('[agents/register] TypeDB api-key insert failed', err)
    return new Response(JSON.stringify({ error: 'typedb-failed', detail: 'api-key insert failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 8. INSERT into D1 agent_wallet ──────────────────────────────────────────
  try {
    await db
      .prepare(
        'INSERT INTO agent_wallet (uid, ciphertext, iv, kdf_version, address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(uid, ciphertextBytes, ivBytes, kdfVersion, address, expiresAt)
      .run()
  } catch (err) {
    console.error('[agents/register] D1 INSERT failed', err)
    return new Response(JSON.stringify({ error: 'd1-failed', detail: 'agent_wallet insert failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── 9. Return receipt — bearer shown ONCE ────────────────────────────────────
  return new Response(
    JSON.stringify({
      uid,
      address,
      bearer,
      keyId,
      kdfVersion,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-ONE-Protocol': 'v1' },
    },
  )
}
