/**
 * POST /api/auth/passkey/assert — owner-tier role assertion + first-mint.
 *
 * This is the gate that locks substrate owner identity. On first call (when
 * the `owner_key` D1 table is empty), the endpoint:
 *   1. Verifies the caller's resolved Sui address equals env.OWNER_EXPECTED_ADDRESS
 *   2. Calls Move `init_substrate_owner(pin, addr)` to lock the on-chain pin
 *      (Sui aborts with E_OWNER_LOCKED on second call → 409 Conflict)
 *   3. Inserts the bearer hash into D1 `owner_key`
 * On subsequent calls, the address is checked against the registered owner.
 *
 * Auth model (Gap 0 scope): authenticated session (Better Auth cookie). The
 * session resolves to a TypeDB unit whose `wallet` attribute is the asserted
 * address. Per-call WebAuthn assertion verification is deferred to a follow-up
 * (the existing `passkey-webauthn` plugin verifies WebAuthn at sign-in time;
 * owner-tier assertions inherit that trust until the per-call WebAuthn dance
 * lands). The OWNER_EXPECTED_ADDRESS env gate is the security-critical layer.
 *
 * Atomicity (D1 + Sui): Move call runs FIRST. If the on-chain lock succeeds
 * but the D1 insert fails (rare), the on-chain pin is the source of truth —
 * recovery re-runs the D1 insert with the matching address. If Move fails,
 * D1 is never touched; first-mint stays open for retry.
 *
 * Spec: owner.md §Bootstrap. owner-todo Gap 0 tasks 0.s3 + 0.s5.
 */

import type { APIRoute } from 'astro'
import { getRoleForUser, resolveUnitFromSession } from '@/lib/api-auth'
import { generateApiKey, hashKey } from '@/lib/api-key'
import { getD1 } from '@/lib/cf-env'
import { lockOnChainOwner } from '@/lib/owner-mint'
import { readParsed } from '@/lib/typedb'

export const prerender = false

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

export const POST: APIRoute = async ({ request }) => {
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
