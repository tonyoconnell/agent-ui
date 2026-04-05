/**
 * /api/tasks — Runtime task visibility
 *
 * GET  → List tasks (skills + pheromone). Filter with ?tag=build&tag=P0
 * POST → Create a task (skill + tags + optional signal)
 *
 * Tasks are skills on units. Tags classify. Pheromone ranks.
 */
import type { APIRoute } from 'astro'
import { readParsed, write, writeSilent } from '@/lib/typedb'

type Row = Record<string, unknown>

export const GET: APIRoute = async ({ url }) => {
  const filterTags = url.searchParams.getAll('tag')

  // Build tag filter clause
  const tagMatch = filterTags.map(t => `$sk has tag "${t}";`).join('\n      ')

  const [capabilities, edges] = await Promise.all([
    readParsed(`
      match (provider: $u, offered: $sk) isa capability, has price $p;
      $u has uid $uid, has unit-kind $kind, has success-rate $sr;
      $sk has skill-id $sid, has name $name;
      ${tagMatch}
      select $uid, $sid, $name, $p, $kind, $sr;
    `).catch(() => []),
    readParsed(`
      match $e (source: $from, target: $to) isa path,
        has strength $s, has resistance $rs, has traversals $t;
      $from has uid $fid; $to has uid $tid;
      select $fid, $tid, $s, $rs, $t;
    `).catch(() => []),
  ])

  // Fetch tags per skill (separate query since multi-valued)
  const skillTags: Record<string, string[]> = {}
  const tagRows = await readParsed(`
    match $sk isa skill, has skill-id $sid, has tag $tag;
    select $sid, $tag;
  `).catch(() => []) as Row[]
  for (const r of tagRows) {
    const sid = r.sid as string
    if (!skillTags[sid]) skillTags[sid] = []
    skillTags[sid].push(r.tag as string)
  }

  const tasks = (capabilities as Row[]).map(cap => {
    const unitId = cap.uid as string
    const skillId = cap.sid as string

    // Pheromone: inbound edges to this unit
    const inbound = (edges as Row[]).filter(e => e.tid === unitId)
    const strength = inbound.reduce((s, e) => s + (e.s as number), 0)
    const resistance = inbound.reduce((s, e) => s + (e.rs as number), 0)
    const traversals = inbound.reduce((s, e) => s + (e.t as number), 0)

    const repelled = resistance >= 30 && resistance > strength
    const attractive = strength >= 50
    const exploratory = inbound.length === 0
    const category = repelled ? 'repelled' : attractive ? 'attractive' : exploratory ? 'exploratory' : 'ready'

    return {
      receiver: `${unitId}:${skillId}`,
      unit: unitId,
      skill: skillId,
      name: cap.name as string,
      tags: skillTags[skillId] || [],
      price: cap.p as number,
      category,
      strength,
      resistance,
      traversals,
      unitKind: cap.kind,
      successRate: cap.sr,
    }
  })

  return new Response(JSON.stringify({ tasks }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as {
    id: string
    name: string
    tags?: string[]
    price?: number
    unit?: string
  }

  if (!body.id || !body.name) {
    return new Response(JSON.stringify({ error: 'Missing id or name' }), { status: 400 })
  }

  const tags = body.tags || []
  const price = body.price || 0
  const unitId = body.unit || 'builder'

  // Create skill with tags
  const tagInserts = tags.map(t => `has tag "${t}"`).join(', ')
  await write(`
    insert $s isa skill, has skill-id "${body.id}", has name "${body.name}",
      ${tagInserts ? tagInserts + ',' : ''} has price ${price}, has currency "SUI";
  `).catch(() => {})

  // Link to unit via capability
  await writeSilent(`
    match $u isa unit, has uid "${unitId}"; $s isa skill, has skill-id "${body.id}";
    insert (provider: $u, offered: $s) isa capability, has price ${price};
  `)

  return new Response(JSON.stringify({ ok: true, skill: body.id, tags, unit: unitId }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
