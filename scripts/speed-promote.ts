#!/usr/bin/env bun
/**
 * speed-promote — copy fresh `.vitest/speed-report.md` into tracked `one/speed-test.md`.
 *
 * Call manually after inspecting the fresh report — typically when verdicts
 * improved or numbers shifted meaningfully enough to be worth committing.
 * The tracked file stays stable between runs; `vitest run` no longer dirties
 * the working tree.
 */
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dir, '..')
const FRESH = resolve(ROOT, '.vitest/speed-report.md')
const BASELINE = resolve(ROOT, 'one/speed-test.md')

if (!existsSync(FRESH)) {
  console.error('✗ No fresh report at .vitest/speed-report.md — run `bun run test` first.')
  process.exit(1)
}

copyFileSync(FRESH, BASELINE)
console.log(`✓ Promoted .vitest/speed-report.md → ${BASELINE}`)
console.log('  Review the diff, then `git add one/speed-test.md && git commit`.')
