/**
 * GET  /api/market/bounty/:id         — fetch bounty status
 * POST /api/market/bounty/:id/verify  — submit rubric scores → settle (release or refund)
 *
 * Note: This single file handles both GET and POST. For POST, the action
 * is determined by the request body: { rubric: {fit, form, truth, taste} }
 */
import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env
    const db = env?.DB as D1Database | undefined
    if (!db) return Response.json({ error: 'Not available' }, { status: 503 })

    const row = await db.prepare('SELECT * FROM bounties WHERE id = ?').bind(params.id).first()
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({
      id: row.id,
      edge: row.edge,
      skillId: row.skill_id,
      sellerUid: row.seller_uid,
      posterUid: row.poster_uid,
      price: row.price,
      rubric: JSON.parse((row.rubric_json as string) || '{}'),
      deadline: row.deadline,
      escrowObjectId: row.escrow_object_id ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    const env = (locals as { runtime?: { env?: { DB?: D1Database } } }).runtime?.env
    const db = env?.DB as D1Database | undefined
    if (!db) return Response.json({ error: 'Not available' }, { status: 503 })

    const row = await db.prepare('SELECT * FROM bounties WHERE id = ?').bind(params.id).first()
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 })
    if (row.status !== 'locked' && row.status !== 'delivered') {
      return Response.json({ error: `Already settled: ${row.status}` }, { status: 409 })
    }

    const body = (await request.json()) as {
      rubric?: { fit?: number; form?: number; truth?: number; taste?: number }
    }
    const submitted = body.rubric ?? {}
    const required = JSON.parse((row.rubric_json as string) || '{}') as {
      fit?: number
      form?: number
      truth?: number
      taste?: number
    }

    // Score: each submitted dim must meet required threshold (default 0.65)
    const dims = ['fit', 'form', 'truth', 'taste'] as const
    const scores: Record<string, number> = {}
    let pass = true
    for (const dim of dims) {
      const score = (submitted[dim] ?? 0) as number
      const threshold = (required[dim] ?? 0.65) as number
      scores[dim] = score
      if (score < threshold) pass = false
    }

    const net = await getNet()
    const edge = row.edge as string
    const escrowObjectId = (row.escrow_object_id as string | null) ?? ''
    const claimantUid = row.seller_uid as string
    const posterUid = row.poster_uid as string

    if (escrowObjectId) {
      net.settle(edge, { escrowObjectId, claimantUid, posterUid, success: pass })
    } else {
      // No escrow (Sui unavailable at creation) — just pheromone
      if (pass) net.mark(edge)
      else net.warn(edge)
    }

    const newStatus = pass ? 'released' : 'refunded'
    await db.prepare('UPDATE bounties SET status = ? WHERE id = ?').bind(newStatus, params.id).run()

    return Response.json({ id: params.id, status: newStatus, rubric: scores, settled: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
