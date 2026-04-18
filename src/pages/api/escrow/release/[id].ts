/**
 * POST /api/escrow/release/:escrowId — Release escrow to worker
 *
 * Flow:
 *   1. Validate escrowId exists and is accessible on Sui
 *   2. Resolve worker UID and Unit object ID from TypeDB
 *   3. Resolve path object ID from TypeDB
 *   4. Call releaseEscrow(workerUid, escrowId, workerUnitId, pathId)
 *   5. signAndExecute with worker's derived keypair
 *   6. Parse TX effects to extract payment amount + protocol fee
 *   7. Emit escrow:released signal to substrate
 *   8. Return { escrowId, paymentSUI, markStrength, fee, tx_digest }
 *
 * Error handling:
 *   - 400: invalid escrowId, worker not found, path not found
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

    // View escrow to verify it exists and get basic info
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

    // Verify deadline hasn't passed (Move enforces this too, but check early)
    if (escrowView.deadline <= Date.now()) {
      return new Response(
        JSON.stringify({
          error: 'Escrow deadline has passed',
          code: 'escrow_expired',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Query TypeDB for worker unit by claimant address (if available)
    // For now, we'll assume the claimant is the worker
    // In production, resolve worker UID from request or TypeDB query
    // const workerUid = 'worker' // placeholder
    const workerUnitObjectId = '' // placeholder

    // Query to find worker unit — may need to be passed in request
    // For now, use a placeholder and require caller to provide it
    // TODO: enhance by querying TypeDB for units matching escrow.claimant wallet

    if (!workerUnitObjectId) {
      return new Response(
        JSON.stringify({
          error: 'Worker unit not resolved from escrow (workerUnitObjectId not provided)',
          hint: 'pass workerUnitObjectId in request body or resolve from TypeDB query',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Placeholder: get pathObjectId and workerUid from TypeDB
    // In production, the API body should provide these, or they're resolved from escrow state
    // For now, return error asking for body data
    return new Response(
      JSON.stringify({
        error: 'Release endpoint requires worker context (workerUid, workerUnitObjectId, pathObjectId)',
        hint: 'send POST body: { workerUid, workerUnitObjectId, pathObjectId }',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )

    // Below: expected behavior once body is provided
    /*
    const { workerUid, workerUnitObjectId, pathObjectId } = body

    // Release escrow on Sui
    const { digest } = await releaseEscrow(
      workerUid,
      escrowId,
      workerUnitObjectId,
      pathObjectId,
    )

    // Parse payment from escrow state or TX effects
    // Convert MIST to SUI (1 SUI = 1e9 MIST)
    const paymentMist = escrowView.amount || 0
    const paymentSUI = paymentMist / 1e9

    // Calculate protocol fee (50 bps = 0.5%)
    const protocolFeeMist = Math.floor(paymentMist * 0.005)
    const protocolFeeSUI = protocolFeeMist / 1e9

    // Mark the path in TypeDB + emit signal
    writeSilent(`
      match
        $p isa path, has sui-path-id "${pathObjectId}";
      update $p has strength 1.0;
    `)

    writeSilent(`
      match
        $from isa unit, has uid "escrow-system";
        $to isa unit, has uid "${workerUid}";
      insert
        (sender: $from, receiver: $to) isa signal,
          has data "escrow:released",
          has amount ${paymentMist},
          has success true,
          has ts ${new Date().toISOString().replace('Z', '')};
    `)

    return new Response(
      JSON.stringify({
        ok: true,
        escrowId,
        paymentSUI,
        markStrength: 1.0,
        fee: protocolFeeSUI,
        tx_digest: digest,
        status: 'released',
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
