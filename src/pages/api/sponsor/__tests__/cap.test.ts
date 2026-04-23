/**
 * Unit tests for State-1 balance cap in POST /api/sponsor/build.
 *
 * The cap logic runs before the sponsor keypair is resolved, so for the
 * "cap exceeded" branch we never reach Sui RPC — no mocking needed there.
 *
 * For the "cap passes" branches (small amount / State-2) the handler will
 * proceed to sponsorKeypair() which reads SUI_SPONSOR_KEY. We set it to an
 * empty string deliberately so the handler returns 503 (no sponsor key).
 * That 503 proves the cap did NOT reject the request — the right exit for
 * these test cases.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { STATE1_CAP_MIST } from '../build'

// ─── types ──────────────────────────────────────────────────────────────────

interface BuildResponseBody {
  error?: string
  message?: string
  code?: string
  txBytes?: number[]
  expiresAt?: number
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/sponsor/build', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function callBuild(body: Record<string, unknown>): Promise<{ status: number; body: BuildResponseBody }> {
  // Dynamic import so import.meta.env mutations take effect
  const { POST } = await import('../build')
  // APIRoute receives { request, ... } — only request is needed for these tests
  const res = await POST({ request: makeRequest(body) } as any)
  const responseBody = (await res.json()) as BuildResponseBody
  return { status: res.status, body: responseBody }
}

// ─── setup ───────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Ensure SUI_SPONSOR_KEY is absent so cap-passing tests reach 503 quickly
  // without trying real Sui RPC calls.
  ;(import.meta.env as Record<string, unknown>).SUI_SPONSOR_KEY = ''
})

// ─── constants ───────────────────────────────────────────────────────────────

const SENDER = '0x0000000000000000000000000000000000000000000000000000000000000001'
// Note: STATE1_CAP_MIST is 25_000_000_000n. Number() loses precision near the
// boundary but our LARGE_AMOUNT is 1_000_000 MIST above the cap which is well
// within safe integer range (2^53 − 1 >> 26_000_000_000).
const SMALL_AMOUNT = 1_000_000 // 0.001 SUI — well under the 25 SUI cap
const AT_CAP_AMOUNT = 25_000_000_000 // exactly 25 SUI — boundary: allowed (> not >=)
const LARGE_AMOUNT = 26_000_000_000 // 26 SUI — over cap

// ─── tests ───────────────────────────────────────────────────────────────────

describe('State-1 balance cap', () => {
  it('State 1 + small amount → passes cap check (no 400 state1-cap-exceeded)', async () => {
    const { status, body } = await callBuild({
      sender: SENDER,
      txKind: 'transfer',
      params: { to: SENDER, amount: SMALL_AMOUNT },
      walletState: 1,
    })
    // Cap check passes → handler proceeds to sponsor key lookup.
    // With no sponsor key configured it returns 503, NOT 400.
    expect(status).not.toBe(400)
    // Should be 503 (no sponsor key) — confirms cap did not block the request
    expect(status).toBe(503)
    expect(body.error).not.toBe('state1-cap-exceeded')
  })

  it('State 1 + amount exactly at cap → passes cap check (boundary: > not >=)', async () => {
    const { status, body } = await callBuild({
      sender: SENDER,
      txKind: 'transfer',
      params: { to: SENDER, amount: AT_CAP_AMOUNT },
      walletState: 1,
    })
    expect(status).not.toBe(400)
    expect(body.error).not.toBe('state1-cap-exceeded')
  })

  it('State 1 + amount over cap → 400 state1-cap-exceeded', async () => {
    const { status, body } = await callBuild({
      sender: SENDER,
      txKind: 'transfer',
      params: { to: SENDER, amount: LARGE_AMOUNT },
      walletState: 1,
    })
    expect(status).toBe(400)
    expect(body.error).toBe('state1-cap-exceeded')
    expect(body.message).toMatch(/save this wallet/i)
  })

  it('State 1 + scoped-spend with amountMist over cap → 400 state1-cap-exceeded', async () => {
    const { status, body } = await callBuild({
      sender: SENDER,
      txKind: 'scoped-spend',
      params: { walletId: '0xabc', to: SENDER, amountMist: LARGE_AMOUNT },
      walletState: 1,
    })
    expect(status).toBe(400)
    expect(body.error).toBe('state1-cap-exceeded')
  })

  it('State 2 + large amount → passes cap check (no cap for saved wallets)', async () => {
    const { status, body } = await callBuild({
      sender: SENDER,
      txKind: 'transfer',
      params: { to: SENDER, amount: LARGE_AMOUNT },
      walletState: 2,
    })
    // Cap does not apply to State 2+ → reaches sponsor key check → 503
    expect(status).not.toBe(400)
    expect(status).toBe(503)
    expect(body.error).not.toBe('state1-cap-exceeded')
  })

  it('no walletState + large amount → passes cap check (omitted = not State 1)', async () => {
    const { status, body } = await callBuild({
      sender: SENDER,
      txKind: 'transfer',
      params: { to: SENDER, amount: LARGE_AMOUNT },
      // walletState intentionally omitted
    })
    expect(status).not.toBe(400)
    expect(body.error).not.toBe('state1-cap-exceeded')
  })
})

describe('STATE1_CAP_MIST constant', () => {
  it('equals 25 SUI expressed in MIST', () => {
    expect(STATE1_CAP_MIST).toBe(25_000_000_000n)
  })
})
