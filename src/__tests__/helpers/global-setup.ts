/**
 * Vitest global setup + teardown — runs once per test run.
 *
 * setup: clears .vitest/speed.ndjson so each run starts clean.
 * teardown: regenerates docs/speed-test.md from the artifacts.
 *
 * Vitest v4 expects a single globalSetup file with `setup` + `teardown`
 * exports (not a separate globalTeardown config).
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export function setup() {
  const path = resolve(process.cwd(), '.vitest/speed.ndjson')
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, '')

  // Test-only SUI_SEED so sui.ts derives keypairs in benches. Production
  // reads from .env / wrangler secret — never this placeholder.
  process.env.SUI_SEED ??= Buffer.from(new Uint8Array(32).fill(42)).toString('base64')
}

export async function teardown() {
  console.log('[teardown] regenerating docs/speed-test.md …')
  const script = resolve(process.cwd(), 'scripts/speed-report.ts')
  await new Promise<void>((done) => {
    const child = spawn('bun', ['run', script], { stdio: 'inherit' })
    child.on('exit', () => done())
    child.on('error', (err) => {
      console.error('[teardown] speed-report failed:', err.message)
      done()
    })
  })
}
