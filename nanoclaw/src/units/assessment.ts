/**
 * Assessment — analyze student progress from side-car data.
 * Detects mastery, struggle, and milestones.
 * Signals: debby:edu (struggles), debby:upsell (milestones).
 */

import { sendToStudent } from '../lib/proactive'
import { mark, warn } from '../lib/substrate'
import type { Env } from '../types'
import { getRecentSidecar } from './student'

interface AssessmentResult {
  mastered: string[] // mistake categories that disappeared
  struggling: string[] // mistake categories that persist
  milestone: boolean // true if session count milestone hit
  vocabGrowth: number // new vocab in last 10 sessions
}

/**
 * Assess a student's recent progress.
 * Call every 5 sessions (check session_count % 5 === 0).
 */
export async function assessStudent(env: Env, uid: string, sessionCount: number): Promise<AssessmentResult> {
  const recent = await getRecentSidecar(env, uid, 10)
  if (recent.length < 3) return { mastered: [], struggling: [], milestone: false, vocabGrowth: 0 }

  // Split into older half and newer half
  const mid = Math.floor(recent.length / 2)
  const older = recent.slice(mid)
  const newer = recent.slice(0, mid)

  // Count mistake categories in each half
  const olderMistakes = countCategories(older.flatMap((s) => s.mistakes))
  const newerMistakes = countCategories(newer.flatMap((s) => s.mistakes))

  // Mastery: category was in older half but gone from newer
  const mastered: string[] = []
  for (const [cat, count] of Object.entries(olderMistakes)) {
    if (count >= 2 && !(cat in newerMistakes)) {
      mastered.push(cat)
    }
  }

  // Struggle: category appears 3+ times in newer half
  const struggling: string[] = []
  for (const [cat, count] of Object.entries(newerMistakes)) {
    if (count >= 3) {
      struggling.push(cat)
    }
  }

  // Vocab growth
  const allVocab = new Set(recent.flatMap((s) => s.newVocab))
  const vocabGrowth = allVocab.size

  // Milestone: 10, 20, 50 sessions
  const milestone = [10, 20, 50].includes(sessionCount)

  // Deposit pheromone
  for (const cat of mastered) {
    mark(env, uid, `skill:${cat}`, 1).catch(() => {})
  }
  for (const cat of struggling) {
    warn(env, uid, `skill:${cat}`, 0.5).catch(() => {})
  }

  // Proactive messages
  if (milestone && sessionCount === 20) {
    sendToStudent(
      env,
      uid,
      "You've completed 20 practice sessions! Your consistency is paying off. Ready to take the next step? Ask me about Flex Nexus Intensive.",
    ).catch(() => {})
  }

  if (mastered.length > 0) {
    sendToStudent(env, uid, `Great progress! You've mastered: ${mastered.join(', ')}. Keep it up.`).catch(() => {})
  }

  return { mastered, struggling, milestone, vocabGrowth }
}

/** Extract the category from a mistake string (e.g. "verb tense: 'I go yesterday'" → "verb tense") */
function extractCategory(mistake: string): string {
  const colonIdx = mistake.indexOf(':')
  return colonIdx > 0 ? mistake.slice(0, colonIdx).trim().toLowerCase() : mistake.trim().toLowerCase()
}

function countCategories(mistakes: string[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of mistakes) {
    const cat = extractCategory(m)
    counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
}
