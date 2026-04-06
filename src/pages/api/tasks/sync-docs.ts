/**
 * POST /api/tasks/sync-docs — Scan TODO-*.md → TypeDB → regenerate TODO.md
 *
 * Two-stage pipeline:
 *   1. Parse TODO-{docname}.md files (structured, deterministic)
 *   2. Sync tasks to TypeDB (task + skill + capability + blocks)
 *   3. Read pheromone back, compute effective priority
 *   4. Regenerate TODO.md ranked by effective priority
 *
 * GET  → dry run (parse only, return tasks with computed priority)
 * POST → full sync (parse → TypeDB → TODO.md)
 *
 * To generate TODO-{docname}.md files from prose docs, run Haiku extraction first.
 * After that, this endpoint is fully deterministic.
 */
import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'
import { effectivePriority, EFFORT_MODEL } from '@/engine/task-parse'

type Row = Record<string, unknown>

/** Read pheromone for skills that have inbound paths to their provider unit */
async function readPheromone(): Promise<Map<string, { strength: number; resistance: number }>> {
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
    const existing = pheromone.get(sid)
    const s = row.s as number
    const r = row.r as number
    if (existing) {
      existing.strength += s
      existing.resistance += r
    } else {
      pheromone.set(sid, { strength: s, resistance: r })
    }
  }
  return pheromone
}

/** Render TODO.md sorted by effective priority */
function renderTodo(
  tasks: Array<{ id: string; name: string; done: boolean; value: string; effort: string; phase: string; persona: string; priority: number; formula: string; tags: string[]; exit: string; blocks: string[]; source: string }>,
  pheromone: Map<string, { strength: number; resistance: number }>
): string {
  const open = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  // Compute effective priority
  const ranked = open.map(t => {
    const ph = pheromone.get(t.id) || { strength: 0, resistance: 0 }
    const effective = effectivePriority(t.priority, ph.strength, ph.resistance)
    return { ...t, effective, ...ph }
  }).sort((a, b) => b.effective - a.effective)

  const lines: string[] = [
    '# TODO',
    '',
    `> ONE Substrate tasks. ${open.length} open, ${done.length} done.`,
    `> Priority = value + phase + persona + blocking. Pheromone adjusts at runtime.`,
    '',
    '---',
    '',
  ]

  // Group by phase
  const phases = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
  const phaseNames: Record<string, string> = {
    C1: 'Foundation', C2: 'Collaboration', C3: 'Commerce',
    C4: 'Expansion', C5: 'Analytics', C6: 'Products', C7: 'Scale',
  }

  for (const phase of phases) {
    const phTasks = ranked.filter(t => t.phase === phase)
    if (phTasks.length === 0) continue

    lines.push(`## ${phase}: ${phaseNames[phase]}`)
    lines.push('')

    for (const t of phTasks) {
      const ph = t.strength > 0 || t.resistance > 0
        ? ` [s:${t.strength.toFixed(0)} r:${t.resistance.toFixed(0)}]`
        : ''
      const model = EFFORT_MODEL[(t as any).effort as keyof typeof EFFORT_MODEL] || 'sonnet'
      lines.push(`- [ ] **${t.name}** — ${t.formula}${ph} [${model}] \`${t.tags.join(', ')}\``)
      if (t.exit) lines.push(`  exit: ${t.exit}`)
      if (t.blocks.length) lines.push(`  blocks: ${t.blocks.join(', ')}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  if (done.length > 0) {
    lines.push('## Done')
    lines.push('')
    for (const t of done) {
      lines.push(`- [x] **${t.name}** \`${t.tags.join(', ')}\``)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export const GET: APIRoute = async () => {
  const { join } = await import('node:path')
  const { scanTodos } = await import('@/engine/task-parse')
  const docsDir = join(process.cwd(), 'docs')
  const tasks = await scanTodos(docsDir)

  return new Response(JSON.stringify({
    total: tasks.length,
    open: tasks.filter(t => !t.done).length,
    done: tasks.filter(t => t.done).length,
    tasks: tasks.map(t => ({
      id: t.id,
      name: t.name,
      value: t.value,
      effort: t.effort,
      model: EFFORT_MODEL[t.effort] || 'sonnet',
      phase: t.phase,
      persona: t.persona,
      priority: t.priority,
      formula: t.formula,
      tags: t.tags,
      blocks: t.blocks,
      exit: t.exit,
      done: t.done,
      source: t.source,
    })),
  }), { headers: { 'Content-Type': 'application/json' } })
}

export const POST: APIRoute = async () => {
  const start = Date.now()
  const { join } = await import('node:path')
  const { writeFile } = await import('node:fs/promises')
  const { scanTodos } = await import('@/engine/task-parse')
  const { syncTasks } = await import('@/engine/task-sync')

  const docsDir = join(process.cwd(), 'docs')
  const todoPath = join(docsDir, 'TODO.md')

  // 1. Parse TODO-*.md files (deterministic)
  const tasks = await scanTodos(docsDir)

  // 2. Sync to TypeDB
  const { synced, blocks, errors } = await syncTasks(tasks)

  // 3. Read pheromone back
  const pheromone = await readPheromone()

  // 4. Regenerate TODO.md
  const todoContent = renderTodo(tasks, pheromone)
  await writeFile(todoPath, todoContent, 'utf-8')

  return new Response(JSON.stringify({
    ok: true,
    parsed: tasks.length,
    synced,
    blocks,
    errors,
    pheromone: pheromone.size,
    elapsed: `${Date.now() - start}ms`,
    open: tasks.filter(t => !t.done).length,
    done: tasks.filter(t => t.done).length,
  }), { headers: { 'Content-Type': 'application/json' } })
}
