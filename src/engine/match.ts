/**
 * Multi-tag agent matching.
 *
 * The substrate's built-in `net.select(tag)` only looks at one tag at a time.
 * This module ranks every capable actor by (tag-set Jaccard) × (pheromone),
 * so a task tagged `[marketing, copy, P0]` prefers a actor that has proven
 * itself on *both* marketing and copy over one that only matches one tag.
 *
 * Pheromone is read from the in-memory world (`net.sense(edge)`), so scoring
 * is O(candidates × taskTags) and never touches the gateway.
 *
 * Returns an empty list when no actor has any tag overlap — the caller should
 * fall back to `ceo` (stage-3 router from `one/lifecycle-one.md`).
 */

import { readParsed } from '@/lib/typedb'
import type { World } from './world'

export interface AgentMatch {
  /** Actor id (matches `actor.aid` in TypeDB). */
  uid: string
  /** Combined score = jaccard × (1 + log1p(pheromone)). Higher is better. */
  score: number
  /** Tag-set Jaccard similarity in [0..1]. */
  jaccard: number
  /** Sum of strength on `loop→actor:tag` edges for overlap tags (0 means cold start). */
  pheromone: number
  /** Tags shared between task and actor (the reason this actor was considered). */
  overlapTags: string[]
}

type UnitTagRow = { aid: string; t: string }

let unitTagCache: { ts: number; data: Map<string, Set<string>> } | null = null
const CACHE_TTL_MS = 10_000

/**
 * Load each actor's tag set (union of tags on the actor itself + tags on its
 * offered capabilities). Cached in-process for 10s because new actors rarely
 * appear between ticks and each query costs one gateway round-trip.
 */
async function loadUnitTags(): Promise<Map<string, Set<string>>> {
  const now = Date.now()
  if (unitTagCache && now - unitTagCache.ts < CACHE_TTL_MS) {
    return unitTagCache.data
  }

  const data = new Map<string, Set<string>>()

  try {
    // Union: tags on the actor + tags on any skill the actor offers.
    const rows = (await readParsed(`
      match
        $u isa actor, has aid $aid;
        { $u has tag $t; } or
        { (provider: $u, offered: $s) isa capability; $s has tag $t; };
      select $aid, $t;
    `)) as UnitTagRow[]

    for (const row of rows) {
      if (!row.aid || !row.t) continue
      if (!data.has(row.aid)) data.set(row.aid, new Set())
      data.get(row.aid)!.add(row.t)
    }
  } catch {
    // Gateway down / schema mismatch → return whatever's cached (may be empty).
    // Callers see no matches and fall back to CEO routing.
    if (unitTagCache) return unitTagCache.data
  }

  unitTagCache = { ts: now, data }
  return data
}

/** Clear the in-process cache. Useful in tests and right after agent-sync. */
export function invalidateMatchCache(): void {
  unitTagCache = null
}

/**
 * Rank actors by fit for a task. Returns top N sorted by score descending.
 * Never throws; empty list means no candidate.
 */
export async function rankAgents(net: World, taskTags: string[], limit = 3): Promise<AgentMatch[]> {
  if (!taskTags || taskTags.length === 0) return []

  const unitTags = await loadUnitTags()
  if (unitTags.size === 0) return []

  const taskTagSet = new Set(taskTags)
  const matches: AgentMatch[] = []

  for (const [uid, caps] of unitTags) {
    const overlapTags: string[] = []
    for (const tag of caps) if (taskTagSet.has(tag)) overlapTags.push(tag)
    if (overlapTags.length === 0) continue

    const union = caps.size + taskTagSet.size - overlapTags.length
    const jaccard = union > 0 ? overlapTags.length / union : 0

    // Pheromone: sum of `loop→uid:tag` strengths for each overlap tag.
    // Falls back to `loop→uid` if no skill-scoped paths exist yet.
    let pheromone = 0
    for (const tag of overlapTags) {
      pheromone += net.sense(`loop→${uid}:${tag}`)
    }
    if (pheromone === 0) pheromone = net.sense(`loop→${uid}`)

    const score = jaccard * (1 + Math.log1p(pheromone))
    matches.push({ uid, score, jaccard, pheromone, overlapTags })
  }

  matches.sort((a, b) => b.score - a.score)
  return matches.slice(0, limit)
}

/**
 * Pick the single best agent. Returns null if no actor shares any tag with
 * the task — the caller should then signal CEO for fallback routing.
 */
export async function pickBest(net: World, taskTags: string[]): Promise<string | null> {
  const [best] = await rankAgents(net, taskTags, 1)
  return best?.uid ?? null
}
