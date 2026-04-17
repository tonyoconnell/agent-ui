/**
 * Shared types for nanoclaw chatbot units.
 */

/** Typed memory pack assembled before each LLM call. */
export interface ContextPack {
  profile: {
    uid: string
    handle: string
    messageCount: number
  }
  /** Stable facts the substrate learned about this actor. */
  hypotheses: Array<{
    statement: string // full statement string, e.g. "user prefers code-examples"
    status: string // "confirmed", "pending", "speculative"
    confidence: number // 0..1 — derived from 1 - p-value
  }>
  /** Strongest paths from this actor to skills/topics. */
  highways: Array<{
    to: string
    strength: number
  }>
  /** Last N messages in this conversation group. */
  recent: Array<{
    role: string
    content: string
  }>
  /** Available tool/skill names in this group. */
  tools: string[]
}
