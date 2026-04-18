/**
 * specialist-leaf — the one probabilistic step in the Chairman→CEO→Director→
 * Specialist chain. Every preceding hop is zero-LLM pheromone routing; only
 * the leaf calls out to an LLM.
 *
 * The factory returns a `.on('respond', ...)` task handler that:
 *   PRE  → toxic-tag check (dissolve before any LLM call)
 *   LLM  → openrouter completion; streams tokens via onDelta
 *   POST → returns accumulated text so ask() resolves {result}; throws bubble
 *          up so ask() resolves {failure} — closed loop per Rule 1.
 *
 * Zero returns: missing api key → dissolve. LLM throw → let it propagate
 * so ask() surfaces `failure` and the caller warns the path.
 */

import type { Emit } from './world'

type Ctx = { from: string; self: string }

export interface LeafOptions {
  uid: string
  model?: string
  systemPrompt?: string
  /** Called with each token chunk as the LLM streams. */
  onDelta?: (text: string, ctx: Ctx) => void
  /** Called once, right before the LLM call. Lets the endpoint emit an early
   * breadcrumb with the *full* chain that reached this leaf (uid + data.chain). */
  onStart?: (uid: string, chain: string[]) => void
  /**
   * Override for the completion call. Default wires to OpenRouter with
   * OPENROUTER_API_KEY. Tests inject a mock that streams tokens via onToken.
   */
  complete?: (
    prompt: string,
    opts: { system?: string; onToken?: (t: string) => void; model?: string },
  ) => Promise<string>
}

export type LeafData = {
  content?: string
  tags?: string[]
  chain?: string[]
  [k: string]: unknown
}

const DEFAULT_MODEL = 'meta-llama/llama-4-maverick'

const defaultSystemFor = (uid: string): string =>
  `You are the ${uid} specialist on the ONE substrate. Respond concisely (<=200 words) to the user's request, focused on your domain. Avoid disclaimers.`

const isToxicTag = (tags: string[]): boolean => tags.includes('toxic')

/** OpenRouter streaming client. Emits tokens via onToken, returns full text. */
const openrouterStream = async (
  prompt: string,
  opts: { system?: string; onToken?: (t: string) => void; model?: string },
): Promise<string> => {
  const apiKey =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.OPENROUTER_API_KEY ??
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY missing')
  const body = {
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: 1024,
    stream: true,
    messages: [
      ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
      { role: 'user' as const, content: prompt },
    ],
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://one.ie',
      'X-Title': 'ONE Substrate',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok || !res.body) throw new Error(`openrouter ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const l = line.trim()
      if (!l.startsWith('data:')) continue
      const payload = l.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const chunk = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const tok = chunk.choices?.[0]?.delta?.content
        if (tok) {
          full += tok
          opts.onToken?.(tok)
        }
      } catch {
        /* drop malformed chunk; SSE can interleave keepalives */
      }
    }
  }
  return full
}

/**
 * Build a `.on('respond', leafHandler(...))` task handler for a specialist.
 * Handler returns the full text on success so ask() resolves {result}.
 * Returns { dissolved: true } on toxic-tag PRE-check.
 */
export const leafHandler = (opts: LeafOptions) => {
  const system = opts.systemPrompt ?? defaultSystemFor(opts.uid)
  const complete = opts.complete ?? openrouterStream
  return async (data: unknown, _emit: Emit, ctx: Ctx): Promise<unknown> => {
    const d = (data ?? {}) as LeafData
    const tags = Array.isArray(d.tags) ? d.tags : []
    if (isToxicTag(tags)) return { dissolved: true }
    const content = typeof d.content === 'string' ? d.content : ''
    if (!content) return { dissolved: true }
    // Zero returns: an unconfigured LLM is a missing capability, not a failure.
    // Dissolve so the chain warns(0.5) instead of warn(1).
    if (opts.complete === undefined) {
      // Astro loads .env into import.meta.env, Node into process.env — check both.
      const apiKey =
        (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.OPENROUTER_API_KEY ??
        (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.OPENROUTER_API_KEY
      if (!apiKey) return { dissolved: true }
    }
    const incomingChain = Array.isArray(d.chain) ? d.chain : []
    opts.onStart?.(opts.uid, [...incomingChain, opts.uid])
    return await complete(content, {
      system,
      model: opts.model,
      onToken: (tok) => opts.onDelta?.(tok, ctx),
    })
  }
}
