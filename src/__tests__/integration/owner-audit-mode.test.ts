/**
 * Integration test: owner-todo Gap 2, task 2.t2
 *
 * Verifies the ownerBypass() decision matrix in src/lib/role-check.ts:
 *
 *  Case 1: OWNER_AUDIT_MODE=audit + auditOwner returns false → 'bypass'
 *          (audit mode is non-blocking; emit failure does not prevent the allow)
 *
 *  Case 2: OWNER_AUDIT_MODE=enforce + auditOwner returns false → 'enforce-block'
 *          (enforce mode: no audit record means no bypass)
 *
 *  Case 3: OWNER_AUDIT_MODE=enforce + auditOwner returns true → 'bypass'
 *          (record buffered successfully; allow proceeds)
 *
 *  Case 4: non-owner role (any OWNER_AUDIT_MODE) → 'not-owner'
 *          (short-circuits before audit; role check only)
 *
 * Mock approach: vi.mock('@/engine/adl-cache') at module scope (hoisted by
 * vitest) intercepts the dynamic import('@/engine/adl-cache') inside
 * ownerBypass(). auditOwner and ownerAuditMode are replaced with vi.fn()
 * instances so each test can control their return values independently.
 *
 * No source files are modified. Env is cleaned up after each test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Module-scope mock (hoisted) ───────────────────────────────────────────────
// Must appear before any imports that transitively pull in adl-cache.
// vi.mock is hoisted to the top of the file by vitest's transformer, so the
// dynamic import inside ownerBypass() is intercepted even though the mock
// declaration appears syntactically after the imports.

vi.mock('@/engine/adl-cache', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/engine/adl-cache')>()
  return {
    ...original,
    auditOwner: vi.fn(),
    ownerAuditMode: vi.fn(),
  }
})

// ── Imports after mock ────────────────────────────────────────────────────────

import { auditOwner, ownerAuditMode } from '@/engine/adl-cache'
import { type OwnerBypassInput, ownerBypass } from '@/lib/role-check'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OWNER_AUTH = { role: 'owner', user: 'human:tony' } as const

const BYPASS_INPUT: OwnerBypassInput = {
  receiver: 'x',
  action: 'scope-bypass',
  gate: 'scope',
  payload: { note: 'test' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockAuditOwner = auditOwner as ReturnType<typeof vi.fn>
const mockOwnerAuditMode = ownerAuditMode as ReturnType<typeof vi.fn>

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ownerBypass: OwnerBypassDecision matrix', () => {
  it('case 1 — audit mode + emit failure → bypass (non-blocking)', async () => {
    // OWNER_AUDIT_MODE=audit: a failed audit emit must NOT block the allow.
    vi.stubEnv('OWNER_AUDIT_MODE', 'audit')
    mockAuditOwner.mockResolvedValue(false)
    mockOwnerAuditMode.mockReturnValue('audit')

    const decision = await ownerBypass(OWNER_AUTH, BYPASS_INPUT)

    expect(decision).toBe('bypass')
    expect(mockAuditOwner).toHaveBeenCalledOnce()
  })

  it('case 2 — enforce mode + emit failure → enforce-block', async () => {
    // OWNER_AUDIT_MODE=enforce: a failed audit emit MUST return enforce-block.
    // Call sites in signal.ts map this to 503 OWNER_AUDIT_REQUIRED.
    vi.stubEnv('OWNER_AUDIT_MODE', 'enforce')
    mockAuditOwner.mockResolvedValue(false)
    mockOwnerAuditMode.mockReturnValue('enforce')

    const decision = await ownerBypass(OWNER_AUTH, BYPASS_INPUT)

    expect(decision).toBe('enforce-block')
    expect(mockAuditOwner).toHaveBeenCalledOnce()
  })

  it('case 3 — enforce mode + emit success → bypass', async () => {
    // OWNER_AUDIT_MODE=enforce: a successful audit emit → allow proceeds.
    vi.stubEnv('OWNER_AUDIT_MODE', 'enforce')
    mockAuditOwner.mockResolvedValue(true)
    mockOwnerAuditMode.mockReturnValue('enforce')

    const decision = await ownerBypass(OWNER_AUTH, BYPASS_INPUT)

    expect(decision).toBe('bypass')
    expect(mockAuditOwner).toHaveBeenCalledOnce()
  })

  it('case 4 — non-owner role → not-owner (regardless of mode)', async () => {
    // ownerBypass short-circuits before calling auditOwner when role !== 'owner'.
    vi.stubEnv('OWNER_AUDIT_MODE', 'enforce')
    mockOwnerAuditMode.mockReturnValue('enforce')
    // auditOwner should never be called for non-owner roles.

    const decision = await ownerBypass({ role: 'chairman', user: 'human:tony' }, BYPASS_INPUT)

    expect(decision).toBe('not-owner')
    expect(mockAuditOwner).not.toHaveBeenCalled()
  })

  it('null auth → not-owner', async () => {
    // Defensive: null/undefined auth must never reach the audit path.
    vi.stubEnv('OWNER_AUDIT_MODE', 'enforce')
    mockOwnerAuditMode.mockReturnValue('enforce')

    const decision = await ownerBypass(null, BYPASS_INPUT)

    expect(decision).toBe('not-owner')
    expect(mockAuditOwner).not.toHaveBeenCalled()
  })
})
