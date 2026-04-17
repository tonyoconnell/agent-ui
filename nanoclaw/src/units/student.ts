/**
 * Student memory — per-student profiles that persist across sessions.
 *
 * Every message from a known student updates their profile.
 * Assessment data (from Amara's side-car) accumulates here.
 * The substrate reads this to personalize routing + responses.
 */

import type { Env } from '../types'

export interface StudentProfile {
  uid: string
  handle: string
  groupId: string | null
  firstSeen: number
  lastSeen: number
  sessionCount: number
  pillar: string | null
  level: string | null
  goals: string | null
  mistakes: string[]
  vocab: string[]
  strengths: string[]
  onboardingStage: 'new' | 'welcomed' | 'first-session' | 'active' | 'churning'
  notes: string | null
}

/** Get or create a student profile */
export async function getStudent(env: Env, uid: string, handle?: string, groupId?: string): Promise<StudentProfile> {
  const row = await env.DB.prepare('SELECT * FROM student_profiles WHERE uid = ?').bind(uid).first()

  if (row) {
    // Update last_seen + session_count, and group_id if provided
    if (groupId) {
      env.DB.prepare(
        'UPDATE student_profiles SET last_seen = ?, session_count = session_count + 1, group_id = ? WHERE uid = ?',
      )
        .bind(Date.now(), groupId, uid)
        .run()
        .catch(() => {})
    } else {
      env.DB.prepare('UPDATE student_profiles SET last_seen = ?, session_count = session_count + 1 WHERE uid = ?')
        .bind(Date.now(), uid)
        .run()
        .catch(() => {})
    }
    return rowToProfile(row)
  }

  // New student — create profile
  const now = Date.now()
  await env.DB.prepare(
    `INSERT INTO student_profiles (uid, handle, group_id, first_seen, last_seen, session_count, onboarding_stage)
     VALUES (?, ?, ?, ?, ?, 1, 'new')`,
  )
    .bind(uid, handle || uid, groupId || null, now, now)
    .run()

  return {
    uid,
    handle: handle || uid,
    groupId: groupId || null,
    firstSeen: now,
    lastSeen: now,
    sessionCount: 1,
    pillar: null,
    level: null,
    goals: null,
    mistakes: [],
    vocab: [],
    strengths: [],
    onboardingStage: 'new',
    notes: null,
  }
}

/** Update student profile fields */
export async function updateStudent(
  env: Env,
  uid: string,
  updates: Partial<Pick<StudentProfile, 'pillar' | 'level' | 'goals' | 'onboardingStage' | 'notes'>>,
): Promise<void> {
  const sets: string[] = []
  const vals: unknown[] = []
  if (updates.pillar !== undefined) {
    sets.push('pillar = ?')
    vals.push(updates.pillar)
  }
  if (updates.level !== undefined) {
    sets.push('level = ?')
    vals.push(updates.level)
  }
  if (updates.goals !== undefined) {
    sets.push('goals = ?')
    vals.push(updates.goals)
  }
  if (updates.onboardingStage !== undefined) {
    sets.push('onboarding_stage = ?')
    vals.push(updates.onboardingStage)
  }
  if (updates.notes !== undefined) {
    sets.push('notes = ?')
    vals.push(updates.notes)
  }
  if (sets.length === 0) return
  vals.push(uid)
  await env.DB.prepare(`UPDATE student_profiles SET ${sets.join(', ')} WHERE uid = ?`)
    .bind(...vals)
    .run()
}

/** Record Amara side-car data from a tutoring session */
export async function recordSidecar(
  env: Env,
  uid: string,
  groupId: string,
  sidecar: { mistakes?: string[]; newVocab?: string[]; praise?: string; lessonTag?: string; flag?: string },
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO amara_sidecar (uid, group_id, mistakes, new_vocab, praise, lesson_tag, flag, ts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      uid,
      groupId,
      JSON.stringify(sidecar.mistakes || []),
      JSON.stringify(sidecar.newVocab || []),
      sidecar.praise || null,
      sidecar.lessonTag || null,
      sidecar.flag || null,
      Date.now(),
    )
    .run()

  // Merge into student profile (append new mistakes/vocab, dedupe)
  const profile = await env.DB.prepare('SELECT mistakes, vocab, strengths FROM student_profiles WHERE uid = ?')
    .bind(uid)
    .first()
  if (!profile) return

  const existingMistakes: string[] = JSON.parse((profile.mistakes as string) || '[]')
  const existingVocab: string[] = JSON.parse((profile.vocab as string) || '[]')
  const existingStrengths: string[] = JSON.parse((profile.strengths as string) || '[]')

  const newMistakes = [...new Set([...existingMistakes, ...(sidecar.mistakes || [])].slice(-50))]
  const newVocab = [...new Set([...existingVocab, ...(sidecar.newVocab || [])].slice(-100))]
  const newStrengths = sidecar.praise
    ? [...new Set([...existingStrengths, sidecar.praise].slice(-20))]
    : existingStrengths

  await env.DB.prepare('UPDATE student_profiles SET mistakes = ?, vocab = ?, strengths = ? WHERE uid = ?')
    .bind(JSON.stringify(newMistakes), JSON.stringify(newVocab), JSON.stringify(newStrengths), uid)
    .run()
}

/** Get recent side-car entries for a student (for Assessment agent) */
export async function getRecentSidecar(
  env: Env,
  uid: string,
  limit = 20,
): Promise<Array<{ mistakes: string[]; newVocab: string[]; praise: string; lessonTag: string; ts: number }>> {
  const rows = await env.DB.prepare(
    'SELECT mistakes, new_vocab, praise, lesson_tag, ts FROM amara_sidecar WHERE uid = ? ORDER BY ts DESC LIMIT ?',
  )
    .bind(uid, limit)
    .all()

  return (rows.results || []).map((r) => ({
    mistakes: JSON.parse((r.mistakes as string) || '[]'),
    newVocab: JSON.parse((r.new_vocab as string) || '[]'),
    praise: (r.praise as string) || '',
    lessonTag: (r.lesson_tag as string) || '',
    ts: r.ts as number,
  }))
}

/** Build a student context string for injection into system prompts */
export function studentContext(profile: StudentProfile): string {
  const parts: string[] = []
  parts.push(`Student: ${profile.handle}`)
  parts.push(`Sessions: ${profile.sessionCount}`)
  if (profile.groupId) parts.push(`Channel: ${profile.groupId}`)
  if (profile.pillar) parts.push(`Program: ${profile.pillar}`)
  if (profile.level) parts.push(`Level: ${profile.level}`)
  if (profile.goals) parts.push(`Goals: ${profile.goals}`)
  if (profile.onboardingStage !== 'active') parts.push(`Stage: ${profile.onboardingStage}`)
  if (profile.mistakes.length > 0) parts.push(`Recent mistakes: ${profile.mistakes.slice(-5).join(', ')}`)
  if (profile.vocab.length > 0) parts.push(`Recent vocab: ${profile.vocab.slice(-10).join(', ')}`)
  if (profile.strengths.length > 0) parts.push(`Strengths: ${profile.strengths.slice(-3).join(', ')}`)
  return parts.join('\n')
}

function rowToProfile(row: Record<string, unknown>): StudentProfile {
  return {
    uid: row.uid as string,
    handle: row.handle as string,
    groupId: (row.group_id as string) || null,
    firstSeen: row.first_seen as number,
    lastSeen: row.last_seen as number,
    sessionCount: row.session_count as number,
    pillar: (row.pillar as string) || null,
    level: (row.level as string) || null,
    goals: (row.goals as string) || null,
    mistakes: JSON.parse((row.mistakes as string) || '[]'),
    vocab: JSON.parse((row.vocab as string) || '[]'),
    strengths: JSON.parse((row.strengths as string) || '[]'),
    onboardingStage: (row.onboarding_stage as string as StudentProfile['onboardingStage']) || 'new',
    notes: (row.notes as string) || null,
  }
}
