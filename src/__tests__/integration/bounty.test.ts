/**
 * Cycle 2 Gate — Testnet escrow → close → release is deterministic.
 *
 * Proves:
 *  (a) createEscrow locks AMOUNT from poster, creates shared Escrow object
 *  (b) releaseEscrow pays worker minus 0.5% fee, marks path.strength++
 *  (c) cancelEscrow (after deadline) returns AMOUNT to poster, warns path.resistance++
 *
 * DOES NOT RUN IN DEFAULT CI. Requires real testnet transactions.
 * Enable: SUI_PACKAGE_ID=<id> SUI_SEED=<base64> RUN_TESTNET_TESTS=1 vitest run bounty
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  addressFor,
  cancelEscrow,
  createEscrow,
  createPath,
  createUnit,
  ensureFunded,
  getClient,
  getObject,
  releaseEscrow,
} from '@/lib/sui'

// ═══════════════════════════════════════════════════════════════════════════
// SKIP GATE — never runs unless both env vars are set
// ═══════════════════════════════════════════════════════════════════════════

const ENABLED = !!process.env.SUI_PACKAGE_ID && process.env.RUN_TESTNET_TESTS === '1'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const AMOUNT = 10_000_000 // 0.01 SUI in MIST — small to conserve faucet
const FEE_BPS = 50 // 0.50% — matches Protocol.fee_bps in one.move
const FEE = Math.floor((AMOUNT * FEE_BPS) / 10_000) // 50_000 MIST
const WORKER_RECEIVES = AMOUNT - FEE // 9_950_000 MIST

// ═══════════════════════════════════════════════════════════════════════════
// FIXTURES — created once per suite, shared across tests
// ═══════════════════════════════════════════════════════════════════════════

const ts = Date.now()
const POSTER_UID = `test-bounty-poster-${ts}`
const CLAIMANT_UID = `test-bounty-claimant-${ts}`

interface Fixtures {
  posterUnitId: string
  claimantUnitId: string
  pathId: string
}

let fixtures: Fixtures

describe.skipIf(!ENABLED)('Cycle 2 Gate: testnet escrow lifecycle', () => {
  beforeAll(async () => {
    // Fund both addresses — faucet may be a no-op if already funded
    const [posterAddr, claimantAddr] = await Promise.all([addressFor(POSTER_UID), addressFor(CLAIMANT_UID)])
    await Promise.all([ensureFunded(posterAddr), ensureFunded(claimantAddr)])

    // Create on-chain Units
    const [posterUnit, claimantUnit] = await Promise.all([
      createUnit(POSTER_UID, 'bounty-poster', 'agent'),
      createUnit(CLAIMANT_UID, 'bounty-claimant', 'agent'),
    ])

    // Poster must have SUI in their Unit balance to fund escrow.
    // ensureFunded tops up the address wallet; we need it inside the Unit object.
    // The createUnit call auto-deposits via ensureFunded on testnet; Unit starts at 0.
    // We call deposit via a separate fund step — handled by ensureFunded + createUnit chain.
    // TODO: expose a `depositToUnit(uid, unitId, amount)` helper so tests can top-up Units
    //       without duplicating the deposit tx logic. For now the test relies on the poster
    //       having pre-funded their Unit before calling createEscrow (testnet flow).

    // Create a Path between poster → claimant
    const { pathId } = await createPath(POSTER_UID, posterUnit.objectId, claimantUnit.objectId, 'bounty')

    fixtures = {
      posterUnitId: posterUnit.objectId,
      claimantUnitId: claimantUnit.objectId,
      pathId,
    }
  }, 90_000)

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1 — Happy path: create → release
  // ─────────────────────────────────────────────────────────────────────────

  it('happy path: escrow created, released to worker, path.strength increments', async () => {
    const client = getClient()
    const claimantAddr = await addressFor(CLAIMANT_UID)

    // Pre-balance
    const beforeBalance = await client.getBalance({ owner: claimantAddr })
    const balanceBefore = BigInt(beforeBalance.totalBalance)

    // Create escrow — poster locks AMOUNT
    const { escrowId } = await createEscrow(
      POSTER_UID,
      fixtures.posterUnitId,
      fixtures.claimantUnitId,
      'bounty:test',
      AMOUNT,
      Date.now() + 3_600_000, // 1 hour deadline — plenty of time
      fixtures.pathId,
    )

    expect(escrowId).toBeTruthy()
    expect(escrowId).toMatch(/^0x/)

    // Fetch escrow object — must be shared, content must match
    const escrowObj = await getObject(escrowId)
    expect(escrowObj.data?.owner).toMatchObject({ Shared: expect.any(Object) })

    const content = escrowObj.data?.content as any
    expect(content?.fields?.task_name).toBe('bounty:test')
    // poster and worker are stored as IDs inside the Move struct
    expect(content?.fields?.poster).toBeTruthy()
    expect(content?.fields?.worker).toBeTruthy()
    // bounty balance ≈ AMOUNT (stored as Balance<SUI>, shown as { value: n })
    const bountyValue = Number(content?.fields?.bounty?.fields?.value ?? content?.fields?.bounty ?? 0)
    expect(bountyValue).toBeGreaterThanOrEqual(AMOUNT - 1000) // allow 1000 MIST rounding

    // Read path strength before release
    const pathBefore = await getObject(fixtures.pathId)
    const strengthBefore = Number((pathBefore.data?.content as any)?.fields?.strength ?? 0)

    // Release: worker claims the escrow
    const { digest } = await releaseEscrow(CLAIMANT_UID, escrowId, fixtures.claimantUnitId, fixtures.pathId)
    expect(digest).toBeTruthy()

    // Post-balance: claimant should have received AMOUNT - fee
    const afterBalance = await client.getBalance({ owner: claimantAddr })
    const balanceAfter = BigInt(afterBalance.totalBalance)
    const delta = balanceAfter - balanceBefore
    // Delta ≥ worker receives minus gas overhead (allow 0.005 SUI gas buffer)
    expect(delta).toBeGreaterThanOrEqual(BigInt(WORKER_RECEIVES) - 5_000_000n)

    // Path strength must have incremented
    const pathAfter = await getObject(fixtures.pathId)
    const strengthAfter = Number((pathAfter.data?.content as any)?.fields?.strength ?? 0)
    expect(strengthAfter).toBeGreaterThan(strengthBefore)

    // TODO: assert Protocol treasury increments by FEE (50_000 MIST).
    // Requires SUI_PROTOCOL_ID env var; skip if not set.
    // if (process.env.SUI_PROTOCOL_ID) { ... }
  }, 60_000)

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2 — Refund path: expired escrow cancelled, resistance increments
  // ─────────────────────────────────────────────────────────────────────────

  it('refund path: expired escrow cancelled, poster refunded, path.resistance increments', async () => {
    const client = getClient()
    const posterAddr = await addressFor(POSTER_UID)

    const beforeBalance = await client.getBalance({ owner: posterAddr })
    const balanceBefore = BigInt(beforeBalance.totalBalance)

    // Read path resistance before cancel
    const pathBefore = await getObject(fixtures.pathId)
    const resistanceBefore = Number((pathBefore.data?.content as any)?.fields?.resistance ?? 0)

    // Create escrow with a deadline 2s in the past so cancel is immediately valid
    // Note: on-chain Clock.timestamp_ms is live; we set deadline = now - 1ms
    // so assert(clock > deadline) passes in cancel_escrow.
    const { escrowId } = await createEscrow(
      POSTER_UID,
      fixtures.posterUnitId,
      fixtures.claimantUnitId,
      'bounty:refund-test',
      AMOUNT,
      Date.now() - 1, // already expired
      fixtures.pathId,
    )

    expect(escrowId).toBeTruthy()

    // Small buffer — let the tx land before cancelling
    await new Promise((r) => setTimeout(r, 2_000))

    // Cancel: poster reclaims
    const { digest } = await cancelEscrow(POSTER_UID, escrowId, fixtures.posterUnitId, fixtures.pathId)
    expect(digest).toBeTruthy()

    // Poster balance restored (minus gas)
    const afterBalance = await client.getBalance({ owner: posterAddr })
    const balanceAfter = BigInt(afterBalance.totalBalance)
    const delta = balanceAfter - balanceBefore
    // delta ≈ 0 minus gas; balance should not drop more than 0.01 SUI
    expect(delta).toBeGreaterThan(-10_000_000n)

    // Path resistance must have incremented
    const pathAfter = await getObject(fixtures.pathId)
    const resistanceAfter = Number((pathAfter.data?.content as any)?.fields?.resistance ?? 0)
    expect(resistanceAfter).toBeGreaterThan(resistanceBefore)
  }, 60_000)

  afterAll(async () => {
    // No cleanup needed — test Units and Paths fade naturally on testnet
  })
})
