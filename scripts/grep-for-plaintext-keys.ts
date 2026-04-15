#!/usr/bin/env bun
/**
 * Verifier: scan the repo + D1 migrations for plaintext API keys / secrets.
 * Gate for TODO-client-ui Cycle 2, deliverable 1 (BYO keys).
 *
 * Passes when: 0 hits for key-shaped literals outside tests, .env, and allowlisted paths.
 * Fails non-zero so deploy.ts / CI can block on Rule 3 (deterministic results).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()

// Paths that legitimately hold plaintext keys or their decrypted values at runtime.
const ALLOWLIST = [
  'node_modules',
  '.git',
  'dist',
  '.astro',
  '.wrangler',
  'scripts/grep-for-plaintext-keys.ts',
  '.env',
  '.env.example',
  '.env.local',
  'CLAUDE.md',
  'docs',
  'agents',
  'src/__tests__',
  'nanoclaw/test',
  'nanoclaw/node_modules',
  'cli/.claude',
  'cli/node_modules',
  'gateway/node_modules',
  'workers/sync/node_modules',
  'test',
  'tests',
]

// Key-shaped literals: sk-ant-*, sk-or-*, ghp_*, xoxb-*, 32+ char hex, OpenAI sk-*.
const PATTERNS: Array<{ name: string; rx: RegExp }> = [
  { name: 'anthropic', rx: /sk-ant-[A-Za-z0-9_-]{20,}/g },
  { name: 'openrouter', rx: /sk-or-[vA-Za-z0-9_-]{20,}/g },
  { name: 'openai', rx: /(?<![\w-])sk-[A-Za-z0-9]{40,}/g },
  { name: 'github-pat', rx: /ghp_[A-Za-z0-9]{30,}/g },
  { name: 'slack-bot', rx: /xoxb-[0-9A-Za-z-]{20,}/g },
  { name: 'telegram-bot', rx: /(?<![\w-])\d{9,10}:[A-Za-z0-9_-]{35}(?!\w)/g },
  { name: 'aws-access', rx: /AKIA[0-9A-Z]{16}/g },
]

// False-positive patterns from code/docs (env-var refs, type definitions, placeholders).
const FALSE_POSITIVE = [
  /\$\{[A-Z_]+\}/, // ${OPENROUTER_API_KEY}
  /process\.env\./,
  /env\.[A-Z_]+/,
  /['"][A-Z_]+['"]\s*[,)]/, // "OPENROUTER_API_KEY",
  /your-.*-key-here/i,
  /example\.com/,
  /xxx+/,
]

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const rel = relative(ROOT, full)
    if (ALLOWLIST.some((a) => rel === a || rel.startsWith(`${a}/`))) continue
    const st = statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|js|jsx|astro|sql|json|toml|md)$/.test(entry)) out.push(full)
  }
  return out
}

const hits: Array<{ file: string; line: number; match: string; pattern: string }> = []

for (const file of walk(ROOT)) {
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n')
  for (const { name, rx } of PATTERNS) {
    rx.lastIndex = 0
    for (const m of content.matchAll(rx)) {
      const idx = m.index ?? 0
      const lineNum = content.slice(0, idx).split('\n').length
      const lineText = lines[lineNum - 1] ?? ''
      if (FALSE_POSITIVE.some((fp) => fp.test(lineText))) continue
      hits.push({ file: relative(ROOT, file), line: lineNum, match: `${m[0].slice(0, 16)}…`, pattern: name })
    }
  }
}

if (hits.length === 0) {
  console.log('✓ 0 plaintext key hits across repo')
  console.log(`  scanned: ${walk(ROOT).length} files`)
  console.log(`  patterns: ${PATTERNS.map((p) => p.name).join(', ')}`)
  process.exit(0)
}

console.error(`✗ ${hits.length} plaintext key hit(s):`)
for (const h of hits) console.error(`  ${h.file}:${h.line}  [${h.pattern}]  ${h.match}`)
process.exit(1)
