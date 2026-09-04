/**
 * POST /api/loop/cycle-close — close a /do cycle with rubric scores
 *
 * Fires the cycle-level pheromone mark plus the per-dimension marks in one call.
 * This is the endpoint do.md's CLOSE step actually targets (the older
 * /api/loop/close is for WorkLoop session/stage tracking, different concern).
 *
 * Body (msg rubric):
 *   { slug, kind: "msg",  scores: { fit, form, truth, taste } }
 *
 * Body (code rubric — default for /do):
 *   { slug, kind: "code", scores: { security, stability, simplicity, speed } }
 *
 * Behavior:
 *   1. Compute composite from scores using the appropriate weights
 *   2. Compute gate: composite ≥ 0.65 → pass, else fail
 *   3. Pass  → net.mark(`loop:cycle:${slug}`,    composite × 5)
 *              net.mark(`loop:${kind}:cycle:${slug}`, composite × 5)  (namespaced twin)
 *   4. Fail  → net.warn(`loop:cycle:${slug}`,    (1 - composite) × 5)
 *              net.warn(`loop:${kind}:cycle:${slug}`, (1 - composite) × 5)
 *   5. Always → call markDims / markCodeDims on edge `loop:${kind}:cycle:${slug}`
 *               (deposits per-dim marks, mirrors DIMS step of do.md)
 *
 * Response: { ok, slug, kind, composite, gate, marks: { cycle, dims } }
 *
 * Spec: one/do-guide.md §4.3 (pheromone ledger), .claude/commands/do.md CLOSE step.
 */
import type { APIRoute } from 'astro'
import { CODE_WEIGHTS, MSG_WEIGHTS, markCodeDims, markDims } from '@/engine/rubric'
import { resolveUnitFromSession } from '@/lib/api-auth'
import { getD1 } from '@/lib/cf-env'
import { getUsage, recordCall } from '@/lib/metering'
import { getNet } from '@/lib/net'
import { checkApiCallLimit, tierLimitResponse } from '@/lib/tier-limits'

const GATE = 0.65
const CYCLE_MARK_MULTIPLIER = 5

type CodeScores = { security: number; stability: number; simplicity: number; speed: number }
type MsgScores = { fit: number; form: number; truth: number; taste: number }

function compositeCode(s: CodeScores): number {
  return (
    s.security * CODE_WEIGHTS.security +
    s.stability * CODE_WEIGHTS.stability +
    s.simplicity * CODE_WEIGHTS.simplicity +
    s.speed * CODE_WEIGHTS.speed
  )
}

function compositeMsg(s: MsgScores): number {
  return s.fit * MSG_WEIGHTS.fit + s.form * MSG_WEIGHTS.form + s.truth * MSG_WEIGHTS.truth + s.taste * MSG_WEIGHTS.taste
}

export const POST: APIRoute = async ({ request, locals }) => {
  // BaaS metering gate (same pattern as mark-dims.ts)
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
    slug?: string
    kind?: 'msg' | 'code'
    scores?: Partial<CodeScores & MsgScores>
  }

  if (!body.slug) {
    return new Response(JSON.stringify({ error: 'slug required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const slug = body.slug
  const kind = body.kind ?? 'code'
  const dimEdge = `loop:${kind}:cycle:${slug}`
  const cycleEdge = `loop:cycle:${slug}`
  const net = await getNet()

  let composite: number
  if (kind === 'code') {
    const scores: CodeScores = {
      security: body.scores?.security ?? 0.5,
      stability: body.scores?.stability ?? 0.5,
      simplicity: body.scores?.simplicity ?? 0.5,
      speed: body.scores?.speed ?? 0.5,
    }
    composite = compositeCode(scores)
    markCodeDims(net, dimEdge, scores)
  } else {
    const scores: MsgScores = {
      fit: body.scores?.fit ?? 0.5,
      form: body.scores?.form ?? 0.5,
      truth: body.scores?.truth ?? 0.5,
      taste: body.scores?.taste ?? 0.5,
    }
    composite = compositeMsg(scores)
    markDims(net, dimEdge, scores)
  }

  const passed = composite >= GATE
  const amount = (passed ? composite : 1 - composite) * CYCLE_MARK_MULTIPLIER
  if (passed) {
    net.mark(cycleEdge, amount)
    net.mark(dimEdge, amount)
  } else {
    net.warn(cycleEdge, amount)
    net.warn(dimEdge, amount)
  }

  return new Response(
    JSON.stringify({
      ok: true,
      slug,
      kind,
      composite: Math.round(composite * 1000) / 1000,
      gate: passed ? 'pass' : 'fail',
      marks: {
        cycle: { edge: cycleEdge, action: passed ? 'mark' : 'warn', strength: amount },
        namespaced: { edge: dimEdge, action: passed ? 'mark' : 'warn', strength: amount },
      },
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
