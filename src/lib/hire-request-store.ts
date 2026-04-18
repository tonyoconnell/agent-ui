/**
 * Hire Request Store — Store original request when 402 is returned.
 *
 * When /api/buy/hire returns 402 (pheromone shortage), the original request
 * must be saved so that settlement can re-execute it later.
 *
 * Pattern: Client receives 402 + escrow_template, funds escrow on Sui,
 * releases escrow, then calls settlement with tx_digest.
 * Settlement needs the original request to recreate the same hire.
 *
 * Storage: D1 table (escrow_settlements.original_request JSON field).
 * Note: original_request is stored by settlement endpoint after verifying TX.
 */

import type { DurableSettlement } from '@/types/escrow-settlement'

/**
 * Derive settlement ID from escrow ID.
 * This is used to store the request before escrow is created on Sui.
 *
 * Note: Escrow is created ON Sui by the client (createEscrowTx + signAndExecute).
 * We don't create it here. The client provides the escrow_id from the Move event.
 */
export function deriveSettlementId(escrowId: string): string {
  return `settle:${escrowId}`
}

/**
 * Build original request structure for settlement.
 * This is passed as `proof.original_request` in the settlement call.
 */
export function buildSettlementRequest(params: {
  buyer: string
  provider: string
  skillId: string
  initialMessage?: string
  groupId?: string
  chatUrl?: string
}): DurableSettlement['original_request'] {
  return {
    buyer: params.buyer,
    provider: params.provider,
    skillId: params.skillId,
    initialMessage: params.initialMessage,
    groupId: params.groupId,
    chatUrl: params.chatUrl,
  }
}

/**
 * Cache original request in local state during 402 response.
 * This allows the client to include original_request in settlement call.
 *
 * Strategy:
 *   1. Server returns 402 + escrow_template
 *   2. Client stores original_request in localStorage or request body
 *   3. Client funds escrow on Sui (createEscrowTx → signAndExecute)
 *   4. Client releases escrow on Sui (releaseEscrowTx → signAndExecute)
 *   5. Client calls settlement with original_request in body
 *   6. Settlement re-executes hire with original_request
 *
 * The client must send original_request in settlement call because:
 *   - Settlement endpoint doesn't have access to user session context
 *   - Settlement can be called from a different device/browser
 *   - We don't want to cache requests server-side (simplicity)
 */
export function encodeRequestForClient(originalRequest: DurableSettlement['original_request']): string {
  return JSON.stringify(originalRequest)
}

export function decodeRequestFromClient(encoded: string): DurableSettlement['original_request'] {
  return JSON.parse(encoded)
}
