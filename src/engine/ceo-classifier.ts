/**
 * CEO-CLASSIFIER — one-time LLM bootstrap for unroutable signals.
 *
 * The Chairman→CEO→Director→Specialist chain is zero-LLM on the hot path.
 * When NO pheromone edge exists for a tag AND the deterministic classifier
 * is unsure (confidence < 0.4), the CEO calls this module ONCE to pick a
 * director from the list of available units. The CEO then `mark()`s the
 * edge so the next request with the same tag routes without an LLM call.
 *
 * Bootstrap cost: one LLM call per new topic, ever.
 *
 * Zero returns: this function never throws. On any failure (network,
 * timeout, parse error, invalid director) it returns `null` and the
 * caller surfaces a `{dissolved: true}` outcome. Closed loop intact.
 */

const DEFAULT_MODEL = 'meta-llama/llama-4-maverick'
const DEFAULT_TIMEOUT_MS = 5_000

export interface CeoDirectorCandidate {
  uid: string
  domain: string
  examples?: string[]
}

export interface CeoClassifyOptions {
  content: string
  availableDirectors: CeoDirectorCandidate[]
  model?: string
  apiKey?: string
  timeoutMs?: number
  /** Injectable HTTP fetcher for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch
}

export interface CeoClassifyResult {
  directorUid: string
  tag: string
  confidence: number
  reasoning?: string
  latencyMs: number
}

const SYSTEM_PROMPT =
  'You route messages to team directors. Given a list of directors with their domains ' +
  'and a user message, pick the single best director to handle it. Return ONLY a JSON object ' +
  'matching the schema: {"directorUid": string, "tag": string, "confidence": number (0-1), "reasoning": string}. ' +
  'The directorUid MUST be one of the provided uids exactly. The tag should be a lowercase domain word. ' +
  'No prose. No markdown. Just JSON.'

const buildUserPrompt = (content: string, directors: CeoDirectorCandidate[]): string => {
  const list = directors
    .map((d) => {
      const ex = d.examples?.length ? ` (e.g. ${d.examples.slice(0, 3).join(', ')})` : ''
      return `- uid="${d.uid}" domain="${d.domain}"${ex}`
    })
    .join('\n')
  return `Directors:\n${list}\n\nMessage: ${JSON.stringify(content)}`
}

const resolveApiKey = (explicit?: string): string | undefined => {
  if (explicit) return explicit
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.OPENROUTER_API_KEY
}

const resolveModel = (explicit?: string): string => {
  if (explicit) return explicit
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  return env?.CEO_CLASSIFIER_MODEL || DEFAULT_MODEL
}

interface RawClassifierOutput {
  directorUid?: unknown
  tag?: unknown
  confidence?: unknown
  reasoning?: unknown
}

// Pull the JSON object out of whatever the model returned. Models often wrap
// JSON in ```json fences or preface with filler; we extract the first `{...}`
// block rather than demanding pure JSON.
const extractJson = (text: string): RawClassifierOutput | null => {
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) return null
  const slice = text.slice(first, last + 1)
  try {
    return JSON.parse(slice) as RawClassifierOutput
  } catch {
    return null
  }
}

const validate = (
  parsed: RawClassifierOutput,
  allowedUids: Set<string>,
): { directorUid: string; tag: string; confidence: number; reasoning?: string } | null => {
  const directorUid = typeof parsed.directorUid === 'string' ? parsed.directorUid.trim() : ''
  if (!directorUid || !allowedUids.has(directorUid)) return null
  const tag = typeof parsed.tag === 'string' && parsed.tag.trim() ? parsed.tag.trim().toLowerCase() : 'general'
  const conf = typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence) ? parsed.confidence : 0.5
  const confidence = Math.max(0, Math.min(1, conf))
  const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 200) : undefined
  return reasoning ? { directorUid, tag, confidence, reasoning } : { directorUid, tag, confidence }
}

/**
 * Ask the LLM which director should handle this message.
 * Returns null on any failure — never throws.
 */
export async function classifyForCeo(opts: CeoClassifyOptions): Promise<CeoClassifyResult | null> {
  const t0 = Date.now()
  const apiKey = resolveApiKey(opts.apiKey)
  if (!apiKey) return null
  if (!opts.availableDirectors.length) return null

  const allowedUids = new Set(opts.availableDirectors.map((d) => d.uid))
  const model = resolveModel(opts.model)
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const fetchImpl = opts.fetchImpl ?? fetch

  const body = {
    model,
    max_tokens: 120,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(opts.content, opts.availableDirectors) },
    ],
  }

  try {
    const res = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://one.ie',
        'X-Title': 'ONE Substrate',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const text = json.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text) return null
    const parsed = extractJson(text)
    if (!parsed) return null
    const valid = validate(parsed, allowedUids)
    if (!valid) return null
    const result: CeoClassifyResult = {
      directorUid: valid.directorUid,
      tag: valid.tag,
      confidence: valid.confidence,
      latencyMs: Date.now() - t0,
      ...(valid.reasoning !== undefined ? { reasoning: valid.reasoning } : {}),
    }
    console.debug(
      `[ceo-classifier] uid=${result.directorUid} tag=${result.tag} conf=${result.confidence.toFixed(2)} ms=${result.latencyMs}`,
    )
    return result
  } catch {
    return null
  }
}

// ── Test injection ─────────────────────────────────────────────────────────
// Runtime swap so wireChairmanChain callers don't need to thread the
// classifier through every test setup. Set via `setClassifierForTests`,
// clear via `resetClassifierForTests` between cases.

type ClassifyFn = typeof classifyForCeo
let _override: ClassifyFn | null = null

export function setClassifierForTests(fn: ClassifyFn | null): void {
  _override = fn
}

export function resetClassifierForTests(): void {
  _override = null
}

export function getActiveClassifier(): ClassifyFn {
  return _override ?? classifyForCeo
}

export function hasClassifierOverride(): boolean {
  return _override !== null
}
