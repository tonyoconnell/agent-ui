/**
 * Owner-tier audit ring + D1 routing tests (owner-todo Gap 2 W3 Wave B).
 *
 * Covers:
 *   2.s3 — auditOwner() pushes a record into the ring buffer with
 *          payload_hash + payload_redacted populated.
 *   2.s4 — flushAuditBuffer() routes owner-tier records to owner_audit
 *          (not adl_audit), preserves the action / hash / redacted JSON.
 *   2.s5 — ownerAuditMode() reads OWNER_AUDIT_MODE env, default 'audit'.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AUDIT_BUFFER, auditOwner, drainAuditBuffer, flushAuditBuffer, ownerAuditMode } from '@/engine/adl-cache'

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

beforeEach(() => {
  // Drain any pre-existing buffer so each test starts clean.
  drainAuditBuffer()
})

afterEach(() => {
  drainAuditBuffer()
  vi.unstubAllEnvs()
})

describe('auditOwner (2.s3)', () => {
  it('pushes a record with payloadHash + payloadRedacted populated', async () => {
    const ok = await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:scout',
      action: 'scope-bypass',
      gate: 'scope',
      payload: { receiver: 'agent:scout', action: 'mark', amount: 5, secret: 'sk_owner_xyz' },
    })

    expect(ok).toBe(true)
    expect(AUDIT_BUFFER).toHaveLength(1)
    const rec = AUDIT_BUFFER[0]
    expect(rec.sender).toBe('human:tony')
    expect(rec.receiver).toBe('agent:scout')
    expect(rec.gate).toBe('role:owner')
    expect(rec.decision).toBe('allow-audit')
    expect(rec.action).toBe('scope-bypass')
    expect(rec.payloadHash).toMatch(/^[0-9a-f]{64}$/)
    expect(typeof rec.payloadRedacted).toBe('string')

    // Redacted payload preserves allow-list keys, replaces secrets.
    const redactedObj = JSON.parse(rec.payloadRedacted!) as Record<string, unknown>
    expect(redactedObj.receiver).toBe('agent:scout')
    expect(redactedObj.action).toBe('mark')
    expect(redactedObj.amount).toBe(5)
    expect(redactedObj.secret).toBe('[REDACTED:bearer]')
  })

  it('produces deterministic hash for same payload', async () => {
    await auditOwner({
      sender: 's',
      receiver: 'r',
      action: 'scope-bypass',
      gate: 'scope',
      payload: { a: 1, b: 2 },
    })
    await auditOwner({
      sender: 's',
      receiver: 'r',
      action: 'scope-bypass',
      gate: 'scope',
      payload: { b: 2, a: 1 }, // same shape, different key order
    })
    expect(AUDIT_BUFFER).toHaveLength(2)
    expect(AUDIT_BUFFER[0].payloadHash).toBe(AUDIT_BUFFER[1].payloadHash)
  })
})

describe('flushAuditBuffer routing (2.s4)', () => {
  it('routes owner-tier records to owner_audit, others to adl_audit', async () => {
    // Owner-tier
    await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:scout',
      action: 'scope-bypass',
      gate: 'scope',
      payload: { action: 'mark' },
    })
    // Non-owner adl record (added directly via the underlying audit())
    const { audit } = await import('@/engine/adl-cache')
    audit({
      sender: 'agent:foo',
      receiver: 'agent:bar',
      gate: 'network',
      decision: 'deny',
      mode: 'enforce',
    })

    const { db, inserts } = makeFakeD1()
    const written = await flushAuditBuffer(db)

    expect(written).toBe(2)
    expect(inserts).toHaveLength(2)

    const ownerInsert = inserts.find((i) => i.sql.includes('owner_audit'))
    const adlInsert = inserts.find((i) => i.sql.includes('adl_audit'))

    expect(ownerInsert).toBeDefined()
    expect(adlInsert).toBeDefined()

    // owner_audit row preserves action + hash + redacted JSON
    const args = ownerInsert!.args
    // (ts, action, sender, receiver, payload_hash, payload_redacted, gate, decision)
    expect(args[1]).toBe('scope-bypass')
    expect(args[2]).toBe('human:tony')
    expect(args[3]).toBe('agent:scout')
    expect(args[4]).toMatch(/^[0-9a-f]{64}$/)
    expect(typeof args[5]).toBe('string')
    expect(args[6]).toBe('scope') // human-readable gate column
    expect(args[7]).toBe('allow-audit')
  })

  it('returns 0 when buffer is empty', async () => {
    const { db } = makeFakeD1()
    const written = await flushAuditBuffer(db)
    expect(written).toBe(0)
  })
})

describe('ownerAuditMode (2.s5)', () => {
  it("defaults to 'audit' when env unset", () => {
    vi.stubEnv('OWNER_AUDIT_MODE', '')
    expect(ownerAuditMode()).toBe('audit')
  })

  it("returns 'enforce' when OWNER_AUDIT_MODE=enforce", () => {
    vi.stubEnv('OWNER_AUDIT_MODE', 'enforce')
    expect(ownerAuditMode()).toBe('enforce')
  })

  it("treats unknown values as 'audit' (safe default)", () => {
    vi.stubEnv('OWNER_AUDIT_MODE', 'banana')
    expect(ownerAuditMode()).toBe('audit')
  })
})
