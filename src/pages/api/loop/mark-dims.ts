/**
 * POST /api/loop/mark-dims — deposit rubric dimension scores as tagged pheromone
 *
 * Body: { edge: string, fit: number, form: number, truth: number, taste: number }
 *   edge   — base edge label, e.g. 'entry→builder:verify' or a task id
 *   fit    — does it solve the stated problem? (0–1)
 *   form   — is code clean, tests passing? (0–1)
 *   truth  — are claims accurate? (0–1)
 *   taste  — is style consistent? (0–1)
 *
 * Each dimension emits a tagged edge: edge:fit, edge:form, edge:truth, edge:taste
 *   score >= 0.5 → mark()   path strengthens
 *   score <  0.5 → warn()   path resists
 *
 * Implements Rule 1 (Closed Loop) for human-driven rubric scoring via /close.
 */
import type { APIRoute } from 'astro'
import { DEFAULT_WEIGHTS, markDims } from '@/engine/rubric'
import { getNet } from '@/lib/net'

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    edge?: string
    fit?: number
    form?: number
    truth?: number
    taste?: number
  }

  const edge = body.edge ?? 'entry→builder:verify'
  const scores = {
    fit: body.fit ?? 0.5,
    form: body.form ?? 0.5,
    truth: body.truth ?? 0.5,
    taste: body.taste ?? 0.5,
  }

  const net = await getNet()
  markDims(net, edge, scores)

  return new Response(
    JSON.stringify({
      ok: true,
      edge,
      scores,
      marks: Object.entries(scores).map(([dim, s]) => ({
        edge: `${edge}:${dim}`,
        action: s >= 0.5 ? 'mark' : 'warn',
        strength:
          s >= 0.5
            ? s * DEFAULT_WEIGHTS[dim as keyof typeof DEFAULT_WEIGHTS]
            : (1 - s) * DEFAULT_WEIGHTS[dim as keyof typeof DEFAULT_WEIGHTS],
      })),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
