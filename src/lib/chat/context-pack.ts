/**
 * ContextPack — typed memory packet assembled before each LLM call.
 *
 * Pages-app version (TypeDB-only, no D1). The pack injects actor memory
 * into the system prompt via systemPromptWithPack().
 *
 * Schema note: hypothesis entity in world.tql has `statement` (not
 * predicate/object) so hypotheses are surfaced as statements with confidence.
 * Asserted hypotheses are capped at 0.30 to prevent injection attacks.
 */

import { actorHighways } from '@/engine/chat-helpers'
import { readParsed } from '@/lib/typedb'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Typed memory packet assembled before each LLM call. */
export interface ContextPack {
  profile: {
    uid: string
    handle: string
    messageCount: number
  }
  /** Substrate-learned facts about this actor. */
  hypotheses: Array<{
    statement: string
    confidence: number
    source: string
  }>
  /** Strongest paths from this actor to skills/topics. */
  highways: Array<{
    to: string
    strength: number
  }>
  /** Recent conversation messages (populated externally from request history). */
  recent: Array<{
    role: string
    content: string
  }>
  /** Available tool/skill names in this context. */
  tools: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Asserted hypotheses are capped below this — they haven't been corroborated. */
const ASSERTED_CAP = 0.3

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Assemble a ContextPack for the given actor from TypeDB.
 * Runs two parallel queries (highways + hypotheses). Cold-start safe: returns
 * empty arrays if TypeDB is slow or the actor has no history yet.
 */
export async function buildPack(actorUid: string): Promise<ContextPack> {
  const safe = actorUid.replace(/"/g, '')

  const [highways, hypRows] = await Promise.all([
    // 1. Actor highways — top paths FROM this actor
    actorHighways(actorUid, 10),

    // 2. Hypotheses — confirmed or testing, statement contains actor uid
    readParsed(
      `match $h isa hypothesis, has statement $s, has p-value $p,
         has hypothesis-status $st, has source $src;
       $s contains "${safe}";
       { $st = "confirmed"; } or { $st = "testing"; };
       sort $p desc; limit 20;
       select $s, $p, $src;`,
    ).catch(() => [] as Record<string, unknown>[]),
  ])

  const hypotheses = (hypRows as { s: string; p: number; src: string }[]).map((r) => ({
    statement: r.s,
    // Cap asserted hypotheses at 0.30 — not corroborated by outcomes yet
    confidence: r.src === 'asserted' ? Math.min(r.p, ASSERTED_CAP) : r.p,
    source: r.src,
  }))

  return {
    profile: {
      uid: actorUid,
      handle: actorUid.split(':').pop() ?? actorUid,
      messageCount: 0, // populated externally if needed
    },
    hypotheses,
    highways,
    recent: [], // caller injects current messages[] — recency is already in the LLM context
    tools: [],
  }
}

// ── System prompt injection ───────────────────────────────────────────────────

/**
 * Render the memory pack as a MEMORY block and prepend it to the base system prompt.
 * Only high-confidence (>= 0.5) hypotheses are included.
 * Returns the base prompt unchanged if the pack contains nothing useful.
 */
export function systemPromptWithPack(basePrompt: string, pack: ContextPack): string {
  const hasMemory = pack.hypotheses.some((h) => h.confidence >= 0.5) || pack.highways.length > 0
  if (!hasMemory) return basePrompt

  const lines: string[] = ['--- MEMORY ---']

  lines.push(`User: ${pack.profile.handle}`)

  const facts = pack.hypotheses.filter((h) => h.confidence >= 0.85)
  if (facts.length > 0) {
    lines.push('\nEstablished facts about this user:')
    for (const h of facts) {
      lines.push(`  [fact] ${h.statement} (${Math.round(h.confidence * 100)}%)`)
    }
  }

  const hints = pack.hypotheses.filter((h) => h.confidence >= 0.5 && h.confidence < 0.85)
  if (hints.length > 0) {
    lines.push('\nSubtle hints (do not quote directly):')
    for (const h of hints) {
      lines.push(`  [hint] ${h.statement}`)
    }
  }

  if (pack.highways.length > 0) {
    lines.push('\nTop interests (by path strength):')
    for (const hw of pack.highways.slice(0, 5)) {
      lines.push(`  - ${hw.to} (strength: ${hw.strength.toFixed(1)})`)
    }
  }

  lines.push('--- END MEMORY ---')
  return `${lines.join('\n')}\n\n${basePrompt}`
}
