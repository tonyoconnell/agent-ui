/**
 * GET /api/agents/detail?id=group:name — Read a single agent from TypeDB
 *
 * Returns full agent spec including system prompt for chat.
 * Replaces filesystem scan (broken on CF Workers Static Assets).
 */

import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

// Map data-sensitivity enum → number (inverse of agent-md.ts:173-177)
function sensitivityToNumber(raw: unknown): number {
  switch (raw) {
    case 'public':
      return 0.3
    case 'internal':
      return 0.5
    case 'confidential':
      return 0.7
    case 'restricted':
      return 0.9
    default:
      return 0.5
  }
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id parameter required' }, { status: 400 })
  }

  // Sanitise: reject any id containing quote characters to prevent TQL injection
  const safeId = id.replace(/["\\]/g, '')

  // ── Stage 1: unit core attrs ──────────────────────────────────────────────
  const unitRows = await readParsed(`
    match
      $u isa unit, has uid "${safeId}",
        has name $name, has model $model, has system-prompt $sp;
    select $name, $model, $sp;
  `).catch(() => [])

  if (unitRows.length === 0) {
    return Response.json({ error: 'Agent not found' }, { status: 404 })
  }

  const unitRow = unitRows[0]
  const unitName = (unitRow.name as string) || safeId
  const unitModel = (unitRow.model as string) || 'default'
  const systemPrompt = (unitRow.sp as string) || ''

  // Optional: data-sensitivity (may not be present on every unit)
  const sensitivityRows = await readParsed(`
    match
      $u isa unit, has uid "${safeId}", has data-sensitivity $ds;
    select $ds;
  `).catch(() => [])
  const sensitivity = sensitivityRows.length > 0 ? sensitivityToNumber(sensitivityRows[0].ds) : 0.5

  // ── Stage 2: unit tags ────────────────────────────────────────────────────
  const tagRows = await readParsed(`
    match
      $u isa unit, has uid "${safeId}", has tag $tag;
    select $tag;
  `).catch(() => [])
  const tags = tagRows.map((r) => r.tag as string).filter(Boolean)

  // ── Stage 3: capabilities — inline literal uid (TypeDB 3.x rejects `$var in [...]` syntax)
  // 3a: capability pairs for this unit
  const capPairRows = await readParsed(`
    match
      (provider: $u, offered: $s) isa capability;
      $u has uid "${safeId}";
      $s has skill-id $sid;
    select $sid;
  `).catch(() => [])

  const skillIds = [...new Set(capPairRows.map((r) => r.sid as string).filter(Boolean))]

  const skills: { name: string; price: number; tags: string[]; description?: string }[] = []

  if (skillIds.length > 0) {
    // OR-chain instead of `$sid in [...]` which is not valid TypeQL in 3.x
    const sidOr = skillIds.map((s) => `{$sid == "${s}";}`).join(' or ')

    // 3b: skill core attrs
    const skillAttrRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid;
        ${sidOr};
        $s has name $sn, has price $sp;
      select $sid, $sn, $sp;
    `).catch(() => [])

    // 3b-optional: skill descriptions (may not exist on every skill)
    const skillDescRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid;
        ${sidOr};
        $s has description $desc;
      select $sid, $desc;
    `).catch(() => [])

    const descBySid: Record<string, string> = {}
    for (const r of skillDescRows) {
      if (r.sid && r.desc) descBySid[r.sid as string] = r.desc as string
    }

    // 3c: skill tags
    const skillTagRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid;
        ${sidOr};
        $s has tag $tag;
      select $sid, $tag;
    `).catch(() => [])

    const tagsBySid: Record<string, string[]> = {}
    for (const r of skillTagRows) {
      const sid = r.sid as string | undefined
      if (sid) {
        tagsBySid[sid] = tagsBySid[sid] || []
        tagsBySid[sid].push(r.tag as string)
      }
    }

    for (const r of skillAttrRows) {
      const sid = r.sid as string | undefined
      if (!sid) continue
      skills.push({
        name: (r.sn as string) || sid,
        price: (r.sp as number) || 0,
        tags: tagsBySid[sid] || [],
        description: descBySid[sid],
      })
    }
  }

  // ── Stage 4: group membership — inline literal uid
  const membershipRows = await readParsed(`
    match
      (group: $g, member: $u) isa membership;
      $u has uid "${safeId}";
      $g has gid $gid;
    select $gid;
  `).catch(() => [])
  const group = membershipRows.length > 0 ? (membershipRows[0].gid as string) : 'standalone'

  const mergedTags = [...new Set([...tags, ...skills.flatMap((s) => s.tags)])].sort()

  return Response.json({
    id: safeId,
    name: unitName,
    group,
    model: unitModel,
    tags: mergedTags,
    skills,
    channels: [], // not stored in TypeDB — markdown-only field
    sensitivity,
    prompt: systemPrompt,
  })
}
