/**
 * Owner-audit redaction pipeline — integration test (owner-todo Gap 2, task 2.t3).
 *
 * Verifies the full e2e path:
 *   auditOwner() → ring buffer → flushAuditBuffer() → fake D1
 *
 * Acceptance: a payload containing real-looking secrets pushed through
 * auditOwner() must NOT survive in payload_redacted; payload_hash must
 * match what redactPayload(originalPayload).hash would compute, so an
 * auditor can verify a redacted row corresponds to a known input.
 *
 * Four cases:
 *   2.t3-a — bearer token redacted, hash matches original
 *   2.t3-b — WebAuthn credId redacted
 *   2.t3-c — BIP39 mnemonic redacted
 *   2.t3-d — allow-listed fields preserved; nested signature key redacted
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { auditOwner, drainAuditBuffer, flushAuditBuffer } from '@/engine/adl-cache'

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
  drainAuditBuffer()
})

afterEach(() => {
  drainAuditBuffer()
})

describe('owner_audit redaction (2.t3)', () => {
  it('2.t3-a: bearer token redacted, hash matches original payload', async () => {
    const SECRET = 'sk_owner_X9X9X9X9_LiveKeyShouldNeverEscape'
    const payload = { receiver: 'agent:scout', action: 'mark', amount: 5, key: SECRET }

    await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:scout',
      action: 'scope-bypass',
      gate: 'scope',
      payload,
    })

    const { db, inserts } = makeFakeD1()
    await flushAuditBuffer(db)

    expect(inserts).toHaveLength(1)
    const { sql, args } = inserts[0]
    // Routed to owner_audit, not adl_audit
    expect(sql).toContain('owner_audit')

    // args: (ts, action, sender, receiver, payload_hash, payload_redacted, gate, decision)
    const persistedHash = args[4] as string
    const persistedRedacted = args[5] as string

    // Secret must NOT appear in the persisted redacted payload
    expect(persistedRedacted).not.toContain(SECRET)
    expect(persistedRedacted).toContain('[REDACTED:bearer]')

    // Hash must match what redactPayload would compute on the ORIGINAL payload
    const { redactPayload } = await import('@/lib/audit-redact')
    const expected = await redactPayload(payload)
    expect(persistedHash).toBe(expected.hash)
    // Sanity: hash is sha256 hex (64 chars)
    expect(persistedHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('2.t3-b: WebAuthn credId redacted', async () => {
    const CRED_ID = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAA' // 28-char base64url
    const payload = { credId: CRED_ID, action: 'register', receiver: 'agent:auth' }

    await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:auth',
      action: 'scope-bypass',
      gate: 'scope',
      payload,
    })

    const { db, inserts } = makeFakeD1()
    await flushAuditBuffer(db)

    expect(inserts).toHaveLength(1)
    const persistedRedacted = inserts[0].args[5] as string

    // credId value must not appear
    expect(persistedRedacted).not.toContain(CRED_ID)
    expect(persistedRedacted).toContain('[REDACTED:credId]')

    // action is allow-listed — must survive
    const obj = JSON.parse(persistedRedacted) as Record<string, unknown>
    expect(obj.action).toBe('register')
    expect(obj.receiver).toBe('agent:auth')
  })

  it('2.t3-c: BIP39 mnemonic redacted, no original word survives', async () => {
    const MNEMONIC = 'abandon ability able about above absent absorb abstract absurd abuse access accident'
    const payload = { words: MNEMONIC, receiver: 'agent:vault', action: 'recover' }

    await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:vault',
      action: 'scope-bypass',
      gate: 'scope',
      payload,
    })

    const { db, inserts } = makeFakeD1()
    await flushAuditBuffer(db)

    expect(inserts).toHaveLength(1)
    const persistedRedacted = inserts[0].args[5] as string

    // The mnemonic as a whole must not appear
    expect(persistedRedacted).not.toContain(MNEMONIC)
    expect(persistedRedacted).toContain('[REDACTED:mnemonic]')

    // Spot-check: none of the individual distinctive words appear verbatim
    // ('abandon' is also a BIP39 word that could appear in other contexts,
    //  but in a valid JSON string the full value is replaced)
    const obj = JSON.parse(persistedRedacted) as Record<string, unknown>
    expect(obj.words).toBe('[REDACTED:mnemonic]')
  })

  it('2.t3-d: allow-listed fields preserved; nested sig key redacted as signature', async () => {
    const payload = {
      receiver: 'agent:scout',
      action: 'mark',
      amount: 100,
      group: 'g:owns:human:tony',
      extra: { sig: 'eyJabc.def.ghi' },
    }

    await auditOwner({
      sender: 'human:tony',
      receiver: 'agent:scout',
      action: 'scope-bypass',
      gate: 'scope',
      payload,
    })

    const { db, inserts } = makeFakeD1()
    await flushAuditBuffer(db)

    expect(inserts).toHaveLength(1)
    const persistedRedacted = inserts[0].args[5] as string
    const obj = JSON.parse(persistedRedacted) as Record<string, unknown>

    // Allow-listed fields preserved verbatim
    expect(obj.receiver).toBe('agent:scout')
    expect(obj.action).toBe('mark')
    expect(obj.amount).toBe(100)
    expect(obj.group).toBe('g:owns:human:tony')

    // Nested sig key value is redacted as [REDACTED:signature]
    const extra = obj.extra as Record<string, unknown>
    expect(extra.sig).toBe('[REDACTED:signature]')

    // The raw sig value must not appear anywhere in the persisted string
    expect(persistedRedacted).not.toContain('eyJabc.def.ghi')
  })
})
