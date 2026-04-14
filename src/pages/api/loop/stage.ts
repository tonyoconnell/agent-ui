/**
 * POST /api/loop/stage — mark that a work-loop stage fired for a session
 *
 * Body: { session: string, stage: Stage, data?: unknown }
 * Response: { ok: true, stages: Stage[] }
 *
 * The substrate auto-marks the edge from prior stage → this stage on delivery.
 * See docs/work-loop.md for the 26 stages.
 */
import type { APIRoute } from 'astro'
import { type Stage, type WorkLoop, workLoop } from '@/engine/work-loop'
import { getNet } from '@/lib/net'

const sessions = new Map<string, WorkLoop>()

export const loopFor = (session: string): WorkLoop | undefined => sessions.get(session)

export const getOrCreate = async (session: string): Promise<WorkLoop> => {
  const existing = sessions.get(session)
  if (existing) return existing
  const net = await getNet()
  const wl = workLoop(net, session)
  sessions.set(session, wl)
  return wl
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as {
    session?: string
    stage?: Stage
    data?: unknown
  }
  if (!body.session || !body.stage) {
    return new Response(JSON.stringify({ error: 'session and stage required' }), { status: 400 })
  }
  const wl = await getOrCreate(body.session)
  wl.stage(body.stage, body.data)
  return new Response(JSON.stringify({ ok: true, stages: wl.stages }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
