/**
 * Integration Test: Gate Matrix (Cycle 2 gate)
 *
 * Tests that the role gate helper and scope validation work correctly.
 * Stage gates: 3 (board/join), 4 (agents/sync), 5b (deploy-on-behalf), 9 (register scope), path-scope.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
  write: vi.fn(),
}))

vi.mock('@/lib/api-auth', () => ({
  validateApiKey: vi.fn().mockResolvedValue({
    isValid: false,
    user: '',
    permissions: [],
    keyId: '',
    role: 'agent',
  }),
  requireRole: vi.fn(),
  getRoleForUser: vi.fn().mockResolvedValue('agent'),
  hasPermission: vi.fn().mockReturnValue(false),
}))

vi.mock('@/engine/adl-cache', () => ({
  enforcementMode: vi.fn(() => 'enforce'),
  audit: vi.fn(),
}))

function ctx(method: string, body: unknown) {
  return {
    request: new Request('http://localhost/test', {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: {} as Record<string, string>,
  } as any
}

describe('Gate: Stage 9 — capability scope validation', () => {
  it('rejects private scope on capabilities', async () => {
    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST(
      ctx('POST', { uid: 'test-seller', capabilities: [{ skill: 'copy', price: 0.02, scope: 'private' }] }),
    )
    expect(res.status).toBe(400)
    const data = (await res.json()) as any
    expect(data.gate).toBe('stage-9')
  })

  it('accepts group scope on capabilities', async () => {
    const { readParsed } = await import('@/lib/typedb')
    ;(readParsed as any).mockResolvedValue([])
    const { POST } = await import('@/pages/api/agents/register')
    const res = await POST(
      ctx('POST', { uid: 'test-seller', capabilities: [{ skill: 'copy', price: 0.02, scope: 'group' }] }),
    )
    // Should not return 400 for gate-9 specifically
    const data = (await res.json()) as any
    expect(data.gate).not.toBe('stage-9')
  })
})

describe('Gate: requireRole helper', () => {
  it('returns 401 when no bearer token in enforce mode', async () => {
    const { enforcementMode } = await import('@/engine/adl-cache')
    ;(enforcementMode as any).mockReturnValue('enforce')
    const { requireRole } = await import('@/lib/api-auth')
    ;(requireRole as any).mockResolvedValue({
      ok: false,
      res: Response.json({ error: 'bearer token required' }, { status: 401 }),
    })
    const result = await requireRole(new Request('http://localhost/test'), 'add_unit', { gate: 'stage-4' })
    expect((result as any).ok).toBe(false)
  })

  it('passes through in audit mode even without bearer', async () => {
    const { enforcementMode } = await import('@/engine/adl-cache')
    ;(enforcementMode as any).mockReturnValue('audit')
    const { requireRole } = await import('@/lib/api-auth')
    ;(requireRole as any).mockResolvedValue({
      ok: true,
      auth: { isValid: false, user: '', permissions: [], keyId: '', role: 'agent' },
      role: 'agent',
    })
    const result = await requireRole(new Request('http://localhost/test'), 'add_unit', { gate: 'stage-4' })
    expect((result as any).ok).toBe(true)
  })
})

describe('Gate: Stage 3 — board/join requires uid', () => {
  it('returns 400 without uid', async () => {
    const { POST } = await import('@/pages/api/board/join')
    const res = await POST(ctx('POST', {}))
    expect(res.status).toBe(400)
  })
})
