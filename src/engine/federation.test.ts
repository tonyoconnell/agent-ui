/**
 * Federation Tests
 *
 * Verify: federate() wires remote ONE worlds as substrate units.
 * Zero returns on network error. Signal forwarding with auth.
 *
 * Run: bun vitest run src/engine/federation.test.ts
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { federate, federateSignal } from './federation'

// ═══════════════════════════════════════════════════════════════════════════
// Mocks
// ═══════════════════════════════════════════════════════════════════════════

// Mock global fetch
global.fetch = vi.fn()

describe('federation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 1: federate(id, url, key) returns a Unit with that id
  // ───────────────────────────────────────────────────────────────────────────

  it('federate returns a Unit with the given id', () => {
    const u = federate('world-legal', 'https://legal.one.ie', 'secret-key')
    expect(u.id).toBe('world-legal')
    expect(u.has('default')).toBe(true)
    expect(typeof u.on).toBe('function')
    expect(typeof u.then).toBe('function')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 2: federate forwards signal via fetch POST with Bearer auth
  // ───────────────────────────────────────────────────────────────────────────

  it('federate handler forwards signal via fetch POST with Authorization header', async () => {
    const mockFetch = global.fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'ok' }),
    })

    const u = federate('world-legal', 'https://legal.one.ie', 'secret-key')
    expect(u.has('default')).toBe(true)

    // Invoke unit with data containing receiver + contract
    u(
      {
        receiver: 'world-legal',
        data: { receiver: 'review', contract: 'test' },
      },
      'entry',
    )

    // Give async handler time to run
    await new Promise((r) => setTimeout(r, 50))

    expect(mockFetch).toHaveBeenCalledWith('https://legal.one.ie/api/signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret-key',
      },
      body: JSON.stringify({
        sender: 'world-legal',
        receiver: 'review',
        data: { contract: 'test' },
      }),
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 3: Network error silently returns (zero returns — silence is valid)
  // ───────────────────────────────────────────────────────────────────────────

  it('federate network error silently continues (zero returns)', async () => {
    const mockFetch = global.fetch as any
    mockFetch.mockImplementationOnce(async () => {
      throw new Error('Network error')
    })

    const u = federate('world-finance', 'https://finance.one.ie', 'key')
    // Invoke unit: should not throw at call time
    expect(() => {
      u(
        {
          receiver: 'world-finance',
          data: { receiver: 'audit', amount: 100 },
        },
        'entry',
      )
    }).not.toThrow()

    // Give async handler time to run and catch the error internally
    await new Promise((r) => setTimeout(r, 50))

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalled()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 4: federateSignal forwards with receiver name intact
  // ───────────────────────────────────────────────────────────────────────────

  it('federateSignal forwards receiver name and data unchanged', async () => {
    const mockFetch = global.fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'forwarded' }),
    })

    const u = federateSignal('world-b:scout', 'https://world-b.one.ie', 'key')
    u(
      {
        receiver: 'world-b:scout',
        data: { target: 'explore' },
      },
      'entry',
    )

    await new Promise((r) => setTimeout(r, 50))

    expect(mockFetch).toHaveBeenCalledWith('https://world-b.one.ie/api/signal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer key',
      },
      body: JSON.stringify({
        receiver: 'world-b:scout',
        data: { target: 'explore' },
      }),
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test 5: Trailing slash in baseUrl is stripped
  // ───────────────────────────────────────────────────────────────────────────

  it('strips trailing slash from baseUrl before calling /api/signal', async () => {
    const mockFetch = global.fetch as any
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const u = federate('world', 'https://example.com/', 'key')
    u(
      {
        receiver: 'world',
        data: { receiver: 'test' },
      },
      'entry',
    )

    await new Promise((r) => setTimeout(r, 50))

    const call = mockFetch.mock.calls[0][0]
    expect(call).toBe('https://example.com/api/signal')
  })
})
