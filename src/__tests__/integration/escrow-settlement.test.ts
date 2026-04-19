/**
 * Integration tests: Escrow Settlement (SUI Phase 3 D3)
 *
 * Tests the POST /api/capability/hire/settle handler logic in isolation.
 * All external dependencies (Sui RPC, D1, TypeDB) are mocked.
 *
 * Pattern: import POST handler directly, call with a mock Request+context.
 * No server spin-up required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---- Module mocks (must be hoisted before imports) -------------------------

vi.mock('@/lib/sui-verify', () => ({
  verifySuiTx: vi.fn(),
}))

vi.mock('@/lib/durable-settlement', () => ({
  getPendingSettlement: vi.fn(),
  storePendingSettlement: vi.fn(),
  markSettled: vi.fn(),
  markFailed: vi.fn(),
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
}))

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn().mockResolvedValue({}),
  getEnv: vi.fn().mockResolvedValue({}),
}))

// ---- Imports (after vi.mock calls) -----------------------------------------

import { getPendingSettlement, markFailed, markSettled, storePendingSettlement } from '@/lib/durable-settlement'
import { verifySuiTx } from '@/lib/sui-verify'
import { readParsed, writeSilent } from '@/lib/typedb'
import { POST } from '@/pages/api/capability/hire/settle'

// ---- Test constants --------------------------------------------------------

const TEST_ESCROW_ID = `0x${'a'.repeat(40)}`
// Sui TX digest: base58 encoded, 43–44 chars [a-zA-Z0-9=]
const TEST_TX_DIGEST = 'fT4XKrvYqfRwz7VLqfeFdVrGNQ7NjGdHH1LvPrGGX6s'
const BUYER_UID = 'test-buyer:settle'
const PROVIDER_UID = 'test-provider:settle'
const SKILL_ID = 'skill:settle:test'

const VALID_BODY = {
  escrow_id: TEST_ESCROW_ID,
  proof: {
    tx_digest: TEST_TX_DIGEST,
  },
  original_request: {
    buyer: BUYER_UID,
    provider: PROVIDER_UID,
    skillId: SKILL_ID,
    initialMessage: 'Settlement test hire',
  },
}

/**
 * Call the Astro POST handler with a synthetic request and minimal locals.
 */
async function callSettle(body: unknown): Promise<Response> {
  const req = new Request('http://localhost/api/capability/hire/settle', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
  return POST({ request: req, locals: { runtime: { env: {} } }, params: {} } as any)
}

// ---- Tests -----------------------------------------------------------------

describe('POST /api/capability/hire/settle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // --------------------------------------------------------------------------
  // Test 1: Valid settlement returns 200 with hire result
  // --------------------------------------------------------------------------

  it('valid settlement: returns 200 with ok=true and hire groupId', async () => {
    // verifySuiTx succeeds
    vi.mocked(verifySuiTx).mockResolvedValue({
      valid: true,
      event: {
        escrow_id: TEST_ESCROW_ID,
        released_at_ms: Date.now(),
        tx_digest: TEST_TX_DIGEST,
      },
    })

    // No previous settlement stored
    vi.mocked(getPendingSettlement).mockResolvedValue(null)

    // storePendingSettlement returns a settlement ID
    const expectedSettlementId = `settle:${TEST_ESCROW_ID}`
    vi.mocked(storePendingSettlement).mockResolvedValue(expectedSettlementId)

    // markSettled resolves successfully
    vi.mocked(markSettled).mockResolvedValue(true)

    // readParsed returns a row — provider capability exists
    vi.mocked(readParsed).mockResolvedValue([{ u: { uid: PROVIDER_UID } }])

    // writeSilent is fire-and-forget
    vi.mocked(writeSilent).mockReturnValue(undefined)

    const res = await callSettle(VALID_BODY)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.result.ok).toBe(true)
    expect(json.result.groupId).toMatch(/^hire:/)
    expect(json.result.chatUrl).toMatch(/^\/app\//)
    expect(json.escrow_id).toBe(TEST_ESCROW_ID)
    expect(json.settlement_id).toBe(expectedSettlementId)

    // Verify dependencies were called
    expect(verifySuiTx).toHaveBeenCalledOnce()
    expect(getPendingSettlement).toHaveBeenCalledWith(TEST_ESCROW_ID)
    expect(storePendingSettlement).toHaveBeenCalledOnce()
    expect(markSettled).toHaveBeenCalledOnce()
    expect(readParsed).toHaveBeenCalledOnce()
  })

  // --------------------------------------------------------------------------
  // Test 2: Invalid TX returns 400
  // --------------------------------------------------------------------------

  it('invalid TX digest: returns 400 with TX verification failed error', async () => {
    vi.mocked(verifySuiTx).mockResolvedValue({
      valid: false,
      reason: 'No EscrowReleased event found',
    })

    const res = await callSettle(VALID_BODY)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toContain('TX verification failed')
    expect(json.reason).toBe('No EscrowReleased event found')

    // Should not proceed to storage
    expect(getPendingSettlement).not.toHaveBeenCalled()
    expect(storePendingSettlement).not.toHaveBeenCalled()
    expect(markSettled).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Test 3: Idempotent — second call returns cached result
  // --------------------------------------------------------------------------

  it('idempotent: second call with settled escrow_id returns cached result with reused=true', async () => {
    const cachedGroupId = 'hire:x:y:123'
    const cachedResult = { ok: true, groupId: cachedGroupId, chatUrl: `/app/${cachedGroupId}` }
    const cachedSettlementId = `settle:${TEST_ESCROW_ID}`

    // verifySuiTx still validates (called before idempotency check)
    vi.mocked(verifySuiTx).mockResolvedValue({
      valid: true,
      event: {
        escrow_id: TEST_ESCROW_ID,
        released_at_ms: Date.now(),
        tx_digest: TEST_TX_DIGEST,
      },
    })

    // getPendingSettlement returns an already-settled record
    vi.mocked(getPendingSettlement).mockResolvedValue({
      id: cachedSettlementId,
      escrow_id: TEST_ESCROW_ID,
      tx_digest: TEST_TX_DIGEST,
      original_request: {
        buyer: BUYER_UID,
        provider: PROVIDER_UID,
        skillId: SKILL_ID,
      },
      status: 'settled',
      result_json: JSON.stringify(cachedResult),
      retry_count: 0,
      created_at: Date.now() - 5000,
      settled_at: Date.now() - 1000,
      expires_at: Date.now() + 86400000,
    })

    const res = await callSettle(VALID_BODY)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.reused).toBe(true)
    expect(json.result.groupId).toBe(cachedGroupId)
    expect(json.result.chatUrl).toBe(`/app/${cachedGroupId}`)
    expect(json.settlement_id).toBe(cachedSettlementId)

    // Should NOT call storePendingSettlement or markSettled again
    expect(storePendingSettlement).not.toHaveBeenCalled()
    expect(markSettled).not.toHaveBeenCalled()
    expect(readParsed).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Test 4: Missing original_request returns 400
  // --------------------------------------------------------------------------

  it('missing original_request: returns 400 with original_request in error', async () => {
    vi.mocked(verifySuiTx).mockResolvedValue({
      valid: true,
      event: {
        escrow_id: TEST_ESCROW_ID,
        released_at_ms: Date.now(),
        tx_digest: TEST_TX_DIGEST,
      },
    })

    // No durable storage record exists either
    vi.mocked(getPendingSettlement).mockResolvedValue(null)

    const bodyWithoutOriginalRequest = {
      escrow_id: TEST_ESCROW_ID,
      proof: {
        tx_digest: TEST_TX_DIGEST,
      },
      // original_request intentionally omitted
    }

    const res = await callSettle(bodyWithoutOriginalRequest)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toContain('original_request')

    // Should not attempt re-execution
    expect(storePendingSettlement).not.toHaveBeenCalled()
    expect(markSettled).not.toHaveBeenCalled()
    expect(readParsed).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Test 5: Capability no longer exists — hire re-execution fails → 500
  // --------------------------------------------------------------------------

  it('provider capability missing: returns 500 and marks settlement as failed', async () => {
    vi.mocked(verifySuiTx).mockResolvedValue({
      valid: true,
      event: {
        escrow_id: TEST_ESCROW_ID,
        released_at_ms: Date.now(),
        tx_digest: TEST_TX_DIGEST,
      },
    })

    vi.mocked(getPendingSettlement).mockResolvedValue(null)
    vi.mocked(storePendingSettlement).mockResolvedValue(`settle:${TEST_ESCROW_ID}`)
    vi.mocked(markFailed).mockResolvedValue(true)

    // readParsed returns empty — capability no longer exists
    vi.mocked(readParsed).mockResolvedValue([])
    vi.mocked(writeSilent).mockReturnValue(undefined)

    const res = await callSettle(VALID_BODY)
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.error).toContain('Hire re-execution failed')

    // Settlement must be marked as failed
    expect(markFailed).toHaveBeenCalledWith(TEST_ESCROW_ID, expect.any(String), expect.anything())
    expect(markSettled).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Test 6: Malformed escrow_id rejected by Zod schema → 400
  // --------------------------------------------------------------------------

  it('invalid escrow_id format: returns 400 with validation error', async () => {
    const badBody = {
      escrow_id: 'not-a-valid-sui-id',
      proof: { tx_digest: TEST_TX_DIGEST },
      original_request: {
        buyer: BUYER_UID,
        provider: PROVIDER_UID,
        skillId: SKILL_ID,
      },
    }

    const res = await callSettle(badBody)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Invalid request')
    expect(json.details).toBeDefined()

    // Zod rejection: verifySuiTx never called
    expect(verifySuiTx).not.toHaveBeenCalled()
  })

  // --------------------------------------------------------------------------
  // Test 7: Pending settlement in durable storage — uses stored original_request
  // --------------------------------------------------------------------------

  it('pending settlement in durable storage: re-executes using stored original_request', async () => {
    vi.mocked(verifySuiTx).mockResolvedValue({
      valid: true,
      event: {
        escrow_id: TEST_ESCROW_ID,
        released_at_ms: Date.now(),
        tx_digest: TEST_TX_DIGEST,
      },
    })

    const storedOriginalRequest = {
      buyer: 'stored-buyer',
      provider: 'stored-provider',
      skillId: 'stored-skill',
    }

    // Existing record with status='pending' — not yet settled
    vi.mocked(getPendingSettlement).mockResolvedValue({
      id: `settle:${TEST_ESCROW_ID}`,
      escrow_id: TEST_ESCROW_ID,
      tx_digest: TEST_TX_DIGEST,
      original_request: storedOriginalRequest,
      status: 'pending',
      retry_count: 1,
      created_at: Date.now() - 10000,
      expires_at: Date.now() + 86400000,
    })

    // storePendingSettlement still called to update/overwrite
    vi.mocked(storePendingSettlement).mockResolvedValue(`settle:${TEST_ESCROW_ID}`)
    vi.mocked(markSettled).mockResolvedValue(true)

    // readParsed confirms capability for stored-provider
    vi.mocked(readParsed).mockResolvedValue([{ u: { uid: 'stored-provider' } }])
    vi.mocked(writeSilent).mockReturnValue(undefined)

    const res = await callSettle(VALID_BODY)
    // Should succeed using the stored original_request
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.result.ok).toBe(true)
    // groupId should reference stored buyer/provider, not the body's
    expect(json.result.groupId).toContain('stored-buyer')
    expect(json.result.groupId).toContain('stored-provider')
  })
})
