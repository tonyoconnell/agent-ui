#!/usr/bin/env bun

// index.ts — /merge orchestrator
// resolve → declare → G0 → classify → ratchet-before → port → land → compress → ratchet-after → gates → G1

import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const EXPLAIN = args.includes('--explain')
const sourceArg = args.filter((a) => !a.startsWith('--'))[0]

// ── resolve ──────────────────────────────────────────────────────────────────

function resolveSource(alias: string): { path: string; translateMd?: string; description?: string } | null {
  // 1. Check registry
  const regFile = path.join(os.homedir(), '.merge-loop', 'sources', `${alias}.yml`)
  if (fs.existsSync(regFile)) {
    const lines = fs.readFileSync(regFile, 'utf8').split('\n')
    const get = (k: string) =>
      lines
        .find((l) => l.startsWith(`${k}:`))
        ?.slice(k.length + 1)
        ?.trim()
        ?.replace(/^["']|["']$/g, '')
    const p = get('path')?.replace('~', os.homedir())
    return p
      ? { path: p, translateMd: get('translate')?.replace('~', os.homedir()), description: get('description') }
      : null
  }
  // 2. Direct path
  const abs = alias.startsWith('~') ? alias.replace('~', os.homedir()) : path.resolve(alias)
  if (fs.existsSync(abs)) return { path: abs }
  // 3. GitHub URL
  if (alias.startsWith('https://github.com/') || alias.startsWith('github.com/')) {
    const slug = alias
      .replace('https://github.com/', '')
      .replace('github.com/', '')
      .replace(/\.git$/, '')
    const cloneDir = path.join(os.homedir(), '.merge-loop', 'clones', slug.replace('/', '--'))
    if (!fs.existsSync(cloneDir)) {
      console.log(`Cloning ${alias}...`)
      const r = spawnSync('git', ['clone', `https://github.com/${slug}.git`, cloneDir], { stdio: 'inherit' })
      if (r.status !== 0) {
        console.error('Clone failed')
        process.exit(1)
      }
    }
    return { path: cloneDir }
  }
  return null
}

// ── list candidates ───────────────────────────────────────────────────────────

function listCandidates() {
  const sourcesDir = path.join(os.homedir(), '.merge-loop', 'sources')
  if (!fs.existsSync(sourcesDir)) {
    console.log('No sources registered. Add one to ~/.merge-loop/sources/<alias>.yml')
    return
  }
  const files = fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.yml'))
  if (files.length === 0) {
    console.log('No sources registered.')
    return
  }
  console.log('\nRegistered sources:\n')
  for (const f of files) {
    const alias = f.replace('.yml', '')
    const lines = fs.readFileSync(path.join(sourcesDir, f), 'utf8').split('\n')
    const desc =
      lines
        .find((l) => l.startsWith('description:'))
        ?.slice(12)
        .trim()
        .replace(/^["']|["']$/g, '') ?? ''
    console.log(`  ${alias.padEnd(20)} ${desc}`)
  }
  console.log('\nUsage: /merge <alias>  or  /merge <path>  or  /merge <github-url>\n')
}

// ── render gate frames ────────────────────────────────────────────────────────

function renderG0(src: { path: string; sha: string; featureCount: number }) {
  const w = 70
  const line = (s: string) => `│ ${s.padEnd(w - 2)} │`
  const sep = `├${'─'.repeat(w - 1)}┤`
  console.log(`\n┌${'─'.repeat(w - 1)}┐`)
  console.log(line(`  /merge — G0 — Scope Review`))
  console.log(sep)
  console.log(line(`  source:   ${src.path}`))
  console.log(line(`  sha:      ${src.sha}`))
  console.log(line(`  features: ${src.featureCount}`))
  console.log(line(`  mode:     ${DRY_RUN ? 'DRY RUN — no writes' : 'LIVE'}`))
  console.log(`└${'─'.repeat(w - 1)}┘\n`)
}

function renderG1(result: { landed: number; deltaLoc: number; ratchet: number; gate: string }) {
  const w = 70
  const line = (s: string) => `│ ${s.padEnd(w - 2)} │`
  const sep = `├${'─'.repeat(w - 1)}┤`
  const tick = result.gate === 'PASS' ? '✓' : '✗'
  console.log(`\n┌${'─'.repeat(w - 1)}┐`)
  console.log(line(`  /merge — G1 — Land Review`))
  console.log(sep)
  console.log(line(`  landed:    ${result.landed} features`))
  console.log(line(`  delta_loc: ${result.deltaLoc >= 0 ? '+' : ''}${result.deltaLoc}`))
  console.log(line(`  ratchet:   ${result.ratchet.toFixed(2)} ${tick} ${result.gate}`))
  console.log(`└${'─'.repeat(w - 1)}┘\n`)
}

// ── run command ───────────────────────────────────────────────────────────────

function run(cmd: string, args2: string[], opts: { fatal?: boolean } = {}) {
  if (EXPLAIN) console.log(`  → ${cmd} ${args2.join(' ')}`)
  const r = spawnSync(cmd, args2, { stdio: 'inherit', cwd: process.cwd() })
  if (opts.fatal !== false && r.status !== 0) {
    console.error(`\nFailed: ${cmd} ${args2.join(' ')} (exit ${r.status})`)
    process.exit(r.status ?? 1)
  }
  return r.status ?? 0
}

// ── main ──────────────────────────────────────────────────────────────────────

if (!sourceArg) {
  listCandidates()
  process.exit(0)
}

const SCRIPT_DIR = path.join(import.meta.dir)

// 1. Resolve
const source = resolveSource(sourceArg)
if (!source) {
  console.error(`Cannot resolve source: ${sourceArg}`)
  process.exit(1)
}
console.log(`\nResolving "${sourceArg}" → ${source.path}`)

// 2. Declare (features.md)
console.log('\nStage 1/7: DECLARE — generating features.md...')
const declareArgs = [path.join(SCRIPT_DIR, 'declare.ts'), source.path]
if (DRY_RUN) declareArgs.push('--dry-run')
run('bun', declareArgs)

// Compute sha for G0 (same formula as declare.ts)
const topLevel = fs.readdirSync(source.path).sort().join('\n')
const { createHash } = await import('node:crypto')
const sha = createHash('sha256').update(topLevel).digest('hex').slice(0, 16)

const featuresFile = path.join(os.homedir(), '.merge-loop', 'indexes', sha, 'features.md')
const featureCount = fs.existsSync(featuresFile)
  ? (fs.readFileSync(featuresFile, 'utf8').match(/\n {2}- id:/g) ?? []).length
  : 0

// G0 gate
renderG0({ path: source.path, sha, featureCount })
if (DRY_RUN) {
  console.log('DRY RUN complete. Use without --dry-run to proceed.\n')
  process.exit(0)
}

// 3. Classify
console.log('Stage 2/7: CLASSIFY — running funnel...')
const classifyExit = run('bash', [path.join(SCRIPT_DIR, 'classify.sh'), source.path], { fatal: false })
if (classifyExit === 2) {
  console.error('\nSecrets detected — halting. Fix source before merging.')
  process.exit(2)
}

// 4. Ratchet snapshot BEFORE landing (baseline must be taken before any files change)
console.log('\nStage 3/7: RATCHET — snapshot before...')
run('bash', [path.join(SCRIPT_DIR, 'ratchet.sh'), 'snapshot'])

// 5. Port agents
console.log('\nStage 4/7: PORT — normalizing agents...')
const agentDirs = ['agents', 'agent'].map((d) => path.join(source.path, d)).filter(fs.existsSync)
if (agentDirs.length > 0) {
  const outDir = path.join(process.cwd(), 'agents', path.basename(source.path))
  fs.mkdirSync(outDir, { recursive: true })
  const portArgs = [path.join(SCRIPT_DIR, 'port-agents.ts'), agentDirs[0], outDir]
  if (source.translateMd) portArgs.push('--translate', source.translateMd)
  run('bun', portArgs)
} else {
  console.log('  (no agents/ dir — skipping PORT)')
}

// 6. Land non-agent files (PORT + TRANSLATE per features.md mode_hint)
console.log('\nStage 5/7: LAND — copying and translating files...')
const landArgs = [path.join(SCRIPT_DIR, 'land.ts'), source.path]
if (source.translateMd) landArgs.push('--translate', source.translateMd)
run('bun', landArgs, { fatal: false })

// 7. Compress candidates
console.log('\nStage 6/7: COMPRESS — scanning for candidates...')
run('bash', [path.join(SCRIPT_DIR, 'compress.sh'), '--dry-run'], { fatal: false })

// 8. Ratchet after + gates
console.log('\nStage 7/7: GATES — ratchet + secrets + tsc + lighthouse...')
run('bash', [path.join(SCRIPT_DIR, 'ratchet.sh'), 'snapshot', '--after'])
run('bash', [path.join(SCRIPT_DIR, 'ratchet.sh'), 'score'])
const gatesExit = run('bash', [path.join(SCRIPT_DIR, 'gates.sh')], { fatal: false })

// Read ratchet result for G1
const ratchetFile = path.join(process.cwd(), '.merge-loop', 'ratchet', 'ratchet.json')
let ratchet = 0.5
let gate = 'SKIP'
let deltaLoc = 0
if (fs.existsSync(ratchetFile)) {
  const r = JSON.parse(fs.readFileSync(ratchetFile, 'utf8'))
  ratchet = r.ratchet ?? 0.5
  gate = r.gate ?? 'SKIP'
  deltaLoc = r.delta_loc ?? 0
}

// G1 gate
renderG1({ landed: featureCount, deltaLoc, ratchet, gate })

if (gatesExit !== 0) {
  console.error('Gates failed — not fast-forwarding. Review issues above.\n')
  process.exit(2)
}

console.log('Loop complete. Review G1 summary above and commit to finalize.\n')
