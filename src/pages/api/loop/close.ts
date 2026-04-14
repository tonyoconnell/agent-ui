/**
 * POST /api/loop/close — close a work-loop session with outcome + rubric
 *
 * Body: { session, outcome: { result | timeout | dissolved | failure }, rubric?: number }
 * Response: { ok, stages, highways: top loop:* edges after close }
 *
 * Propagates mark/warn back along every stage edge in the session chain.
 * Rubric 0..1 scales chain bonus — good taste reinforces more.
 */
import type { APIRoute } from 'astro'
import type { StageOutcome } from '@/engine/work-loop'
import { loopFor } from './stage'

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    session?: string
    outcome?: StageOutcome
    rubric?: number
    reason?: string
  }
  if (!body.session || !body.outcome) {
    return new Response(JSON.stringify({ error: 'session and outcome required' }), { status: 400 })
  }
  const wl = loopFor(body.session)
  if (!wl) {
    return new Response(JSON.stringify({ error: 'unknown session' }), { status: 404 })
  }
  wl.close(body.outcome, { rubric: body.rubric, reason: body.reason })
  return new Response(JSON.stringify({ ok: true, stages: wl.stages, highways: wl.highways(10) }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
