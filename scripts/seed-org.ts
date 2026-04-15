/**
 * seed-org — Bootstrap Phase 1 (C1) tasks into TypeDB from docs/autonomous-orgs.md
 *
 * Usage:
 *   bun run scripts/seed-org.ts
 *   bun run scripts/seed-org.ts --dry-run
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Effort, Phase, Task, Value, Wave } from '../src/engine/task-parse'
import { computePriority } from '../src/engine/task-parse'
import { syncTasks } from '../src/engine/task-sync'

const DRY_RUN = process.argv.includes('--dry-run')
const ROOT = join(import.meta.dir, '..')
const SOURCE = 'autonomous-orgs'

// ── Narrow parser: extract task-id blocks from TQL insert sections ────────

function extractC1Tasks(content: string): Task[] {
  // Pull each `insert $tN isa task, ...` block between the C1 heading and DEPENDENCIES
  const section = content.slice(
    content.indexOf('### Initial Task Setup (Cycle C1: Foundation)'),
    content.indexOf('# DEPENDENCIES (Task Graph)'),
  )

  const taskBlockRe = /insert \$t\d+ isa task,([\s\S]*?)(?=\n\s*(?:insert (?:\$t\d+ isa task|\()|\n#|$))/g
  const attrRe = /has (\S+) "([^"]+)"/g
  const priorityRe = /has priority (\d+)/

  const tasks: Task[] = []

  for (const m of section.matchAll(taskBlockRe)) {
    const block = m[0]
    const attrs: Record<string, string[]> = {}
    let am: RegExpExecArray | null

    attrRe.lastIndex = 0
    while ((am = attrRe.exec(block)) !== null) {
      const [, k, v] = am
      if (!attrs[k]) attrs[k] = []
      attrs[k].push(v)
    }

    const pm = block.match(priorityRe)
    const priority = pm ? Number(pm[1]) : 50

    const id = attrs['task-id']?.[0] ?? ''
    const name = attrs.name?.[0] ?? id
    const phase = (attrs.phase?.[0] ?? 'C1').replace('cycle:', '') as Phase
    const value = (attrs.value?.[0] ?? 'medium') as Value
    const persona = attrs.persona?.[0] ?? 'agent'
    const tags = attrs.tag ?? []

    const { formula } = computePriority(value, phase, persona, 0)

    tasks.push({
      id,
      name,
      done: false,
      value,
      effort: 'medium' as Effort,
      wave: 'W3' as Wave,
      phase,
      persona,
      context: [],
      blocks: [],
      exit: '',
      tags,
      source: SOURCE,
      line: 0,
      priority,
      formula,
    })
  }

  // Wire blocks from the DEPENDENCIES section
  const depsSection = content.slice(content.indexOf('# DEPENDENCIES (Task Graph)'))
  const depRe = /\(source: \$t(\d+), target: \$t(\d+)\)/g
  // Map index (1-based) → task id — tasks are in order parsed
  const byIdx = new Map(tasks.map((t, i) => [i + 1, t]))

  for (const d of depsSection.matchAll(depRe)) {
    const src = byIdx.get(Number(d[1]))
    const tgt = byIdx.get(Number(d[2]))
    if (src && tgt) src.blocks.push(tgt.id)
  }

  return tasks
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const content = await readFile(join(ROOT, 'docs/autonomous-orgs.md'), 'utf-8')
  const tasks = extractC1Tasks(content)

  if (tasks.length === 0) {
    console.error('seed-org: no C1 tasks extracted — check parser against autonomous-orgs.md')
    process.exit(1)
  }

  console.log(`seed-org: extracted ${tasks.length} C1 tasks from autonomous-orgs.md`)
  for (const t of tasks) {
    console.log(`  [${t.value.padEnd(8)}] ${t.id} — ${t.name.slice(0, 60)}`)
    if (t.blocks.length) console.log(`            blocks: ${t.blocks.join(', ')}`)
  }

  if (DRY_RUN) {
    console.log(`\n--dry-run: { seeded: ${tasks.length}, skipped: 0 } (no writes)`)
    return
  }

  try {
    const { synced, blocks, errors } = await syncTasks(tasks)
    const skipped = tasks.length - synced - errors
    console.log(`\nseed-org: { seeded: ${synced}, skipped: ${skipped}, blocks: ${blocks}, errors: ${errors} }`)
    if (errors > 0) process.exit(1)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`seed-org: TypeDB unreachable — ${msg}`)
    console.error('Tip: check TYPEDB_CLOUD_ADDRESS + TYPEDB_CLOUD_TOKEN in .env')
    process.exit(1)
  }
}

main()
