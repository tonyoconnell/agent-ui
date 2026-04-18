/**
 * GET  /api/market/bounty        — list bounties by poster or seller
 * POST /api/market/bounty        — create bounty: lock Sui escrow + store in D1
 *
 * Body for POST: { skillId, sellerUid, posterUid, tags?, content?, price,
 *                  rubric?, deadline?: ISO-8601,
 *                  posterUnitObjectId?, workerUnitObjectId?, pathObjectId? }
 * Returns: { id, escrowId, data: BountyData }
 *
 * Wire format: signal.data conforms to marketplace-schema.md §"Bounty data contract"
 */
import type { APIRoute } from 'astro'
import { createEscrow } from '@/lib/sui'

/** Escrow lifecycle states per marketplace-schema.md */
type EscrowState = 'locked' | 'claimed' | 'verifying' | 'released' | 'refunded'

/** Bounty wire format — all fields present in signal.data */
export type BountyData = {
  kind: 'bounty'
  tags: string[]
  content: object
  price: number
  rubric: { fit: number; form: number; truth: number; taste: number }
  deadline: string // ISO-8601
  escrow_state: EscrowState
  tx_hash: string | null
  claims: string | null
}

export type BountyStatus = 'locked' | 'delivered' | 'released' | 'refunded'

export type Bounty = {
  id: string
  edge: string
  skillId: string
  sellerUid: string
  posterUid: string
  data: BountyData
  escrowId?: string
  createdAt: number
  // Flattened view-model fields (derived from data)
  status: BountyStatus
  price: number
  deadline: number // unix ms
  rubric: { fit?: number; form?: number; truth?: number; taste?: number }
}

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const { getEnv } = await import('@/lib/cf-env')
    const env = (await getEnv(locals)) as { DB?: D1Database }
    const db = env?.DB as D1Database | undefined
    if (!db) return Response.json({ bounties: [] })

    const sellerUid = url.searchParams.get('seller')
    const posterUid = url.searchParams.get('poster')

    let query = 'SELECT * FROM bounties'
    const bindings: string[] = []
    if (sellerUid) {
      query += ' WHERE seller_uid = ?'
      bindings.push(sellerUid)
    } else if (posterUid) {
      query += ' WHERE poster_uid = ?'
      bindings.push(posterUid)
    }
    query += ' ORDER BY created_at DESC LIMIT 50'

    const rows = await db
      .prepare(query)
      .bind(...bindings)
      .all()
    const bounties = rows.results.map((r) => ({
      id: r.id,
      edge: r.edge,
      skillId: r.skill_id,
      sellerUid: r.seller_uid,
      posterUid: r.poster_uid,
      data: JSON.parse((r.data_json as string) || '{}') as BountyData,
      escrowId: r.escrow_id ?? undefined,
      createdAt: r.created_at,
    }))

    return Response.json({ bounties })
  } catch {
    return Response.json({ bounties: [] })
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { getEnv } = await import('@/lib/cf-env')
    const env = (await getEnv(locals)) as { DB?: D1Database }
    const db = env?.DB as D1Database | undefined

    const body = (await request.json()) as {
      skillId?: string
      sellerUid?: string
      posterUid?: string
      tags?: string[]
      content?: object
      price?: number
      rubric?: { fit?: number; form?: number; truth?: number; taste?: number }
      deadline?: string // ISO-8601
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
    // deadline: accept ISO-8601 string; default to +7 days
    const deadline: string = body.deadline ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const rubric = {
      fit: body.rubric?.fit ?? 0.65,
      form: body.rubric?.form ?? 0.65,
      truth: body.rubric?.truth ?? 0.65,
      taste: body.rubric?.taste ?? 0.65,
    }
    const now = Date.now()

    // Lock Sui escrow — requires all three Sui object IDs to be present
    let escrowId: string | undefined
    let txHash: string | null = null
    if (body.posterUnitObjectId && body.workerUnitObjectId && body.pathObjectId) {
      try {
        const escrow = await createEscrow(
          body.posterUid,
          body.posterUnitObjectId,
          body.workerUnitObjectId,
          body.skillId,
          body.price,
          new Date(deadline).getTime(),
          body.pathObjectId,
        )
        escrowId = escrow.escrowId
        txHash = escrow.digest ?? null
      } catch {
        // Escrow failed — bounty still recorded, escrow_state stays locked, Sui unavailable
      }
    }

    // Bounty wire-format data object (signal.data per marketplace-schema.md)
    const bountyData: BountyData = {
      kind: 'bounty',
      tags: body.tags ?? [],
      content: body.content ?? {},
      price: body.price,
      rubric,
      deadline,
      escrow_state: 'locked',
      tx_hash: txHash,
      claims: null,
    }

    if (db) {
      await db
        .prepare(
          `INSERT INTO bounties (id, edge, skill_id, seller_uid, poster_uid, data_json, escrow_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, edge, body.skillId, body.sellerUid, body.posterUid, JSON.stringify(bountyData), escrowId ?? null, now)
        .run()
    }

    return Response.json({ id, escrowId, data: bountyData }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
