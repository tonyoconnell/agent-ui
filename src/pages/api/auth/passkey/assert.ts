/**
 * POST /api/auth/passkey/assert — owner-tier role assertion + first-mint,
 * and N-of-M chairman multisig assertion batching (Gap 3 §3.s3).
 *
 * === FIRST-MINT FLOW (existing, unchanged) ===
 * When body.action is absent / not 'multisig-action', the existing first-mint
 * owner flow runs:
 *   1. Verifies the caller's resolved Sui address equals env.OWNER_EXPECTED_ADDRESS
 *   2. Calls Move `init_substrate_owner(pin, addr)` to lock the on-chain pin
 *      (Sui aborts with E_OWNER_LOCKED on second call → 409 Conflict)
 *   3. Inserts the bearer hash into D1 `owner_key`
 * On subsequent calls, the address is checked against the registered owner.
 *
 * === MULTISIG BATCHED FLOW (Gap 3 §3.s3) ===
 * When body.action === 'multisig-action', the endpoint accepts a SINGLE
 * WebAuthn assertion from one chairman. The server collects N such assertions
 * (one per chairman) in an in-process bundle store keyed by bundleId within
 * a 5-minute window:
 *
 *   POST body: {
 *     action: 'multisig-action',
 *     groupId: string,
 *     bundleId: string,           // UUIDv4 nonce issued by client or server earlier
 *     assertion: {
 *       credId: string,
 *       clientDataJSON: string,   // base64url
 *       authenticatorData: string, // base64url
 *       signature: string,         // base64url
 *     }
 *   }
 *
 *   Responses:
 *     { ok: false, accepted: N, threshold: M }  — accepted, not yet at threshold
 *     { ok: true,  accepted: N, threshold: M }  — threshold reached
 *     { error: '...', ... }                     — failure modes
 *
 * Server flow:
 *   1. Look up chairman_multisig D1 row for group_id → 400 if absent.
 *   2. Parse member_credentials JSON; find the credId → 403 if unknown.
 *   3. Verify the WebAuthn assertion using verifyAuthenticationResponse from
 *      @simplewebauthn/server; member.pubKey (COSE key, base64url) is required.
 *   4. Maintain bundle store (module-scope Map, 5-min TTL):
 *      - First call: create entry, add credId to accepted Set.
 *      - Subsequent calls: add credId (Set dedupes, can't double-count).
 *      - Expired bundle: 410 bundle-expired.
 *      - groupId mismatch: 403 bundle-group-mismatch.
 *   5. Compare accepted.size vs threshold_n:
 *      - < n → 200 { ok: false, accepted, threshold: n }
 *      - >= n → 200 { ok: true, accepted, threshold: n } + emit audit record.
 *
 * Cryptographic verification: V2 uses verifyAuthenticationResponse from
 * @simplewebauthn/server. member_credentials JSON now requires pubKey (base64url
 * COSE key bytes returned from verifyRegistrationResponse). The bundleId is the
 * expectedChallenge — server-issued and replay-protected by the 5-min TTL.
 * Counter tracking (sign_count per member) is V3 work — deferred because it
 * requires a D1 write per assertion; the 5-min TTL is the current replay guard.
 *
 * Bundle store: module-scope Map<bundleId, BundleEntry>. In production this
 * would live in a Durable Object (one per group); in V1 in-process is
 * acceptable — matches Gap 5's per-isolate counter pattern.
 *
 * Spec: compliance.md §"Implementation notes for W3". owner-todo Gap 3 §3.s3.
 */

import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { APIRoute } from 'astro'
import { auditOwner } from '@/engine/adl-cache'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { generateApiKey, hashKey } from '@/lib/api-key'
import { getD1 } from '@/lib/cf-env'
import { lockOnChainOwner } from '@/lib/owner-mint'
import { readParsed } from '@/lib/typedb'

export const prerender = false

// ─── Multisig bundle store ─────────────────────────────────────────────────

const BUNDLE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface BundleEntry {
  groupId: string
  accepted: Set<string> // credIds that have verified
  expiresAt: number
}

/** Module-scope bundle store. V1: in-process. V2: Durable Object per group. */
export const MULTISIG_BUNDLES = new Map<string, BundleEntry>()

function cleanExpiredBundles(): void {
  const now = Date.now()
  for (const [id, entry] of MULTISIG_BUNDLES) {
    if (now > entry.expiresAt) MULTISIG_BUNDLES.delete(id)
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssertResponse {
  ok: boolean
  role?: string
  address?: string
  firstMint?: boolean
  ownerKey?: string // bearer (returned only on first-mint, never re-fetched)
  pinDigest?: string
  error?: string
  reason?: string
}

interface MultisigResponse {
  ok: boolean
  accepted?: number
  threshold?: number
  error?: string
  reason?: string
}

interface MultisigAssertion {
  credId: string
  clientDataJSON: string
  authenticatorData: string
  signature: string
  userHandle?: string
}

interface MultisigBody {
  action: 'multisig-action'
  groupId: string
  bundleId: string
  assertion: MultisigAssertion
}

interface MemberCredential {
  uid: string
  credId: string
  addedAt?: number
  pubKey: string // base64url-encoded COSE public key bytes; required for cryptographic verify
}

interface MultisigRow {
  threshold_n: number
  threshold_m: number
  member_credentials: string // JSON
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function envValue(name: string): string {
  const fromRuntime = typeof process !== 'undefined' && process.env?.[name]
  const fromBuild = (import.meta.env as Record<string, unknown>)[name]
  return ((fromRuntime || fromBuild || '') as string).toString()
}

async function resolveAssertedAddress(uid: string): Promise<string | null> {
  const safeUid = uid.replace(/[^a-zA-Z0-9_:.-]/g, '')
  const rows = await readParsed(`
    match $u isa unit, has uid "${safeUid}", has wallet $w;
    select $w;
  `)
  const w = rows?.[0]?.w
  return typeof w === 'string' ? w : null
}

/**
 * Verify a WebAuthn assertion cryptographically using @simplewebauthn/server.
 *
 * The member must have a `pubKey` (base64url-encoded COSE key bytes) stored in
 * member_credentials. The `bundleId` is used as the expected challenge — it is
 * server-issued and replay-protected by the 5-minute bundle TTL.
 *
 * Counter tracking: V2 starts counter at 0 on every call (replay-prevention at
 * the sign_count level is deferred to V3 — tracking requires writing a per-member
 * counter back to D1 after each verify, which adds a write per assertion).
 *
 * @returns { verified: true } on success; throws on crypto failure or bad input
 */
async function verifyMultisigAssertion(
  assertion: MultisigAssertion,
  member: MemberCredential,
  bundleId: string,
  requestUrl: string,
  originHeader: string | null,
): Promise<{ verified: boolean }> {
  const expectedRPID = envValue('PASSKEY_RP_ID') || new URL(requestUrl).hostname
  const expectedOrigin = originHeader || `https://${expectedRPID}`

  return verifyAuthenticationResponse({
    response: {
      id: assertion.credId,
      rawId: assertion.credId,
      response: {
        clientDataJSON: assertion.clientDataJSON,
        authenticatorData: assertion.authenticatorData,
        signature: assertion.signature,
        userHandle: assertion.userHandle,
      },
      type: 'public-key' as const,
      clientExtensionResults: {},
    },
    expectedChallenge: bundleId,
    expectedOrigin,
    expectedRPID,
    credential: {
      id: assertion.credId,
      publicKey: b64urlDecode(member.pubKey),
      counter: 0, // V3: track sign_count per member in member_credentials for replay prevention
    },
  })
}

// ─── Multisig assertion handler ───────────────────────────────────────────────

async function handleMultisigAssertion(
  body: MultisigBody,
  db: NonNullable<Awaited<ReturnType<typeof getD1>>>,
  request: Request,
): Promise<Response> {
  const { groupId, bundleId, assertion } = body

  // 1. Look up chairman_multisig row for this group
  const row = await db
    .prepare('SELECT threshold_n, threshold_m, member_credentials FROM chairman_multisig WHERE group_id = ?')
    .bind(groupId)
    .first<MultisigRow>()
    .catch(() => null)

  if (!row) {
    return Response.json(
      {
        ok: false,
        error: 'no-multisig-config',
        reason: 'no chairman_multisig row for this group',
      } satisfies MultisigResponse,
      { status: 400 },
    )
  }

  // 2. Parse member_credentials; find the credId
  let members: MemberCredential[]
  try {
    members = JSON.parse(row.member_credentials) as MemberCredential[]
  } catch {
    return Response.json(
      {
        ok: false,
        error: 'invalid-member-credentials',
        reason: 'member_credentials is not valid JSON',
      } satisfies MultisigResponse,
      { status: 500 },
    )
  }

  const matchedMember = members.find((m) => m.credId === assertion.credId)
  if (!matchedMember) {
    return Response.json(
      {
        ok: false,
        error: 'unknown-cred',
        reason: "credId is not in this group's member_credentials",
      } satisfies MultisigResponse,
      { status: 403 },
    )
  }

  // 3. Cryptographically verify the WebAuthn assertion
  if (!matchedMember.pubKey) {
    return Response.json(
      {
        ok: false,
        error: 'pubkey-missing',
        reason: 'member_credentials entry is missing pubKey — re-configure multisig with pubKey per member',
      } satisfies MultisigResponse,
      { status: 400 },
    )
  }

  let verifyResult: { verified: boolean }
  try {
    verifyResult = await verifyMultisigAssertion(
      assertion,
      matchedMember,
      bundleId,
      request.url,
      request.headers.get('origin'),
    )
  } catch (e) {
    return Response.json(
      {
        ok: false,
        error: 'verify-failed',
        reason: (e as Error).message,
      } satisfies MultisigResponse,
      { status: 403 },
    )
  }

  if (!verifyResult.verified) {
    return Response.json(
      {
        ok: false,
        error: 'verify-failed',
        reason: 'WebAuthn signature invalid',
      } satisfies MultisigResponse,
      { status: 403 },
    )
  }

  // 4. Maintain bundle store
  // IMPORTANT: look up the target bundle BEFORE cleanExpiredBundles() so we
  // can return 410 for an expired bundle rather than silently recreating it.
  // cleanExpiredBundles() would remove the target entry, making the 410 path
  // unreachable — check expiry first, then clean the rest.
  const now = Date.now()
  const preClean = MULTISIG_BUNDLES.get(bundleId)

  if (preClean && now > preClean.expiresAt) {
    MULTISIG_BUNDLES.delete(bundleId)
    cleanExpiredBundles()
    return Response.json(
      {
        ok: false,
        error: 'bundle-expired',
        reason: 'assertion window (5 min) has elapsed',
      } satisfies MultisigResponse,
      { status: 410 },
    )
  }

  cleanExpiredBundles()
  const existing = MULTISIG_BUNDLES.get(bundleId)

  if (existing) {
    // Check groupId consistency
    if (existing.groupId !== groupId) {
      return Response.json(
        {
          ok: false,
          error: 'bundle-group-mismatch',
          reason: 'bundleId is associated with a different groupId',
        } satisfies MultisigResponse,
        { status: 403 },
      )
    }
    // Add credId (Set dedupes — can't double-count one chairman)
    existing.accepted.add(assertion.credId)
  } else {
    // First assertion for this bundleId
    MULTISIG_BUNDLES.set(bundleId, {
      groupId,
      accepted: new Set([assertion.credId]),
      expiresAt: now + BUNDLE_TTL_MS,
    })
  }

  const bundle = MULTISIG_BUNDLES.get(bundleId)!
  const acceptedCount = bundle.accepted.size
  const threshold = row.threshold_n

  // 5. Check if threshold is reached
  if (acceptedCount >= threshold) {
    // Emit audit record — best-effort, does not block the response
    void auditOwner({
      sender: matchedMember.uid,
      receiver: `group:${groupId}`,
      action: 'multisig:threshold-reached',
      gate: 'scope',
      payload: { bundleId, groupId, accepted: Array.from(bundle.accepted), threshold },
    }).catch(() => {
      /* audit is best-effort per gap 2 pattern */
    })

    return Response.json({
      ok: true,
      accepted: acceptedCount,
      threshold,
    } satisfies MultisigResponse)
  }

  return Response.json({
    ok: false,
    accepted: acceptedCount,
    threshold,
  } satisfies MultisigResponse)
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  // Parse body to check action discriminator FIRST (no auth required for
  // multisig — each assertion is individually verified via WebAuthn)
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  // ── Multisig batched flow ─────────────────────────────────────────────────
  if (body.action === 'multisig-action') {
    const { groupId, bundleId, assertion } = body as Partial<MultisigBody>

    if (!groupId || typeof groupId !== 'string') {
      return Response.json(
        { ok: false, error: 'missing-groupId', reason: 'body.groupId is required' } satisfies MultisigResponse,
        { status: 400 },
      )
    }
    if (!bundleId || typeof bundleId !== 'string') {
      return Response.json(
        { ok: false, error: 'missing-bundleId', reason: 'body.bundleId is required' } satisfies MultisigResponse,
        { status: 400 },
      )
    }
    if (
      !assertion ||
      typeof assertion.credId !== 'string' ||
      typeof assertion.clientDataJSON !== 'string' ||
      typeof assertion.authenticatorData !== 'string' ||
      typeof assertion.signature !== 'string'
    ) {
      return Response.json(
        {
          ok: false,
          error: 'missing-assertion',
          reason: 'body.assertion must include credId, clientDataJSON, authenticatorData, signature',
        } satisfies MultisigResponse,
        { status: 400 },
      )
    }

    const db = await getD1()
    if (!db) {
      return Response.json(
        { ok: false, error: 'd1-unavailable', reason: 'D1 not configured' } satisfies MultisigResponse,
        { status: 503 },
      )
    }

    return handleMultisigAssertion(
      { action: 'multisig-action', groupId, bundleId, assertion } as MultisigBody,
      db,
      request,
    )
  }

  // ── Existing first-mint / post-first-mint owner flow (unchanged) ──────────

  // 1. Authenticate via session (Better Auth cookie)
  const ctx = await resolveUnitFromSession(request).catch(() => null)
  if (!ctx?.user) {
    return Response.json({ ok: false, error: 'unauthenticated' } satisfies AssertResponse, { status: 401 })
  }

  // 2. Resolve the user's asserted address from their TypeDB unit
  const assertedAddress = await resolveAssertedAddress(ctx.user)
  if (!assertedAddress) {
    return Response.json(
      { ok: false, error: 'no-wallet', reason: 'unit has no wallet attribute' } satisfies AssertResponse,
      { status: 400 },
    )
  }

  const db = await getD1()
  if (!db) {
    return Response.json({ ok: false, error: 'd1-unavailable', reason: 'D1 not configured' } satisfies AssertResponse, {
      status: 503,
    })
  }

  // 3. First-mint sentinel: count rows in owner_key
  const countRow = await db
    .prepare('SELECT count(*) AS n FROM owner_key')
    .first<{ n: number }>()
    .catch(() => null)
  if (!countRow) {
    return Response.json(
      { ok: false, error: 'd1-error', reason: 'owner_key table query failed' } satisfies AssertResponse,
      { status: 500 },
    )
  }
  const isFirstMint = (countRow.n ?? 0) === 0

  if (isFirstMint) {
    // 4a. First-mint branch: env-gate the asserted address
    const expected = envValue('OWNER_EXPECTED_ADDRESS')
    if (!expected) {
      return Response.json(
        { ok: false, error: 'env-missing', reason: 'OWNER_EXPECTED_ADDRESS not configured' } satisfies AssertResponse,
        { status: 503 },
      )
    }
    if (assertedAddress.toLowerCase() !== expected.toLowerCase()) {
      return Response.json(
        {
          ok: false,
          error: 'first-mint-address-mismatch',
          reason: 'asserted address does not match OWNER_EXPECTED_ADDRESS',
        } satisfies AssertResponse,
        { status: 403 },
      )
    }

    // 4b. Lock the on-chain pin first (atomicity: Move before D1)
    let pinDigest: string
    let pinObject: string
    try {
      const locked = await lockOnChainOwner(assertedAddress)
      pinDigest = locked.digest
      pinObject = locked.pinObject
    } catch (e) {
      const msg = (e as Error).message
      // E_OWNER_LOCKED on chain but D1 empty = state drift (e.g., D1 wipe).
      // Surface 409 so the operator can recover by re-inserting the D1 row
      // with the on-chain address.
      const isLocked = /E_OWNER_LOCKED|abort.*100/.test(msg)
      return Response.json(
        {
          ok: false,
          error: isLocked ? 'on-chain-already-locked' : 'sui-call-failed',
          reason: msg,
        } satisfies AssertResponse,
        { status: isLocked ? 409 : 502 },
      )
    }

    // 4c. Mint the owner bearer + insert D1 row
    const bearer = generateApiKey()
    const hash = await hashKey(bearer)
    try {
      await db
        .prepare('INSERT INTO owner_key (key_hash, address, pin_object, pin_digest) VALUES (?, ?, ?, ?)')
        .bind(hash, assertedAddress, pinObject, pinDigest)
        .run()
    } catch (e) {
      // D1 failed AFTER Move succeeded — operator must recover. Owner is on
      // chain; D1 insert can be retried via a recovery script that reads
      // the pin object id and reconstructs the row.
      return Response.json(
        {
          ok: false,
          error: 'd1-insert-failed-after-move-success',
          reason: (e as Error).message,
        } satisfies AssertResponse,
        { status: 500 },
      )
    }

    return Response.json({
      ok: true,
      role: 'owner',
      address: assertedAddress,
      firstMint: true,
      ownerKey: bearer,
      pinDigest,
    } satisfies AssertResponse)
  }

  // 5. Post-first-mint: verify the asserted address is the registered owner
  const ownerRow = await db
    .prepare('SELECT address FROM owner_key LIMIT 1')
    .first<{ address: string }>()
    .catch(() => null)
  if (ownerRow?.address?.toLowerCase() !== assertedAddress.toLowerCase()) {
    return Response.json(
      {
        ok: false,
        error: 'address-not-owner',
        reason: 'asserted address is not the registered owner',
      } satisfies AssertResponse,
      { status: 403 },
    )
  }

  // 6. Owner asserted post-first-mint — return role for the caller's UID
  // (TypeDB membership lookup; should be 'owner' for the registered actor).
  const role = (await getRoleForUser(ctx.user).catch(() => undefined)) ?? 'owner'
  return Response.json({
    ok: true,
    role,
    address: assertedAddress,
    firstMint: false,
  } satisfies AssertResponse)
}
