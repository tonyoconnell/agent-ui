/**
 * x402 — HTTP 402 Payment Required gate for capability-priced routes.
 *
 * Standard: https://github.com/coinbase/x402
 * ONE adaptation: Sui escrow scheme (MIST) instead of Base USDC.
 *
 * Flow:
 *   1. Client requests a priced capability (POST /api/capability/hire)
 *   2. Gate checks pheromone — low trust → 402 with escrow template + X-Payment-Required header
 *   3. Client pays on Sui (create_escrow + release_escrow)
 *   4. Client retries with X-Payment: { escrow_id, tx_digest }
 *   5. Gate verifies TX → proceeds to hire
 *
 * Pheromone threshold: once path strength ≥ 1.0 (earned trust), payment is skipped.
 * Revenue = weight: every payment marks the path, accumulating trust over time.
 */

import type { EscrowTemplate, Payment402Response } from '@/types/escrow'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface X402Requirement {
  version: 1
  scheme: 'sui-escrow'
  network: 'sui:testnet' | 'sui:mainnet'
  maxAmountRequired: string // human-readable SUI, e.g. "0.05"
  resource: string // API path being gated, e.g. "/api/capability/hire"
  description: string
  mimeType: 'application/json'
  payTo: string // provider Sui address
  maxTimeoutSeconds: number
  asset: 'SUI'
  extra: { escrow_template: EscrowTemplate }
}

export interface XPaymentProof {
  escrow_id: string // Sui Escrow object ID
  tx_digest: string // Sui TX digest of release_escrow call
}

// ─── Builders ────────────────────────────────────────────────────────────────

/** Build an EscrowTemplate for a priced capability hire. */
export function buildEscrowTemplate(
  providerSuiId: string,
  skillId: string,
  price: number,
  pathId = '0x',
): EscrowTemplate {
  return {
    worker_id: providerSuiId,
    task_name: skillId,
    amount_mist: Math.round(price * 1e9), // SUI → MIST
    deadline_ms: Date.now() + 3_600_000, // 1 hour expiry
    path_id: pathId,
    settlement_url: '/api/capability/hire/settle',
  }
}

/** Build the X-Payment-Required header payload. */
export function buildX402Requirement(
  escrowTemplate: EscrowTemplate,
  providerSuiId: string,
  skillId: string,
  resource: string,
  price: number,
  network: 'sui:testnet' | 'sui:mainnet',
): X402Requirement {
  return {
    version: 1,
    scheme: 'sui-escrow',
    network,
    maxAmountRequired: String(price),
    resource,
    description: `Pay ${price} SUI for ${skillId} capability`,
    mimeType: 'application/json',
    payTo: providerSuiId,
    maxTimeoutSeconds: 3600,
    asset: 'SUI',
    extra: { escrow_template: escrowTemplate },
  }
}

/** Build the full 402 Response with X-Payment-Required header. */
export function payment402Response(requirement: X402Requirement): Response {
  const template = requirement.extra.escrow_template
  const body: Payment402Response = {
    status: 402,
    code: 'payment_required',
    escrow_template: template,
    expires_at: template.deadline_ms,
  }
  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': JSON.stringify(requirement),
    },
  })
}

// ─── X-Payment header parsing ────────────────────────────────────────────────

/**
 * Parse the X-Payment header from a retry request.
 * Returns null if absent or malformed.
 */
export function parseXPayment(header: string | null): XPaymentProof | null {
  if (!header) return null
  try {
    const parsed = JSON.parse(header) as unknown
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'escrow_id' in parsed &&
      'tx_digest' in parsed &&
      typeof (parsed as Record<string, unknown>).escrow_id === 'string' &&
      typeof (parsed as Record<string, unknown>).tx_digest === 'string'
    ) {
      return parsed as XPaymentProof
    }
    return null
  } catch {
    return null
  }
}

// ─── Network helper ──────────────────────────────────────────────────────────

/** Derive x402 network string from SUI_NETWORK env. */
export function x402Network(): 'sui:testnet' | 'sui:mainnet' {
  return (import.meta.env?.SUI_NETWORK ?? 'testnet') === 'mainnet' ? 'sui:mainnet' : 'sui:testnet'
}
