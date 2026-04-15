/**
 * Engine boundary enforcement
 *
 * Ensures no file outside src/engine/ imports directly from '@/engine/world'.
 * External code must use the persist() layer or the '@/engine' barrel.
 */
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('engine import boundary', () => {
  it('no file outside src/engine/ imports from @/engine/world', () => {
    const result = execSync(
      "grep -rn \"from '@/engine/world'\" src/ --include='*.ts' --include='*.tsx' --include='*.astro' || true",
      { cwd: '/Users/toc/Server/envelopes', encoding: 'utf-8' },
    )
    const violations = result
      .split('\n')
      .filter((line) => line.trim())
      .filter((line) => !line.startsWith('src/engine/'))
    expect(violations).toHaveLength(0)
  })
})
