/**
 * chat:recall — three-parallel memory query → ContextPack.
 *
 * Episodic:    D1 messages table (last 20 in group)
 * Associative: TypeDB paths FROM actor uid (actorHighways)
 * Semantic:    TypeDB hypotheses ABOUT actor uid (recallHypotheses)
 *
 * All three run in parallel. Empty results are valid (cold start).
 */

import { actorHighways, recallHypotheses } from '../lib/substrate'
import type { ContextPack } from './types'
import type { Env } from '../types'

export async function recall(
  env: Env,
  groupId: string,
  actorUid: string,
  handle: string,
): Promise<ContextPack> {
  // Three parallel queries — no LLM call
  const [recentRows, highways, hypotheses] = await Promise.all([
    // 1. Episodic: last 20 messages in this conversation group
    env.DB.prepare(
      `SELECT role, content FROM messages WHERE group_id = ? ORDER BY ts DESC LIMIT 20`,
    )
      .bind(groupId)
      .all()
      .then((r) =>
        (r.results || [])
          .reverse()
          .map((row) => ({ role: row.role as string, content: row.content as string })),
      )
      .catch(() => [] as { role: string; content: string }[]),

    // 2. Associative: top paths from this actor
    actorHighways(env, actorUid, 10).catch(() => [] as { to: string; strength: number }[]),

    // 3. Semantic: hypotheses about this actor
    recallHypotheses(env, actorUid).catch(
      () => [] as { predicate: string; object: string; confidence: number }[],
    ),
  ])

  // Count messages in this group for the profile
  const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages WHERE group_id = ?`)
    .bind(groupId)
    .first()
    .catch(() => null)
  const messageCount = (countRow?.cnt as number) || 0

  return {
    profile: { uid: actorUid, handle, messageCount },
    hypotheses,
    highways,
    recent: recentRows,
    tools: [], // populated by router from group context capabilities
  }
}
