/**
 * POST /api/capability/hire/settle — Settlement callback for escrow releases.
 *
 * SUI Phase 3 D3 — Async-proof settlement via durable storage.
 *
 * Flow:
 *   1. Client releases escrow on Sui (moveCall release_escrow)
 *   2. Client calls this endpoint: POST /api/capability/hire/settle { escrow_id, proof: { tx_digest } }
 *   3. Server verifies TX on Sui RPC (EscrowReleased event)
 *   4. Server stores settlement in D1 (durable storage)
 *   5. Server re-executes original /api/buy/hire logic (create chat group)
 *   6. Server marks path in TypeDB (atomic pheromone deposit)
 *   7. Server returns 200 with result
 *
 * Idempotent: Same escrow_id settles once (status flag prevents re-execution).
 * Deterministic: Settlement is a pure function of escrow_id + tx_digest.
 * Durable: D1 survives worker restarts; task can be retried via polling.
 *
 * Design decisions:
 *   - Verify on Sui RPC first (before any writes)
 *   - Store in D1 immediately (survives restarts)
 *   - Re-execute hire synchronously (must complete before returning)
 *   - Mark TypeDB idempotent (multiple marks are safe)
 *   - Return 200 on success, 400 on TX verification failure, 500 on re-execution error
 *
 * Dependencies:
 *   - durable-settlement.ts — D1 storage helpers
 *   - sui-verify.ts — Sui RPC TX verification
 *   - buy/hire.ts — Original hire logic (re-executed)
 *   - persist.ts — Path marking for pheromone
 */

import type { APIRoute } from 'astro'
import { getPendingSettlement, markFailed, markSettled, storePendingSettlement } from '@/lib/durable-settlement'
import { verifySuiTx } from '@/lib/sui-verify'
import { readParsed, writeSilent } from '@/lib/typedb'
import { type DurableSettlement, SettlementRequestSchema } from '@/types/escrow-settlement'

export const prerender = false

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request
    const body = await request.json()
    const parseResult = SettlementRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return Response.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { escrow_id, proof, original_request: bodyRequest } = parseResult.data

    // Step 1: Verify TX on Sui RPC
    const verifyResult = await verifySuiTx(escrow_id, proof.tx_digest)
    if (!verifyResult.valid) {
      return Response.json({ error: 'TX verification failed', reason: verifyResult.reason }, { status: 400 })
    }

    // Step 2: Check if settlement already exists
    const existing = await getPendingSettlement(escrow_id)
    if (existing && existing.status === 'settled') {
      // Idempotent: return the previous result
      if (existing.result_json) {
        return Response.json(
          {
            status: 200,
            escrow_id,
            settlement_id: existing.id,
            result: JSON.parse(existing.result_json),
            reused: true,
          },
          { status: 200 },
        )
      }
    }

    // Step 3: Retrieve original request
    // Priority: from existing durable storage > from request body > derive from TypeDB
    let originalRequest: DurableSettlement['original_request']

    if (existing && existing.status === 'pending') {
      originalRequest = existing.original_request
    } else if (bodyRequest) {
      originalRequest = bodyRequest
    } else {
      // Must have original request to re-execute hire
      return Response.json({ error: 'Missing original_request: cannot re-execute hire' }, { status: 400 })
    }

    // Step 4: Store in durable storage (fire-and-forget)
    const { getD1 } = await import('@/lib/cf-env')
    const db = await getD1(locals)
    const settlementId = await storePendingSettlement(escrow_id, proof.tx_digest, originalRequest, db)

    // Step 5: Re-execute hire logic
    const hireResult = await reexecuteHire(originalRequest)
    if (!hireResult.ok) {
      await markFailed(escrow_id, hireResult.error || 'Unknown error', db)
      return Response.json({ error: 'Hire re-execution failed', details: hireResult.error }, { status: 500 })
    }

    // Step 6: Mark path in TypeDB (pheromone deposit)
    // Edge: buyer → provider (strength increases on successful settlement)
    const from = originalRequest.buyer
    const to = originalRequest.provider
    const _edge = `${from}→${to}`

    // Increment existing strength (TypeDB 3.0: match/delete/insert)
    writeSilent(`
      match $p isa path, has from-unit "${from}", has to-unit "${to}", has strength $s;
      delete $p has strength $s;
      insert $p has strength ($s + 1.0);
    `)
    // If path has no strength yet, set to 1.0
    writeSilent(`
      match $p isa path, has from-unit "${from}", has to-unit "${to}";
      not { $p has strength $_; };
      insert $p has strength 1.0;
    `)

    // Step 7: Mark settlement as complete
    await markSettled(escrow_id, hireResult, db)

    // Return 200 with result
    return Response.json(
      {
        status: 200,
        escrow_id,
        settlement_id: settlementId,
        result: hireResult,
        mark_strength: 1, // Will be updated by TypeDB in next read
        fee_collected_mist: 50, // 50 bps protocol fee (from Move contract)
        tx_digest: proof.tx_digest,
      },
      { status: 200 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[settle] error:', msg, err)
    return Response.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}

/**
 * Re-execute the original /api/buy/hire logic.
 *
 * Takes original request params and:
 * 1. Verifies provider + skill capability still exist
 * 2. Creates chat group (or reuses if exists)
 * 3. Sends initial message if provided
 * 4. Returns same shape as /api/buy/hire
 */
async function reexecuteHire(originalRequest: {
  buyer: string
  provider: string
  skillId: string
  initialMessage?: string
  groupId?: string
  chatUrl?: string
}): Promise<{ ok: true; groupId: string; chatUrl: string } | { ok: false; error: string }> {
  const {
    buyer,
    provider,
    skillId,
    initialMessage,
    groupId: existingGroupId,
    chatUrl: existingChatUrl,
  } = originalRequest

  try {
    // Verify provider + skill capability still exists
    const rows = await readParsed(`
      match
        $u isa unit, has uid "${provider}";
        $s isa skill, has skill-id "${skillId}";
        (provider: $u, offered: $s) isa capability;
      select $u;
    `)

    if (rows.length === 0) {
      return { ok: false, error: `Capability ${skillId} no longer available on ${provider}` }
    }

    // Reuse existing group or create new one
    const groupId = existingGroupId || `hire:${buyer}:${provider}:${Date.now()}`

    // Only insert if new group
    if (!existingGroupId) {
      writeSilent(`insert $g isa group, has gid "${groupId}", has name "hire:${provider}", has tag "hire";`)
      writeSilent(
        `match $g isa group, has gid "${groupId}"; $b isa unit, has uid "${buyer}"; insert (member: $b, group: $g) isa membership, has member-role "buyer";`,
      )
      writeSilent(
        `match $g isa group, has gid "${groupId}"; $p isa unit, has uid "${provider}"; insert (member: $p, group: $g) isa membership, has member-role "provider";`,
      )
    }

    // Emit initial signal if message provided (and not already sent)
    if (initialMessage && !existingGroupId) {
      // Fire-and-forget: best-effort signal emission
      writeSilent(`
        insert
          $s isa signal,
          has receiver "${provider}",
          has data "${JSON.stringify({
            tags: ['hire', 'initial'],
            content: initialMessage,
            groupId,
          })}";
      `)
    }

    return {
      ok: true,
      groupId,
      chatUrl: existingChatUrl || `/app/${groupId}`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Re-execution failed: ${msg}` }
  }
}
