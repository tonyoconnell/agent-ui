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
    predicate: string // "prefers", "works-in", "struggles-with"
    object: string // "code-examples", "seo", "typescript"
    confidence: number // 0..1
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
