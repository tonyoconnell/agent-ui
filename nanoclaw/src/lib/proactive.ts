/**
 * Proactive messaging — agents push signals back to students.
 * Resolves student uid → group_id → channel send.
 * Used by Welcome (onboarding drip), Upsell (milestone triggers), Assessment (weekly summary).
 */

import { send } from '../channels'
import type { Env } from '../types'

/** Send a proactive message to a student by their uid */
export async function sendToStudent(env: Env, uid: string, message: string): Promise<boolean> {
  // Look up the student's most recent group_id from their profile
  const row = await env.DB.prepare('SELECT group_id FROM student_profiles WHERE uid = ?').bind(uid).first()

  const groupId = row?.group_id as string | null
  if (!groupId) return false

  await send(env, groupId, message)
  return true
}

/** Send a proactive message to all students matching a filter */
export async function broadcastToStudents(
  env: Env,
  filter: { onboardingStage?: string; minSessions?: number },
  message: string,
): Promise<number> {
  let query = 'SELECT uid, group_id FROM student_profiles WHERE group_id IS NOT NULL'
  const binds: unknown[] = []

  if (filter.onboardingStage) {
    query += ' AND onboarding_stage = ?'
    binds.push(filter.onboardingStage)
  }
  if (filter.minSessions) {
    query += ' AND session_count >= ?'
    binds.push(filter.minSessions)
  }

  const rows = await env.DB.prepare(query)
    .bind(...binds)
    .all()
  let sent = 0

  for (const row of rows.results || []) {
    const gid = row.group_id as string
    if (gid) {
      await send(env, gid, message).catch(() => {})
      sent++
    }
  }

  return sent
}
