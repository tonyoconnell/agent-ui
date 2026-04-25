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
import { prewarmDetail } from './detail'

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

// Stale-while-revalidate in-process cache. Once the list is warmed ONE time,
// every subsequent hit is ~0ms — even past TTL we serve stale bytes and kick
// off a background refresh. Cache effectively never goes cold under traffic.
//
// IMPORTANT: `inflight` caches the JSON payload, NOT the Response object.
// Workerd blocks cross-request stream reads even with `Response.clone()` —
// every request must build its own Response from the shared payload value.
declare global {
  var _agentListCache: Map<number, { v: Record<string, unknown>; ts: number }> | undefined
  var _agentListInflight: Map<number, Promise<Record<string, unknown>>> | undefined
  var _agentListWarmed: boolean | undefined
}
const FRESH_TTL = 60_000 // serve as HIT if younger than this
const STALE_TTL = 600_000 // serve stale (with SWR) up to 10 min past fresh
// Defensive init: previous module versions may have populated globalThis with
// a plain object (pre-SWR shape). Replace if the current value isn't a Map so
// HMR reloads don't crash with `cache.get is not a function`.
if (!(globalThis._agentListCache instanceof Map)) {
  globalThis._agentListCache = new Map()
}
if (!(globalThis._agentListInflight instanceof Map)) {
  globalThis._agentListInflight = new Map()
}
const cache = globalThis._agentListCache
const inflight = globalThis._agentListInflight

const DEFAULT_LIMIT = 50

// Build a fresh Response per request from a shared payload. Workerd's I/O
// barrier means a Response built in request A can't be read by request B
// even via clone() — so the inflight cache stores payloads, not Responses,
// and each requester serializes its own bytes here.
function payloadResponse(v: Record<string, unknown>, age: 'HIT' | 'STALE' | 'MISS'): Response {
  return new Response(JSON.stringify(v), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      'X-Cache': age,
    },
  })
}

// Kick off a background refresh (no awaited Response — caller already returned).
function refreshInBackground(limit: number) {
  if (inflight.has(limit)) return
  const work = buildList(limit).finally(() => inflight.delete(limit))
  inflight.set(limit, work)
  work.catch(() => {}) // swallow errors; cache stays stale until next refresh
}

export const GET: APIRoute = async ({ url }) => {
  const raw = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 500) : DEFAULT_LIMIT

  const now = Date.now()
  const hit = cache.get(limit)

  // Fresh — instant HIT.
  if (hit && now - hit.ts < FRESH_TTL) {
    return payloadResponse(hit.v, 'HIT')
  }

  // Stale but usable — serve now, refresh in background (SWR).
  if (hit && now - hit.ts < STALE_TTL) {
    refreshInBackground(limit)
    return payloadResponse(hit.v, 'STALE')
  }

  // Truly cold — dedup concurrent builds, block on one. Each requester
  // builds its own Response from the shared payload (workerd I/O barrier).
  const pending = inflight.get(limit)
  if (pending) return payloadResponse(await pending, 'MISS')
  const work = buildList(limit).finally(() => inflight.delete(limit))
  inflight.set(limit, work)
  return payloadResponse(await work, 'MISS')
}

// Kick off a warm-up on module load so the FIRST user of a fresh isolate
// doesn't pay the 9s TypeDB round-trip. Only fires once per isolate.
if (!globalThis._agentListWarmed) {
  globalThis._agentListWarmed = true
  refreshInBackground(DEFAULT_LIMIT)
}

// Build the payload value (not a Response). Callers wrap in a fresh
// Response per request — see payloadResponse + workerd I/O note above.
async function buildList(limit: number): Promise<Record<string, unknown>> {
  const now = Date.now()

  try {
    // All non-cap stages run in parallel — they're independent reads.
    // Split into separate queries (not joined) because TypeDB 3.x's planner
    // hangs on relation-join + multi-attr projection in a single match.
    //
    // The cap join `(provider:, offered:) isa capability` with BOTH $uid and
    // $sid projected and unbound hangs >30s at the gateway (verified 2026-04-20)
    // — the planner can't handle the double-unbound cross-side projection.
    // Solution: fetch units first, slice to the visible window, then fan out
    // per-unit cap queries with a concrete uid literal (which IS fast — see
    // /api/agents/detail.ts). See memory: typedb_attr_before_relation.
    const unitPromise = readParsed(`
        match
          $u isa unit, has uid $uid, has name $n, has model $m, has generation $g;
        select $uid, $n, $m, $g;
      `).catch(() => [])

    const othersPromise = Promise.all([
      readParsed(`
        match
          $u isa unit, has uid $uid, has system-prompt $sp;
        select $uid, $sp;
      `).catch(() => []),
      readParsed(`
        match
          $u isa unit, has uid $uid, has tag $tag;
        select $uid, $tag;
      `).catch(() => []),
      readParsed(`
        match
          $s isa skill, has skill-id $sid, has name $sn, has price $sp;
        select $sid, $sn, $sp;
      `).catch(() => []),
      readParsed(`
        match
          $s isa skill, has skill-id $sid, has tag $tag;
        select $sid, $tag;
      `).catch(() => []),
      readParsed(`
        match
          $g isa group, has gid $gid;
          (group: $g, member: $u) isa membership;
          $u has uid $uid;
        select $gid, $uid;
      `).catch(() => []),
      readParsed(`
        match
          $u isa unit, has uid $uid, has data-sensitivity $ds;
        select $uid, $ds;
      `).catch(() => []),
    ])

    // Kick off cap queries as soon as we know the visible uid slice —
    // don't wait for the other 6 queries to finish.
    const capPromise = unitPromise.then(async (rows) => {
      rows.sort((a, b) => String(a.uid).localeCompare(String(b.uid)))
      const slice = rows.slice(0, limit)
      const visibleUids = slice.map((r) => r.uid as string).filter(Boolean)
      const pairs: { uid: string; sid: string }[] = []
      const POOL = 8
      for (let i = 0; i < visibleUids.length; i += POOL) {
        const batch = visibleUids.slice(i, i + POOL)
        const batchResults = await Promise.all(
          batch.map((uid) =>
            readParsed(`
              match
                $s isa skill, has skill-id $sid;
                (provider: $u, offered: $s) isa capability;
                $u has uid "${uid.replace(/["\\]/g, '')}";
              select $sid;
            `).catch(() => []),
          ),
        )
        batchResults.forEach((br, idx) => {
          const uid = batch[idx]
          for (const r of br) if (r.sid) pairs.push({ uid, sid: r.sid as string })
        })
      }
      return pairs
    })

    const [unitRows, [promptRows, unitTagRows, skillRows, skillTagRows, memberRows, sensitivityRows], capPairs] =
      await Promise.all([unitPromise, othersPromise, capPromise])

    if (unitRows.length === 0) {
      const empty = { agents: [], groups: {}, tags: [], count: 0, _limit: limit }
      cache.set(limit, { v: empty, ts: now })
      return empty
    }

    // Sort by uid first so the slice is stable across reloads, then cap.
    // Keeping this before the JS merge means we only pay merge cost for the
    // agents we're actually returning.
    unitRows.sort((a, b) => String(a.uid).localeCompare(String(b.uid)))
    const totalUnits = unitRows.length
    const capped = unitRows.slice(0, limit)
    const visibleUids = new Set(capped.map((r) => r.uid as string))

    // Skip unit-scoped merges for uids outside the visible slice — this is
    // where the JS-side speedup comes from when the system has 100s of agents.
    const promptByUid: Record<string, string> = {}
    for (const r of promptRows) {
      const uid = r.uid as string
      if (uid && visibleUids.has(uid)) promptByUid[uid] = r.sp as string
    }

    const unitTagsByUid: Record<string, string[]> = {}
    for (const r of unitTagRows) {
      const uid = r.uid as string
      if (!visibleUids.has(uid)) continue
      if (!unitTagsByUid[uid]) unitTagsByUid[uid] = []
      unitTagsByUid[uid].push(r.tag as string)
    }

    const capsByUid: Record<string, string[]> = {}
    for (const p of capPairs) {
      if (!visibleUids.has(p.uid)) continue
      if (!capsByUid[p.uid]) capsByUid[p.uid] = []
      capsByUid[p.uid].push(p.sid)
    }

    const skillById: Record<string, { name: string; price: number }> = {}
    for (const r of skillRows) {
      skillById[r.sid as string] = { name: r.sn as string, price: (r.sp as number) || 0 }
    }

    const skillTagsBySid: Record<string, string[]> = {}
    for (const r of skillTagRows) {
      const sid = r.sid as string
      if (!skillTagsBySid[sid]) skillTagsBySid[sid] = []
      skillTagsBySid[sid].push(r.tag as string)
    }

    const groupByUid: Record<string, string> = {}
    for (const r of memberRows) {
      const uid = r.uid as string
      if (visibleUids.has(uid)) groupByUid[uid] = r.gid as string
    }

    const sensitivityByUid: Record<string, unknown> = {}
    for (const r of sensitivityRows) {
      const uid = r.uid as string
      if (visibleUids.has(uid)) sensitivityByUid[uid] = r.ds
    }

    // JS merge — build AgentSummary for the capped slice only.
    const agents: AgentSummary[] = capped.map((r) => {
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

    // `count` reports visible agents; `total` exposes the full set so the UI
    // can show e.g. "Showing 50 of 247 agents" if we want that later.
    const payload = {
      agents,
      groups,
      tags: allTags,
      count: agents.length,
      total: totalUnits,
      _limit: limit,
    }
    cache.set(limit, { v: payload, ts: now })

    // Preload the detail cache for the top visible agents. Spread over a
    // short window so we don't stampede the gateway — one every 50ms.
    // Only preload the first 8; that covers the fold for typical viewports.
    for (const [idx, a] of agents.slice(0, 8).entries()) {
      setTimeout(() => prewarmDetail(a.id), idx * 50)
    }

    return payload
  } catch {
    return { agents: [], groups: {}, tags: [], count: 0 }
  }
}
