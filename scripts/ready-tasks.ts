#!/usr/bin/env bun
/**
 * Show ready tasks: open AND no open blockers, ranked by priority + unlock count.
 *
 * Connects directly to TypeDB Cloud (bypasses 8s gateway timeout) so it can
 * fetch the full task graph (~1000+ rows) in one pass and compute readiness
 * client-side.
 *
 * Usage:  bun run scripts/ready-tasks.ts
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

const t0 = Date.now()
const [openRows, doneRows, blocksRows, tagRows, phRows] = await Promise.all([
  query(`match $t isa task, has task-id $id, has name $n, has done false,
           has priority-score $p, has task-phase $ph, has task-wave $w,
           has task-effort $e, has source-file $src;
         select $id, $n, $p, $ph, $w, $e, $src;`),
  query(`match $t isa task, has task-id $id, has done $d; select $id, $d;`),
  query(`match (blocker: $a, blocked: $b) isa blocks; $a has task-id $aid; $b has task-id $bid; select $aid, $bid;`),
  query(`match $t isa task, has task-id $id, has tag $tag; select $id, $tag;`),
  query(`match $e (source: $f, target: $t) isa path; $t has uid $uid;
         $e has strength $s, has resistance $r;
         select $uid, $s, $r;`).catch(() => []),
])
console.log(
  `fetched in ${Date.now() - t0}ms: open=${openRows.length} done-rows=${doneRows.length} blocks=${blocksRows.length} tags=${tagRows.length}`,
)

const doneMap = new Map<string, boolean>()
for (const r of doneRows) doneMap.set(r.id as string, r.d as boolean)

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

// Pheromone aggregated per unit (builder is the provider for all tasks)
const builderPh = phRows
  .filter((r) => r.uid === 'builder')
  .reduce((acc, r) => ({ s: acc.s + (r.s as number), r: acc.r + (r.r as number) }), { s: 0, r: 0 })
console.log(`pheromone on builder unit: strength=${builderPh.s.toFixed(1)} resistance=${builderPh.r.toFixed(1)}`)

const ready = openRows.filter((t) => {
  const bs = blockersOf.get(t.id as string)
  if (!bs || bs.size === 0) return true
  for (const b of bs) if (doneMap.get(b) === false) return false
  return true
})
console.log(`ready (no open blockers): ${ready.length}   stalled: ${openRows.length - ready.length}\n`)

const ranked = ready
  .map((t) => ({ ...t, unlocks: blocksWhat.get(t.id as string)?.size ?? 0 }))
  .sort((a, b) => (b.p as number) - (a.p as number) || b.unlocks - a.unlocks)

const limit = Number(process.argv[2]) || 20
console.log(`top ${limit} ready tasks:`)
console.log(`#    pri  phase wav  effort  unlk  src              tags                        name`)
console.log('─'.repeat(130))
for (let i = 0; i < Math.min(limit, ranked.length); i++) {
  const t = ranked[i]
  const tags = (tagMap.get(t.id as string) || []).slice(0, 3).join(',').padEnd(26).slice(0, 26)
  const name = (t.n as string).slice(0, 52)
  const src = ((t.src as string) || '?').slice(0, 16).padEnd(16)
  console.log(
    `${String(i + 1).padStart(2)}. ${String(t.p).padStart(4)}  ${(t.ph as string).padEnd(5)} ${(t.w as string).padEnd(3)}  ${(t.e as string).padEnd(6)}  ${String(t.unlocks).padStart(4)}  ${src} ${tags} ${name}`,
  )
}

const bySource = new Map<string, number>()
for (const t of ready) bySource.set(t.src as string, (bySource.get(t.src as string) || 0) + 1)
console.log(
  `\nready by source: ${[...bySource]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([s, n]) => `${s}(${n})`)
    .join(' ')}`,
)

const unlockers = ranked
  .filter((t) => t.unlocks > 0)
  .sort((a, b) => b.unlocks - a.unlocks)
  .slice(0, 5)
console.log(`\nbiggest unlockers (complete to cascade):`)
for (const t of unlockers)
  console.log(
    `  unlocks ${String(t.unlocks).padStart(2)}  pri ${String(t.p).padStart(3)}  ${(t.n as string).slice(0, 65)}`,
  )
