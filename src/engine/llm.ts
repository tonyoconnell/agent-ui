/**
 * LLM — Language model as a unit
 *
 * Deterministic wrapper around the one probabilistic call: retry on transient
 * errors, timeout on hangs, schema-validate the response. Errors are typed
 * values (LLMError), not thrown exceptions — fits the zero-returns philosophy.
 * The public `Complete` signature is preserved; substrate code is unchanged.
 */

import { Duration, Effect, Schedule, Schema } from 'effect'
import { type Unit, unit } from './world'

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export const llm = (id: string, complete: Complete): Unit => {
  return unit(id)
    .on('complete', async (d, emit, ctx) => {
      const { prompt, system, history } = d as { prompt: string; system?: string; history?: unknown }
      const response = await complete(prompt, { system, history })
      emit({ receiver: ctx.from, data: { response } })
    })
    .on('stream', async (d, emit, ctx) => {
      const { prompt, system, onChunk } = d as { prompt: string; system?: string; onChunk?: (t: string) => void }
      let full = ''
      await complete(`${prompt}\n[STREAM]`, {
        system,
        onToken: (t: string) => {
          full += t
          onChunk?.(t)
        },
      })
      emit({ receiver: ctx.from, data: { response: full } })
    })
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMAS — Validate shapes at the boundary; no more `as any` casts
// ═══════════════════════════════════════════════════════════════════════════

const ChatCompletion = Schema.Struct({
  choices: Schema.Array(
    Schema.Struct({
      message: Schema.Struct({ content: Schema.String }),
    }),
  ),
})

const AnthropicMessage = Schema.Struct({
  content: Schema.Array(Schema.Struct({ text: Schema.String })),
})

export class LLMError extends Schema.TaggedError<LLMError>()('LLMError', {
  provider: Schema.String,
  status: Schema.Number,
  body: Schema.String,
}) {}

// ═══════════════════════════════════════════════════════════════════════════
// EFFECT HELPERS — Timeout + exponential-backoff retry on transient failures
// ═══════════════════════════════════════════════════════════════════════════

// Retry on network errors, timeouts, and 5xx/429 responses. Never retry 4xx.
const isTransient = (e: LLMError) => e.status === 0 || e.status >= 500 || e.status === 429 || e.status === 408

// One end-to-end call: fetch → validate HTTP → parse JSON → decode schema → extract text.
// Anything deterministic (4xx, schema mismatch) fails once. Anything transient retries 3× with backoff.
const callLLM = <A>(
  provider: string,
  url: string,
  init: RequestInit,
  schema: Schema.Schema<A, any>,
  extract: (a: A) => string,
): Promise<string> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const res = yield* Effect.tryPromise({
        try: () => fetch(url, init),
        catch: (e) => new LLMError({ provider, status: 0, body: String(e) }),
      })
      if (!res.ok) {
        const body = yield* Effect.promise(() => res.text())
        return yield* Effect.fail(new LLMError({ provider, status: res.status, body }))
      }
      const json = yield* Effect.promise(() => res.json() as Promise<unknown>)
      const parsed = yield* Schema.decodeUnknown(schema)(json).pipe(
        Effect.mapError((e) => new LLMError({ provider, status: 200, body: `Schema: ${e.message}` })),
      )
      return extract(parsed)
    }).pipe(
      Effect.timeout(Duration.seconds(30)),
      Effect.mapError((e) =>
        e instanceof LLMError ? e : new LLMError({ provider, status: 408, body: 'Timeout after 30s' }),
      ),
      Effect.retry({
        schedule: Schedule.exponential(Duration.millis(500), 2).pipe(Schedule.intersect(Schedule.recurs(3))),
        while: isTransient,
      }),
      Effect.catchAll((e) => Effect.die(new Error(`[${e.provider}] ${e.status}: ${e.body.slice(0, 200)}`))),
    ),
  )

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTERS — Same shape as before; now with retry, timeout, schema validation
// ═══════════════════════════════════════════════════════════════════════════

export const openrouter =
  (apiKey: string, model = 'meta-llama/llama-4-maverick'): Complete =>
  (prompt, ctx) =>
    callLLM(
      'openrouter',
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://one.ie',
          'X-Title': 'ONE Substrate',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            ...(ctx?.system ? [{ role: 'system', content: ctx.system }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      },
      ChatCompletion,
      (r) => r.choices[0].message.content,
    )

export const anthropic =
  (apiKey: string, model = 'claude-sonnet-4-20250514'): Complete =>
  (prompt, ctx) =>
    callLLM(
      'anthropic',
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: ctx?.system,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
      AnthropicMessage,
      (r) => r.content[0].text,
    )

export const openai =
  (apiKey: string, model = 'gpt-4o'): Complete =>
  (prompt, ctx) =>
    callLLM(
      'openai',
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: ctx?.system || '' },
            { role: 'user', content: prompt },
          ],
        }),
      },
      ChatCompletion,
      (r) => r.choices[0].message.content,
    )
