/**
 * Integration tests for POST /api/owner/daemon-audit receiver.
 *
 * Tests:
 *   1. Valid daemon request → 202; D1 row inserted.
 *   2. Bad HMAC sig → 401 bad-sig.
 *   3. Missing OWNER_DAEMON_KEY env → 503.
 *   4. Bad body (missing fields) → 400.
 *   5. Future ts (>1 hour skew) → 400 ts-future-skew.
 *   6. Unknown outcome enum → 400.
 *
 * Uses vi.mock for getD1 and vi.stubEnv for OWNER_DAEMON_KEY.
 * Never calls real TypeDB or D1.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Crypto helpers (Web Crypto — same as the endpoint)

const encoder = new TextEncoder()

function b64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function _b64urlDecode(s: string): Uint8Array {
  const padded = s + '=='.slice((s.length % 4 || 4) - 2)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function signBody(keyBytes: Uint8Array, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return b64urlEncode(new Uint8Array(sig))
}

// ─────────────────────────────────────────────────────────────────────────────
// Fake D1

interface RecordedInsert {
  sql: string
  args: unknown[]
}

function makeFakeD1() {
  const inserts: RecordedInsert[] = []
  const db = {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: unknown[]) => ({
        run: vi.fn(async () => {
          inserts.push({ sql, args })
          return { success: true }
        }),
      })),
    })),
  }
  return { db, inserts }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock cf-env so tests never touch real D1

vi.mock('@/lib/cf-env', () => ({
  getD1: vi.fn(),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Import the POST handler under test (after mocks are set up)

import { getD1 } from '@/lib/cf-env'
import { POST } from '../../pages/api/owner/daemon-audit'

const mockedGetD1 = vi.mocked(getD1)

// ─────────────────────────────────────────────────────────────────────────────
// Test key (32 random bytes, set as base64url env)

const TEST_KEY = crypto.getRandomValues(new Uint8Array(32))
const TEST_KEY_B64 = b64urlEncode(TEST_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

function makeValidRow() {
  return {
    ts: Math.floor(Date.now() / 1000) - 5, // 5 seconds ago, well within skew
    agentUid: 'agent:test-uid',
    kdfVersion: 1,
    outcome: 'ok',
    callerSig: 'abcdefabcdef',
  }
}

async function buildRequest(
  body: unknown,
  opts: {
    sig?: string
    noSig?: boolean
    keyOverride?: Uint8Array
  } = {},
): Promise<Request> {
  const bodyStr = JSON.stringify(body)
  const keyToSign = opts.keyOverride ?? TEST_KEY
  const sig = opts.noSig ? undefined : (opts.sig ?? (await signBody(keyToSign, bodyStr)))

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (sig) headers['X-Daemon-Sig'] = sig

  return new Request('https://one.ie/api/owner/daemon-audit', {
    method: 'POST',
    headers,
    body: bodyStr,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup / teardown

beforeEach(() => {
  vi.stubEnv('OWNER_DAEMON_KEY', TEST_KEY_B64)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests

describe('POST /api/owner/daemon-audit', () => {
  it('1. valid daemon request → 202; D1 row inserted', async () => {
    const { db, inserts } = makeFakeD1()
    mockedGetD1.mockResolvedValue(db as unknown as D1Database)

    const row = makeValidRow()
    const req = await buildRequest(row)
    const res = await POST({ request: req, locals: {} as App.Locals } as Parameters<typeof POST>[0])

    expect(res.status).toBe(202)
    const data = (await res.json()) as Record<string, unknown>
    expect(data.ok).toBe(true)

    expect(inserts).toHaveLength(1)
    const insert = inserts[0]
    expect(insert.sql).toContain('owner_daemon_audit')
    expect(insert.args).toContain(row.ts)
    expect(insert.args).toContain(row.agentUid)
    expect(insert.args).toContain(row.kdfVersion)
    expect(insert.args).toContain(row.outcome)
    expect(insert.args).toContain(row.callerSig)
  })

  it('2. bad HMAC sig → 401 bad-sig', async () => {
    const wrongKey = crypto.getRandomValues(new Uint8Array(32))
    const row = makeValidRow()
    const req = await buildRequest(row, { keyOverride: wrongKey })

    const res = await POST({ request: req, locals: {} as App.Locals } as Parameters<typeof POST>[0])

    expect(res.status).toBe(401)
    const data = (await res.json()) as Record<string, unknown>
    expect(data.code).toBe('bad-sig')
  })

  it('3. missing OWNER_DAEMON_KEY env → 503', async () => {
    vi.stubEnv('OWNER_DAEMON_KEY', '')

    const row = makeValidRow()
    const req = await buildRequest(row)

    const res = await POST({ request: req, locals: {} as App.Locals } as Parameters<typeof POST>[0])

    expect(res.status).toBe(503)
    const data = (await res.json()) as Record<string, unknown>
    expect(data.code).toBe('key-not-configured')
  })

  it('4. bad body — missing required field → 400', async () => {
    const { db } = makeFakeD1()
    mockedGetD1.mockResolvedValue(db as unknown as D1Database)

    // Missing agentUid
    const row = { ts: Math.floor(Date.now() / 1000), kdfVersion: 1, outcome: 'ok', callerSig: 'abc' }
    const req = await buildRequest(row)

    const res = await POST({ request: req, locals: {} as App.Locals } as Parameters<typeof POST>[0])

    expect(res.status).toBe(400)
    const data = (await res.json()) as Record<string, unknown>
    expect(data.code).toBe('bad-body')
  })

  it('5. future ts > 1 hour skew → 400 ts-future-skew', async () => {
    const { db } = makeFakeD1()
    mockedGetD1.mockResolvedValue(db as unknown as D1Database)

    const row = {
      ...makeValidRow(),
      ts: Math.floor(Date.now() / 1000) + 7200, // 2 hours in the future
    }
    const req = await buildRequest(row)

    const res = await POST({ request: req, locals: {} as App.Locals } as Parameters<typeof POST>[0])

    expect(res.status).toBe(400)
    const data = (await res.json()) as Record<string, unknown>
    expect(data.code).toBe('ts-future-skew')
  })

  it('6. unknown outcome enum → 400', async () => {
    const { db } = makeFakeD1()
    mockedGetD1.mockResolvedValue(db as unknown as D1Database)

    const row = { ...makeValidRow(), outcome: 'invalid-outcome' }
    const req = await buildRequest(row)

    const res = await POST({ request: req, locals: {} as App.Locals } as Parameters<typeof POST>[0])

    expect(res.status).toBe(400)
    const data = (await res.json()) as Record<string, unknown>
    expect(data.code).toBe('bad-body')
    expect(String(data.reason)).toContain('unknown outcome')
  })
})
