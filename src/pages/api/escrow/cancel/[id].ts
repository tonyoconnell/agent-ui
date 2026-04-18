/**
 * POST /api/escrow/cancel/:escrowId — Cancel expired escrow
 *
 * Flow:
 *   1. Validate escrowId exists and deadline has passed
 *   2. Resolve poster UID and Unit object ID from TypeDB
 *   3. Resolve path object ID from TypeDB
 *   4. Call cancelEscrow(posterUid, escrowId, posterUnitId, pathId)
 *   5. signAndExecute with poster's derived keypair
 *   6. Parse TX effects to extract refunded amount
 *   7. Emit escrow:cancelled signal to substrate, warn path
 *   8. Return { escrowId, refundedAmount, tx_digest }
 *
 * Error handling:
 *   - 400: deadline hasn't passed yet, escrowId invalid, poster not found
 *   - 404: escrow not found on chain
 *   - 503: Sui unavailable
 */

import type { APIRoute } from 'astro'
import { viewEscrow } from '@/lib/sui'

export const POST: APIRoute = async ({ params }) => {
  try {
    const escrowId = params.id
    if (!escrowId || typeof escrowId !== 'string' || escrowId.length < 4) {
      return new Response(JSON.stringify({ error: 'Invalid escrowId format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // View escrow to verify it exists and check deadline
    const escrowView = await viewEscrow(escrowId)
    if (!escrowView) {
      return new Response(
        JSON.stringify({
          error: 'Escrow not found',
          code: 'escrow_not_found',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Verify deadline has passed
    if (escrowView.deadline > Date.now()) {
      return new Response(
        JSON.stringify({
          error: 'Escrow deadline has not yet passed',
          code: 'escrow_not_expired',
          deadline: escrowView.deadline,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Placeholder: get posterUid, posterUnitObjectId, and pathObjectId from TypeDB or request body
    // For now, return error asking for body data
    return new Response(
      JSON.stringify({
        error: 'Cancel endpoint requires poster context (posterUid, posterUnitObjectId, pathObjectId)',
        hint: 'send POST body: { posterUid, posterUnitObjectId, pathObjectId }',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )

    // Below: expected behavior once body is provided
    /*
    const { posterUid, posterUnitObjectId, pathObjectId } = body

    // Cancel escrow on Sui
    const { digest } = await cancelEscrow(
      posterUid,
      escrowId,
      posterUnitObjectId,
      pathObjectId,
    )

    // Extract refunded amount from escrow
    const refundedMist = escrowView.amount || 0
    const refundedSUI = refundedMist / 1e9

    // Warn the path in TypeDB (deadline miss = failure)
    writeSilent(`
      match
        $p isa path, has sui-path-id "${pathObjectId}";
      update $p has resistance 1.0;
    `)

    // Emit signal
    writeSilent(`
      match
        $from isa unit, has uid "escrow-system";
        $to isa unit, has uid "${posterUid}";
      insert
        (sender: $from, receiver: $to) isa signal,
          has data "escrow:cancelled",
          has amount ${refundedMist},
          has success false,
          has ts ${new Date().toISOString().replace('Z', '')};
    `)

    return new Response(
      JSON.stringify({
        ok: true,
        escrowId,
        refundedAmount: refundedSUI,
        tx_digest: digest,
        status: 'cancelled',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
    */
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message.includes('not configured') || message.includes('SUI_SEED')) {
      return new Response(JSON.stringify({ error: 'Sui not configured', code: 'sui_unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
