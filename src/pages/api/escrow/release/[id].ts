/**
 * POST /api/escrow/release/:escrowId — Release escrow to worker
 *
 * Flow:
 *   1. Validate escrowId exists and is accessible on Sui
 *   2. Parse request body: { workerUid, workerUnitObjectId, pathObjectId }
 *   3. Call viewEscrow(escrowId) — 404 if not found
 *   4. Check deadline not yet passed — 400 if expired
 *   5. Call releaseEscrow(workerUid, escrowId, workerUnitObjectId, pathObjectId)
 *   6. Calculate payment + protocol fee (50 bps)
 *   7. Emit pheromone mark via TypeDB delete+insert
 *   8. Emit escrow:released signal
 *   9. Return { ok, escrowId, paymentSUI, markStrength, fee, tx_digest, status }
 *
 * Error handling:
 *   - 400: invalid escrowId, missing body fields, deadline expired
 *   - 404: escrow not found on chain
 *   - 503: Sui unavailable
 *   - 500: all other errors
 */

import type { APIRoute } from 'astro'
import { releaseEscrow, viewEscrow } from '@/lib/sui'
import { writeSilent } from '@/lib/typedb'

export const prerender = false

export const POST: APIRoute = async ({ params, request }) => {
  try {
    // 1. Validate escrowId from params
    const escrowId = params.id
    if (!escrowId || typeof escrowId !== 'string' || escrowId.length < 4) {
      return new Response(JSON.stringify({ error: 'Invalid escrowId format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse request body
    let body: { workerUid?: string; workerUnitObjectId?: string; pathObjectId?: string }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { workerUid, workerUnitObjectId, pathObjectId } = body
    if (!workerUid || !workerUnitObjectId || !pathObjectId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          required: ['workerUid', 'workerUnitObjectId', 'pathObjectId'],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 3. View escrow — 404 if not found
    const escrowView = await viewEscrow(escrowId)
    if (!escrowView) {
      return new Response(JSON.stringify({ error: 'Escrow not found', code: 'escrow_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 4. Check deadline has not passed
    if (escrowView.deadline <= Date.now()) {
      return new Response(JSON.stringify({ error: 'Escrow deadline has passed', code: 'escrow_expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 5. Release escrow on Sui — 503 if not configured
    const { digest: tx_digest } = await releaseEscrow(workerUid, escrowId, workerUnitObjectId, pathObjectId)

    // 6. Calculate payment and protocol fee
    const paymentMist = escrowView.amount || 0
    const paymentSUI = paymentMist / 1e9
    const protocolFeeMist = Math.floor(paymentMist * 0.005)
    const protocolFeeSUI = protocolFeeMist / 1e9

    // 7. Emit pheromone mark — TypeDB 3.0 delete+insert pattern
    writeSilent(`
      match $p isa path, has sui-path-id "${pathObjectId}", has strength $s;
      delete $p has strength $s;
      insert $p has strength ($s + 1.0);
    `)

    // 8. Emit escrow:released signal
    const signalData = JSON.stringify({
      tags: ['escrow', 'released'],
      content: { escrowId, workerUid, paymentMist },
    }).replace(/"/g, '\\"')
    writeSilent(`insert $s isa signal, has receiver "escrow:system", has data "${signalData}";`)

    // 9. Return success
    return new Response(
      JSON.stringify({
        ok: true,
        escrowId,
        paymentSUI,
        markStrength: 1.0,
        fee: protocolFeeSUI,
        tx_digest,
        status: 'released',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
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
