/**
 * Welcome — onboarding drip for new students.
 * Called after every response. Checks stage + session count.
 * Sends stage-appropriate message, advances onboarding_stage.
 *
 * Stages: new → welcomed → first-session → active
 */

import { sendToStudent } from '../lib/proactive'
import type { Env } from '../types'
import type { StudentProfile } from './student'
import { updateStudent } from './student'

const WELCOME_MESSAGES = {
  new: `Welcome to Elevare! I'm glad you're here.

Here's what to expect: you can ask me anything about our programs, and when you're ready, Amara (our AI practice buddy) will help you practice English every day.

What would you like to know first?`,

  welcomed: `Quick tip: when you practice with Amara, she remembers your mistakes and adapts to your level. The more you chat with her, the better she gets at helping you.

Your first few sessions will feel like a warm-up. By session 5, you'll notice the difference.`,

  'first-session': `How's it going so far? I wanted to check in.

If anything feels confusing or you have questions about how things work, just ask. There are no silly questions here.`,
} as const

/**
 * Check if the student needs an onboarding message.
 * Call this after every response — it's a no-op for active students.
 * Returns true if an onboarding message was sent.
 */
export async function checkOnboarding(env: Env, student: StudentProfile): Promise<boolean> {
  const { uid, sessionCount, onboardingStage } = student

  // Active students — no onboarding needed
  if (onboardingStage === 'active' || onboardingStage === 'churning') return false

  // Stage transitions based on session count
  if (onboardingStage === 'new' && sessionCount >= 1) {
    await sendToStudent(env, uid, WELCOME_MESSAGES.new).catch(() => {})
    await updateStudent(env, uid, { onboardingStage: 'welcomed' })
    return true
  }

  if (onboardingStage === 'welcomed' && sessionCount >= 3) {
    await sendToStudent(env, uid, WELCOME_MESSAGES.welcomed).catch(() => {})
    await updateStudent(env, uid, { onboardingStage: 'first-session' })
    return true
  }

  if (onboardingStage === 'first-session' && sessionCount >= 7) {
    await sendToStudent(env, uid, WELCOME_MESSAGES['first-session']).catch(() => {})
    await updateStudent(env, uid, { onboardingStage: 'active' })
    return true
  }

  return false
}
