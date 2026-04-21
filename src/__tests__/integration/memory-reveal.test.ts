/**
 * Memory reveal integration test.
 *
 * Tests that a unit can be written to TypeDB and read back —
 * verifying the persist layer stores and surfaces actor data correctly.
 *
 * Cassette schema: world.tql (post-KEK-fix, 2026-04-21)
 *
 * Record:
 *   RECORD=1 bun vitest run src/__tests__/integration/memory-reveal.test.ts
 *
 * Replay (CI):
 *   bun vitest run src/__tests__/integration/memory-reveal.test.ts
 */

import { describe, it, expect, afterAll } from 'vitest'
import { useCassette } from '@/__tests__/helpers/cassette'
import { readParsed, writeSilent, escapeTqlString } from '@/lib/typedb'

describe('memory reveal', () => {
  const uid = `vcr-actor-${Date.now()}`
  const name = 'VCR Test Actor'

  // cleanup fires before cassette closes (LIFO afterAll order)
  afterAll(async () => {
    const safeUid = escapeTqlString(uid)
    await writeSilent(`match $u isa unit, has uid "${safeUid}"; delete $u isa unit;`)
  })

  useCassette('memory-reveal-agent')

  it('creates an actor and retrieves it by uid', async () => {
    const safeUid = escapeTqlString(uid)
    const safeName = escapeTqlString(name)

    await writeSilent(`
      insert $u isa unit,
        has uid "${safeUid}",
        has name "${safeName}",
        has tag "vcr-test";
    `)

    const rows = await readParsed(`
      match $u isa unit, has uid "${safeUid}", has name $n;
      select $n;
    `)

    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0].n).toBe(name)
  })

  it('returns empty for an unknown uid', async () => {
    const rows = await readParsed(`
      match $u isa unit, has uid "vcr-nonexistent-actor-xyz-${Date.now()}";
      select $u;
    `)
    expect(rows).toHaveLength(0)
  })
})
