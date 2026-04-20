// src/__tests__/integration/u-vault-audit-log.test.ts
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { appendAudit, closeVaultDb, recentAudit } from '@/components/u/lib/vault/storage'

describe('u-vault: audit log records security events', () => {
  beforeEach(() => {
    // Reset db connection between tests
    closeVaultDb()
  })

  it('appends audit events and retrieves them', async () => {
    const events: Parameters<typeof appendAudit>[0][] = [
      { at: Date.now(), verb: 'unlock', outcome: 'ok', method: 'password' },
      { at: Date.now(), verb: 'unlock', outcome: 'ok', method: 'passkey' },
      { at: Date.now(), verb: 'lock', outcome: 'ok' },
      { at: Date.now(), verb: 'reveal', outcome: 'ok', subject: 'wallet-0' },
      { at: Date.now(), verb: 'export', outcome: 'ok' },
      { at: Date.now(), verb: 'unlock', outcome: 'fail', method: 'password' },
      { at: Date.now(), verb: 'save', outcome: 'ok', subject: 'wallet-1' },
      { at: Date.now(), verb: 'delete', outcome: 'ok', subject: 'wallet-2' },
      { at: Date.now(), verb: 'import', outcome: 'ok' },
      { at: Date.now(), verb: 'sign', outcome: 'ok', subject: 'wallet-3' },
    ]

    for (const event of events) {
      await appendAudit(event)
    }

    const log = await recentAudit(10)
    expect(log.length).toBe(10)
  })

  it('audit event includes expected fields', async () => {
    closeVaultDb()
    await appendAudit({ at: Date.now(), verb: 'unlock', outcome: 'ok', method: 'password' })
    const log = await recentAudit(1)
    expect(log.length).toBeGreaterThanOrEqual(1)
    const event = log[0]
    expect(event).toHaveProperty('verb')
    expect(event).toHaveProperty('outcome')
    expect(event).toHaveProperty('at')
  })

  it('recentAudit respects limit parameter', async () => {
    closeVaultDb()
    for (let i = 0; i < 5; i++) {
      await appendAudit({ at: Date.now() + i, verb: 'lock', outcome: 'ok' })
    }
    const log = await recentAudit(3)
    expect(log.length).toBeLessThanOrEqual(3)
  })
})
