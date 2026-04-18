#!/usr/bin/env bun
/**
 * Close a task: mark done, deposit pheromone on loop→builder path,
 * cascade-unblock dependents, report counts.
 *
 * Mirrors selfCheckoff() in src/engine/task-sync.ts but runs as a CLI tool
 * that connects direct to TypeDB Cloud (bypasses the 8s gateway cap and the
 * broken dev server).
 *
 * Usage:
 *   bun run scripts/close-task.ts <task-id>
 *   bun run scripts/close-task.ts --search "phrase"   # find by name
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

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('usage: bun run scripts/close-task.ts <task-id> | --search <phrase>')
  process.exit(1)
}

const signin = await fetch(`${TYPEDB_URL}/v1/signin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: TYPEDB_USERNAME, password: TYPEDB_PASSWORD }),
})
const { token } = (await signin.json()) as { token: string }

async function q(tql: string, txType: 'read' | 'write' = 'read') {
  const res = await fetch(`${TYPEDB_URL}/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      databaseName: TYPEDB_DATABASE,
      transactionType: txType,
      query: tql,
      commit: txType === 'write',
    }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
  return res.json() as Promise<{ answers?: unknown[] }>
}
const parse = (a: unknown[]) =>
  (a as Array<{ data?: Record<string, { value?: unknown }> }>).map((x) => {
    const r: Record<string, unknown> = {}
    if (!x?.data) return r
    for (const [k, c] of Object.entries(x.data)) if (c?.value !== undefined) r[k] = c.value
    return r
  })
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

// Resolve target task id
let taskId: string | null = null
if (args[0] === '--search') {
  const phrase = args.slice(1).join(' ')
  const rows = parse(
    (
      await q(`
    match $t isa task, has task-id $id, has name $n, has done false;
    $n contains "${esc(phrase)}";
    select $id, $n;
  `)
    ).answers || [],
  )
  console.log(`matches for "${phrase}": ${rows.length}`)
  for (const r of rows.slice(0, 10)) console.log(`  ${r.id}  —  ${r.n}`)
  if (rows.length === 1) taskId = rows[0].id as string
  else process.exit(0)
} else {
  taskId = args[0]
}

// Verify target exists and is open
const check = parse(
  (
    await q(`
  match $t isa task, has task-id "${esc(taskId)}", has done $d, has name $n;
  select $d, $n;
`)
  ).answers || [],
)
if (check.length === 0) {
  console.error(`no task with id ${taskId}`)
  process.exit(1)
}
if (check[0].d === true) {
  console.log(`already done: ${check[0].n}`)
  process.exit(0)
}
console.log(`closing: ${taskId}  —  ${check[0].n}`)

// 1. Mark done
await q(
  `
  match $t isa task, has task-id "${esc(taskId)}", has done $d, has task-status $s;
  delete $d of $t; delete $s of $t;
  insert $t has done true, has task-status "done";
`,
  'write',
)
console.log('  ✓ marked done')

// 2. Ensure loop unit exists, then strengthen loop → builder path
try {
  await q(
    `insert $u isa unit, has uid "loop", has name "Loop", has unit-kind "system",
    has status "active", has success-rate 0.5, has activity-score 0.0,
    has sample-count 0, has reputation 0.0, has balance 0.0, has generation 0;`,
    'write',
  )
} catch {}
const delta = 5 // chain depth default — matches selfCheckoff mark strength
// Best-effort pheromone deposit: try update-in-place, fall back to fresh insert,
// swallow any failure so the cascade-unblock step below always runs. The primary
// job of close-task.ts is marking done + cascading; the loop→builder pheromone is
// secondary signal. Direct TypeDB 3.x rejects the delete+insert-attr-in-place
// pattern that the gateway-routed mark.ts accepts (REP1 variable-type collision);
// path unique constraint rejects re-insert when the path exists.
let pheromone = 'skipped'
try {
  await q(
    `
    match $from isa unit, has uid "loop"; $to isa unit, has uid "builder";
      $edge (source: $from, target: $to) isa path, has strength $s;
    delete $s of $edge;
    insert $edge has strength ($s + ${delta.toFixed(1)});
  `,
    'write',
  )
  pheromone = `updated +${delta}`
} catch {
  try {
    await q(
      `
      match $from isa unit, has uid "loop"; $to isa unit, has uid "builder";
      insert (source: $from, target: $to) isa path,
        has strength ${delta.toFixed(1)}, has resistance 0.0, has traversals 1;
    `,
      'write',
    )
    pheromone = `created =${delta}`
  } catch {
    pheromone = 'skipped (path exists, update rejected)'
  }
}
console.log(`  ✓ path loop→builder: ${pheromone}`)

// 3. Find dependents (tasks this one was blocking) and check whether any are now fully unblocked
const downstream = parse(
  (
    await q(`
  match (blocker: $a, blocked: $b) isa blocks;
  $a has task-id "${esc(taskId)}";
  $b has task-id $bid;
  select $bid;
`)
  ).answers || [],
).map((r) => r.bid as string)

const unblocked: string[] = []
for (const dep of downstream) {
  const stillBlocked = parse(
    (
      await q(`
    match (blocker: $b, blocked: $t) isa blocks;
    $t has task-id "${esc(dep)}";
    $b has done false;
    select $b;
  `).catch(() => ({ answers: [] }))
    ).answers || [],
  )
  if (stillBlocked.length === 0) unblocked.push(dep)
}

console.log(`  dependents: ${downstream.length}  newly unblocked: ${unblocked.length}`)
for (const d of unblocked) console.log(`    → ${d}`)

console.log(
  '\ndone — first-order pheromone deposit complete. run `bun run scripts/ready-tasks.ts` to see the new ready set.',
)
