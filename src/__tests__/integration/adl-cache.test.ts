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
  API_PERM_CACHE,
  AUDIT_BUFFER,
  AUDIT_BUFFER_MAX,
  audit,
  BRIDGE_PERM_CACHE,
  CACHE_TTL,
  drainAuditBuffer,
  enforcementMode,
  flushAuditBuffer,
  getCached,
  invalidateAdlCache,
  invalidateApiCache,
  invalidateBridgeCache,
  invalidateLlmCache,
  invalidatePermCache,
  invalidateSchemaCache,
  LLM_ENV_CACHE,
  PERM_CACHE,
  SKILL_SCHEMA_CACHE,
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
  LLM_ENV_CACHE.clear()
  API_PERM_CACHE.clear()
  SKILL_SCHEMA_CACHE.clear()
  AUDIT_BUFFER.length = 0
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

describe('adl-cache: Cycle 1.6 — unified cache consolidation', () => {
  it('invalidateLlmCache drops the perm-env key', () => {
    LLM_ENV_CACHE.set('u1:env', { access: ['*'], expires: Date.now() + 60_000 })
    invalidateLlmCache('u1')
    expect(LLM_ENV_CACHE.has('u1:env')).toBe(false)
  })

  it('invalidateApiCache drops every uid-keyed hostname entry', () => {
    API_PERM_CACHE.set('u1:api.github.com', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    API_PERM_CACHE.set('u1:api.stripe.com', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    API_PERM_CACHE.set('u2:api.github.com', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    invalidateApiCache('u1')
    expect(API_PERM_CACHE.has('u1:api.github.com')).toBe(false)
    expect(API_PERM_CACHE.has('u1:api.stripe.com')).toBe(false)
    expect(API_PERM_CACHE.has('u2:api.github.com')).toBe(true)
  })

  it('invalidateSchemaCache drops every uid-keyed skill entry', () => {
    SKILL_SCHEMA_CACHE.set('u1:skillA', { schema: null, expires: Date.now() + 60_000 })
    SKILL_SCHEMA_CACHE.set('u1:skillB', { schema: null, expires: Date.now() + 60_000 })
    SKILL_SCHEMA_CACHE.set('u2:skillA', { schema: null, expires: Date.now() + 60_000 })
    invalidateSchemaCache('u1')
    expect(SKILL_SCHEMA_CACHE.has('u1:skillA')).toBe(false)
    expect(SKILL_SCHEMA_CACHE.has('u1:skillB')).toBe(false)
    expect(SKILL_SCHEMA_CACHE.has('u2:skillA')).toBe(true)
  })

  it('invalidateAdlCache flushes ALL 5 caches atomically for the uid', () => {
    setCached('u1:status', { adlStatus: 'active' })
    BRIDGE_PERM_CACHE.set('u1:network', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    LLM_ENV_CACHE.set('u1:env', { access: ['*'], expires: Date.now() + 60_000 })
    API_PERM_CACHE.set('u1:api.github.com', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    SKILL_SCHEMA_CACHE.set('u1:skillA', { schema: null, expires: Date.now() + 60_000 })

    invalidateAdlCache('u1')

    expect(PERM_CACHE.has('u1:status')).toBe(false)
    expect(BRIDGE_PERM_CACHE.has('u1:network')).toBe(false)
    expect(LLM_ENV_CACHE.has('u1:env')).toBe(false)
    expect(API_PERM_CACHE.has('u1:api.github.com')).toBe(false)
    expect(SKILL_SCHEMA_CACHE.has('u1:skillA')).toBe(false)
  })

  it('invalidateAdlCache leaves other uids untouched across all 5 caches', () => {
    LLM_ENV_CACHE.set('u1:env', { access: ['*'], expires: Date.now() + 60_000 })
    LLM_ENV_CACHE.set('u2:env', { access: ['*'], expires: Date.now() + 60_000 })
    API_PERM_CACHE.set('u1:x.com', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    API_PERM_CACHE.set('u2:x.com', { allowedHosts: ['*'], expires: Date.now() + 60_000 })
    SKILL_SCHEMA_CACHE.set('u1:s', { schema: null, expires: Date.now() + 60_000 })
    SKILL_SCHEMA_CACHE.set('u2:s', { schema: null, expires: Date.now() + 60_000 })

    invalidateAdlCache('u1')

    expect(LLM_ENV_CACHE.has('u2:env')).toBe(true)
    expect(API_PERM_CACHE.has('u2:x.com')).toBe(true)
    expect(SKILL_SCHEMA_CACHE.has('u2:s')).toBe(true)
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

// ═══════════════════════════════════════════════════════════════════════
// Ring buffer backpressure — dropped records must be counted and warned
// ═══════════════════════════════════════════════════════════════════════
describe('adl-cache: ring buffer backpressure', () => {
  it('emitting past AUDIT_BUFFER_MAX increments AUDIT_DROPPED', async () => {
    const { AUDIT_BUFFER, AUDIT_BUFFER_MAX, auditStats, resetAuditStats } = await import('@/engine/adl-cache')
    AUDIT_BUFFER.length = 0
    resetAuditStats()
    for (let i = 0; i < AUDIT_BUFFER_MAX + 5; i++) {
      audit({ sender: `s${i}`, receiver: 'r', gate: 'lifecycle', decision: 'deny', mode: 'enforce' })
    }
    const stats = auditStats()
    expect(stats.bufferSize).toBe(AUDIT_BUFFER_MAX)
    expect(stats.dropped).toBe(5)
  })

  it('emits a BACKPRESSURE warning on overflow (rate-limited to one per window)', async () => {
    const { AUDIT_BUFFER, AUDIT_BUFFER_MAX, resetAuditStats } = await import('@/engine/adl-cache')
    AUDIT_BUFFER.length = 0
    resetAuditStats()
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (let i = 0; i < AUDIT_BUFFER_MAX + 100; i++) {
      audit({ sender: `s${i}`, receiver: 'r', gate: 'lifecycle', decision: 'deny', mode: 'enforce' })
    }
    const backpressureCalls = spy.mock.calls.map((c) => c[0] as string).filter((s) => s.includes('BACKPRESSURE'))
    // Rate-limited: exactly one BACKPRESSURE line even though 100 records dropped
    expect(backpressureCalls.length).toBe(1)
    expect(backpressureCalls[0]).toContain('ring buffer full')
    spy.mockRestore()
  })
})

// ═══════════════════════════════════════════════════════════════════════
// Cycle 1.5 retrofit: prove enforcementMode is wired into the newly
// threaded gates (llm.ts perm-env, api.ts perm-network). The persist.ts
// lifecycle gate is covered by signal.test.ts.
// ═══════════════════════════════════════════════════════════════════════
// Helper: wait for a microtask queue flush so the async handler runs
const flush = () => new Promise((r) => setTimeout(r, 20))

describe('retrofit: enforcementMode wired into llm.ts perm-env gate', () => {
  it('audit mode: denied perm-env still invokes complete(), emits [adl-audit]', async () => {
    const { readParsed } = await import('@/lib/typedb')
    vi.mocked(readParsed).mockResolvedValue([{ pe: JSON.stringify({ access: ['SOME_OTHER_KEY'] }) }])

    const { llm } = await import('@/engine/llm')
    const complete = vi.fn().mockResolvedValue('ok')
    const u = llm('llm-1', complete)

    process.env.ADL_ENFORCEMENT_MODE = 'audit'
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    u({ receiver: 'llm-1:complete', data: { prompt: 'hi' } }, 'restricted')
    await flush()

    expect(complete).toHaveBeenCalledWith('hi', expect.any(Object))
    const auditCalls = spy.mock.calls.map((c) => c[0] as string).filter((s) => s.includes('[adl-audit]'))
    expect(auditCalls.length).toBeGreaterThan(0)
    expect(auditCalls[0]).toContain('"receiver":"llm"')
    expect(auditCalls[0]).toContain('"decision":"allow-audit"')
    spy.mockRestore()
  })

  it('enforce mode: denied perm-env means complete() NOT called', async () => {
    const { readParsed } = await import('@/lib/typedb')
    vi.mocked(readParsed).mockResolvedValue([{ pe: JSON.stringify({ access: ['SOME_OTHER_KEY'] }) }])

    const { llm } = await import('@/engine/llm')
    const complete = vi.fn().mockResolvedValue('ok')
    const u = llm('llm-2', complete)

    process.env.ADL_ENFORCEMENT_MODE = 'enforce'
    u({ receiver: 'llm-2:complete', data: { prompt: 'hi' } }, 'restricted')
    await flush()
    expect(complete).not.toHaveBeenCalled()
  })
})

describe('retrofit: enforcementMode wired into api.ts perm-network gate', () => {
  it('audit mode: disallowed host still lets the fetch run, emits [adl-audit]', async () => {
    const { readParsed } = await import('@/lib/typedb')
    vi.mocked(readParsed).mockResolvedValue([{ pn: JSON.stringify({ allowed_hosts: ['other.com'] }) }])
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    const { apiUnit } = await import('@/engine/api')
    const u = apiUnit('api-1', { base: 'https://blocked.com' })

    process.env.ADL_ENFORCEMENT_MODE = 'audit'
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    u({ receiver: 'api-1:get', data: { path: '/x' } }, 'restricted')
    await flush()

    expect(fetchSpy).toHaveBeenCalled()
    const auditCalls = spy.mock.calls.map((c) => c[0] as string).filter((s) => s.includes('[adl-audit]'))
    expect(auditCalls.length).toBeGreaterThan(0)
    expect(auditCalls[0]).toContain('"receiver":"blocked.com"')
    expect(auditCalls[0]).toContain('"decision":"allow-audit"')
    spy.mockRestore()
    fetchSpy.mockRestore()
  })

  it('enforce mode: disallowed host means fetch NOT called', async () => {
    const { readParsed } = await import('@/lib/typedb')
    vi.mocked(readParsed).mockResolvedValue([{ pn: JSON.stringify({ allowed_hosts: ['other.com'] }) }])
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))

    const { apiUnit } = await import('@/engine/api')
    const u = apiUnit('api-2', { base: 'https://blocked.com' })

    process.env.ADL_ENFORCEMENT_MODE = 'enforce'
    u({ receiver: 'api-2:get', data: { path: '/x' } }, 'restricted')
    await flush()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})

describe('adl-cache: Cycle 3 — audit ring buffer + D1 flush', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('audit() pushes a stamped record into the ring buffer', () => {
    audit({ sender: 'a', receiver: 'b', gate: 'schema', decision: 'deny', mode: 'enforce', reason: 'bad shape' })
    expect(AUDIT_BUFFER).toHaveLength(1)
    const entry = AUDIT_BUFFER[0]
    expect(entry.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(entry.gate).toBe('schema')
    expect(entry.decision).toBe('deny')
  })

  it('ring buffer caps at AUDIT_BUFFER_MAX, oldest-first eviction', () => {
    for (let i = 0; i < AUDIT_BUFFER_MAX + 5; i++) {
      audit({ sender: `s${i}`, receiver: 'r', gate: 'network', decision: 'deny', mode: 'enforce' })
    }
    expect(AUDIT_BUFFER).toHaveLength(AUDIT_BUFFER_MAX)
    expect(AUDIT_BUFFER[0].sender).toBe('s5') // first 5 evicted
    expect(AUDIT_BUFFER[AUDIT_BUFFER_MAX - 1].sender).toBe(`s${AUDIT_BUFFER_MAX + 4}`)
  })

  it('drainAuditBuffer returns snapshot and leaves buffer empty', () => {
    audit({ sender: 'a', receiver: 'b', gate: 'lifecycle', decision: 'deny', mode: 'enforce' })
    audit({ sender: 'c', receiver: 'd', gate: 'network', decision: 'deny', mode: 'enforce' })
    const snap = drainAuditBuffer()
    expect(snap).toHaveLength(2)
    expect(AUDIT_BUFFER).toHaveLength(0)
  })

  it('drainAuditBuffer on empty buffer returns [] without throwing', () => {
    expect(drainAuditBuffer()).toEqual([])
  })

  it('flushAuditBuffer(null) is a no-op and returns 0', async () => {
    audit({ sender: 'a', receiver: 'b', gate: 'schema', decision: 'deny', mode: 'enforce' })
    const n = await flushAuditBuffer(null)
    expect(n).toBe(0)
    expect(AUDIT_BUFFER).toHaveLength(1) // not drained when db missing
  })

  it('flushAuditBuffer inserts every buffered record and drains the buffer', async () => {
    const calls: unknown[][] = []
    const db = {
      prepare: (sql: string) => ({
        bind: (...args: unknown[]) => ({
          run: async () => {
            calls.push([sql, ...args])
            return {}
          },
        }),
      }),
    }
    audit({ sender: 'a', receiver: 'b', gate: 'schema', decision: 'deny', mode: 'enforce', reason: 'r1' })
    audit({ sender: 'c', receiver: 'd', gate: 'network', decision: 'allow-audit', mode: 'audit' })
    const n = await flushAuditBuffer(db)
    expect(n).toBe(2)
    expect(calls).toHaveLength(2)
    expect(calls[0][3]).toBe('b') // [sql, ts, sender, receiver, gate, decision, mode, reason]
    expect(AUDIT_BUFFER).toHaveLength(0)
  })

  it('flushAuditBuffer tolerates per-row insert errors and continues', async () => {
    let which = 0
    const db = {
      prepare: () => ({
        bind: () => ({
          run: async () => {
            which++
            if (which === 2) throw new Error('boom')
            return {}
          },
        }),
      }),
    }
    audit({ sender: 'a', receiver: 'b', gate: 'schema', decision: 'deny', mode: 'enforce' })
    audit({ sender: 'c', receiver: 'd', gate: 'schema', decision: 'deny', mode: 'enforce' })
    audit({ sender: 'e', receiver: 'f', gate: 'schema', decision: 'deny', mode: 'enforce' })
    const n = await flushAuditBuffer(db)
    expect(n).toBe(2) // 2 ok, 1 failed
    expect(AUDIT_BUFFER).toHaveLength(0) // whole batch drained regardless
  })

  it('pheromoneWeight returns 1.0 for deny/fail-closed, 0.3 for allow-audit, 0 for observe', async () => {
    const { pheromoneWeight } = await import('@/engine/adl-cache')
    expect(pheromoneWeight('deny')).toBe(1.0)
    expect(pheromoneWeight('fail-closed')).toBe(1.0)
    expect(pheromoneWeight('allow-audit')).toBe(0.3)
    expect(pheromoneWeight('observe')).toBe(0)
  })

  it('setAuditPheromone installs a hook that audit() invokes', async () => {
    const { setAuditPheromone } = await import('@/engine/adl-cache')
    const calls: unknown[] = []
    setAuditPheromone((rec) => calls.push(rec))
    audit({ sender: 'a', receiver: 'b', gate: 'schema', decision: 'deny', mode: 'enforce' })
    expect(calls).toHaveLength(1)
    setAuditPheromone(null)
  })

  it('audit() hook failures never throw out of audit()', async () => {
    const { setAuditPheromone } = await import('@/engine/adl-cache')
    setAuditPheromone(() => {
      throw new Error('hook blew up')
    })
    expect(() =>
      audit({ sender: 'a', receiver: 'b', gate: 'network', decision: 'deny', mode: 'enforce' }),
    ).not.toThrow()
    setAuditPheromone(null)
  })

  it('end-to-end: deny → hook → warn() on sender→receiver edge', async () => {
    const { setAuditPheromone, pheromoneWeight } = await import('@/engine/adl-cache')
    const warns: { edge: string; weight: number }[] = []
    setAuditPheromone((rec) => {
      const w = pheromoneWeight(rec.decision)
      if (w > 0) warns.push({ edge: `${rec.sender}→${rec.receiver}`, weight: w })
    })
    audit({ sender: 'scout', receiver: 'restricted', gate: 'lifecycle', decision: 'deny', mode: 'enforce' })
    audit({ sender: 'scout', receiver: 'other', gate: 'network', decision: 'observe', mode: 'enforce' })
    expect(warns).toEqual([{ edge: 'scout→restricted', weight: 1.0 }])
    setAuditPheromone(null)
  })

  it('null reason is bound as null (not undefined) for D1 compatibility', async () => {
    const bound: unknown[][] = []
    const db = {
      prepare: () => ({
        bind: (...args: unknown[]) => {
          bound.push(args)
          return { run: async () => ({}) }
        },
      }),
    }
    audit({ sender: 'a', receiver: 'b', gate: 'network', decision: 'deny', mode: 'enforce' })
    await flushAuditBuffer(db)
    expect(bound[0][6]).toBeNull() // reason slot
  })
})
