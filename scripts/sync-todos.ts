#!/usr/bin/env bun
/**
 * Sync all docs/TODO-*.md → TypeDB with weights, tags, blocks.
 *
 * Reuses the deterministic pipeline:
 *   scanTodos()  parse TODO-*.md   → Task[] with priority formula
 *   syncTasks()  write to TypeDB   → task + skill + capability + blocks
 *
 * After sync, reads pheromone back and prints top tasks by
 * effective priority = priority + (strength − resistance) × 0.7
 *
 * Usage:  bun run scripts/sync-todos.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const docsDir = path.join(repoRoot, 'docs')

// Load .env so the TypeDB client can reach the gateway
const envPath = path.join(repoRoot, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
}

const { scanTodos, effectivePriority } = await import('../src/engine/task-parse.ts')
const { syncTasks } = await import('../src/engine/task-sync.ts')
const { readParsed } = await import('../src/lib/typedb.ts')

const t0 = Date.now()

// 1. Parse TODO-*.md files
const tasks = await scanTodos(docsDir)
const open = tasks.filter((t) => !t.done)
const done = tasks.filter((t) => t.done)
console.log(`parsed  ${tasks.length} tasks (${open.length} open, ${done.length} done) from ${docsDir}`)

// 2. Write to TypeDB (task + skill + capability + blocks)
const syncStart = Date.now()
const { synced, blocks, errors } = await syncTasks(tasks)
const syncMs = Date.now() - syncStart
console.log(`synced  ${synced} tasks, ${blocks} blocks, ${errors} errors in ${syncMs}ms`)

// 3. Read pheromone back — aggregate inbound paths per skill
const phStart = Date.now()
const rows = await readParsed(`
  match
    (provider: $u, offered: $sk) isa capability;
    $sk has skill-id $sid;
    $e (source: $from, target: $u) isa path, has strength $s, has resistance $r;
  select $sid, $s, $r;
`).catch(() => [])

const pheromone = new Map<string, { strength: number; resistance: number }>()
for (const row of rows) {
  const sid = row.sid as string
  const existing = pheromone.get(sid) || { strength: 0, resistance: 0 }
  existing.strength += row.s as number
  existing.resistance += row.r as number
  pheromone.set(sid, existing)
}
console.log(`pheromone  ${pheromone.size} skills have paths, read in ${Date.now() - phStart}ms`)

// 4. Top 10 by effective priority
const ranked = open
  .map((t) => {
    const ph = pheromone.get(t.id) || { strength: 0, resistance: 0 }
    return { ...t, ...ph, effective: effectivePriority(t.priority, ph.strength, ph.resistance) }
  })
  .sort((a, b) => b.effective - a.effective)

console.log(`\ntop 10 open tasks by effective priority:`)
for (const t of ranked.slice(0, 10)) {
  const ph = t.strength > 0 || t.resistance > 0 ? ` s:${t.strength.toFixed(0)} r:${t.resistance.toFixed(0)}` : ''
  console.log(
    `  ${t.effective.toFixed(1).padStart(6)} ${t.phase} ${t.wave} [${t.tags.slice(0, 3).join(',')}]${ph}  ${t.name.slice(0, 70)}`,
  )
}

// 5. Tag coverage — what the swarm can route on
const tagCount = new Map<string, number>()
for (const t of open) for (const tag of t.tags) tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
const topTags = [...tagCount].sort((a, b) => b[1] - a[1]).slice(0, 12)
console.log(`\ntop tags (open): ${topTags.map(([t, n]) => `${t}(${n})`).join(' ')}`)

console.log(`\ndone in ${Date.now() - t0}ms`)
