/**
 * /memory command — show what the substrate knows about this user.
 *
 * Queries: hypotheses + highways + message count.
 * Formats as a readable text card for Telegram/Discord.
 */

import { actorHighways, recallHypotheses } from '../lib/substrate'
import type { Env } from '../types'

export async function handleMemoryCommand(
  actorUid: string,
  handle: string,
  groupId: string,
  env: Env,
): Promise<string> {
  const [hypotheses, highways] = await Promise.all([
    recallHypotheses(env, actorUid).catch(() => []),
    actorHighways(env, actorUid, 5).catch(() => []),
  ])

  const countRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM messages WHERE group_id = ?`)
    .bind(groupId)
    .first()
    .catch(() => null)
  const msgCount = (countRow?.cnt as number) || 0

  const lines: string[] = [`Memory for ${handle} (${msgCount} messages)`]

  if (hypotheses.length === 0 && highways.length === 0) {
    lines.push('\nNothing learned yet. Chat more to build a profile!')
    return lines.join('\n')
  }

  // High-confidence facts (direct quotes)
  const confident = hypotheses.filter((h) => h.confidence >= 0.85)
  if (confident.length > 0) {
    lines.push('\nWhat I know:')
    for (const h of confident) {
      lines.push(`  [${h.status}] ${h.statement} (${Math.round(h.confidence * 100)}%)`)
    }
  }

  // Lower-confidence hints (softer language)
  const hints = hypotheses.filter((h) => h.confidence >= 0.5 && h.confidence < 0.85)
  if (hints.length > 0) {
    lines.push('\nWhat I think (less certain):')
    for (const h of hints) {
      lines.push(`  possibly: ${h.statement} (${Math.round(h.confidence * 100)}%)`)
    }
  }

  // Top interests by path strength
  if (highways.length > 0) {
    lines.push('\nTop interests:')
    for (const hw of highways) {
      lines.push(`  ${hw.to} (strength: ${hw.strength.toFixed(1)})`)
    }
  }

  lines.push('\n/forget to erase  /explore to discover new topics')
  return lines.join('\n')
}
