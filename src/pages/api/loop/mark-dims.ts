/**
 * POST /api/loop/mark-dims — deposit rubric dimension scores as tagged pheromone
 *
 * Two rubrics (see one/do-guide.md §4.2):
 *
 *   msg  (default): { edge, fit, form, truth, taste }
 *     fit    — does it solve the stated problem? (0–1)
 *     form   — is code clean, tests passing? (0–1)
 *     truth  — are claims accurate? (0–1)
 *     taste  — is style consistent? (0–1)
 *
 *   code (kind: "code"): { edge, kind: "code", security, stability, simplicity, speed }
 *     security   — zero vulnerabilities, boundaries validated, no secrets (0–1)
 *     stability  — tests pass, zero type errors, handlers close their loops (0–1)
 *     simplicity — minimum code for maximum feature (0–1)
 *     speed      — Lighthouse 100, bundle ≤ W0, tokens lean (0–1)
 *
 * Each dimension emits a tagged edge: `${edge}:${dim}`. Callers control namespace
 * via the edge prefix — e.g. pass 'loop:msg:wave4' or 'loop:code:cycle' to keep
 * the two rubrics' pheromone independent.
 *
 *   score >= 0.5 → mark()   path strengthens
 *   score <  0.5 → warn()   path resists
 *
 * Implements Rule 1 (Closed Loop) for human-driven rubric scoring via /close.
 *
 * BaaS metering (Cycle 1 T-B1-06): L2 feature — available on all tiers.
 * Authenticated callers are metered and rate-limited.
 */
import type { APIRoute } from 'astro'
import { CODE_WEIGHTS, MSG_WEIGHTS, markCodeDims, markDims } from '@/engine/rubric'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { getNet } from '@/lib/net'
import { checkApiCallLimit, tierLimitResponse } from '@/lib/tier-limits'

export const POST: APIRoute = async ({ request, locals }) => {
  // BaaS metering gate
  const db = await getD1(locals)
  const auth = await resolveUnitFromSession(request, locals).catch(() => null)
  if (auth?.isValid) {
    const tier = auth.tier ?? 'free'
    const usage = await getUsage(db, auth.keyId)
    const gate = checkApiCallLimit(tier, usage)
    if (!gate.ok) return tierLimitResponse(gate)
    void recordCall(db, auth.keyId)
  }

  const body = (await request.json().catch(() => ({}))) as {
    edge?: string
    kind?: 'msg' | 'code'
    // msg rubric
    fit?: number
    form?: number
    truth?: number
    taste?: number
    // code rubric
    security?: number
    stability?: number
    simplicity?: number
    speed?: number
  }

  const kind = body.kind ?? 'msg'
  const edge = body.edge ?? 'entry→builder:verify'
  const net = await getNet()

  if (kind === 'code') {
    const scores = {
      security: body.security ?? 0.5,
      stability: body.stability ?? 0.5,
      simplicity: body.simplicity ?? 0.5,
      speed: body.speed ?? 0.5,
    }
    markCodeDims(net, edge, scores)
    return new Response(
      JSON.stringify({
        ok: true,
        kind,
        edge,
        scores,
        marks: Object.entries(scores).map(([dim, s]) => ({
          edge: `${edge}:${dim}`,
          action: s >= 0.5 ? 'mark' : 'warn',
          strength:
            s >= 0.5
              ? s * CODE_WEIGHTS[dim as keyof typeof CODE_WEIGHTS]
              : (1 - s) * CODE_WEIGHTS[dim as keyof typeof CODE_WEIGHTS],
        })),
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const scores = {
    fit: body.fit ?? 0.5,
    form: body.form ?? 0.5,
    truth: body.truth ?? 0.5,
    taste: body.taste ?? 0.5,
  }
  markDims(net, edge, scores)
  return new Response(
    JSON.stringify({
      ok: true,
      kind,
      edge,
      scores,
      marks: Object.entries(scores).map(([dim, s]) => ({
        edge: `${edge}:${dim}`,
        action: s >= 0.5 ? 'mark' : 'warn',
        strength:
          s >= 0.5
            ? s * MSG_WEIGHTS[dim as keyof typeof MSG_WEIGHTS]
            : (1 - s) * MSG_WEIGHTS[dim as keyof typeof MSG_WEIGHTS],
      })),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
