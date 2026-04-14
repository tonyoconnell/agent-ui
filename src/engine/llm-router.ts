/**
 * LLM ROUTER — Tags × Pheromone × Rubrics
 *
 * Three primitives. Nothing else.
 *
 *   TAGS       — what kind of work (creative, extract, classify, code, summarise)
 *   PHEROMONE  — learned weight per tag→model edge (mark/warn)
 *   RUBRICS    — quality score (fit/form/truth/taste) that sizes mark/warn
 *
 * The router does not decide. The substrate decides. The router routes.
 *
 * See docs/llm-routing.md for the full mechanism.
 * Proven numerically in src/engine/llm-router.test.ts.
 */

import type { RubricScore } from './rubric-score'
import { compositeScore } from './rubric-score'
import type { World } from './world'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ModelSpec = {
  id: string // e.g. "anthropic/claude-haiku-4-5", "google/gemma-4-26b-a4b-it"
  costPerMToken: number
  maxTokens?: number
  seed?: number // cold-start prior on entry→id (0.1 default)
}

export type RouteRequest = {
  prompt: string
  tags?: string[] // drives per-tag learning: "creative", "extract", "classify", ...
  system?: string
  estimatedTokens?: number // for budget gate
  maxCostPerCall?: number // budget ceiling in USD
  sensitivity?: number // STAN: 0.7 exploit, 1.0 greedy, 0.0 uniform
}

export type RouteChoice = {
  model: ModelSpec
  reason: 'highway' | 'pheromone' | 'seed' | 'budget-fallback'
  edge: string // the tag→model path that was selected
  estimatedCost: number
}

export type RouteOutcome = {
  response?: string
  failure?: boolean
  dissolved?: boolean
  timeout?: boolean
  rubric?: RubricScore
  quality?: number // 0..1, used when no rubric provided
  latencyMs?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// SEED — cold-start priors so routing has something to walk on
// ═══════════════════════════════════════════════════════════════════════════

/** Seed edges for each model. Call once at boot, before any routing. */
export const seedModels = (net: World, models: ModelSpec[], tags: string[] = ['default']): void => {
  for (const tag of tags) {
    for (const m of models) {
      const edge = `${tag}→${m.id}`
      if (!net.strength[edge]) net.mark(edge, m.seed ?? 0.1)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHOOSE — tag × pheromone × budget → model
// ═══════════════════════════════════════════════════════════════════════════

const HIGHWAY_THRESHOLD = 20

const withinBudget = (m: ModelSpec, req: RouteRequest): boolean => {
  if (!req.maxCostPerCall) return true
  const tokens = req.estimatedTokens ?? 500
  const cost = (tokens * m.costPerMToken) / 1_000_000
  return cost <= req.maxCostPerCall
}

const estCost = (m: ModelSpec, req: RouteRequest): number =>
  ((req.estimatedTokens ?? 500) * m.costPerMToken) / 1_000_000

/**
 * Pick a model using the tag's pheromone distribution.
 * Falls back to cheapest-within-budget if no pheromone exists.
 */
export const chooseModel = (net: World, models: ModelSpec[], req: RouteRequest): RouteChoice => {
  const tag = req.tags?.[0] ?? 'default'
  const affordable = models.filter((m) => withinBudget(m, req))
  if (affordable.length === 0) {
    // Budget too tight for any model; return cheapest as fallback signal
    const cheapest = [...models].sort((a, b) => a.costPerMToken - b.costPerMToken)[0]
    return {
      model: cheapest,
      reason: 'budget-fallback',
      edge: `${tag}→${cheapest.id}`,
      estimatedCost: estCost(cheapest, req),
    }
  }

  // Highway check — if any affordable model has a proven path, prefer it
  for (const m of affordable) {
    const edge = `${tag}→${m.id}`
    const net_ = (net.strength[edge] ?? 0) - (net.resistance[edge] ?? 0)
    if (net_ >= HIGHWAY_THRESHOLD) {
      return { model: m, reason: 'highway', edge, estimatedCost: estCost(m, req) }
    }
  }

  // Pheromone-weighted selection across affordable models only.
  // Build scores from tag-scoped edges.
  const sensitivity = req.sensitivity ?? 0.7
  const scored = affordable.map((m) => {
    const edge = `${tag}→${m.id}`
    const s = net.strength[edge] ?? 0
    const r = net.resistance[edge] ?? 0
    return { model: m, edge, weight: Math.max(0.001, s - r) }
  })

  const _totalWeight = scored.reduce((a, b) => a + b.weight, 0)
  const anyLearned = scored.some((s) => s.weight > 0.1)

  // Cold start: nothing learned yet — pick cheapest affordable
  if (!anyLearned) {
    const cheapest = [...affordable].sort((a, b) => a.costPerMToken - b.costPerMToken)[0]
    return {
      model: cheapest,
      reason: 'seed',
      edge: `${tag}→${cheapest.id}`,
      estimatedCost: estCost(cheapest, req),
    }
  }

  // STAN: interpolate between uniform and pure-greedy by sensitivity
  const greedy = [...scored].sort((a, b) => b.weight - a.weight)[0]
  if (sensitivity >= 1.0) {
    return { model: greedy.model, reason: 'pheromone', edge: greedy.edge, estimatedCost: estCost(greedy.model, req) }
  }

  // Probabilistic pick weighted by (weight^sensitivity)
  const exponent = Math.max(0.01, sensitivity * 4) // sensitivity 0.7 → exp 2.8
  const reweighted = scored.map((s) => ({ ...s, w: s.weight ** exponent }))
  const sum = reweighted.reduce((a, b) => a + b.w, 0)
  let roll = Math.random() * sum
  for (const s of reweighted) {
    roll -= s.w
    if (roll <= 0) {
      return { model: s.model, reason: 'pheromone', edge: s.edge, estimatedCost: estCost(s.model, req) }
    }
  }
  // Fallback (shouldn't happen unless totalWeight=0)
  return { model: greedy.model, reason: 'pheromone', edge: greedy.edge, estimatedCost: estCost(greedy.model, req) }
}

// ═══════════════════════════════════════════════════════════════════════════
// MARK — rubric sizes the pheromone deposit
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert quality score to mark/warn amount.
 * Mirrors `qualityMark` in llm-router.test.ts.
 *
 *   >0.8  → mark(2)    strong highway reinforcement
 *   >0.5  → mark(1)    normal mark
 *   >0.2  → mark(0.5)  weak but positive
 *   >0    → warn(0.5)  ambiguous — mild alarm
 *   =0    → warn(1)    full alarm (dissolved / failed)
 */
export const markOutcome = (net: World, choice: RouteChoice, outcome: RouteOutcome): void => {
  const quality =
    outcome.rubric !== undefined
      ? compositeScore(outcome.rubric)
      : outcome.quality !== undefined
        ? outcome.quality
        : outcome.response
          ? 0.6
          : 0

  if (outcome.timeout) return // neutral — no mark, no warn
  if (outcome.dissolved) {
    net.warn(choice.edge, 0.5)
    return
  }

  if (quality > 0.8) net.mark(choice.edge, 2)
  else if (quality > 0.5) net.mark(choice.edge, 1)
  else if (quality > 0.2) net.mark(choice.edge, 0.5)
  else if (quality > 0) net.warn(choice.edge, 0.5)
  else net.warn(choice.edge, 1)

  // If rubric provided, also mark the per-dimension tagged edges via markDims.
  // Caller can do this via rubric-score.markDims() — we don't double-dip here.

  if (outcome.latencyMs !== undefined) {
    net.recordLatency(choice.edge, outcome.latencyMs)
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE — the full loop: choose → call → mark
// ═══════════════════════════════════════════════════════════════════════════

export type Caller = (model: ModelSpec, req: RouteRequest) => Promise<RouteOutcome>

/**
 * One-shot route: choose a model, call it via `caller`, mark the outcome.
 *
 *   const router = (req) => route(net, models, req, openrouterCaller)
 */
export const route = async (
  net: World,
  models: ModelSpec[],
  req: RouteRequest,
  caller: Caller,
): Promise<{ choice: RouteChoice; outcome: RouteOutcome }> => {
  const choice = chooseModel(net, models, req)
  const t0 = Date.now()
  const outcome = await caller(choice.model, req).catch(
    (err): RouteOutcome => ({ failure: true, response: String(err) }),
  )
  outcome.latencyMs = outcome.latencyMs ?? Date.now() - t0
  markOutcome(net, choice, outcome)
  return { choice, outcome }
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENROUTER CALLER — any OpenAI-compatible endpoint
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Factory for an OpenAI-compatible caller. Defaults to OpenRouter but works
 * against any endpoint exposing `/chat/completions` with Bearer auth.
 *
 *   const caller = openAiCaller({ apiKey: env.OPENROUTER_API_KEY })
 *   const { choice, outcome } = await route(net, models, req, caller)
 */
export const openAiCaller = (opts: { apiKey: string; baseUrl?: string; referer?: string; title?: string }): Caller => {
  const base = opts.baseUrl ?? 'https://openrouter.ai/api/v1'
  return async (model, req) => {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
        ...(opts.referer ? { 'HTTP-Referer': opts.referer } : {}),
        ...(opts.title ? { 'X-Title': opts.title } : {}),
      },
      body: JSON.stringify({
        model: model.id,
        max_tokens: model.maxTokens ?? 4096,
        messages: [
          ...(req.system ? [{ role: 'system', content: req.system }] : []),
          { role: 'user', content: req.prompt },
        ],
      }),
    })
    if (!res.ok) return { failure: true, response: `HTTP ${res.status}` }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const response = data.choices?.[0]?.message?.content
    if (!response) return { dissolved: true }
    return { response }
  }
}
