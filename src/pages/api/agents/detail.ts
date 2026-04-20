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

// ── In-process cache (SWR) ─────────────────────────────────────────────────
// Agent details change rarely (only on markdown re-sync). Cold build ~5s;
// warm <10ms. Stale bytes serve instantly past TTL while a background
// refresh runs — so once warmed, a detail is effectively always instant.
type CacheEntry = { json: string; ts: number }
const FRESH_TTL = 60_000
const STALE_TTL = 600_000
type GlobalCache = {
  _agentDetailCache?: Map<string, CacheEntry>
  _agentDetailInflight?: Map<string, Promise<Response>>
}
const g = globalThis as unknown as GlobalCache
const cache = (g._agentDetailCache ??= new Map())
const inflight = (g._agentDetailInflight ??= new Map())

function cachedResponse(json: string, age: 'HIT' | 'STALE' | 'MISS'): Response {
  return new Response(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      'X-Cache': age,
    },
  })
}

/** Warm a detail in the background. No-op if already inflight. Used by /list
 *  to preload the visible slice so first click is instant. */
export function prewarmDetail(safeId: string): void {
  if (inflight.has(safeId)) return
  const hit = cache.get(safeId)
  if (hit && Date.now() - hit.ts < FRESH_TTL) return
  const work = buildDetail(safeId).finally(() => inflight.delete(safeId))
  inflight.set(safeId, work)
  work.catch(() => {})
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id parameter required' }, { status: 400 })
  }

  // Sanitise: reject any id containing quote characters to prevent TQL injection
  const safeId = id.replace(/["\\]/g, '')

  const now = Date.now()
  const hit = cache.get(safeId)

  // Fresh — instant HIT.
  if (hit && now - hit.ts < FRESH_TTL) {
    return cachedResponse(hit.json, 'HIT')
  }

  // Stale — serve instantly, refresh in background.
  if (hit && now - hit.ts < STALE_TTL) {
    prewarmDetail(safeId)
    return cachedResponse(hit.json, 'STALE')
  }

  // Truly cold — dedup + block.
  const pending = inflight.get(safeId)
  if (pending) return pending.then((r) => r.clone())

  const work = buildDetail(safeId).finally(() => inflight.delete(safeId))
  inflight.set(safeId, work)
  return work.then((r) => r.clone())
}

async function buildDetail(safeId: string): Promise<Response> {
  // ── Stages 1-4 (independent, uid-keyed): fan out in parallel ─────────────
  // Each stage is its own TypeDB query; the gateway handles each in ~1-8s.
  // Serial = sum of latencies (~30-40s). Parallel = max latency (~8s).
  const [unitRows, sensitivityRows, tagRows, capPairRows, membershipRows] = await Promise.all([
    readParsed(`
      match
        $u isa unit, has uid "${safeId}",
          has name $name, has model $model, has system-prompt $sp;
      select $name, $model, $sp;
    `).catch(() => []),
    readParsed(`
      match
        $u isa unit, has uid "${safeId}", has data-sensitivity $ds;
      select $ds;
    `).catch(() => []),
    readParsed(`
      match
        $u isa unit, has uid "${safeId}", has tag $tag;
      select $tag;
    `).catch(() => []),
    // Planner-friendly order: hoist projected-attribute bindings above the
    // relation pattern. With ($u has uid ...) at the top the planner fans
    // out from the unit across all capabilities before projecting skill-id,
    // which hangs >30s on cold paths. Binding `$s has skill-id $sid` first
    // gives the planner a concrete start set. See memory: typedb_planner_trio.
    readParsed(`
      match
        $s isa skill, has skill-id $sid;
        (provider: $u, offered: $s) isa capability;
        $u has uid "${safeId}";
      select $sid;
    `).catch(() => []),
    readParsed(`
      match
        $g isa group, has gid $gid;
        (group: $g, member: $u) isa membership;
        $u has uid "${safeId}";
      select $gid;
    `).catch(() => []),
  ])

  if (unitRows.length === 0) {
    return Response.json({ error: 'Agent not found' }, { status: 404 })
  }

  const unitRow = unitRows[0]
  const unitName = (unitRow.name as string) || safeId
  const unitModel = (unitRow.model as string) || 'default'
  const systemPrompt = (unitRow.sp as string) || ''

  const sensitivity = sensitivityRows.length > 0 ? sensitivityToNumber(sensitivityRows[0].ds) : 0.5
  const tags = tagRows.map((r) => r.tag as string).filter(Boolean)

  const skillIds = [...new Set(capPairRows.map((r) => r.sid as string).filter(Boolean))]

  const skills: { name: string; price: number; tags: string[]; description?: string }[] = []

  if (skillIds.length > 0) {
    // OR-chain instead of `$sid in [...]` which is not valid TypeQL in 3.x
    const sidOr = skillIds.map((s) => `{$sid == "${s}";}`).join(' or ')

    // 3b/3b-desc/3c are all keyed on the same sidOr — fan out in parallel.
    const [skillAttrRows, skillDescRows, skillTagRows] = await Promise.all([
      readParsed(`
        match
          $s isa skill, has skill-id $sid;
          ${sidOr};
          $s has name $sn, has price $sp;
        select $sid, $sn, $sp;
      `).catch(() => []),
      readParsed(`
        match
          $s isa skill, has skill-id $sid;
          ${sidOr};
          $s has description $desc;
        select $sid, $desc;
      `).catch(() => []),
      readParsed(`
        match
          $s isa skill, has skill-id $sid;
          ${sidOr};
          $s has tag $tag;
        select $sid, $tag;
      `).catch(() => []),
    ])

    const descBySid: Record<string, string> = {}
    for (const r of skillDescRows) {
      if (r.sid && r.desc) descBySid[r.sid as string] = r.desc as string
    }

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

  const group = membershipRows.length > 0 ? (membershipRows[0].gid as string) : 'standalone'

  const mergedTags = [...new Set([...tags, ...skills.flatMap((s) => s.tags)])].sort()

  const payload = {
    id: safeId,
    name: unitName,
    group,
    model: unitModel,
    tags: mergedTags,
    skills,
    channels: [], // not stored in TypeDB — markdown-only field
    sensitivity,
    prompt: systemPrompt,
  }

  const json = JSON.stringify(payload)
  cache.set(safeId, { json, ts: Date.now() })
  return cachedResponse(json, 'MISS')
}
