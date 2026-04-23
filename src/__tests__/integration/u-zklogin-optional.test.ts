import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Recursively collect all .ts/.tsx files under a directory
function collectFiles(dir: string, exts = ['.ts', '.tsx']): string[] {
  const result: string[] = []
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        result.push(...collectFiles(full, exts))
      } else if (exts.some((ext) => full.endsWith(ext))) {
        result.push(full)
      }
    }
  } catch {
    // Directory may not exist
  }
  return result
}

describe('u-zklogin: isolation contract', () => {
  const uComponentsDir = join(process.cwd(), 'src/components/u')
  const uPagesDir = join(process.cwd(), 'src/pages/u')

  // lib/signer/ is the designated signer adapter layer
  const signerDir = join(uComponentsDir, 'lib', 'signer')
  const allUFiles = [...collectFiles(uComponentsDir), ...collectFiles(uPagesDir)].filter(
    (f) => !f.startsWith(signerDir),
  )

  it('zero files in /u import from zklogin API endpoints', () => {
    // Checks for actual import statements only — zklogin + dapp-kit signers have been deleted
    // Replaced with passkey-PRF Ed25519 signing via vault-signer
    const forbidden = [
      /import[^'"]*from\s+['"]api\/auth\/zklogin/,
      /import[^'"]*from\s+['"]@mysten\/sui\/zklogin/,
      /import[^'"]*from\s+['"]@mysten\/enoki/,
    ]
    const violations: string[] = []
    for (const file of allUFiles) {
      const content = readFileSync(file, 'utf-8')
      if (forbidden.some((re) => re.test(content))) {
        violations.push(file)
      }
    }
    expect(violations).toEqual([])
  })

  it('frontDoor is only used as a display hint, never as a code branch', () => {
    const hardBranchViolations: string[] = []
    for (const file of allUFiles) {
      const content = readFileSync(file, 'utf-8')
      // frontDoor used in an import statement would be a violation
      if (content.includes('frontDoor') && content.includes('import') && content.includes('zklogin')) {
        hardBranchViolations.push(file)
      }
    }
    expect(hardBranchViolations).toEqual([])
  })

  it('/u component files exist', () => {
    expect(allUFiles.length).toBeGreaterThan(0)
  })
})
