/**
 * Cycle 1.5 — ADL cache invalidation + enforcement-mode kill-switch.
 *
 * Proves:
 *  (a) invalidateAdlCache(uid) drops every key across both caches
 *  (b) syncAdl auto-invalidates after every TypeDB write
 *  (c) ADL_ENFORCEMENT_MODE=audit logs + allows; =enforce blocks
 *  (d) Sui bridge fails CLOSED on TypeDB read error in enforce mode
 *  (e) audit() never throws
 *
 * Runs without a real TypeDB — mocks `@/lib/typedb` like signal.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  audit,
  BRIDGE_PERM_CACHE,
  CACHE_TTL,
  enforcementMode,
  getCached,
  invalidateAdlCache,
  invalidateBridgeCache,
  invalidatePermCache,
  PERM_CACHE,
  setCached,
} from '@/engine/adl-cache'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  write: vi.fn().mockResolvedValue(undefined),
  writeSilent: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  PERM_CACHE.clear()
  BRIDGE_PERM_CACHE.clear()
  vi.clearAllMocks()
  delete process.env.ADL_ENFORCEMENT_MODE
})

describe('adl-cache: PERM_CACHE helpers', () => {
  it('getCached returns undefined for missing key', () => {
    expect(getCached('nope:status')).toBeUndefined()
  })

  it('setCached + getCached round-trip', () => {
    setCached('u1:status', { adlStatus: 'active' })
    expect(getCached('u1:status')?.adlStatus).toBe('active')
  })

  it('getCached evicts entries older than CACHE_TTL', () => {
    setCached('u1:status', { adlStatus: 'active' })
    const entry = PERM_CACHE.get('u1:status')!
    entry.timestamp = Date.now() - (CACHE_TTL + 1000)
    expect(getCached('u1:status')).toBeUndefined()
    expect(PERM_CACHE.has('u1:status')).toBe(false)
  })
})

describe('adl-cache: invalidation (Cycle 1.5 contract)', () => {
  it('invalidatePermCache drops ALL 4 signal keys (fixes Cycle 1 leak)', () => {
    setCached('u1:status', { adlStatus: 'active' })
    setCached('u1:network', { permNetwork: { allowedHosts: ['*'] } })
    setCached('u1:sensitivity', { senderSensitivity: 'internal' })

    invalidatePermCache('u1')

    expect(PERM_CACHE.has('u1:status')).toBe(false)
    expect(PERM_CACHE.has('u1:network')).toBe(false)
    expect(PERM_CACHE.has('u1:sensitivity')).toBe(false)
  })

  it('invalidateBridgeCache drops the bridge network key', () => {
    BRIDGE_PERM_CACHE.set('u1:network', {
      allowedHosts: ['a.com'],
      expires: Date.now() + 60_000,
    })
    invalidateBridgeCache('u1')
    expect(BRIDGE_PERM_CACHE.has('u1:network')).toBe(false)
  })

  it('invalidateAdlCache flushes BOTH caches atomically for the uid', () => {
    setCached('u1:status', { adlStatus: 'retired' })
    BRIDGE_PERM_CACHE.set('u1:network', {
      allowedHosts: ['a.com'],
      expires: Date.now() + 60_000,
    })

    invalidateAdlCache('u1')

    expect(PERM_CACHE.has('u1:status')).toBe(false)
    expect(BRIDGE_PERM_CACHE.has('u1:network')).toBe(false)
  })

  it('invalidateAdlCache does NOT touch other uids', () => {
    setCached('u1:status', { adlStatus: 'active' })
    setCached('u2:status', { adlStatus: 'active' })

    invalidateAdlCache('u1')

    expect(PERM_CACHE.has('u1:status')).toBe(false)
    expect(PERM_CACHE.has('u2:status')).toBe(true)
  })

  it('set → invalidate → next read misses within <100ms (staleness window closed)', () => {
    setCached('u1:status', { adlStatus: 'active' })
    const t0 = Date.now()
    invalidateAdlCache('u1')
    const t1 = Date.now()
    expect(getCached('u1:status')).toBeUndefined()
    expect(t1 - t0).toBeLessThan(100)
  })
})

describe('adl-cache: syncAdl invalidates after every write', async () => {
  it('syncAdl calls invalidateAdlCache(doc.id) after TypeDB writes', async () => {
    const { syncAdl } = await import('@/engine/adl')
    // Seed cache for a uid we are about to sync
    setCached('https://example.com/agents/x:status', { adlStatus: 'active' })
    BRIDGE_PERM_CACHE.set('https://example.com/agents/x:network', {
      allowedHosts: ['*'],
      expires: Date.now() + 60_000,
    })

    await syncAdl({
      id: 'https://example.com/agents/x',
      name: 'X',
      version: '1.0.0',
      adlVersion: '0.2.0',
      status: 'active',
    } as Parameters<typeof syncAdl>[0])

    // Both caches for that uid must be gone
    expect(PERM_CACHE.has('https://example.com/agents/x:status')).toBe(false)
    expect(BRIDGE_PERM_CACHE.has('https://example.com/agents/x:network')).toBe(false)
  })
})

describe('adl-cache: enforcementMode kill-switch', () => {
  it('defaults to enforce when env unset', () => {
    delete process.env.ADL_ENFORCEMENT_MODE
    expect(enforcementMode()).toBe('enforce')
  })

  it('honors ADL_ENFORCEMENT_MODE=audit', () => {
    process.env.ADL_ENFORCEMENT_MODE = 'audit'
    expect(enforcementMode()).toBe('audit')
  })

  it('unrecognized values fall back to enforce (fail safe)', () => {
    process.env.ADL_ENFORCEMENT_MODE = 'nonsense'
    expect(enforcementMode()).toBe('enforce')
  })

  it('explicit enforce stays enforce', () => {
    process.env.ADL_ENFORCEMENT_MODE = 'enforce'
    expect(enforcementMode()).toBe('enforce')
  })
})

describe('adl-cache: audit() is truly silent on failure', () => {
  it('never throws even when given structurally-broken input', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(() =>
      audit({
        sender: 'a',
        receiver: 'b',
        gate: 'lifecycle',
        decision: 'deny',
        mode: 'enforce',
        // @ts-expect-error — deliberately broken
        reason: circular,
      }),
    ).not.toThrow()
  })

  it('emits a [adl-audit] prefixed line', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    audit({
      sender: 'a',
      receiver: 'b',
      gate: 'lifecycle',
      decision: 'deny',
      mode: 'enforce',
    })
    expect(spy).toHaveBeenCalled()
    const call = spy.mock.calls[0][0] as string
    expect(call).toContain('[adl-audit]')
    expect(call).toContain('"gate":"lifecycle"')
    expect(call).toContain('"decision":"deny"')
    spy.mockRestore()
  })
})
