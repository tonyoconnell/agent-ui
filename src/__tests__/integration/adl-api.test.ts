/**
 * adl-api.test.ts — ADL Cycle 2: perm-network API host permission gate
 *
 * Verifies that canCallAPI() in api.ts correctly gates HTTP calls:
 * 1. Caller with no perm-network → fail-open, fetch fires
 * 2. Caller with wildcard `*` allowedHosts → fetch fires
 * 3. Caller with matching hostname in allowedHosts → fetch fires
 * 4. Caller with blocked hostname → dissolved, fetch NOT called
 * 5. Malformed perm-network JSON → fail-open, fetch fires
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'

const TARGET_BASE = 'https://api.example.com'
const CALLER_ID = 'caller-id'
const SIGNAL_DATA = { path: '/items' }

/** Wire a fresh apiUnit into a fresh world and return the world. */
async function makeWorld() {
  const { apiUnit } = await import('@/engine/api')
  const { world: createWorld } = await import('@/engine/world')
  const net = createWorld()
  const u = apiUnit('test-api', { base: TARGET_BASE })
  net.units['test-api'] = u
  return net
}

/** Wait for async handlers (fetch mock) to settle. */
const settle = () => new Promise((r) => setTimeout(r, 50))

describe('ADL Cycle 2: API host permission gate', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'ok' }),
    })
  })

  it('caller with no perm-network → fail-open, fetch fires', async () => {
    // readParsed returns empty rows → no perm-network attribute → fail-open
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const net = await makeWorld()
    net.signal({ receiver: 'test-api:get', data: SIGNAL_DATA }, CALLER_ID)
    await settle()

    expect(global.fetch).toHaveBeenCalled()
  })

  it('caller with wildcard `*` allowedHosts → fetch fires', async () => {
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([{ pn: JSON.stringify({ allowed_hosts: ['*'] }) }])

    const net = await makeWorld()
    net.signal({ receiver: 'test-api:get', data: SIGNAL_DATA }, CALLER_ID)
    await settle()

    expect(global.fetch).toHaveBeenCalled()
  })

  it('caller with matching hostname in allowedHosts → fetch fires', async () => {
    // hostname of TARGET_BASE is 'api.example.com'
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([
      { pn: JSON.stringify({ allowed_hosts: ['api.example.com', 'other.com'] }) },
    ])

    const net = await makeWorld()
    net.signal({ receiver: 'test-api:get', data: SIGNAL_DATA }, CALLER_ID)
    await settle()

    expect(global.fetch).toHaveBeenCalled()
  })

  it('caller with blocked hostname → dissolved, fetch NOT called', async () => {
    // allowedHosts set but does not include api.example.com or *
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([
      { pn: JSON.stringify({ allowed_hosts: ['trusted.internal.com'] }) },
    ])

    const net = await makeWorld()
    net.signal({ receiver: 'test-api:get', data: SIGNAL_DATA }, CALLER_ID)
    await settle()

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('malformed perm-network JSON → fail-open, fetch fires', async () => {
    // JSON.parse throws on this → catch block sets allowedHosts=[] → fail-open
    ;(readParsed as ReturnType<typeof vi.fn>).mockResolvedValue([{ pn: 'not-valid-json{{{' }])

    const net = await makeWorld()
    net.signal({ receiver: 'test-api:get', data: SIGNAL_DATA }, CALLER_ID)
    await settle()

    expect(global.fetch).toHaveBeenCalled()
  })
})
