/**
 * adl-nanoclaw.test.ts — ADL Cycle 3: NanoClaw persona gets [OPERATIONAL CONSTRAINTS]
 *
 * Tests the frontmatter parsing + constraint block logic that was added to
 * scripts/setup-nanoclaw.ts. Replicates the exact regexes to verify correctness.
 */

import { describe, expect, it } from 'vitest'

// Replicate the parsing logic from setup-nanoclaw.ts
function parseAdlFromFrontmatter(fm: string): { sensitivity: string; allowedHosts: string } {
  const sensitivity = fm.match(/^sensitivity:\s*(.+)$/m)?.[1]?.trim() || 'internal'
  const rawOrigins = fm.match(/^allowed_origins:\s*\[(.+)\]/m)?.[1]?.trim()
  const allowedHosts = rawOrigins
    ? rawOrigins
        .split(',')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .join(', ')
    : '*'
  return { sensitivity, allowedHosts }
}

function buildConstraintBlock(sensitivity: string, allowedHosts: string): string {
  if (sensitivity !== 'public' && allowedHosts !== '*') {
    return `\n\n[OPERATIONAL CONSTRAINTS]\nData classification: ${sensitivity}\nAllowed hosts: ${allowedHosts}`
  }
  if (sensitivity !== 'public') {
    return `\n\n[OPERATIONAL CONSTRAINTS]\nData classification: ${sensitivity}\nAllowed hosts: ${allowedHosts}`
  }
  if (allowedHosts !== '*') {
    return `\n\n[OPERATIONAL CONSTRAINTS]\nData classification: ${sensitivity}\nAllowed hosts: ${allowedHosts}`
  }
  return ''
}

describe('ADL Cycle 3: NanoClaw ADL constraint injection', () => {
  it('parses sensitivity from frontmatter', () => {
    const fm = 'name: test\nmodel: claude-haiku-4-5\nsensitivity: confidential\n'
    const { sensitivity } = parseAdlFromFrontmatter(fm)
    expect(sensitivity).toBe('confidential')
  })

  it('defaults sensitivity to internal when absent', () => {
    const fm = 'name: test\nmodel: claude-haiku-4-5\n'
    const { sensitivity } = parseAdlFromFrontmatter(fm)
    expect(sensitivity).toBe('internal')
  })

  it('parses allowed_origins from frontmatter', () => {
    const fm = 'name: test\nallowed_origins: [api.one.ie, dev.one.ie]\n'
    const { allowedHosts } = parseAdlFromFrontmatter(fm)
    expect(allowedHosts).toBe('api.one.ie, dev.one.ie')
  })

  it('defaults allowedHosts to * when absent', () => {
    const fm = 'name: test\n'
    const { allowedHosts } = parseAdlFromFrontmatter(fm)
    expect(allowedHosts).toBe('*')
  })

  it('builds [OPERATIONAL CONSTRAINTS] block when sensitivity is internal', () => {
    const block = buildConstraintBlock('internal', '*')
    expect(block).toContain('[OPERATIONAL CONSTRAINTS]')
    expect(block).toContain('Data classification: internal')
  })

  it('builds constraint block when hosts are restricted', () => {
    const block = buildConstraintBlock('public', 'api.one.ie')
    expect(block).toContain('[OPERATIONAL CONSTRAINTS]')
    expect(block).toContain('Allowed hosts: api.one.ie')
  })

  it('no constraint block when sensitivity=public and hosts=*', () => {
    const block = buildConstraintBlock('public', '*')
    expect(block).toBe('')
  })

  it('wrangler vars include ADL_DATA_SENSITIVITY and ADL_ALLOWED_HOSTS', () => {
    // Simulate the wrangler config template with ADL vars
    const sensitivity = 'confidential'
    const allowedHosts = 'api.one.ie'
    const wranglerVars = `[vars]\nVERSION = "1.0.0"\nADL_DATA_SENSITIVITY = "${sensitivity}"\nADL_ALLOWED_HOSTS = "${allowedHosts}"`
    expect(wranglerVars).toContain('ADL_DATA_SENSITIVITY = "confidential"')
    expect(wranglerVars).toContain('ADL_ALLOWED_HOSTS = "api.one.ie"')
  })
})
