/**
 * Escrow and payment-required schemas for x402 HTTP flow.
 *
 * Spec: DECISION-SUI-Phase3-W2.md § D2
 */

export interface EscrowTemplate {
  worker_id: string // Sui ID of worker Unit
  task_name: string // e.g., "research"
  amount_mist: number // exact amount in MIST
  deadline_ms: number // now + 1 hour (absolute timestamp)
  path_id: string // Sui ID of the path being marked
  settlement_url: string // POST /api/capability/hire/settle
}

export interface Payment402Response {
  status: 402
  code: 'payment_required'
  escrow_template: EscrowTemplate
  expires_at: number // deadline_ms (client knows when template expires)
}
