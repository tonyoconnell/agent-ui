/**
 * POST /api/escrow/create — Create an escrow on Sui
 *
 * Body: { posterUid, workerUnitObjectId, taskName, amountMist, deadlineMs, pathObjectId }
 *
 * Flow:
 *   1. Validate input: amount > 0, deadline > now, objects exist
 *   2. Resolve poster's Unit object ID from TypeDB
 *   3. Call createEscrow(posterUid, posterUnitId, workerId, taskName, amountMist, deadlineMs, pathId)
 *   4. signAndExecute with poster's derived keypair
 *   5. Return { escrowId, deadline, tx_digest, status }
 *
 * Error handling:
 *   - 400: invalid params (missing fields, amount <= 0, deadline in past, objects not found)
 *   - 503: Sui unavailable (signing, broadcast failed)
 */

import type { APIRoute } from 'astro'
import { createEscrow, resolveUnit } from '@/lib/sui'
import { readParsed } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as {
      posterUid: string
      workerUnitObjectId: string
      taskName: string
      amountMist: number
      deadlineMs: number
      pathObjectId: string
    }

    const { posterUid, workerUnitObjectId, taskName, amountMist, deadlineMs, pathObjectId } = body

    // Validate required fields
    if (!posterUid || !workerUnitObjectId || !taskName || !pathObjectId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: posterUid, workerUnitObjectId, taskName, pathObjectId',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Validate amount
    if (typeof amountMist !== 'number' || amountMist <= 0) {
      return new Response(JSON.stringify({ error: 'amountMist must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate deadline
    if (typeof deadlineMs !== 'number' || deadlineMs <= Date.now()) {
      return new Response(
        JSON.stringify({ error: 'deadlineMs must be in the future (absolute timestamp in milliseconds)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Validate deadline is reasonably formatted (between year 2001 and 2286 in ms)
    if (deadlineMs < 1e12 || deadlineMs > 1e13) {
      return new Response(
        JSON.stringify({
          error: 'deadlineMs appears invalid (should be ms timestamp between year 2001 and 2286)',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Resolve poster's Unit object ID from TypeDB
    let posterUnitObjectId: string | null = null
    try {
      const posterUnits = await readParsed(`
        match $u isa unit, has uid "${posterUid}", has sui-unit-id $suid;
        select $suid;
      `)
      if (posterUnits.length > 0) {
        posterUnitObjectId = posterUnits[0].suid as string
      }
    } catch {
      // Continue — may use posterUid directly if not in TypeDB
    }

    if (!posterUnitObjectId) {
      // Try resolveUnit as fallback
      const posterUnit = await resolveUnit(posterUid)
      if (!posterUnit?.objectId) {
        return new Response(
          JSON.stringify({
            error: `Poster unit not found: ${posterUid}`,
            code: 'unit_not_found',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }
      posterUnitObjectId = posterUnit.objectId
    }

    // Create escrow on Sui
    const { digest, escrowId } = await createEscrow(
      posterUid,
      posterUnitObjectId,
      workerUnitObjectId,
      taskName,
      Math.floor(amountMist),
      Math.floor(deadlineMs),
      pathObjectId,
    )

    return new Response(
      JSON.stringify({
        ok: true,
        escrowId,
        deadline: deadlineMs,
        tx_digest: digest,
        status: 'created',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    // Distinguish between configuration errors (503) and user errors (400)
    if (message.includes('not configured') || message.includes('SUI_SEED') || message.includes('sys-201')) {
      return new Response(JSON.stringify({ error: 'Sui not configured', code: 'sui_unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Balance, signing, or broadcast failures
    if (
      message.includes('insufficient') ||
      message.includes('balance') ||
      message.includes('gas') ||
      message.includes('Broadcast')
    ) {
      return new Response(
        JSON.stringify({
          error: message,
          code: 'tx_execution_failed',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
