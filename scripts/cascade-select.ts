#!/usr/bin/env bun
/**
 * cascade-select — top tasks ranked by unlock cascade + priority + effort.
 *
 * Scoring formula:
 *   cascade_score   = direct_unlocks + 0.5 * transitive_unlocks
 *   effective_score = priority + cascade_score * 10 - effort_penalty
 *
 * Effort penalty map: low=0  medium=1  high=3  critical=0 (treat as high-value)
 *
 * Connects directly to TypeDB Cloud (bypasses 8s gateway timeout).
 *
 * Usage:  bun run scripts/cascade-select.ts [limit=10]
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env: Record<string, string> = {}
for (const line of fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '')
}
const { TYPEDB_URL, TYPEDB_DATABASE = 'one', TYPEDB_USERNAME = 'admin', TYPEDB_PASSWORD } = env
if (!TYPEDB_URL || !TYPEDB_PASSWORD) {
  console.error('missing TYPEDB_URL / TYPEDB_PASSWORD in .env')
  process.exit(1)
}

const signin = await fetch(`${TYPEDB_URL}/v1/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
})
if (!signin.ok) {
  console.error('signin failed:', signin.status)
  process.exit(1)
}
const { token } = (await signin.json()) as { token: string }

async function query(tql: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ databaseName: TYPEDB_DATABASE, transactionType: 'read', query: tql, commit: false }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  const { answers = [] } = (await res.json()) as { answers?: unknown[] }
  return (answers as Array<{ data?: Record<string, { value?: unknown }> }>).map((a) => {
    const r: Record<string, unknown> = {}
    if (a?.data) for (const [k, c] of Object.entries(a.data)) if (c?.value !== undefined) r[k] = c.value
    return r
  })
}

// ── fetch ──────────────────────────────────────────────────────────────────
const t0 = Date.now()
const [openRows, doneRows, blocksRows, tagRows] = await Promise.all([
  query(`match $t isa task, has task-id $id, has name $n, has done false,
           has priority-score $p, has task-phase $ph, has task-wave $w,
           has task-effort $e, has source-file $src;
         select $id, $n, $p, $ph, $w, $e, $src;`),
  query(`match $t isa task, has task-id $id, has done $d; select $id, $d;`),
  query(`match (blocker: $a, blocked: $b) isa blocks; $a has task-id $aid; $b has task-id $bid; select $aid, $bid;`),
  query(`match $t isa task, has task-id $id, has tag $tag; select $id, $tag;`),
])
console.log(
  `fetched in ${Date.now() - t0}ms: open=${openRows.length} done-rows=${doneRows.length} blocks=${blocksRows.length} tags=${tagRows.length}`,
)

// ── index ──────────────────────────────────────────────────────────────────
const doneMap = new Map<string, boolean>()
for (const r of doneRows) doneMap.set(r.id as string, r.d as boolean)

// blockersOf[B] = set of tasks that must complete before B is unblocked
// blocksWhat[A] = set of tasks that A directly unblocks when completed
const blockersOf = new Map<string, Set<string>>()
const blocksWhat = new Map<string, Set<string>>()
for (const r of blocksRows) {
  const a = r.aid as string,
    b = r.bid as string
  if (!blockersOf.has(b)) blockersOf.set(b, new Set())
  blockersOf.get(b)!.add(a)
  if (!blocksWhat.has(a)) blocksWhat.set(a, new Set())
  blocksWhat.get(a)!.add(b)
}

const tagMap = new Map<string, string[]>()
for (const r of tagRows) {
  const id = r.id as string
  if (!tagMap.has(id)) tagMap.set(id, [])
  tagMap.get(id)!.push(r.tag as string)
}

// ── readiness filter ───────────────────────────────────────────────────────
const ready = openRows.filter((t) => {
  const bs = blockersOf.get(t.id as string)
  if (!bs || bs.size === 0) return true
  for (const b of bs) if (doneMap.get(b) === false) return false
  return true
})
console.log(`ready (no open blockers): ${ready.length}   stalled: ${openRows.length - ready.length}\n`)

// ── cascade computation ────────────────────────────────────────────────────
// transitiveCascade: count all tasks reachable through the blocks graph
// (tasks that become progressively unblocked after this one completes).
// We use BFS; we don't re-enter already-visited nodes so diamond deps count once.
function transitiveUnlocks(startId: string): { direct: number; transitive: number } {
  const direct = blocksWhat.get(startId) ?? new Set<string>()
  const visited = new Set<string>([startId])
  const queue = [...direct]
  let transitive = 0
  while (queue.length > 0) {
    const cur = queue.shift()!
    if (visited.has(cur)) continue
    visited.add(cur)
    transitive++
    const next = blocksWhat.get(cur)
    if (next) for (const n of next) if (!visited.has(n)) queue.push(n)
  }
  // direct is included in transitive; separate them
  return { direct: direct.size, transitive: transitive - direct.size }
}

// Effort penalty: higher effort = slight cost (we favour low-effort high-cascade tasks)
const EFFORT_PENALTY: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 3,
  critical: 0, // critical effort tasks are always high-value; no penalty
}

const scored = ready.map((t) => {
  const { direct, transitive } = transitiveUnlocks(t.id as string)
  const cascadeScore = direct + 0.5 * transitive
  const effortKey = ((t.e as string) || 'medium').toLowerCase()
  const effortPenalty = EFFORT_PENALTY[effortKey] ?? 1
  const effectiveScore = (t.p as number) + cascadeScore * 10 - effortPenalty
  return { ...t, direct, transitive, cascadeScore, effectiveScore }
})

const ranked = scored.sort((a, b) => b.effectiveScore - a.effectiveScore)

// ── output ─────────────────────────────────────────────────────────────────
const limit = Number(process.argv[2]) || 10
console.log(`top ${limit} tasks by effective score  (pri + cascade×10 - effort_penalty)\n`)
console.log(`  #  score  pri  dirU  transU  cascade  effort   phase wav  tags                  name`)
console.log('─'.repeat(140))

for (let i = 0; i < Math.min(limit, ranked.length); i++) {
  const t = ranked[i]
  const tags = (tagMap.get(t.id as string) || []).slice(0, 3).join(',').padEnd(21).slice(0, 21)
  const name = (t.n as string).slice(0, 52)
  const score = t.effectiveScore.toFixed(1).padStart(6)
  const pri = String(t.p).padStart(4)
  const dirU = String(t.direct).padStart(4)
  const transU = String(t.transitive).padStart(6)
  const cascade = t.cascadeScore.toFixed(1).padStart(7)
  const effort = ((t.e as string) || '?').padEnd(7)
  const phase = (t.ph as string).padEnd(5)
  const wave = (t.w as string).padEnd(3)
  console.log(
    `${String(i + 1).padStart(3)}  ${score}  ${pri}  ${dirU}  ${transU}  ${cascade}  ${effort}  ${phase} ${wave}  ${tags} ${name}`,
  )
}

// ── cascade champions ──────────────────────────────────────────────────────
console.log('\ntop 5 cascade champions (most total unlocks, any readiness):')
const allScored = openRows.map((t) => {
  const { direct, transitive } = transitiveUnlocks(t.id as string)
  return { ...t, direct, transitive, total: direct + transitive }
})
const champions = allScored.sort((a, b) => b.total - a.total).slice(0, 5)
console.log(`  total  dirU  transU  pri   name`)
for (const t of champions) {
  const name = (t.n as string).slice(0, 65)
  const ready =
    !blockersOf.get(t.id as string)?.size ||
    [...(blockersOf.get(t.id as string) ?? [])].every((b) => doneMap.get(b) !== false)
  const rMark = ready ? '✓' : '·'
  console.log(
    `  ${rMark} ${String(t.total).padStart(4)}  ${String(t.direct).padStart(4)}  ${String(t.transitive).padStart(6)}  ${String(t.p).padStart(3)}   ${name}`,
  )
}

// ── effort distribution ────────────────────────────────────────────────────
const effortDist = new Map<string, number>()
for (const t of ready) {
  const k = (t.e as string) || 'unknown'
  effortDist.set(k, (effortDist.get(k) || 0) + 1)
}
console.log(
  `\nready by effort: ${[...effortDist]
    .sort((a, b) => b[1] - a[1])
    .map(([e, n]) => `${e}(${n})`)
    .join('  ')}`,
)
