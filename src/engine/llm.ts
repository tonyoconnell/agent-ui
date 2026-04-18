/**
 * LLM — Language model as a unit
 *
 * Deterministic wrapper around the one probabilistic call: retry on transient
 * errors, timeout on hangs, schema-validate the response. Errors are typed
 * values (LLMError), not thrown exceptions — fits the zero-returns philosophy.
 * The public `Complete` signature is preserved; substrate code is unchanged.
 */

import { Duration, Effect, Schedule, Schema } from 'effect'
import { readParsed } from '@/lib/typedb'
import { audit, enforcementMode, LLM_ENV_CACHE, LLM_ENV_TTL } from './adl-cache'
import { type Unit, unit } from './world'

// ADL: perm-env gate — shared cache from adl-cache.ts (Cycle 1.6 consolidation).
// Invalidated by `invalidateAdlCache(uid)` on every ADL write path.

const llmAccessAllows = (access: string[]): boolean => {
  if (!access.length) return true
  return access.includes('*') || access.some((k) => k.includes('API_KEY') || k.includes('OPENROUTER'))
}

/** Check if a caller has permission to use LLM providers. Fail-open if no perm-env set. */
async function canCallLLM(callerId: string): Promise<boolean> {
  const key = `${callerId}:env`
  const cached = LLM_ENV_CACHE.get(key)
  if (cached && cached.expires > Date.now()) {
    const allowed = llmAccessAllows(cached.access)
    if (!allowed) {
      const mode = enforcementMode()
      audit({
        sender: callerId,
        receiver: 'llm',
        gate: 'network',
        decision: mode === 'audit' ? 'allow-audit' : 'deny',
        mode,
        reason: `perm-env access=${JSON.stringify(cached.access)} does not grant LLM key`,
      })
      if (mode === 'audit') return true
    }
    return allowed
  }
  const rows = await readParsed(
    `match $u isa unit, has uid "${callerId.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}", has perm-env $pe; select $pe;`,
  ).catch(() => [])
  const access: string[] = []
  if (rows.length) {
    try {
      const perms = JSON.parse(rows[0].pe as string) as Record<string, unknown>
      const raw = perms.access ?? []
      if (Array.isArray(raw)) access.push(...(raw as string[]))
    } catch {
      /* malformed → fail open */
    }
  }
  LLM_ENV_CACHE.set(key, { access, expires: Date.now() + LLM_ENV_TTL })
  const allowed = llmAccessAllows(access)
  if (!allowed) {
    const mode = enforcementMode()
    audit({
      sender: callerId,
      receiver: 'llm',
      gate: 'network',
      decision: mode === 'audit' ? 'allow-audit' : 'deny',
      mode,
      reason: `perm-env access=${JSON.stringify(access)} does not grant LLM key`,
    })
    if (mode === 'audit') return true
  }
  return allowed
}

type Complete = (prompt: string, ctx?: Record<string, unknown>) => Promise<string>

export const llm = (id: string, complete: Complete): Unit => {
  return unit(id)
    .on('complete', async (d, emit, ctx) => {
      if (!(await canCallLLM(ctx.from))) return { dissolved: true }
      const { prompt, system, history } = d as { prompt: string; system?: string; history?: unknown }
      const response = await complete(prompt, { system, history })
      emit({ receiver: ctx.from, data: { response } })
    })
    .on('stream', async (d, emit, ctx) => {
      if (!(await canCallLLM(ctx.from))) return { dissolved: true }
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

// Cerebras — purpose-built inference silicon, ~2,100 tok/s, OpenAI-compatible API
// Get a free key at cloud.cerebras.ai → set CEREBRAS_API_KEY in .env
export const cerebras =
  (apiKey: string, model = 'llama3.1-8b'): Complete =>
  (prompt, ctx) =>
    callLLM(
      'cerebras',
      'https://api.cerebras.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
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

// ASI-1 Mini — first Web3-native LLM from ASI Alliance (Fetch.ai + SingularityNET + Ocean)
// Optimized for agentic workflows. Get key at asi1.ai → set ASI1_API_KEY in .env
export const asi1 =
  (apiKey: string, model = 'asi1-mini'): Complete =>
  (prompt, ctx) =>
    callLLM(
      'asi1',
      'https://api.asi1.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            ...(ctx?.system ? [{ role: 'system', content: ctx.system }] : []),
            { role: 'user', content: prompt },
          ],
        }),
      },
      ChatCompletion,
      (r) => r.choices[0].message.content,
    )
