#!/usr/bin/env tsx
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

const SKIP_DIRS = ['src/styles', 'src/components/ui', 'src/__tests__']
const SKIP_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']
const SKIP_EXTS = new Set(['.css', '.json', '.md', '.svg'])
const ALLOWED_EXTS = new Set(['.tsx', '.astro', '.ts'])

function walk(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(ROOT, full)
    if (SKIP_DIRS.some((skip) => rel.startsWith(skip))) continue
    const stat = statSync(full)
    if (stat.isDirectory()) {
      results.push(...walk(full))
    } else if (
      ALLOWED_EXTS.has(extname(entry)) &&
      !SKIP_EXTS.has(extname(entry)) &&
      !SKIP_SUFFIXES.some((s) => entry.endsWith(s))
    ) {
      results.push(full)
    }
  }
  return results
}

const FORBIDDEN = [
  {
    name: 'hex literal',
    re: /#[0-9a-fA-F]{3,8}\b/,
  },
  {
    name: 'rgb/rgba/hsl literal',
    // Matches rgb(, rgba(, hsl(, hsla( — but we then filter out hsl(var(-- in isAllowed
    re: /\b(rgb|rgba|hsla?)\(/,
  },
  {
    name: 'tailwind raw palette',
    re: /\b(?:bg|text|border|ring|fill|stroke)-(red|blue|green|yellow|orange|purple|pink|gray|slate|zinc|neutral|stone|amber|lime|emerald|teal|cyan|indigo|violet|rose|fuchsia|sky)-\d/,
  },
]

// Semantic whites/blacks that are allowed
const _ALLOWED_SEMANTIC = /\b(bg-white|text-white|bg-black|text-black)\b/

function isAllowed(line: string): boolean {
  // hsl/rgb/rgba(var(-- or hsl(var( are correct token usage
  if (/hsl\(var\(/.test(line)) return true
  if (/rgba?\(var\(--/.test(line)) return true
  // data URI — skip
  if (/data:image/.test(line)) return true
  // theme-ok suppression comment
  if (/theme-ok/.test(line)) return true
  // meta/link tag attribute values — browser chrome theming needs real hex
  if (/<meta|<link/.test(line)) return true
  // Pure comment lines (no style attribute)
  const trimmed = line.trimStart()
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true
  return false
}

function lineHasForbiddenPattern(line: string): { matched: boolean; name: string } {
  for (const { name, re } of FORBIDDEN) {
    if (!re.test(line)) continue

    // Special-case: tailwind palette — allow bg-white, text-white, bg-black, text-black
    if (name === 'tailwind raw palette') {
      return { matched: true, name }
    }

    // For hsl/rgb: if it's hsl(var(-- that's fine, already caught in isAllowed
    return { matched: true, name }
  }
  return { matched: false, name: '' }
}

interface Violation {
  file: string
  line: number
  text: string
  rule: string
}

const auditMode = process.argv.includes('--fix-list')

const files = walk(SRC)
const violations: Violation[] = []

for (const file of files) {
  let content: string
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isAllowed(line)) continue

    const { matched, name } = lineHasForbiddenPattern(line)
    if (matched) {
      violations.push({
        file: relative(ROOT, file),
        line: i + 1,
        text: line.trim(),
        rule: name,
      })
    }
  }
}

const MAX_PRINT = 20

if (violations.length === 0) {
  console.log('✓ 0 raw color violations')
  process.exit(0)
} else {
  console.log(`✗ ${violations.length} raw color violation${violations.length === 1 ? '' : 's'} found:\n`)
  for (const v of violations.slice(0, MAX_PRINT)) {
    console.log(`  ${v.file}:${v.line} [${v.rule}]: ${v.text}`)
  }
  if (violations.length > MAX_PRINT) {
    console.log(`  ... and ${violations.length - MAX_PRINT} more`)
  }

  if (auditMode) {
    process.exit(0)
  }
  process.exit(1)
}
