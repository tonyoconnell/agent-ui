/**
 * Path round-trip integration test.
 *
 * Tests the mark()/warn() persistence path — the most critical write path
 * in the substrate. Inserts two units and a path between them, reads back
 * the strength value to confirm the TypeDB write→read round-trip works.
 *
 * Original intent was "signal-flow" but signal is a relation (not entity)
 * with relates sender/receiver roles — path is the right write-round-trip
 * test since it's what mark()/warn() actually write to TypeDB.
 *
 * Cassette schema: world.tql (post-KEK-fix, 2026-04-21)
 *
 * Record:
 *   RECORD=1 bun vitest run src/__tests__/integration/signal-flow.test.ts
 *
 * Replay (CI):
 *   bun vitest run src/__tests__/integration/signal-flow.test.ts
 */

import { afterAll, describe, expect, it } from 'vitest'
import { useCassette } from '@/__tests__/helpers/cassette'
import { escapeTqlString, readParsed, writeSilent } from '@/lib/typedb'

describe('path round-trip', () => {
  const suffix = Date.now()
  const uidA = `vcr-src-${suffix}`
  const uidB = `vcr-tgt-${suffix}`

  // cleanup runs while cassette is still active (LIFO: this afterAll fires
  // before cassette's afterAll, so the delete calls are also recorded/replayed)
  afterAll(async () => {
    const safeA = escapeTqlString(uidA)
    const safeB = escapeTqlString(uidB)
    await writeSilent(`match $u isa unit, has uid "${safeA}"; delete $u isa unit;`)
    await writeSilent(`match $u isa unit, has uid "${safeB}"; delete $u isa unit;`)
  })

  useCassette('path-roundtrip')

  it('writes two units and a path, reads back the strength', async () => {
    const safeA = escapeTqlString(uidA)
    const safeB = escapeTqlString(uidB)

    // Insert source unit
    await writeSilent(`
      insert $u isa unit, has uid "${safeA}", has name "VCR Source";
    `)

    // Insert target unit
    await writeSilent(`
      insert $u isa unit, has uid "${safeB}", has name "VCR Target";
    `)

    // Insert path between them with strength 5.0
    await writeSilent(`
      match $a isa unit, has uid "${safeA}";
            $b isa unit, has uid "${safeB}";
      insert (source: $a, target: $b) isa path,
        has strength 5.0,
        has resistance 0.0,
        has scope "public";
    `)

    // Read back path strength
    const rows = await readParsed(`
      match $a isa unit, has uid "${safeA}";
            $b isa unit, has uid "${safeB}";
            (source: $a, target: $b) isa path, has strength $s;
      select $s;
    `)

    expect(rows.length).toBeGreaterThan(0)
    expect(Number(rows[0].s)).toBeCloseTo(5.0)
  })

  it('returns empty when querying a non-existent path', async () => {
    const rows = await readParsed(`
      match $a isa unit, has uid "vcr-nonexistent-a-xyz";
            $b isa unit, has uid "vcr-nonexistent-b-xyz";
            (source: $a, target: $b) isa path;
      select $a;
    `)
    expect(rows).toHaveLength(0)
  })
})
