/**
 * owner-audit-emit.test.ts — Gap 2, task 2.t1
 *
 * Acceptance: synthetic owner-tier signal → assert one `owner_audit` row
 * appears in the fake D1 within the 100ms budget.
 *
 * Covers:
 *  1. Single owner-tier signal lands exactly one owner_audit row (8 columns).
 *  2. Three owner-tier signals → three owner_audit rows, no adl_audit rows.
 *  3. Mixed: 1 owner + 2 non-owner → 1 owner_audit + 2 adl_audit rows.
 *     Owner row preserves the action value passed to auditOwner().
 *  4. Throughput: 50 owner records flush in under 100ms.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AUDIT_BUFFER, audit, auditOwner, drainAuditBuffer, flushAuditBuffer } from '@/engine/adl-cache'

// ── Fake D1 ──────────────────────────────────────────────────────────────────

interface RecordedInsert {
  sql: string
  args: unknown[]
}

function makeFakeD1() {
  const inserts: RecordedInsert[] = []
  const db = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        run: async () => {
          inserts.push({ sql, args })
          return { success: true }
        },
      }),
    }),
  }
  return { db, inserts }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Drain any stale records before each test.
  drainAuditBuffer()
})

afterEach(() => {
  // Leave buffer clean regardless of test outcome.
  drainAuditBuffer()
})

// ── Test suite ────────────────────────────────────────────────────────────────

describe('owner_audit emit (2.t1)', () => {
  it('1 — single owner-tier signal lands exactly one owner_audit row with 8 bound args', async () => {
    const buffered = await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:scout',
      action: 'scope-bypass',
      gate: 'scope',
      payload: { foo: 'bar' },
    })

    expect(buffered).toBe(true)
    expect(AUDIT_BUFFER).toHaveLength(1)

    const { db, inserts } = makeFakeD1()

    const t0 = performance.now()
    const written = await flushAuditBuffer(db)
    const elapsed = performance.now() - t0

    expect(written).toBe(1)
    expect(elapsed).toBeLessThan(100)

    const ownerInserts = inserts.filter((i) => /INSERT\s+INTO\s+owner_audit/i.test(i.sql))
    const adlInserts = inserts.filter((i) => /INSERT\s+INTO\s+adl_audit/i.test(i.sql))

    expect(ownerInserts).toHaveLength(1)
    expect(adlInserts).toHaveLength(0)

    // owner_audit has 8 bound columns:
    //   ts, action, sender, receiver, payload_hash, payload_redacted, gate, decision
    expect(ownerInserts[0].args).toHaveLength(8)

    // Buffer must be drained after flush
    expect(AUDIT_BUFFER).toHaveLength(0)
  })

  it('2 — three owner-tier signals → three owner_audit rows, zero adl_audit rows', async () => {
    const actions = ['scope-bypass', 'network-bypass', 'sensitivity-bypass'] as const
    for (const action of actions) {
      await auditOwner({
        sender: 'human:tony',
        receiver: 'agent:scout',
        action,
        gate: 'scope',
        payload: { action },
      })
    }

    expect(AUDIT_BUFFER).toHaveLength(3)

    const { db, inserts } = makeFakeD1()
    const written = await flushAuditBuffer(db)

    expect(written).toBe(3)

    const ownerInserts = inserts.filter((i) => /INSERT\s+INTO\s+owner_audit/i.test(i.sql))
    const adlInserts = inserts.filter((i) => /INSERT\s+INTO\s+adl_audit/i.test(i.sql))

    expect(ownerInserts).toHaveLength(3)
    expect(adlInserts).toHaveLength(0)

    expect(AUDIT_BUFFER).toHaveLength(0)
  })

  it('3 — mixed: 1 owner + 2 non-owner → 1 owner_audit + 2 adl_audit; owner row preserves action', async () => {
    // One owner-tier record
    await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:scout',
      action: 'scope-bypass',
      gate: 'scope',
      payload: { request: 'sensitive' },
    })

    // Two non-owner audit records (direct audit() calls, no payloadHash)
    audit({
      sender: 'human:tony',
      receiver: 'agent:sentinel',
      gate: 'lifecycle',
      decision: 'deny',
      mode: 'enforce',
    })
    audit({
      sender: 'agent:scout',
      receiver: 'agent:logger',
      gate: 'network',
      decision: 'allow-audit',
      mode: 'audit',
    })

    expect(AUDIT_BUFFER).toHaveLength(3)

    const { db, inserts } = makeFakeD1()
    const written = await flushAuditBuffer(db)

    expect(written).toBe(3)

    const ownerInserts = inserts.filter((i) => /INSERT\s+INTO\s+owner_audit/i.test(i.sql))
    const adlInserts = inserts.filter((i) => /INSERT\s+INTO\s+adl_audit/i.test(i.sql))

    expect(ownerInserts).toHaveLength(1)
    expect(adlInserts).toHaveLength(2)

    // The action column is the 2nd bound arg (index 1) in owner_audit:
    //   (ts, action, sender, receiver, payload_hash, payload_redacted, gate, decision)
    expect(ownerInserts[0].args[1]).toBe('scope-bypass')

    expect(AUDIT_BUFFER).toHaveLength(0)
  })

  it('4 — throughput: 50 owner records flush in under 100ms', async () => {
    for (let i = 0; i < 50; i++) {
      await auditOwner({
        sender: `human:tony-${i}`,
        receiver: `agent:scout-${i}`,
        action: 'scope-bypass',
        gate: 'scope',
        payload: { index: i },
      })
    }

    expect(AUDIT_BUFFER).toHaveLength(50)

    const { db, inserts } = makeFakeD1()

    const t0 = performance.now()
    const written = await flushAuditBuffer(db)
    const elapsed = performance.now() - t0

    expect(written).toBe(50)
    expect(elapsed).toBeLessThan(100)

    const ownerInserts = inserts.filter((i) => /INSERT\s+INTO\s+owner_audit/i.test(i.sql))
    expect(ownerInserts).toHaveLength(50)

    expect(AUDIT_BUFFER).toHaveLength(0)
  })
})
