/**
 * Escrow Settlement Types — SUI Phase 3 (DECISION-SUI-Phase3-W2.md § D3)
 *
 * Deterministic settlement: client releases escrow on Sui,
 * provides TX digest, server verifies and re-executes original hire.
 */

import { z } from 'zod'

/**
 * Settlement request: escrow released on Sui, need to verify and settle.
 */
export const SettlementRequestSchema = z.object({
  escrow_id: z.string().regex(/^0x[a-f0-9]{40,}$/, 'Invalid Sui object ID'),
  proof: z.object({
    tx_digest: z.string().regex(/^[a-zA-Z0-9=]{43,44}$/, 'Invalid Sui TX digest'),
    tx_effects: z.unknown().optional(),
  }),
  original_request: z
    .object({
      buyer: z.string(),
      provider: z.string(),
      skillId: z.string(),
      initialMessage: z.string().optional(),
      groupId: z.string().optional(),
      chatUrl: z.string().optional(),
    })
    .optional(),
})

export type SettlementRequest = z.infer<typeof SettlementRequestSchema>

/**
 * Settlement response: escrow verified and re-executed.
 */
export const SettlementResponseSchema = z.object({
  status: z.literal(200),
  escrow_id: z.string(),
  settlement_id: z.string(),
  result: z.object({
    ok: z.boolean(),
    groupId: z.string(),
    chatUrl: z.string(),
  }),
  mark_strength: z.number(),
  fee_collected_mist: z.number().optional(),
  tx_digest: z.string(),
})

export type SettlementResponse = z.infer<typeof SettlementResponseSchema>

/**
 * Durable settlement state — stored in D1, survives restarts.
 */
export interface DurableSettlement {
  id: string // 'settle:${escrow_id}'
  escrow_id: string
  tx_digest: string
  original_request: {
    buyer: string
    provider: string
    skillId: string
    initialMessage?: string
    groupId?: string
    chatUrl?: string
  }
  status: 'pending' | 'settled' | 'failed'
  result_json?: string // JSON stringified result
  error_message?: string
  retry_count: number
  created_at: number
  settled_at?: number
  expires_at: number
}

/**
 * EscrowReleased event from Sui Move contract.
 * Parsed from transaction effects.
 */
export interface EscrowReleasedEvent {
  escrow_id: string // 0x...
  released_at_ms: number
  tx_digest: string
}
