/**
 * /api/tasks — Task visibility with priority formula + pheromone
 *
 * GET  → List tasks with effective priority. Filter with ?tag=build&tag=P0&sensitivity=0.7
 * POST → Create a task (with value/phase/persona/blocks + auto-computed priority)
 *
 * Local dev uses in-memory store (.tasks.json).
 * Production uses D1 with TypeDB sync.
 */
import type { APIRoute } from 'astro'
import { computePriority, effectivePriority, type Phase, type Value } from '@/engine/task-parse'
import { getNet } from '@/lib/net'
import * as store from '@/lib/tasks-store'
import { readParsed, write, writeSilent } from '@/lib/typedb'

type Row = Record<string, unknown>

export const GET: APIRoute = async ({ url }) => {
  const filterTags = url.searchParams.getAll('tag')
  const sensitivity = parseFloat(url.searchParams.get('sensitivity') || '0.7')
  const phase = url.searchParams.get('phase')
  const value = url.searchParams.get('value')

  // Try local store first (fast, always available)
  const localTasks = store.getAllTasks()
  if (localTasks.length > 0) {
    let filtered = localTasks

    // Apply filters
    if (filterTags.length > 0) {
      filtered = filtered.filter((t) => filterTags.every((tag) => t.tags.includes(tag)))
    }
    if (phase) {
      filtered = filtered.filter((t) => t.phase === phase)
    }
    if (value) {
      filtered = filtered.filter((t) => t.value === value)
    }

    const net = await getNet()

    const result = filtered
      .filter((t) => t.status !== 'in_progress' && t.status !== 'active')
      .map((t) => {
        const repelled = t.alarmPheromone >= 30 && t.alarmPheromone > t.trailPheromone
        const attractive = t.trailPheromone >= 50
        const exploratory = t.trailPheromone === 0 && t.alarmPheromone === 0
        const category = repelled ? 'repelled' : attractive ? 'attractive' : exploratory ? 'exploratory' : 'ready'
        const taskAny = t as unknown as Record<string, unknown>
        return {
          tid: t.tid,
          name: t.name,
          status: t.status,
          priority: t.priority,
          phase: t.phase,
          value: t.value,
          persona: t.persona,
          tags: t.tags,
          blockedBy: t.blockedBy,
          blocks: t.blocks,
          trailPheromone: t.trailPheromone,
          alarmPheromone: t.alarmPheromone,
          category,
          attractive,
          repelled,
          strength: net.sense(`loop→builder:${t.tid}`) || 0,
          resistance: net.danger(`loop→builder:${t.tid}`) || 0,
          wave: (taskAny.wave as string | undefined) || 'W3',
          context: (taskAny.context as string[] | undefined) || [],
        }
      })

    return new Response(JSON.stringify({ tasks: result, source: 'local' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Fallback to TypeDB
  // Build filter clauses
  const tagMatch = filterTags.map((t) => `$t has tag "${t}";`).join('\n      ')
  const phaseMatch = phase ? `$t has task-phase "${phase}";` : ''
  const valueMatch = value ? `$t has task-value "${value}";` : ''

  // Query tasks from TypeDB
  const tasks = (await readParsed(`
    match $t isa task, not { $t has task-status "active"; },
      has task-id $id, has name $name, has done $done,
      has task-value $val, has task-phase $ph, has task-persona $persona,
      has priority-score $priority, has priority-formula $formula,
      has source-file $source, has task-status $status;
    ${tagMatch}
    ${phaseMatch}
    ${valueMatch}
    select $id, $name, $done, $val, $ph, $persona, $priority, $formula, $source, $status;
  `).catch(() => [])) as Row[]

  // Get tags per task
  const tagRows = (await readParsed(`
    match $t isa task, has task-id $id, has tag $tag;
    select $id, $tag;
  `).catch(() => [])) as Row[]

  const tagMap: Record<string, string[]> = {}
  for (const r of tagRows) {
    const id = r.id as string
    if (!tagMap[id]) tagMap[id] = []
    tagMap[id].push(r.tag as string)
  }

  // Get blocks per task
  const blockRows = (await readParsed(`
    match (blocker: $a, blocked: $b) isa blocks;
    $a has task-id $aid; $b has task-id $bid;
    select $aid, $bid;
  `).catch(() => [])) as Row[]

  const blockMap: Record<string, string[]> = {}
  const blockedByMap: Record<string, string[]> = {}
  for (const r of blockRows) {
    const aid = r.aid as string
    const bid = r.bid as string
    if (!blockMap[aid]) blockMap[aid] = []
    blockMap[aid].push(bid)
    if (!blockedByMap[bid]) blockedByMap[bid] = []
    blockedByMap[bid].push(aid)
  }

  // Get pheromone from paths (skill-id → capability → unit → inbound paths)
  const edges = (await readParsed(`
    match $e (source: $from, target: $to) isa path,
      has strength $s, has resistance $rs, has traversals $tr;
    $to has uid $tid;
    select $tid, $s, $rs, $tr;
  `).catch(() => [])) as Row[]

  // Aggregate pheromone per unit
  const pheromone: Record<string, { strength: number; resistance: number; traversals: number }> = {}
  for (const e of edges) {
    const tid = e.tid as string
    if (!pheromone[tid]) pheromone[tid] = { strength: 0, resistance: 0, traversals: 0 }
    pheromone[tid].strength += e.s as number
    pheromone[tid].resistance += e.rs as number
    pheromone[tid].traversals += e.tr as number
  }

  // Map task-id → unit-id via capability
  const capRows = (await readParsed(`
    match (provider: $u, offered: $sk) isa capability;
    $u has uid $uid; $sk has skill-id $sid;
    select $uid, $sid;
  `).catch(() => [])) as Row[]

  const taskUnit: Record<string, string> = {}
  for (const r of capRows) {
    taskUnit[r.sid as string] = r.uid as string
  }

  // Build response
  const result = tasks.map((t) => {
    const id = t.id as string
    const unitId = taskUnit[id] || 'builder'
    const ph = pheromone[unitId] || { strength: 0, resistance: 0, traversals: 0 }
    const priority = t.priority as number
    const effective = effectivePriority(priority, ph.strength, ph.resistance, sensitivity)

    // Categories from pheromone
    const repelled = ph.resistance >= 30 && ph.resistance > ph.strength
    const attractive = ph.strength >= 50
    const exploratory = ph.strength === 0 && ph.resistance === 0
    const category = repelled ? 'repelled' : attractive ? 'attractive' : exploratory ? 'exploratory' : 'ready'

    return {
      id,
      name: t.name as string,
      done: t.done as boolean,
      value: t.val as string,
      phase: t.ph as string,
      persona: t.persona as string,
      priorityScore: priority,
      effectivePriority: Math.round(effective * 10) / 10,
      formula: t.formula as string,
      tags: tagMap[id] || [],
      blocks: blockMap[id] || [],
      blockedBy: blockedByMap[id] || [],
      category,
      strength: ph.strength,
      resistance: ph.resistance,
      traversals: ph.traversals,
      unit: unitId,
      source: t.source as string,
      status: t.status as string,
      wave: (t.wave as string | undefined) || 'W3',
      context: (t.context as string[] | undefined) || [],
    }
  })

  // Sort by effective priority descending
  result.sort((a, b) => b.effectivePriority - a.effectivePriority)

  return new Response(JSON.stringify({ tasks: result }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    id: string
    name: string
    tags?: string[]
    value?: Value
    phase?: Phase
    persona?: string
    blocks?: string[]
    exit?: string
    price?: number
    unit?: string
  }

  if (!body.id || !body.name) {
    return new Response(JSON.stringify({ error: 'Missing id or name' }), { status: 400 })
  }

  const tags = body.tags || []
  const value = body.value || 'medium'
  const phase = body.phase || 'C4'
  const persona = body.persona || 'agent'
  const blocks = body.blocks || []
  const price = body.price || 0
  const unitId = body.unit || 'builder'

  const { score, formula } = computePriority(value, phase, persona, blocks.length)

  // Determine priority label from tags or score
  const priorityTag = tags.find((t) => /^P[0-3]$/.test(t)) as 'P0' | 'P1' | 'P2' | 'P3' | undefined
  const priority = priorityTag || (score >= 90 ? 'P0' : score >= 70 ? 'P1' : score >= 50 ? 'P2' : 'P3')

  // Write to local store (always works, fast)
  store.createTask({
    tid: body.id,
    name: body.name,
    status: 'todo',
    priority,
    phase,
    value,
    persona,
    tags,
    blockedBy: [],
    blocks,
    trailPheromone: 0,
    alarmPheromone: 0,
  })

  const tagInserts = tags.map((t) => `has tag "${t}"`).join(', ')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  // Also write to TypeDB (may fail if not connected)
  await write(`
    insert $t isa task,
      has task-id "${esc(body.id)}",
      has name "${esc(body.name)}",
      has task-status "open",
      has task-value "${value}",
      has task-phase "${phase}",
      has task-persona "${persona}",
      has priority-score ${score.toFixed(1)},
      has priority-formula "${esc(formula)}",
      has source-file "api",
      ${body.exit ? `has exit-condition "${esc(body.exit)}",` : ''}
      has done false,
      ${tagInserts ? `${tagInserts},` : ''}
      has created ${new Date().toISOString().replace('Z', '')};
  `).catch(() => {})

  // Create matching skill for capability routing
  await writeSilent(`
    insert $s isa skill, has skill-id "${esc(body.id)}", has name "${esc(body.name)}",
      ${tagInserts ? `${tagInserts},` : ''} has price ${price}, has currency "SUI";
  `)

  // Link to unit via capability
  await writeSilent(`
    match $u isa unit, has uid "${unitId}"; $s isa skill, has skill-id "${esc(body.id)}";
    insert (provider: $u, offered: $s) isa capability, has price ${price};
  `)

  // Insert blocks relations
  for (const blockedId of blocks) {
    await writeSilent(`
      match $a isa task, has task-id "${esc(body.id)}";
            $b isa task, has task-id "${esc(blockedId)}";
      insert (blocker: $a, blocked: $b) isa blocks;
    `)
  }

  return new Response(
    JSON.stringify({
      ok: true,
      task: body.id,
      priorityScore: score,
      formula,
      tags,
      unit: unitId,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
