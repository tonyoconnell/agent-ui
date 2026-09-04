#!/usr/bin/env bun
/**
 * translate-init.ts — scaffold a translate.md boundary contract from a source directory.
 * Deterministic, no LLM calls. Human edits output to add substitutions.
 *
 * Usage:
 *   bun run scripts/merge-loop/translate-init.ts <source-dir> [--out <path>] [--dry-run]
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// ── Canonical substitutions (pre-filled, not TODO) ─────────────────────────
const CANONICAL: Record<string, string> = {
  '@mui/material': '@/components/ui',
  '@mui/icons-material': 'lucide-react',
  antd: '@/components/ui',
  'next/router': 'astro:',
  'next/navigation': 'astro:',
  'react-router-dom': 'astro:',
  axios: 'fetch',
  prisma: '@/lib/typedb',
  '@prisma/client': '@/lib/typedb',
  supabase: '@/lib/typedb',
  '@supabase/supabase-js': '@/lib/typedb',
  zustand: 'useState / useReducer',
  '@tanstack/react-query': 'use()',
  'next-auth': '@/lib/auth',
  'auth.js': '@/lib/auth',
}

const UI_PKG = ['@mui/', 'antd', '@chakra-ui/', '@mantine/', 'bootstrap']
const HOST_PKG = [
  'axios',
  'fetch',
  'node-fetch',
  '@supabase/',
  'supabase',
  'firebase',
  'prisma',
  '@prisma/',
  'mongoose',
  'drizzle-orm',
  'next/router',
  'next/navigation',
  'react-router',
  'nuxt',
  'vue-router',
]
const STATE_PKG = ['redux', 'zustand', 'jotai', 'recoil', 'mobx', '@tanstack/query', '@tanstack/react-query']
const AUTH_PKG = ['next-auth', 'auth.js', 'firebase/auth', '@clerk/']

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '.nuxt', 'build'])
const SRC_EXTS = new Set(['.ts', '.tsx', '.jsx', '.js', '.astro', '.vue'])

// ── Helpers ─────────────────────────────────────────────────────────────────

function matchesPkg(pkg: string, patterns: string[]): boolean {
  return patterns.some((p) => pkg === p || pkg.startsWith(p))
}

function categorise(pkg: string): 'ui_primitives' | 'host_primitives' | 'state' | 'auth' | 'other' {
  if (matchesPkg(pkg, UI_PKG)) return 'ui_primitives'
  if (matchesPkg(pkg, HOST_PKG)) return 'host_primitives'
  if (matchesPkg(pkg, STATE_PKG)) return 'state'
  if (matchesPkg(pkg, AUTH_PKG)) return 'auth'
  return 'other'
}

function walkFiles(dir: string, depth = 0): string[] {
  if (depth > 3) return []
  const results: string[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return results
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) results.push(...walkFiles(full, depth + 1))
    else if (e.isFile() && SRC_EXTS.has(path.extname(e.name))) results.push(full)
  }
  return results
}

function extractImports(src: string): string[] {
  const pkgs: string[] = []
  // static import: from '...'
  for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) pkgs.push(m[1])
  // require('...')
  for (const m of src.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) pkgs.push(m[1])
  // strip relative paths and node: builtins
  return pkgs.filter((p) => !p.startsWith('.') && !p.startsWith('node:') && !p.startsWith('/'))
}

function normalisePkg(specifier: string): string {
  // Turn e.g. "@mui/material/Button" → "@mui/material"
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/')
    return parts.slice(0, 2).join('/')
  }
  return specifier.split('/')[0]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
if (!args.length || args[0].startsWith('--')) {
  console.error('Usage: translate-init.ts <source-dir> [--out <path>] [--dry-run]')
  process.exit(1)
}

const sourceDir = path.resolve(args[0])
if (!fs.existsSync(sourceDir)) {
  console.error(`Error: source directory not found: ${sourceDir}`)
  process.exit(1)
}

let outPath: string | null = null
let dryRun = false
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--dry-run') dryRun = true
  if (args[i] === '--out' && args[i + 1]) {
    outPath = path.resolve(args[++i])
  }
}

const files = walkFiles(sourceDir)

const byCategory: Record<string, Set<string>> = {
  ui_primitives: new Set(),
  host_primitives: new Set(),
  state: new Set(),
  auth: new Set(),
  other: new Set(),
}

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  for (const raw of extractImports(src)) {
    const pkg = normalisePkg(raw)
    byCategory[categorise(pkg)].add(pkg)
  }
}

const uiCount = byCategory.ui_primitives.size
const hostCount = byCategory.host_primitives.size
const total = files.length

console.error(`scanned ${total} files, found ${uiCount} ui_primitives, ${hostCount} host_primitives`)

if (dryRun) process.exit(0)

function renderList(pkgs: Set<string>, label: string): string {
  if (!pkgs.size) return `# No ${label} detected\n`
  return [...pkgs]
    .sort()
    .map((p) => {
      const sub = CANONICAL[p] ?? 'TODO'
      return `${p} → ${sub}`
    })
    .join('\n')
}

const output = `---
source: ${path.basename(sourceDir)}
trunk: one.ie
last_validated: ${today()}
schema_version: 1
status: draft
---

## vocabulary
# Add renames here: external-term → canonical-term
# (leave empty if source already uses canonical names)

## schema
# Dimension mapping: source-concept → one.ie 6-dimension
# actors (dim 2):
# things (dim 3):
# groups (dim 1):
# paths (dim 4):
# events (dim 5):
# learning (dim 6):

## host_primitives
# Detected host primitives requiring substitution:
${renderList(byCategory.host_primitives, 'host_primitives')}

## ui_primitives
# Detected UI primitives requiring substitution:
${renderList(byCategory.ui_primitives, 'ui_primitives')}

## target_map
# Where source paths land in one.ie/src/ — first match wins.
# Format: source-prefix → target-prefix (relative to one.ie/src/)
# Defaults apply when this section is absent (see land.ts DEFAULT_TARGET_MAP).
# Add overrides here if the source uses non-standard directory layout:
# src/components/ → components/imported/
# src/lib/ → lib/imported/
# src/utils/ → lib/imported/

## behavior_preserves
# List acceptance criteria here (what must still work after translation):
# -
`

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, output, 'utf8')
  console.error(`wrote ${outPath}`)
} else {
  process.stdout.write(output)
}
