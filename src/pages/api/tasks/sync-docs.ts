/**
 * POST /api/tasks/sync-docs — Scan docs/ → TypeDB → regenerate TODO.md
 *
 * The loop:
 *   1. Scan docs/*.md for TODOs, gaps, checkboxes
 *   2. Upsert each item as a skill in TypeDB (with tags, priority)
 *   3. Read pheromone back from TypeDB (strength/resistance per skill)
 *   4. Regenerate TODO.md ranked by pheromone weight
 *
 * GET  → dry run (scan only, return items, don't write)
 * POST → full sync (scan → TypeDB → TODO.md)
 */
import type { APIRoute } from 'astro'
import { readParsed, writeSilent } from '@/lib/typedb'

// DocItem type (inlined to avoid pulling doc-scan into Cloudflare bundle at import time)
type DocItem = { id: string; name: string; source: string; section: string; tags: string[]; done: boolean; priority: string; line: number; raw: string }

const UNIT_ID = 'builder'
const BATCH_SIZE = 10

/** Ensure builder unit exists */
async function ensureBuilder() {
  await writeSilent(`
    insert $u isa unit, has uid "${UNIT_ID}", has name "Builder", has unit-kind "system",
      has tag "system", has status "active", has success-rate 0.5, has activity-score 0.0,
      has sample-count 0, has reputation 0.0, has balance 0.0, has generation 0;
  `)
}

/** Upsert a doc item as a skill + capability in TypeDB */
async function upsertItem(item: DocItem) {
  const tags = [...new Set(item.tags)].map(t => `has tag "${t.replace(/"/g, "'")}"`)
  const nameEsc = item.name.replace(/"/g, "'").slice(0, 200)

  await writeSilent(`
    insert $s isa skill, has skill-id "${item.id}", has name "${nameEsc}",
      ${tags.join(', ')}, has price 0.0, has currency "SUI";
  `)

  await writeSilent(`
    match $u isa unit, has uid "${UNIT_ID}"; $s isa skill, has skill-id "${item.id}";
    insert (provider: $u, offered: $s) isa capability, has price 0.0;
  `)
}

/** Upsert items in parallel batches */
async function upsertBatch(items: DocItem[]): Promise<{ synced: number; errors: number }> {
  let synced = 0
  let errors = 0

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(batch.map(item => upsertItem(item)))
    for (const r of results) {
      if (r.status === 'fulfilled') synced++
      else errors++
    }
  }

  return { synced, errors }
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

export const GET: APIRoute = async () => {
  const { join } = await import('node:path')
  const { scanDocs } = await import('@/engine/doc-scan')
  const docsDir = join(process.cwd(), 'docs')
  const items = await scanDocs(docsDir)

  return new Response(JSON.stringify({
    total: items.length,
    open: items.filter(i => !i.done).length,
    done: items.filter(i => i.done).length,
    items: items.map(i => ({
      id: i.id,
      name: i.name,
      source: i.source,
      priority: i.priority,
      tags: i.tags,
      done: i.done,
    })),
  }), { headers: { 'Content-Type': 'application/json' } })
}

export const POST: APIRoute = async () => {
  const start = Date.now()
  const { join } = await import('node:path')
  const { writeFile } = await import('node:fs/promises')
  const { scanDocs, renderTodo } = await import('@/engine/doc-scan')

  const docsDir = join(process.cwd(), 'docs')
  const todoPath = join(docsDir, 'TODO.md')

  // 1. Scan docs/
  const items = await scanDocs(docsDir)

  // 2. Ensure builder unit
  await ensureBuilder()

  // 3. Upsert items to TypeDB in batches
  const { synced, errors } = await upsertBatch(items)

  // 4. Read pheromone back
  const pheromone = await readPheromone()

  // 5. Regenerate TODO.md
  const todoContent = renderTodo(items, pheromone)
  await writeFile(todoPath, todoContent, 'utf-8')

  return new Response(JSON.stringify({
    ok: true,
    scanned: items.length,
    synced,
    errors,
    pheromone: pheromone.size,
    elapsed: `${Date.now() - start}ms`,
    open: items.filter(i => !i.done).length,
    done: items.filter(i => i.done).length,
  }), { headers: { 'Content-Type': 'application/json' } })
}
