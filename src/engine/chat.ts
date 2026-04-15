/**
 * Chat memory — Pages app turn helpers.
 *
 * Two functions implement the turn loop using the PersistentWorld (TypeDB-backed).
 * These are the Pages-app equivalent of nanoclaw/src/units/ingest + outcome.
 *
 * Turn flow (called from /api/chat/turn):
 *   1. ingestMessage()   → classify text, ensure actor unit exists in TypeDB
 *   2. measureOutcome()  → detect valence of new message vs last turn → mark/warn
 *   3. buildPack()       → (see src/lib/chat/context-pack.ts)
 */

import { getNet } from '@/lib/net'
import { writeSilent } from '@/lib/typedb'
import { classify, detectValence } from './chat-helpers'

const esc = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, ' ').slice(0, 200)

export interface IngestResult {
  uid: string
  tags: string[]
}

/**
 * Classify incoming message text and ensure the actor unit exists in TypeDB.
 * If no actorUid is provided, defaults to "visitor:web".
 * Returns the stable uid and keyword-derived topic tags.
 */
export function ingestMessage(text: string, actorUid = 'visitor:web'): IngestResult {
  const tags = classify(text)
  // Ensure actor unit exists — fire-and-forget, cold-start safe
  const safe = esc(actorUid)
  writeSilent(`match $u isa unit, has uid "${safe}"; select $u;`).catch(() => {
    writeSilent(
      `insert $u isa unit,
         has uid "${safe}",
         has name "${safe}",
         has unit-kind "human",
         has status "active",
         has success-rate 0.5,
         has sample-count 0,
         has generation 0;`,
    ).catch(() => {})
  })
  return { uid: actorUid, tags }
}

/**
 * Measure outcome: detect valence of the user's new message against the
 * tags used in the PREVIOUS bot turn. Called at turn-start so the user's
 * new message becomes the outcome signal for the last reply.
 *
 * valence >  0.3 → mark(actor→tag) for each tag
 * valence < -0.3 → warn(actor→tag) for each tag
 * otherwise      → neutral, no deposit
 *
 * All writes are fire-and-forget; errors are silently ignored.
 */
export async function measureOutcome(actorUid: string, lastTags: string[], text: string): Promise<void> {
  if (lastTags.length === 0) return
  const valence = detectValence(text)
  if (valence === 0.0) return

  const net = await getNet().catch(() => null)
  if (!net) return

  for (const tag of lastTags) {
    const edge = `${actorUid}→${tag}`
    if (valence > 0.3) {
      net.mark(edge, valence)
    } else if (valence < -0.3) {
      net.warn(edge, Math.abs(valence))
    }
  }
}
