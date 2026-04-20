/**
 * POST /api/escrow/cancel/:escrowId — Cancel expired escrow
 *
 * Flow:
 *   1. Parse and validate escrowId from params
 *   2. Parse request body: { posterUid, posterUnitObjectId, pathObjectId }
 *   3. viewEscrow(escrowId) — 404 if not found
 *   4. Check deadline HAS passed — 400 if still active
 *   5. cancelEscrow(posterUid, escrowId, posterUnitObjectId, pathObjectId)
 *   6. Warn path via writeSilent (TypeDB 3.0 delete+insert)
 *   7. Emit escrow:cancelled signal via writeSilent
 *   8. Return { ok, escrowId, refundedAmount, tx_digest, status }
 *
 * Errors:
 *   400 — invalid escrowId / missing body fields / deadline not yet passed
 *   404 — escrow not found on chain
 *   503 — Sui not configured
 *   500 — unexpected error
 */

import type { APIRoute } from 'astro'
import { cancelEscrow, viewEscrow } from '@/lib/sui'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ params, request }) => {
  try {
    // 1. Validate escrowId
    const escrowId = params.id
    if (!escrowId || typeof escrowId !== 'string' || escrowId.length < 4) {
      return Response.json({ error: 'Invalid escrowId format' }, { status: 400 })
    }

    // 2. Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { posterUid, posterUnitObjectId, pathObjectId } = (body ?? {}) as Record<string, unknown>

    if (
      !posterUid ||
      typeof posterUid !== 'string' ||
      !posterUnitObjectId ||
      typeof posterUnitObjectId !== 'string' ||
      !pathObjectId ||
      typeof pathObjectId !== 'string'
    ) {
      return Response.json(
        {
          error: 'Missing required fields: posterUid, posterUnitObjectId, pathObjectId',
        },
        { status: 400 },
      )
    }

    // 3. Fetch escrow — 404 if absent
    const escrowView = await viewEscrow(escrowId)
    if (!escrowView) {
      return Response.json({ error: 'Escrow not found', code: 'escrow_not_found' }, { status: 404 })
    }

    // 4. Deadline must have passed
    if (escrowView.deadline > Date.now()) {
      return Response.json(
        {
          error: 'Escrow deadline has not yet passed',
          code: 'escrow_not_expired',
          deadline: escrowView.deadline,
        },
        { status: 400 },
      )
    }

    // 5. Execute on-chain cancellation
    const { digest } = await cancelEscrow(posterUid, escrowId, posterUnitObjectId, pathObjectId)

    // 6. Compute refund
    const refundedMist: number = escrowView.amount ?? 0
    const refundedSUI = refundedMist / 1e9

    // 7. Warn path in TypeDB — delete old resistance, insert incremented value
    writeSilent(`
      match $p isa path, has sui-path-id "${pathObjectId}", has resistance $r;
      delete $p has resistance $r;
      insert $p has resistance ($r + 1.0);
    `)

    // 8. Emit escrow:cancelled signal
    const sigData = JSON.stringify({
      tags: ['escrow', 'cancelled'],
      content: { escrowId, posterUid, refundedMist },
    }).replace(/"/g, '\\"')
    writeSilent(`insert $s isa signal, has receiver "escrow:system", has data "${sigData}";`)

    // 9. Return receipt
    return Response.json({
      ok: true,
      escrowId,
      refundedAmount: refundedSUI,
      tx_digest: digest,
      status: 'cancelled',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('not configured') || message.includes('SUI_SEED')) {
      return Response.json({ error: 'Sui not configured', code: 'sui_unavailable' }, { status: 503 })
    }

    return Response.json({ error: message }, { status: 500 })
  }
}
