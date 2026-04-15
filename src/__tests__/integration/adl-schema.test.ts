/**
 * adl-schema.test.ts — ADL Cycle 2: PEP-4 schema validation gate in PersistentWorld.ask()
 *
 * Verifies that:
 * 1. No input-schema declared → ask() passes through and returns result
 * 2. Valid data against declared schema → ask() succeeds
 * 3. Invalid data (wrong type) → dissolved
 * 4. Missing required field → dissolved
 * 5. Malformed schema JSON in TypeDB → fail-open, ask() succeeds
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/typedb', () => ({
  readParsed: vi.fn(),
  writeSilent: vi.fn(),
  parseAnswers: vi.fn(() => []),
  read: vi.fn(() => []),
}))
vi.mock('@/lib/security-signals', () => ({ emitSecurityEvent: vi.fn() }))
vi.mock('@/lib/kek', () => ({ encryptForGroup: vi.fn((_: string, s: string) => s) }))
vi.mock('@/lib/ws-server', () => ({ wsManager: { broadcast: vi.fn() }, relayToGateway: vi.fn() }))
vi.mock('@/engine/bridge', () => ({
  mirrorActor: vi.fn(),
  mirrorMark: vi.fn(),
  mirrorWarn: vi.fn(),
  settleEscrow: vi.fn(),
}))
vi.mock('@/engine/context', () => ({ ingestDocs: vi.fn(), loadContext: vi.fn(() => ({})) }))

import { readParsed } from '@/lib/typedb'

async function makePersist() {
  const mod = await import('@/engine/persist')
  const w = mod.world()
  // Register a unit with a handler for the 'summarise' skill
  w.add('test-agent').on('summarise', async () => ({ result: 'done' }))
  return w
}

/** Set up readParsed mock AFTER creating the world (same pattern as adl-lifecycle.test.ts).
 *  Satisfies PEP-3 (capability), PEP-3.5 (lifecycle), and PEP-4 (input-schema). */
function mockReadParsed(schemaRows: Record<string, unknown>[]) {
  ;(readParsed as ReturnType<typeof vi.fn>).mockImplementation((q: string) => {
    // PEP-4: input-schema query (check first — also mentions 'capability')
    if (q.includes('input-schema')) return Promise.resolve(schemaRows)
    // PEP-3.5: lifecycle check — no rows → active (fail-open)
    if (q.includes('adl-status')) return Promise.resolve([])
    // PEP-3: capability check (must pass so we reach PEP-4)
    if (q.includes('capability')) return Promise.resolve([{ u: 'test-agent' }])
    // Fallback (sample-count writes etc.)
    return Promise.resolve([])
  })
}

describe('ADL Cycle 2: PEP-4 schema validation gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('no input-schema → ask() succeeds (result returned)', async () => {
    const w = await makePersist()
    // Schema query returns [] — no schema declared, fail-open
    mockReadParsed([])

    const outcome = await w.ask({ receiver: 'test-agent:summarise', data: { text: 'hello' } }, 'caller')

    // Should not be dissolved by schema gate; unit exists so result flows through
    expect(outcome).not.toEqual({ dissolved: true })
    expect(outcome).toHaveProperty('result')
  })

  it('valid data matches declared schema → ask() succeeds', async () => {
    const w = await makePersist()
    const schema = JSON.stringify({ type: 'object', required: ['text'] })
    mockReadParsed([{ is: schema }])

    const outcome = await w.ask({ receiver: 'test-agent:summarise', data: { text: 'hello' } }, 'caller')

    expect(outcome).not.toEqual({ dissolved: true })
    expect(outcome).toHaveProperty('result')
  })

  it('invalid data (wrong type) against schema → dissolved', async () => {
    const w = await makePersist()
    const schema = JSON.stringify({ type: 'object', required: ['text'] })
    mockReadParsed([{ is: schema }])

    // data is a string, schema requires object → should fail validation
    const outcome = await w.ask({ receiver: 'test-agent:summarise', data: 'wrong' }, 'caller')

    expect(outcome).toEqual({ dissolved: true })
  })

  it('missing required field → dissolved', async () => {
    const w = await makePersist()
    const schema = JSON.stringify({ type: 'object', required: ['text', 'lang'] })
    mockReadParsed([{ is: schema }])

    // data has 'text' but not 'lang'
    const outcome = await w.ask({ receiver: 'test-agent:summarise', data: { text: 'hi' } }, 'caller')

    expect(outcome).toEqual({ dissolved: true })
  })

  it('malformed schema JSON in TypeDB → fail-open, ask() succeeds', async () => {
    const w = await makePersist()
    // Return a row where the value is not valid JSON
    mockReadParsed([{ is: 'not-valid-json-{[' }])

    const outcome = await w.ask({ receiver: 'test-agent:summarise', data: { text: 'hello' } }, 'caller')

    // Malformed schema must not block — fail-open
    expect(outcome).not.toEqual({ dissolved: true })
    expect(outcome).toHaveProperty('result')
  })
})
