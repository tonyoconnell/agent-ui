/**
 * Structured data extraction from LLM responses.
 *
 * Uses Groq direct API with JSON schema in the prompt + Zod validation.
 * ~100-200ms on Groq LPU. Fire-and-forget from afterResponse.
 *
 * Shared by all nanoclaw workers. Not client-specific.
 */

import { z } from 'zod'
import type { Env } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const sidecarSchema = z.object({
  mistakes: z.array(
    z.object({
      category: z.string(),
      example: z.string(),
      correction: z.string(),
    }),
  ),
  newVocab: z.array(z.string()),
  praise: z.string(),
  lessonTag: z.string(),
  flag: z.enum(['none', 'struggling', 'distressed', 'off-topic', 'milestone']),
})

export type Sidecar = z.infer<typeof sidecarSchema>

export const intentSchema = z.object({
  intent: z.enum([
    'learn-english',
    'pricing',
    'about-elevare',
    'book-session',
    'technical-issue',
    'practice-request',
    'interview-prep',
    'pronunciation-help',
    'confidence-coaching',
    'general-question',
    'greeting',
  ]),
  pillar: z.enum(['lingua', 'rise', 'flex-nexus', 'amara', 'none']),
  urgency: z.enum(['low', 'medium', 'high']),
  suggestedAgent: z.string(),
})

export type Intent = z.infer<typeof intentSchema>

// ═══════════════════════════════════════════════════════════════════════════
// GROQ JSON CALL — raw fetch + Zod validation
// ═══════════════════════════════════════════════════════════════════════════

async function groqJson<T>(env: Env, schema: z.ZodType<T>, prompt: string): Promise<T | null> {
  const key = env.GROQ_API_KEY
  if (!key) return null

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 512,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a structured data extractor. Always respond with valid JSON matching the requested schema exactly. No extra keys.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) return null

  const data = (await res.json()) as { choices?: [{ message?: { content?: string } }] }
  const text = data.choices?.[0]?.message?.content
  if (!text) return null

  const parsed = JSON.parse(text)
  const result = schema.safeParse(parsed)
  return result.success ? result.data : null
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extract learning side-car from a tutoring conversation turn.
 * ~100-200ms on Groq.
 */
export async function extractSidecar(
  env: Env,
  studentMessage: string,
  assistantReply: string,
): Promise<Sidecar | null> {
  try {
    return await groqJson(
      env,
      sidecarSchema,
      `Analyze this English tutoring conversation and return JSON with these exact keys:
{
  "mistakes": [{"category": "verb tense", "example": "what student said", "correction": "correct form"}],
  "newVocab": ["word1", "word2"],
  "praise": "one thing student did well or empty string",
  "lessonTag": "topic like daily-routines or job-interview",
  "flag": "none" or "struggling" or "distressed" or "off-topic" or "milestone"
}

Student: "${studentMessage}"
Tutor: "${assistantReply}"`,
    )
  } catch (e) {
    console.error('[extract] sidecar error:', e)
    return null
  }
}

/**
 * Classify the intent of a student message for routing.
 * ~50-100ms on Groq.
 */
export async function classifyIntent(env: Env, studentMessage: string): Promise<Intent | null> {
  try {
    return await groqJson(
      env,
      intentSchema,
      `Classify this message from someone visiting Elevare (English coaching school). Return JSON:
{
  "intent": one of: learn-english, pricing, about-elevare, book-session, technical-issue, practice-request, interview-prep, pronunciation-help, confidence-coaching, general-question, greeting
  "pillar": one of: lingua, rise, flex-nexus, amara, none
  "urgency": one of: low, medium, high
  "suggestedAgent": one of: concierge, enrollment, amara, support, edu
}

Programs: Lingua ($149-179/mo live coaching), Rise (confidence), Flex Nexus ($497 intensive), Amara ($29-49/mo AI tutor).

Message: "${studentMessage}"`,
    )
  } catch (e) {
    console.error('[extract] intent error:', e)
    return null
  }
}
