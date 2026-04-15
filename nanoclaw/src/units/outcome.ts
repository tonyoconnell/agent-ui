/**
 * chat:outcome — detect valence of incoming message vs last bot reply → mark/warn.
 *
 * Called at the START of each turn (before recall + respond).
 * If the previous message in the group was from the bot, this new message
 * is the "outcome" of that turn — we can measure it and deposit pheromone.
 *
 * valence > 0.3  → mark(actor, tag) for each tag in last turn
 * valence < -0.3 → warn(actor, tag) for each tag in last turn
 * otherwise      → neutral, no deposit
 */

import { detectValence } from '../lib/classify-fallback'
import { mark, warn } from '../lib/substrate'
import type { Env } from '../types'

export async function measureOutcome(
  env: Env,
  actorUid: string,
  groupId: string,
  newMessageContent: string,
): Promise<void> {
  // Look up the last bot reply + the tags we used for that turn
  const lastBot = await env.DB.prepare(
    `SELECT content FROM messages WHERE group_id = ? AND role = 'assistant' ORDER BY ts DESC LIMIT 1`,
  )
    .bind(groupId)
    .first()
    .catch(() => null)

  if (!lastBot) return // no prior bot reply → nothing to measure

  // Look up tags stored for the last user turn in this group
  const lastTags = await env.DB.prepare(
    `SELECT tags FROM turn_meta WHERE group_id = ? ORDER BY ts DESC LIMIT 1`,
  )
    .bind(groupId)
    .first()
    .catch(() => null)

  if (!lastTags?.tags) return // no tag metadata → can't deposit on right paths

  const tags = (lastTags.tags as string).split(',').filter(Boolean)
  if (tags.length === 0) return

  const valence = detectValence(newMessageContent)

  if (valence > 0.3) {
    // Positive engagement → strengthen actor→tag paths
    await Promise.all(tags.map((tag) => mark(env, actorUid, tag, valence).catch(() => {})))
  } else if (valence < -0.3) {
    // Correction/disagreement → resist actor→tag paths
    await Promise.all(tags.map((tag) => warn(env, actorUid, tag, Math.abs(valence)).catch(() => {})))
  }
  // Otherwise neutral — no deposit (silence, task requests)
}
