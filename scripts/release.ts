#!/usr/bin/env bun
/**
 * release.ts — assemble one-ie/one from this monorepo into /releases
 *
 * Contract locked in /release.md:
 *   - Six slots: agents, one (docs), web, sdk, mcp, .claude
 *   - Four files per slot: README.md, CLAUDE.md, AGENTS.md, LICENSE
 *   - Script is a pure copy manifest — declarative, no business logic
 *
 * Steps:
 *   1. clean     — wipe releases/
 *   2. copy      — run manifest, honor exclude patterns
 *   3. overlay   — apply scripts/release-templates/ on top of copied tree
 *   4. license   — mirror root LICENSE into each slot
 *   5. pkg       — trim web/package.json to publishable subset
 *   6. report    — deterministic receipt: files, bytes, ms per step
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const OUT = join(ROOT, 'release')
const TEMPLATES = join(ROOT, 'scripts', 'release-templates')

const args = new Set(Bun.argv.slice(2))
const PUSH = args.has('--push')
const DRY_RUN = args.has('--dry-run')

type Entry = { from: string; to: string; exclude?: string[] }

/**
 * one/ is default-deny. Only files in this allowlist ship publicly.
 * Add to ship: vocabulary, patterns, reference, tutorials, completed specs.
 * Withhold: strategy, partnerships, pricing playbook, in-flight work.
 */
const ONE_PUBLIC_DOCS = new Set<string>([
  // Landing
  'README.md',
  'CLAUDE.md',
  'AGENTS.md',
  'SECURITY.md',
  // Ontology / vocabulary
  'dictionary.md',
  'one-ontology.md',
  'ontology.md',
  'primitives.md',
  'metaphors.md',
  'names.md',
  'dsl.md',
  // Patterns / rules
  'patterns.md',
  'rubrics.md',
  'flow.md',
  'flows.md',
  'flow-diagram.md',
  'events.md',
  'lifecycle.md',
  'lifecycle-one.md',
  'memory.md',
  'knowledge.md',
  'task-management.md',
  'world.md',
  'world-memory.md',
  'workflow.md',
  // Architecture (non-strategic)
  'architecture.md',
  'the-stack.md',
  'framework.md',
  'groups.md',
  'ants.md',
  'agents-how-they-work.md',
  'agents-memory.md',
  'agent-communication.md',
  // Reference
  'api.md',
  'sdk.md',
  'sdk-reference.md',
  'cli-reference.md',
  'commands-reference.md',
  'mcp-tools.md',
  'adl-integration.md',
  'adl-mcp.md',
  // Tutorials / onboarding
  'tutorial.md',
  'tutorial-agent.md',
  'tutorial-assisted.md',
  'tutorial-toolkit.md',
  'code-tutorial.md',
  'examples.md',
  'code.md',
  // Claude harness
  'claude-code-integration.md',
  'docs-first-workflow.md',
  // Standards / contributor
  'opensource.md',
  // Completed specs (status: TEMPLATE | DONE | COMPLETE | LOCKED)
  'template-todo.md', // TEMPLATE — TODO authoring template
  'governance-todo.md', // LOCKED — security model
  'testing-todo.md', // COMPLETE — deterministic sandwich
  'rich-messages-todo.md', // COMPLETE — rich message format
  'typedb-todo.md', // COMPLETE — TypeDB integration
  'chat-sanitize-todo.md', // COMPLETE — chat sanitization
  'design-system-hardening-todo.md', // COMPLETE — design tokens
  'ui-signals-todo.md', // COMPLETE — emitClick convention
  'client-ui-todo.md', // COMPLETE — client UI
  'lifecycle-todo.md', // DONE — lifecycle
  'memory-todo.md', // DONE — memory C3
  'chat-memory-todo.md', // DONE — chat memory
  'memory-c4-todo.md', // DONE — memory C4
  // Learning logs
  'learnings.md',
])

const manifest: Entry[] = [
  { from: 'LICENSE', to: 'LICENSE' },
  // README.md + CLAUDE.md come from release-templates overlay, NOT the internal monorepo copies
  // (internal CLAUDE.md is 43KB of private dev context — never ship)

  // Ship ONLY templates from agents/ — real pods (donal, debby, marketing, dave) stay local
  // agents/README.md comes from release-templates overlay (clean, templates-focused)
  { from: 'agents/templates', to: 'agents/templates', exclude: ['.DS_Store'] },
  // NOTE: one/ is filtered separately — see copyOneDocs()
  { from: 'packages/sdk', to: 'sdk', exclude: ['node_modules', 'dist', '.DS_Store'] },
  { from: 'packages/mcp', to: 'mcp', exclude: ['node_modules', 'dist', '.DS_Store'] },
  { from: '.claude', to: '.claude', exclude: ['settings.local.json', 'scheduled_tasks.lock', '.DS_Store'] },
  // web/ from templates/web — Astro + React template for chatbot + landing
  {
    from: 'templates/web',
    to: 'web',
    exclude: ['node_modules', 'dist', '.astro', '.wrangler', 'bun.lock', 'package-lock.json', '.DS_Store'],
  },
]

const SLOTS = ['agents', 'one', 'sdk', 'mcp', '.claude', 'web'] as const

type Stats = { files: number; bytes: number; ms: number }
const stats: Record<string, Stats> = {}

async function timed(label: string, fn: () => Promise<Stats | undefined>): Promise<void> {
  const t0 = performance.now()
  const s = (await fn()) ?? { files: 0, bytes: 0, ms: 0 }
  s.ms = Math.round(performance.now() - t0)
  stats[label] = s
  console.log(`  ${label.padEnd(10)} ${s.ms}ms  ${s.files ? `${s.files} files, ${fmtBytes(s.bytes)}` : ''}`)
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

async function sizeOf(path: string): Promise<Stats> {
  const files = await walk(path)
  let bytes = 0
  for (const f of files) bytes += (await stat(f)).size
  return { files: files.length, bytes, ms: 0 }
}

async function clean(): Promise<void> {
  // Preserve .git so releases/ can live as a persistent checkout of one-ie/one.
  await mkdir(OUT, { recursive: true })
  const entries = await readdir(OUT, { withFileTypes: true })
  for (const e of entries) {
    if (e.name === '.git') continue
    await rm(join(OUT, e.name), { recursive: true, force: true })
  }
}

async function copyOneDocs(): Promise<Stats> {
  const src = join(ROOT, 'one')
  const dst = join(OUT, 'one')
  await mkdir(dst, { recursive: true })

  const entries = await readdir(src, { withFileTypes: true })
  let files = 0
  let bytes = 0
  const skipped: string[] = []

  for (const e of entries) {
    if (e.isDirectory()) continue // no subdirs (archive/, lessons/ excluded)
    if (!ONE_PUBLIC_DOCS.has(e.name)) {
      skipped.push(e.name)
      continue
    }
    const srcPath = join(src, e.name)
    const dstPath = join(dst, e.name)
    await cp(srcPath, dstPath)
    files++
    bytes += (await stat(dstPath)).size
  }

  // Warn if any allowlisted files don't exist (typos in the list)
  const actualNames = new Set(entries.filter((e) => e.isFile()).map((e) => e.name))
  const missing = [...ONE_PUBLIC_DOCS].filter((name) => !actualNames.has(name))
  if (missing.length > 0) {
    console.warn(`  ⚠ ${missing.length} allowlisted one/ files not found:`)
    for (const m of missing) console.warn(`    - ${m}`)
  }
  console.log(`  one/       ${files} shipped, ${skipped.length} withheld`)
  return { files, bytes, ms: 0 }
}

async function copyManifest(): Promise<Stats> {
  let files = 0
  let bytes = 0
  for (const e of manifest) {
    const src = join(ROOT, e.from)
    const dst = join(OUT, e.to)
    await cp(src, dst, {
      recursive: true,
      filter: (path) => !e.exclude?.some((ex) => path.includes(ex)),
    })
    const s = (await stat(src)).isDirectory() ? await sizeOf(dst) : { files: 1, bytes: (await stat(dst)).size, ms: 0 }
    files += s.files
    bytes += s.bytes
  }
  return { files, bytes, ms: 0 }
}

async function overlay(): Promise<Stats> {
  const exists = await stat(TEMPLATES).catch(() => null)
  if (!exists) {
    console.warn(`  (no templates dir at ${relative(ROOT, TEMPLATES)} — skipping overlay)`)
    return { files: 0, bytes: 0, ms: 0 }
  }
  const files = await walk(TEMPLATES)
  let bytes = 0
  for (const f of files) {
    const rel = relative(TEMPLATES, f)
    const dst = join(OUT, rel)
    await mkdir(join(dst, '..'), { recursive: true })
    await cp(f, dst)
    bytes += (await stat(f)).size
  }
  return { files: files.length, bytes, ms: 0 }
}

async function mirrorLicense(): Promise<Stats> {
  const src = join(OUT, 'LICENSE')
  let files = 0
  let bytes = 0
  const s = await stat(src)
  for (const slot of SLOTS) {
    const dst = join(OUT, slot, 'LICENSE')
    await cp(src, dst)
    files++
    bytes += s.size
  }
  return { files, bytes, ms: 0 }
}

async function verify(): Promise<Stats> {
  let files = 0
  const required = ['README.md', 'CLAUDE.md', 'AGENTS.md', 'LICENSE']
  const locations = ['', ...SLOTS]
  const missing: string[] = []
  for (const loc of locations) {
    for (const f of required) {
      const path = join(OUT, loc, f)
      const s = await stat(path).catch(() => null)
      if (!s) missing.push(join(loc || '(root)', f))
      else files++
    }
  }
  if (missing.length > 0) {
    console.warn(`  ⚠ ${missing.length} files missing from 4-file convention:`)
    for (const m of missing) console.warn(`    - ${m}`)
  }
  return { files, bytes: 0, ms: 0 }
}

async function pushToGitHub(): Promise<void> {
  console.log('\n[Push] one-ie/one')

  const hasGit = existsSync(join(OUT, '.git'))
  if (!hasGit) {
    console.log('  → git init')
    spawnSync('git', ['init'], { cwd: OUT, stdio: 'inherit' })
    spawnSync('git', ['remote', 'add', 'origin', 'git@github.com:one-ie/one.git'], { cwd: OUT, stdio: 'inherit' })
  }

  spawnSync('git', ['add', '.'], { cwd: OUT, stdio: 'inherit' })

  const pkgJson = await readFile(join(ROOT, 'package.json'), 'utf-8')
  const version = JSON.parse(pkgJson).version ?? '0.0.0'
  const msg = `release: v${version}`

  const commit = spawnSync('git', ['commit', '-m', msg], { cwd: OUT, stdio: 'inherit' })
  if (commit.status !== 0) {
    console.log('  (nothing to commit)')
  }

  console.log('  → git push origin main')
  const push = spawnSync('git', ['push', '-u', 'origin', 'main'], { cwd: OUT, stdio: 'inherit' })

  if (push.status === 0) {
    console.log('\n✓ Pushed to github.com/one-ie/one')
  } else {
    console.log('\n✗ Push failed — check git credentials or remote')
  }
}

async function main() {
  console.log(`release → ${relative(ROOT, OUT)}/\n`)

  if (DRY_RUN) {
    console.log('⊘ DRY RUN — would copy:\n')
    for (const e of manifest) {
      console.log(`  ${e.from} → release/${e.to}`)
    }
    console.log(`  one/ (filtered by allowlist)`)
    return
  }

  await timed('clean', clean)
  await timed('copy', copyManifest)
  await timed('one', copyOneDocs)
  await timed('overlay', overlay)
  await timed('license', mirrorLicense)
  await timed('verify', verify)

  const total = Object.values(stats).reduce((a, b) => a + b.ms, 0)
  const bytes = Object.values(stats).reduce((a, b) => a + b.bytes, 0)
  const files = stats.copy?.files ?? 0
  console.log(`\n✓ release staged in ${total}ms — ${files} files, ${fmtBytes(bytes)}`)

  if (PUSH) {
    await pushToGitHub()
  } else {
    console.log('\n  Next: bun run release --push')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
