#!/usr/bin/env bun
/**
 * rename-one — enforce topic-first, lowercase, kebab-case naming in `one/`.
 *
 *   TODO-chat.md          → chat-todo.md
 *   PLAN-debby.md         → debby-plan.md
 *   DECISION-sui-p3.md    → sui-p3-decision.md
 *   TODO-template.md      → template-todo.md
 *   CHAT_ARCHITECTURE.md  → chat-architecture.md
 *   DSL.md                → dsl.md
 *   autonomous-orgs 1.md  → autonomous-orgs-1.md
 *
 * Preserves tooling conventions (CLAUDE.md, README.md, LICENSE*.md).
 * Uses `git mv` — blame history survives.
 * Idempotent: re-running is a no-op.
 *
 *   bun run scripts/rename-one.ts --dry-run   # preview, change nothing
 *   bun run scripts/rename-one.ts             # execute
 *   bun run scripts/rename-one.ts --verbose   # show unchanged files too
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, renameSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const ONE = join(ROOT, 'one')

// Names that stay UPPERCASE even after lowercase enforcement.
// Matched case-insensitively; canonicalized to the uppercase form.
const PRESERVE_UPPER = new Map<string, string>([
  ['readme.md', 'README.md'],
  ['claude.md', 'CLAUDE.md'],
  ['agents.md', 'AGENTS.md'],
  ['security.md', 'SECURITY.md'],
])
// Subdirs we walk into but whose *own directory name* we leave alone.
// Files inside still get normalized (consistency wins).
const SKIP_DIR_CONTENTS = new Set<string>([
  // add 'archive' here if historical stability trumps consistency
])

const PREFIX_TO_SUFFIX: Array<[RegExp, string]> = [
  [/^TODO[-_]/i, '-todo'],
  [/^PLAN[-_]/i, '-plan'],
  [/^DECISION[-_]/i, '-decision'],
  [/^SHIPPED[-_]/i, '-shipped'],
  [/^SPEC[-_]/i, '-spec'],
  [/^RFC[-_]/i, '-rfc'],
]

function normalize(name: string): string | null {
  if (!name.endsWith('.md')) return null

  // Preserved UPPERCASE names — canonicalize if wrong-case, else no-op.
  const preserved = PRESERVE_UPPER.get(name.toLowerCase())
  if (preserved) return preserved === name ? null : preserved

  let base = name.slice(0, -3)
  for (const [rx, sfx] of PREFIX_TO_SUFFIX) {
    if (rx.test(base)) {
      base = base.replace(rx, '') + sfx
      break
    }
  }
  base = base
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  const next = `${base}.md`
  return next === name ? null : next
}

function walk(dir: string): string[] {
  const out: string[] = []
  if (SKIP_DIR_CONTENTS.has(dir.split('/').pop() ?? '')) return out
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      out.push(...walk(p))
    } else if (entry.isFile()) {
      out.push(p)
    }
  }
  return out
}

function gitMv(from: string, to: string) {
  const rel = (p: string) => relative(ROOT, p)
  const caseOnly = from.toLowerCase() === to.toLowerCase()
  if (caseOnly) {
    // Case-insensitive filesystems (macOS default) need a two-step rename.
    const tmp = `${to}.__rename_tmp__`
    execSync(`git mv "${rel(from)}" "${rel(tmp)}"`, { cwd: ROOT, stdio: 'pipe' })
    execSync(`git mv "${rel(tmp)}" "${rel(to)}"`, { cwd: ROOT, stdio: 'pipe' })
  } else {
    execSync(`git mv "${rel(from)}" "${rel(to)}"`, { cwd: ROOT, stdio: 'pipe' })
  }
}

function plainMv(from: string, to: string) {
  const caseOnly = from.toLowerCase() === to.toLowerCase()
  if (caseOnly) {
    const tmp = `${to}.__rename_tmp__`
    renameSync(from, tmp)
    renameSync(tmp, to)
  } else {
    renameSync(from, to)
  }
}

// ─── main ──────────────────────────────────────────────────────────────────

const argv = new Set(process.argv.slice(2))
const dryRun = argv.has('--dry-run')
const verbose = argv.has('--verbose')
const noGit = argv.has('--no-git')

if (!existsSync(ONE)) {
  console.error(`✗ one/ directory not found at ${ONE}`)
  process.exit(1)
}

type Plan = { from: string; to: string; caseOnly: boolean }
const plans: Plan[] = []
const unchanged: string[] = []

for (const file of walk(ONE)) {
  const name = file.split('/').pop()!
  const newName = normalize(name)
  if (!newName) {
    unchanged.push(file)
    continue
  }
  const to = join(dirname(file), newName)
  plans.push({ from: file, to, caseOnly: file.toLowerCase() === to.toLowerCase() })
}

// ─── collision detection ──────────────────────────────────────────────────
const collisions: string[] = []
const targetMap = new Map<string, string>()
for (const { from, to } of plans) {
  const key = to.toLowerCase() // case-insensitive match for macOS
  const prev = targetMap.get(key)
  if (prev) {
    collisions.push(`  ${from}\n  ${prev}\n  → both collide on ${to}`)
  }
  targetMap.set(key, from)
}
// Static collisions: target already exists as an unchanged file
const unchangedLower = new Set(unchanged.map((f) => f.toLowerCase()))
for (const { from, to, caseOnly } of plans) {
  if (caseOnly) continue // case-only renames aren't static collisions
  if (unchangedLower.has(to.toLowerCase())) {
    collisions.push(`  ${from} → ${to} (target already present, unchanged)`)
  }
}

if (collisions.length > 0) {
  console.error(`\n✗ ${collisions.length} collision(s) — aborting:\n`)
  collisions.forEach((c) => console.error(`${c}\n`))
  process.exit(2)
}

// ─── report ───────────────────────────────────────────────────────────────
const rel = (p: string) => relative(ROOT, p)
console.log(`\n${plans.length} rename(s) planned, ${unchanged.length} already normalized.\n`)

if (plans.length === 0) {
  console.log('✓ one/ is already canonical.')
  process.exit(0)
}

for (const { from, to, caseOnly } of plans) {
  const marker = caseOnly ? '(case)' : '      '
  console.log(`  ${marker} ${rel(from)}  →  ${rel(to)}`)
}

if (verbose) {
  console.log(`\nUnchanged (${unchanged.length}):`)
  for (const f of unchanged) console.log(`  · ${rel(f)}`)
}

if (dryRun) {
  console.log(`\n--dry-run: no changes applied.`)
  process.exit(0)
}

// ─── execute ──────────────────────────────────────────────────────────────
console.log(`\nExecuting ${noGit ? 'fs rename' : 'git mv'}...\n`)
let ok = 0
const failures: Array<{ plan: Plan; err: string }> = []

for (const plan of plans) {
  try {
    if (noGit) plainMv(plan.from, plan.to)
    else gitMv(plan.from, plan.to)
    ok++
  } catch (e) {
    failures.push({ plan, err: (e as Error).message.split('\n')[0] })
  }
}

console.log(`\n✓ ${ok}/${plans.length} renamed.`)
if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} failure(s):`)
  for (const { plan, err } of failures) {
    console.error(`  ${rel(plan.from)} → ${rel(plan.to)}`)
    console.error(`    ${err}`)
  }
  process.exit(1)
}

// ─── next-steps hint ──────────────────────────────────────────────────────
console.log(`
Next steps (not in this script's scope):
  1. Update scripts that glob TODO filenames:
     - scripts/sync-todos.ts           (glob: docs/TODO-*.md → one/*-todo.md)
     - src/pages/api/tasks/sync.ts     (same)
     - src/engine/task-parse.ts        (regex: /^TODO-/ → /-todo\\.md$/)
     - src/engine/task-extract.ts      (output path: docs/TODO-{n}.md → one/{n}-todo.md)
  2. Rewrite in-file doc links:  rg 'TODO-|\\bPLAN-|\\bDECISION-' one/ -l | xargs sed -i ''
  3. Update CLAUDE.md references from docs/ to one/
  4. Re-run: bun run scripts/rename-one.ts     (idempotent — should report 0 renames)
  5. bun run verify
`)
