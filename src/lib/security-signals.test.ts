import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  writeSilent: vi.fn().mockResolvedValue(undefined),
}))

import { emitSecurityEvent } from '@/lib/security-signals'
import { writeSilent } from '@/lib/typedb'

const mockWriteSilent = vi.mocked(writeSilent)

describe('emitSecurityEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes a hypothesis to TypeDB on auth-fail', () => {
    emitSecurityEvent({ kind: 'auth-fail', caller: 'key-abc123', reason: 'invalid-key' })
    expect(mockWriteSilent).toHaveBeenCalledOnce()
    const tql = mockWriteSilent.mock.calls[0][0] as string
    expect(tql).toContain('isa hypothesis')
    expect(tql).toContain('auth-fail')
    expect(tql).toContain('source "observed"')
  })

  it('writes a hypothesis on replay event', () => {
    emitSecurityEvent({ kind: 'replay', edge: 'entry→target:ping', nonce: 'uuid-v7-xyz' })
    expect(mockWriteSilent).toHaveBeenCalledOnce()
    const tql = mockWriteSilent.mock.calls[0][0] as string
    expect(tql).toContain('replay')
    expect(tql).toContain('uuid-v7-xyz')
  })

  it('writes a hypothesis on revoke event', () => {
    emitSecurityEvent({ kind: 'revoke', keyId: 'key-123', userId: 'user@example.com' })
    expect(mockWriteSilent).toHaveBeenCalledOnce()
    const tql = mockWriteSilent.mock.calls[0][0] as string
    expect(tql).toContain('revoke')
    expect(tql).toContain('key-123')
  })

  it('never throws even if writeSilent rejects', async () => {
    mockWriteSilent.mockRejectedValueOnce(new Error('TypeDB down'))
    // emitSecurityEvent is fire-and-forget — calling it must not throw
    expect(() => emitSecurityEvent({ kind: 'toxic', edge: 'a→b' })).not.toThrow()
    // Let the rejected promise settle without crashing
    await new Promise((r) => setTimeout(r, 10))
  })
})
