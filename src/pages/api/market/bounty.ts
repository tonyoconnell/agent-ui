/**
 * GET  /api/market/bounty        — list bounties by poster or seller
 * POST /api/market/bounty        — create bounty: lock Sui escrow + store in D1
 *
 * Body for POST: { skillId, sellerUid, posterUid, price, rubric?, deadline?,
 *                  posterUnitObjectId?, workerUnitObjectId?, pathObjectId? }
 * Returns: { id, escrowId, status: 'locked' }
 */
import type { APIRoute } from 'astro'
import { createEscrow } from '@/lib/sui'

type BountyStatus = 'locked' | 'delivered' | 'released' | 'refunded'

export type Bounty = {
  id: string
  edge: string
  skillId: string
  sellerUid: string
  posterUid: string
  price: number
  rubric: { fit?: number; form?: number; truth?: number; taste?: number }
  deadline: number
  escrowId?: string
  status: BountyStatus
  createdAt: number
}

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const env = (locals as Record<string, unknown>).runtime?.env as Record<string, unknown> | undefined
    const db = env?.DB as D1Database | undefined
    if (!db) return Response.json({ bounties: [] })

    const sellerUid = url.searchParams.get('seller')
    const posterUid = url.searchParams.get('poster')

    let query = 'SELECT * FROM bounties'
    const bindings: string[] = []
    if (sellerUid) { query += ' WHERE seller_uid = ?'; bindings.push(sellerUid) }
    else if (posterUid) { query += ' WHERE poster_uid = ?'; bindings.push(posterUid) }
    query += ' ORDER BY created_at DESC LIMIT 50'

    const rows = await db.prepare(query).bind(...bindings).all()
    const bounties = rows.results.map((r) => ({
      id: r.id,
      edge: r.edge,
      skillId: r.skill_id,
      sellerUid: r.seller_uid,
      posterUid: r.poster_uid,
      price: r.price,
      rubric: JSON.parse((r.rubric_json as string) || '{}'),
      deadline: r.deadline,
      escrowId: r.escrow_id ?? undefined,
      status: r.status,
      createdAt: r.created_at,
    }))

    return Response.json({ bounties })
  } catch {
    return Response.json({ bounties: [] })
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as Record<string, unknown>).runtime?.env as Record<string, unknown> | undefined
    const db = env?.DB as D1Database | undefined

    const body = (await request.json()) as {
      skillId?: string
      sellerUid?: string
      posterUid?: string
      price?: number
      rubric?: { fit?: number; form?: number; truth?: number; taste?: number }
      deadline?: number
      // Sui object IDs — required for on-chain escrow; omit to skip Sui
      posterUnitObjectId?: string
      workerUnitObjectId?: string
      pathObjectId?: string
    }

    if (!body.skillId || !body.sellerUid || !body.posterUid || !body.price) {
      return Response.json({ error: 'skillId, sellerUid, posterUid, price are required' }, { status: 400 })
    }

    const id = `bounty:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
    const edge = `${body.posterUid}→${body.sellerUid}`
    const deadline = body.deadline ?? Date.now() + 7 * 24 * 60 * 60 * 1000 // +7 days
    const rubric = body.rubric ?? {}
    const now = Date.now()

    // Lock Sui escrow — requires all three Sui object IDs to be present
    let escrowId: string | undefined
    if (body.posterUnitObjectId && body.workerUnitObjectId && body.pathObjectId) {
      try {
        const escrow = await createEscrow(
          body.posterUid,
          body.posterUnitObjectId,
          body.workerUnitObjectId,
          body.skillId,
          body.price,
          deadline,
          body.pathObjectId,
        )
        escrowId = escrow.escrowId
      } catch {
        // Escrow failed — bounty still recorded, status stays locked, Sui unavailable
      }
    }

    if (db) {
      await db
        .prepare(
          `INSERT INTO bounties (id, edge, skill_id, seller_uid, poster_uid, price, rubric_json, deadline, escrow_id, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'locked', ?)`,
        )
        .bind(id, edge, body.skillId, body.sellerUid, body.posterUid, body.price, JSON.stringify(rubric), deadline, escrowId ?? null, now)
        .run()
    }

    return Response.json({ id, escrowId, status: 'locked' }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
