/**
 * GET /api/agents/list — Read agents from TypeDB (CF Workers compatible)
 *
 * Three-stage query pattern per discover.ts — avoids TypeDB 3.x planner
 * timeout on combined relation-join + attribute-filter + multi-attr projection.
 *
 * Returns all units with their skills, tags, group membership, and sensitivity.
 * Shape preserved for AgentList.tsx and DiscoverGrid.tsx consumers.
 */

import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'

interface AgentSummary {
  id: string
  name: string
  group: string
  model: string
  tags: string[]
  skills: { name: string; price: number; tags: string[] }[]
  channels: string[]
  sensitivity: number
  promptPreview: string
}

/** Inverse of agent-md.ts:173-177 sensitivity enum */
function sensitivityToNumber(ds: unknown): number {
  const map: Record<string, number> = {
    public: 0.3,
    internal: 0.5,
    confidential: 0.7,
    restricted: 0.9,
  }
  return typeof ds === 'string' ? (map[ds] ?? 0.5) : 0.5
}

export const GET: APIRoute = async () => {
  try {
    // STAGE 1: All units with basic attrs.
    // system-prompt is fetched separately (Stage 1b) because including it
    // here alongside other attrs hangs the TypeDB 3.x planner.
    const unitRows = await readParsed(`
      match
        $u isa unit, has uid $uid, has name $n, has model $m, has generation $g;
      select $uid, $n, $m, $g;
    `).catch(() => [])

    if (unitRows.length === 0) {
      return Response.json({ agents: [], groups: {}, tags: [], count: 0 })
    }

    // STAGE 1b: system-prompt separately — avoids planner hang when joined above.
    const promptRows = await readParsed(`
      match
        $u isa unit, has uid $uid, has system-prompt $sp;
      select $uid, $sp;
    `).catch(() => [])

    const promptByUid: Record<string, string> = {}
    for (const r of promptRows) {
      if (r.uid) promptByUid[r.uid as string] = r.sp as string
    }

    // STAGE 2: Unit tags.
    const unitTagRows = await readParsed(`
      match
        $u isa unit, has uid $uid, has tag $tag;
      select $uid, $tag;
    `).catch(() => [])

    const unitTagsByUid: Record<string, string[]> = {}
    for (const r of unitTagRows) {
      const uid = r.uid as string
      if (!unitTagsByUid[uid]) unitTagsByUid[uid] = []
      unitTagsByUid[uid].push(r.tag as string)
    }

    // STAGE 3: All capabilities (unit → skill pairs).
    const capRows = await readParsed(`
      match
        (provider: $u, offered: $s) isa capability;
        $u has uid $uid;
        $s has skill-id $sid;
      select $uid, $sid;
    `).catch(() => [])

    const capsByUid: Record<string, string[]> = {}
    for (const r of capRows) {
      const uid = r.uid as string
      if (!capsByUid[uid]) capsByUid[uid] = []
      capsByUid[uid].push(r.sid as string)
    }

    // STAGE 4: All skills with price.
    const skillRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid, has name $sn, has price $sp;
      select $sid, $sn, $sp;
    `).catch(() => [])

    const skillById: Record<string, { name: string; price: number }> = {}
    for (const r of skillRows) {
      skillById[r.sid as string] = { name: r.sn as string, price: (r.sp as number) || 0 }
    }

    // STAGE 5: Skill tags.
    const skillTagRows = await readParsed(`
      match
        $s isa skill, has skill-id $sid, has tag $tag;
      select $sid, $tag;
    `).catch(() => [])

    const skillTagsBySid: Record<string, string[]> = {}
    for (const r of skillTagRows) {
      const sid = r.sid as string
      if (!skillTagsBySid[sid]) skillTagsBySid[sid] = []
      skillTagsBySid[sid].push(r.tag as string)
    }

    // STAGE 6: Group membership.
    const memberRows = await readParsed(`
      match
        (group: $g, member: $u) isa membership;
        $g has gid $gid;
        $u has uid $uid;
      select $gid, $uid;
    `).catch(() => [])

    const groupByUid: Record<string, string> = {}
    for (const r of memberRows) {
      groupByUid[r.uid as string] = r.gid as string
    }

    // STAGE 7 (optional): data-sensitivity per unit.
    const sensitivityRows = await readParsed(`
      match
        $u isa unit, has uid $uid, has data-sensitivity $ds;
      select $uid, $ds;
    `).catch(() => [])

    const sensitivityByUid: Record<string, unknown> = {}
    for (const r of sensitivityRows) {
      sensitivityByUid[r.uid as string] = r.ds
    }

    // JS merge — build AgentSummary for each unit.
    const agents: AgentSummary[] = unitRows.map((r) => {
      const uid = r.uid as string
      const name = (r.n as string) || uid
      const group = groupByUid[uid] || 'standalone'

      const skillIds = capsByUid[uid] || []
      const skills = skillIds.map((sid) => ({
        name: skillById[sid]?.name || sid,
        price: skillById[sid]?.price || 0,
        tags: skillTagsBySid[sid] || [],
      }))

      const unitTags = unitTagsByUid[uid] || []
      const skillTags = skills.flatMap((s) => s.tags)
      const allTags = [...new Set([...unitTags, ...skillTags])]

      const rawPrompt = promptByUid[uid] || ''
      const promptPreview = rawPrompt.trim().slice(0, 200).replace(/\n/g, ' ')

      return {
        id: group !== 'standalone' ? `${group}:${name}` : name,
        name,
        group,
        model: (r.m as string) || 'default',
        tags: allTags,
        skills,
        channels: [],
        sensitivity: sensitivityToNumber(sensitivityByUid[uid]),
        promptPreview,
      }
    })

    agents.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))

    // Build group index.
    const groups: Record<string, AgentSummary[]> = {}
    for (const a of agents) {
      if (!groups[a.group]) groups[a.group] = []
      groups[a.group].push(a)
    }

    const allTags = [...new Set(agents.flatMap((a) => a.tags))].sort()

    return Response.json({ agents, groups, tags: allTags, count: agents.length })
  } catch {
    return Response.json({ agents: [], groups: {}, tags: [], count: 0 })
  }
}
