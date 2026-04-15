/**
 * Naming guard — dead names from docs/naming.md must not appear in src/.
 *
 * The 6 dimensions are LOCKED (2026-04-13). Dead names that resurface in code
 * are how the ontology erodes. This test catches them before the PR lands.
 *
 * Exceptions:
 *  - strings inside comments/docs are allowed if tagged `// naming:allow reason`
 *  - skin/metaphor files may use metaphor-aliased terms (they opt-in via path)
 */
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { measure } from '@/__tests__/helpers/speed'
import { fastGlob } from './_glob'

// From CLAUDE.md: "Dead names (never use): knowledge, connections, people,
// node, scent, alarm, trail, colony (as dimension)"
// We check symbol-ish contexts only: identifiers, not prose.
const DEAD_NAMES = [
  'scent', // → strength
  'alarm', // → resistance
]

// Metaphor skins may legitimately reference these terms — they're the
// whole point of those files.
const METAPHOR_PATHS = [/src\/skins\//, /\.test\.ts$/, /CLAUDE\.md$/]

// Baseline ratchet: current known offenders as of 2026-04-15. The gate
// fails when the count grows — not when it's non-zero. Shrink this number
// as dead-name usage gets cleaned up. Never raise it.
const BASELINE_OFFENDERS = 12

describe('naming — dead names', () => {
  test('dead-name count does not exceed baseline', async () => {
    const files = fastGlob('src', ['.ts', '.tsx'])
    const offenders: Array<{ file: string; term: string; line: number }> = []

    const ms = await measure('naming:scan-src', () => {
      for (const file of files) {
        if (METAPHOR_PATHS.some((re) => re.test(file))) continue
        const text = readFileSync(file, 'utf8')
        const lines = text.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (/naming:allow/.test(line)) continue
          for (const term of DEAD_NAMES) {
            const re = new RegExp(`\\b${term}\\b`, 'i')
            if (re.test(line)) offenders.push({ file, term, line: i + 1 })
          }
        }
      }
    })

    if (offenders.length > BASELINE_OFFENDERS) {
      const report = offenders
        .slice(0, 20)
        .map((o) => `  ${o.file}:${o.line} — "${o.term}"`)
        .join('\n')
      throw new Error(
        `Dead names grew: ${offenders.length} (baseline ${BASELINE_OFFENDERS}).\n${report}\n` +
          'Remove new offenders or tag the line with // naming:allow <reason>.',
      )
    }
    expect(ms).toBeLessThan(1500)
  })

  test('baseline stays honest — flag when offenders shrink (ratchet down)', async () => {
    // When this test fails, you've cleaned code — lower BASELINE_OFFENDERS
    // in this file to the new actual count. That's the ratchet.
    const files = fastGlob('src', ['.ts', '.tsx'])
    let actual = 0
    for (const file of files) {
      if (METAPHOR_PATHS.some((re) => re.test(file))) continue
      const text = readFileSync(file, 'utf8')
      for (const line of text.split('\n')) {
        if (/naming:allow/.test(line)) continue
        for (const term of DEAD_NAMES) {
          if (new RegExp(`\\b${term}\\b`, 'i').test(line)) actual++
        }
      }
    }
    expect(actual, `Offenders dropped to ${actual}; lower BASELINE_OFFENDERS in naming.test.ts`).toBe(
      BASELINE_OFFENDERS,
    )
  })
})
