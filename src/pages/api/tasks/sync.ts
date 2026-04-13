/**
 * POST /api/tasks/sync — Scan TODO-*.md → KV → TypeDB → regenerate TODO.md
 *
 * Three-layer pipeline (deterministic sandwich):
 *   1. Parse TODO-{docname}.md files (structured, deterministic)
 *   2. Write to KV cache (hash-gated, 10ms hot)
 *   3. Sync to TypeDB (async, 100ms durable)
 *   4. Read pheromone back, compute effective priority
 *   5. Regenerate TODO.md ranked by effective priority
 *
 * GET  → dry run (parse only, return tasks with computed priority)
 * POST → full sync (parse → KV → TypeDB → TODO.md)
 *
 * KV caching:
 *   - Hash Task[] array (FNV-1a)
 *   - If hash differs from last write → update KV
 *   - If hash unchanged → skip KV write (save bandwidth)
 *   - Routing always reads from KV (10ms), falls back to TypeDB (100ms)
 *
 * To generate TODO-{docname}.md files from prose docs, run Haiku extraction first.
 * After that, this endpoint is fully deterministic.
 */
import type { APIRoute } from 'astro'
import { EFFORT_MODEL, effectivePriority, WAVE_MODEL } from '@/engine/task-parse'
import { readParsed } from '@/lib/typedb'

/** FNV-1a hash for KV write comparison */
function fnv1a(data: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i)
    hash = (hash * 0x01000193) & 0xffffffff
  }
  return hash.toString(16)
}

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

/** Render TODO.md as master index with links to TODO-*.md files + tasks by phase */
function renderTodo(
  tasks: Array<{
    id: string
    name: string
    done: boolean
    value: string
    effort: string
    phase: string
    persona: string
    priority: number
    formula: string
    tags: string[]
    exit: string
    blocks: string[]
    source: string
  }>,
  pheromone: Map<string, { strength: number; resistance: number }>,
): string {
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  // Compute effective priority
  const ranked = open
    .map((t) => {
      const ph = pheromone.get(t.id) || { strength: 0, resistance: 0 }
      const effective = effectivePriority(t.priority, ph.strength, ph.resistance)
      return { ...t, effective, ...ph }
    })
    .sort((a, b) => b.effective - a.effective)

  // Group by source TODO file
  const sources = new Map<string, { open: number; done: number }>()
  for (const t of tasks) {
    const src = t.source || 'unknown'
    const entry = sources.get(src) || { open: 0, done: 0 }
    t.done ? entry.done++ : entry.open++
    sources.set(src, entry)
  }

  const lines: string[] = [
    '# TODO',
    '',
    '> ONE Substrate — self-learning task system.',
    '> Tasks are signals. Waves are loops. The template is a unit.',
    `> ${open.length} open, ${done.length} done. Priority + pheromone adjusts at runtime.`,
    '>',
    '> **Sync:** `POST /api/tasks/sync` or `/sync` — writes to KV (10ms), then TypeDB (100ms)',
    `> **Generated:** ${new Date().toISOString().slice(0, 19)}`,
    '',
    '---',
    '',
    '## Active TODOs',
    '',
    '| TODO | Open | Done | Status |',
    '|------|-----:|-----:|--------|',
  ]

  for (const [src, counts] of [...sources].sort((a, b) => b[1].open - a[1].open)) {
    const status = counts.open === 0 ? 'DONE' : counts.done > 0 ? 'PROVE' : 'WIRE'
    lines.push(`| [TODO-${src}](TODO-${src}.md) | ${counts.open} | ${counts.done} | ${status} |`)
  }

  lines.push('')
  lines.push('---')
  lines.push('')

  // Top 15 by effective priority
  lines.push('## Top 15 by Effective Priority')
  lines.push('')

  for (const t of ranked.slice(0, 15)) {
    const ph = t.strength > 0 || t.resistance > 0 ? ` [s:${t.strength.toFixed(0)} r:${t.resistance.toFixed(0)}]` : ''
    const model = EFFORT_MODEL[(t as any).effort as keyof typeof EFFORT_MODEL] || 'sonnet'
    lines.push(`- [ ] **${t.name}**${ph} [${model}] \`${t.tags.join(', ')}\` ← [TODO-${t.source}](TODO-${t.source}.md)`)
    if (t.exit) lines.push(`  exit: ${t.exit}`)
  }

  lines.push('')
  lines.push('---')
  lines.push('')

  // Group by phase
  const phases = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7']
  const phaseNames: Record<string, string> = {
    C1: 'Foundation',
    C2: 'Collaboration',
    C3: 'Commerce',
    C4: 'Expansion',
    C5: 'Analytics',
    C6: 'Products',
    C7: 'Scale',
  }

  for (const phase of phases) {
    const phTasks = ranked.filter((t) => t.phase === phase)
    if (phTasks.length === 0) continue

    lines.push(`## ${phase}: ${phaseNames[phase]}`)
    lines.push('')

    for (const t of phTasks) {
      const ph = t.strength > 0 || t.resistance > 0 ? ` [s:${t.strength.toFixed(0)} r:${t.resistance.toFixed(0)}]` : ''
      const model = EFFORT_MODEL[(t as any).effort as keyof typeof EFFORT_MODEL] || 'sonnet'
      lines.push(
        `- [ ] **${t.name}** — ${t.formula}${ph} [${model}] \`${t.tags.join(', ')}\` ← [${t.source}](TODO-${t.source}.md)`,
      )
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
      lines.push(`- [x] **${t.name}** \`${t.tags.join(', ')}\` ← [${t.source}](TODO-${t.source}.md)`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('*This file is generated. Edit the TODO-*.md files, not this. Run `/sync-docs` to regenerate.*')
  lines.push('')

  return lines.join('\n')
}

export const GET: APIRoute = async () => {
  const { join } = await import('node:path')
  const { scanTodos } = await import('@/engine/task-parse')
  const docsDir = join(process.cwd(), 'docs')
  const tasks = await scanTodos(docsDir)

  return new Response(
    JSON.stringify({
      total: tasks.length,
      open: tasks.filter((t) => !t.done).length,
      done: tasks.filter((t) => t.done).length,
      tasks: tasks.map((t) => ({
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
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}

export const POST: APIRoute = async (context) => {
  const start = Date.now()
  const { join } = await import('node:path')
  const { writeFile } = await import('node:fs/promises')
  const { scanTodos } = await import('@/engine/task-parse')
  const { syncTasks } = await import('@/engine/task-sync')

  const docsDir = join(process.cwd(), 'docs')
  const todoPath = join(docsDir, 'TODO.md')

  // 1. Parse TODO-*.md files (deterministic)
  const tasks = await scanTodos(docsDir)

  // 2. Write to KV cache (hash-gated)
  const kvStart = Date.now()
  const taskJson = JSON.stringify(tasks)
  const taskHash = fnv1a(taskJson)
  let kvWritten = false

  // Try to write to CF KV if available (edge runtime)
  const kv = ((context.locals as any)?.runtime?.env as { KV?: KVNamespace })?.KV
  if (kv) {
    try {
      // Read existing hash
      const lastHashJson = await kv.get('_tasks.hash')
      const lastHash = lastHashJson ? JSON.parse(lastHashJson) : null

      // Only write if changed
      if (lastHash !== taskHash) {
        await Promise.all([
          kv.put('tasks.json', taskJson, { expirationTtl: 3600 }),
          kv.put('_tasks.hash', JSON.stringify(taskHash), { expirationTtl: 3600 }),
        ])
        kvWritten = true
      }
    } catch (err) {
      // KV write failure is not fatal — TypeDB is source of truth
      console.warn('[sync] KV write skipped:', err instanceof Error ? err.message : err)
    }
  }
  const kvMs = Date.now() - kvStart

  // 3. Sync to TypeDB (async, non-blocking in production)
  const typedbStart = Date.now()
  const { synced, blocks, errors } = await syncTasks(tasks)
  const typedbMs = Date.now() - typedbStart

  // 4. Read pheromone back
  const pheromone = await readPheromone()

  // 5. Regenerate TODO.md
  const todoContent = renderTodo(tasks, pheromone)
  await writeFile(todoPath, todoContent, 'utf-8')

  // 6. Write todo.json — snapshot for CI, dashboards, sync checks
  const todoJsonPath = join(docsDir, '..', 'todo.json')
  const todoJson = {
    generated: new Date().toISOString(),
    total: tasks.length,
    open: tasks.filter((t) => !t.done).length,
    done: tasks.filter((t) => t.done).length,
    synced,
    blocks,
    errors,
    kvWritten,
    tasks: tasks
      .map((t) => {
        const ph = pheromone.get(t.id) || { strength: 0, resistance: 0 }
        const wave = (t as any).wave || 'W3'
        const context = (t as any).context || []
        return {
          id: t.id,
          name: t.name,
          done: t.done,
          value: t.value,
          effort: t.effort,
          wave,
          model: WAVE_MODEL[wave as keyof typeof WAVE_MODEL] || EFFORT_MODEL[t.effort] || 'sonnet',
          phase: t.phase,
          persona: t.persona,
          context,
          priority: t.priority,
          effective: effectivePriority(t.priority, ph.strength, ph.resistance),
          formula: t.formula,
          tags: t.tags,
          blocks: t.blocks,
          exit: t.exit,
          source: t.source,
          strength: ph.strength,
          resistance: ph.resistance,
        }
      })
      .sort((a, b) => b.effective - a.effective),
  }
  await writeFile(todoJsonPath, JSON.stringify(todoJson, null, 2), 'utf-8')

  const totalMs = Date.now() - start
  return new Response(
    JSON.stringify({
      ok: true,
      parsed: tasks.length,
      synced,
      blocks,
      errors,
      pheromone: pheromone.size,
      kvWritten,
      timing: {
        kv: `${kvMs}ms`,
        typedb: `${typedbMs}ms`,
        total: `${totalMs}ms`,
      },
      elapsed: `${totalMs}ms`,
      open: tasks.filter((t) => !t.done).length,
      done: tasks.filter((t) => t.done).length,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
