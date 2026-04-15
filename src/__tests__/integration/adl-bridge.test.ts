/**
 * adl-bridge.test.ts — ADL Cycle 1: perm-network gate on Sui bridge
 *
 * Verifies:
 * 1. Allowed sender → suiMark fires
 * 2. Blocked sender → suiMark does NOT fire
 * 3. Wildcard allowedHosts → always succeeds
 * 4. Missing perm-network → fail-open (suiMark fires)
 * 5. Same logic for mirrorWarn + suiWarn
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

const suiMarkMock = vi.fn().mockResolvedValue(undefined)
const suiWarnMock = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/sui', () => ({
  cancelEscrow: vi.fn(),
  createPath: vi.fn().mockResolvedValue({ pathId: 'path-sui-123' }),
  createUnit: vi.fn(),
  getClient: vi.fn(),
  releaseEscrow: vi.fn(),
  mark: suiMarkMock,
  warn: suiWarnMock,
}))

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
}))

import { readParsed } from '@/lib/typedb'

/** Build a readParsed mock that handles resolve(), resolvePath(), and canCallSui() queries. */
function setupMocks(permNetwork: string | null) {
  ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((q: string) => {
    // resolve(uid) → wallet + sui-unit-id
    if (q.includes('sui-unit-id')) {
      return Promise.resolve([{ w: 'wallet-x', oid: 'object-x' }])
    }
    // resolvePath() → sui-path-id
    if (q.includes('sui-path-id')) {
      return Promise.resolve([{ pid: 'path-sui-123' }])
    }
    // canCallSui() → perm-network
    if (q.includes('perm-network')) {
      if (permNetwork === null) return Promise.resolve([])
      return Promise.resolve([{ pn: permNetwork }])
    }
    return Promise.resolve([])
  })
}

describe('ADL Cycle 1: bridge perm-network gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('allowed sender → suiMark fires', async () => {
    setupMocks(JSON.stringify({ allowed_hosts: ['from-unit'] }))
    const { mirrorMark } = await import('@/engine/bridge')
    await mirrorMark('from-unit', 'to-unit', 1)
    expect(suiMarkMock).toHaveBeenCalled()
  })

  it('wildcard allowedHosts → suiMark always fires', async () => {
    setupMocks(JSON.stringify({ allowed_hosts: ['*'] }))
    const { mirrorMark } = await import('@/engine/bridge')
    await mirrorMark('any-sender', 'to-unit', 1)
    expect(suiMarkMock).toHaveBeenCalled()
  })

  it('missing perm-network → fail-open, suiMark fires', async () => {
    setupMocks(null)
    const { mirrorMark } = await import('@/engine/bridge')
    await mirrorMark('any-sender', 'to-unit', 1)
    expect(suiMarkMock).toHaveBeenCalled()
  })

  it('blocked sender → suiMark does NOT fire', async () => {
    setupMocks(JSON.stringify({ allowed_hosts: ['only-this-sender'] }))
    const { mirrorMark } = await import('@/engine/bridge')
    await mirrorMark('wrong-sender', 'to-unit', 1)
    expect(suiMarkMock).not.toHaveBeenCalled()
  })

  it('blocked sender → suiWarn does NOT fire', async () => {
    setupMocks(JSON.stringify({ allowed_hosts: ['only-this-sender'] }))
    const { mirrorWarn } = await import('@/engine/bridge')
    await mirrorWarn('wrong-sender', 'to-unit', 1)
    expect(suiWarnMock).not.toHaveBeenCalled()
  })
})
