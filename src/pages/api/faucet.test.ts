/**
 * Tests for POST /api/faucet — Sui testnet faucet proxy
 *
 * Validates:
 * - Address format validation (0x prefix, min length)
 * - Successful faucet proxy (200 → { ok, address, faucet })
 * - Rate-limit handling (429 → { ok, rateLimited })
 * - Upstream error (500 → 502)
 * - Timeout handling (abort → { ok, timeout })
 * - Missing body (400)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock global fetch for faucet proxy tests
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createCtx(body?: unknown) {
  return {
    request: new Request('http://localhost:4321/api/faucet', {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    }),
  } as any
}

describe('POST /api/faucet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 when address is missing', async () => {
    const { POST } = await import('./faucet')
    const res = await POST(createCtx({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('valid Sui address')
  })

  it('should return 400 when address lacks 0x prefix', async () => {
    const { POST } = await import('./faucet')
    const res = await POST(createCtx({ address: 'abc123' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('valid Sui address')
  })

  it('should return 400 when address is too short', async () => {
    const { POST } = await import('./faucet')
    const res = await POST(createCtx({ address: '0xabc' }))
    expect(res.status).toBe(400)
  })

  it('should proxy to faucet and return success', async () => {
    const faucetResponse = { task: 'faucet-task-123', transferredGasObjects: [] }
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(faucetResponse), { status: 200 }))

    const { POST } = await import('./faucet')
    const address = `0x${'a'.repeat(64)}`
    const res = await POST(createCtx({ address }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.address).toBe(address)
    expect(data.faucet).toEqual(faucetResponse)

    // Verify faucet was called with correct body
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toBe('https://faucet.testnet.sui.io/v1/gas')
    expect(opts.method).toBe('POST')
    const body = JSON.parse(opts.body)
    expect(body.FixedAmountRequest.recipient).toBe(address)
  })

  it('should handle faucet rate limiting (429)', async () => {
    mockFetch.mockResolvedValueOnce(new Response('rate limited', { status: 429 }))

    const { POST } = await import('./faucet')
    const address = `0x${'b'.repeat(64)}`
    const res = await POST(createCtx({ address }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.rateLimited).toBe(true)
    expect(data.note).toContain('already be funded')
  })

  it('should handle faucet rate limiting (body contains "rate")', async () => {
    mockFetch.mockResolvedValueOnce(new Response('rate limit exceeded', { status: 400 }))

    const { POST } = await import('./faucet')
    const address = `0x${'c'.repeat(64)}`
    const res = await POST(createCtx({ address }))
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.rateLimited).toBe(true)
  })

  it('should return 502 on upstream faucet error', async () => {
    mockFetch.mockResolvedValueOnce(new Response('internal error', { status: 500 }))

    const { POST } = await import('./faucet')
    const address = `0x${'d'.repeat(64)}`
    const res = await POST(createCtx({ address }))
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toContain('faucet 500')
  })

  it('should handle fetch abort (timeout) gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new DOMException('signal is aborted', 'AbortError'))

    const { POST } = await import('./faucet')
    const address = `0x${'e'.repeat(64)}`
    const res = await POST(createCtx({ address }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.timeout).toBe(true)
    expect(data.note).toContain('faucet slow')
  })

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'))

    const { POST } = await import('./faucet')
    const address = `0x${'f'.repeat(64)}`
    const res = await POST(createCtx({ address }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('fetch failed')
  })
})
