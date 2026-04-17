/**
 * Owner Notifications — alert claw owners when students message.
 *
 * Alert levels:
 *   off             — no alerts
 *   first           — only first message from a new student
 *   low-confidence  — first message + low-confidence responses
 *   all             — every incoming student message (summary, not full text)
 */

import { send } from '../channels'
import type { Env } from '../types'

export type AlertLevel = 'off' | 'first' | 'low-confidence' | 'all'

interface OwnerConfig {
  clawId: string
  ownerChannel: string
  ownerGroupId: string
  alertLevel: AlertLevel
}

/** Look up the owner config for this worker */
async function getOwnerConfig(env: Env): Promise<OwnerConfig | null> {
  const clawId = env.BOT_PERSONA || 'default'
  const row = await env.DB.prepare('SELECT * FROM claw_owners WHERE claw_id = ?').bind(clawId).first()
  if (!row) return null
  return {
    clawId: row.claw_id as string,
    ownerChannel: row.owner_channel as string,
    ownerGroupId: row.owner_group_id as string,
    alertLevel: (row.alert_level as AlertLevel) || 'all',
  }
}

/** Register or update owner notification config */
export async function registerOwner(
  env: Env,
  ownerChannel: string,
  ownerGroupId: string,
  alertLevel: AlertLevel = 'all',
): Promise<void> {
  const clawId = env.BOT_PERSONA || 'default'
  await env.DB.prepare(
    `INSERT OR REPLACE INTO claw_owners (claw_id, owner_channel, owner_group_id, alert_level, created_at)
     VALUES (?, ?, ?, ?, unixepoch())`,
  )
    .bind(clawId, ownerChannel, ownerGroupId, alertLevel)
    .run()
}

/**
 * Notify the claw owner about an incoming student message.
 * Called fire-and-forget from afterResponse — never blocks the student.
 */
export async function notifyOwner(
  env: Env,
  opts: {
    studentName: string
    studentMessage: string
    groupId: string
    reply: string
    confidence?: number
    isFirstMessage?: boolean
  },
): Promise<void> {
  const config = await getOwnerConfig(env)
  if (!config || config.alertLevel === 'off') return

  // Don't notify the owner about their own messages
  if (opts.groupId === config.ownerGroupId) return

  const shouldNotify =
    config.alertLevel === 'all' ||
    (config.alertLevel === 'first' && opts.isFirstMessage) ||
    (config.alertLevel === 'low-confidence' &&
      (opts.isFirstMessage || (opts.confidence !== undefined && opts.confidence <= 0.7)))

  if (!shouldNotify) return

  // Build a short digest — not the full conversation
  const studentSnippet =
    opts.studentMessage.length > 80 ? `${opts.studentMessage.slice(0, 77)}...` : opts.studentMessage
  const replySnippet = opts.reply.length > 100 ? `${opts.reply.slice(0, 97)}...` : opts.reply

  const tag = opts.isFirstMessage ? '🆕 New student' : '💬 Message'
  const confTag = opts.confidence !== undefined && opts.confidence <= 0.7 ? ' ⚠️ low confidence' : ''

  const alert = `${tag}${confTag}\n\nFrom: ${opts.studentName}\n> ${studentSnippet}\n\nReply:\n${replySnippet}`

  await send(env, config.ownerGroupId, alert).catch(() => {})
}
