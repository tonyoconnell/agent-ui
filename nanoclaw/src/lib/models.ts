/**
 * STAN model catalog for nanoclaw.
 * Models ordered cheapest-first within capability tier.
 * pricePerM = USD per million input tokens (OpenRouter pricing).
 */

export interface NanoModel {
  id: string
  tags: string[] // capability tags: "fast", "code", "reasoning", "chat", "cheap"
  pricePerM: number // USD per million input tokens
  isGroq?: boolean // use Groq endpoint instead of OpenRouter
}

export const MODELS: NanoModel[] = [
  // Fast / cheap — general chat, greetings, simple Q&A
  {
    id: 'groq/meta-llama/llama-4-scout-17b-16e-instruct',
    tags: ['fast', 'cheap', 'chat', 'general'],
    pricePerM: 0.1,
    isGroq: true,
  },
  { id: 'meta-llama/llama-4-scout', tags: ['fast', 'cheap', 'chat', 'general'], pricePerM: 0.11 },
  { id: 'meta-llama/llama-4-maverick', tags: ['chat', 'general', 'fast'], pricePerM: 0.15 },

  // Balanced — good reasoning, moderate cost
  { id: 'google/gemma-4-26b-a4b-it', tags: ['reasoning', 'general', 'chat'], pricePerM: 0.1 },
  { id: 'google/gemini-flash-1.5-8b', tags: ['fast', 'chat', 'cheap'], pricePerM: 0.038 },

  // Higher capability — code, complex reasoning
  { id: 'anthropic/claude-haiku-4-5', tags: ['code', 'reasoning', 'chat', 'quality'], pricePerM: 0.8 },
  { id: 'anthropic/claude-sonnet-4-5', tags: ['code', 'reasoning', 'quality', 'complex'], pricePerM: 3.0 },
]

export const DEFAULT_MODEL_ID = 'meta-llama/llama-4-maverick'
export const DEFAULT_MAX_COST = 0.002 // $0.002 per call = ~13k tokens at maverick pricing
