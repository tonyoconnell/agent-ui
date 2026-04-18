/**
 * GET /api/capability/hire/settle-status/:settlementId — Poll settlement status
 *
 * Returns current settlement state: pending | settled | failed.
 * Used by client to check if async settlement has completed.
 *
 * Response:
 *   { status: 'pending' | 'settled' | 'failed', escrow_id, result?, error_message?, retry_count }
 */

import type { APIRoute } from 'astro'
import { getSettlementById } from '@/lib/durable-settlement'

export const prerender = false

export const GET: APIRoute = async ({ params, locals }) => {
  const { settlementId } = params

  if (!settlementId) {
    return Response.json({ error: 'settlementId required' }, { status: 400 })
  }

  try {
    const { getD1 } = await import('@/lib/cf-env')
    const db = await getD1(locals)
    const settlement = await getSettlementById(settlementId as string, db)

    if (!settlement) {
      return Response.json({ error: 'Settlement not found' }, { status: 404 })
    }

    return Response.json(
      {
        status: settlement.status,
        escrow_id: settlement.escrow_id,
        settlement_id: settlement.id,
        result: settlement.result_json ? JSON.parse(settlement.result_json) : null,
        error_message: settlement.error_message,
        retry_count: settlement.retry_count,
        created_at: settlement.created_at,
        settled_at: settlement.settled_at,
        expires_at: settlement.expires_at,
      },
      { status: 200 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[settle-status] error:', msg, err)
    return Response.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}
