/**
 * send.ts — Sponsored transaction submission with retry
 *
 * Submits a signed transaction through the sponsor Worker at /api/sponsor/execute.
 * Retries up to maxRetries times (default 3) with exponential backoff on epoch-expiry.
 * Throws WalletError on unrecoverable errors.
 *
 * Contract: interfaces/wallet/send.d.ts
 */

import type { SendOptions, SendResult } from '../../../../interfaces/wallet/send'
import { makeWalletError } from './errors'

export type { SendOptions, SendResult }

/**
 * sendTx — Submit a signed transaction through the sponsor Worker.
 *
 * @param txBytes   - Serialized transaction bytes
 * @param signature - Ed25519 signature from the user's signer
 * @param opts      - Optional: network, maxRetries (default 3), retryDelayMs (default 200)
 * @returns         - { digest, confirmedAt } on success
 * @throws          - WalletError with kind "epoch-expired" | "sponsor-unreachable" | "sponsor-rate-limited"
 */
export async function sendTx(txBytes: Uint8Array, signature: Uint8Array, opts: SendOptions = {}): Promise<SendResult> {
  const { maxRetries = 3, retryDelayMs = 200 } = opts

  let lastError: unknown

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('/api/sponsor/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txBytes: Array.from(txBytes),
          senderSig: Array.from(signature),
        }),
      })

      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}))
        if (isEpochExpiry(body)) {
          lastError = body
          await delay(retryDelayMs)
          continue
        }
        throw makeWalletError(res.status === 503 ? 'network-error' : 'rate-limited')
      }

      return (await res.json()) as SendResult
    } catch (err) {
      // Re-throw WalletErrors immediately — they are already classified
      if (err != null && typeof err === 'object' && (err as { name?: string }).name === 'WalletError') {
        throw err
      }
      lastError = err
      if (!isEpochExpiry(err)) throw err
    }

    await delay(retryDelayMs)
  }

  // All retries exhausted due to epoch expiry
  throw makeWalletError('epoch-expired', lastError)
}

/**
 * isEpochExpiry — Detect epoch-related errors in Sui RPC responses.
 *
 * Checks the `message`, `error`, or `code` fields of an error object for
 * epoch-related keywords emitted by the Sui RPC or sponsor Worker.
 */
export function isEpochExpiry(err: unknown): boolean {
  if (err == null || typeof err !== 'object') return false
  const obj = err as Record<string, unknown>
  const msg = String(obj.message ?? obj.error ?? '')
  const code = String(obj.code ?? '')
  return (
    msg.includes('epoch') ||
    msg.includes('expired') ||
    msg.includes('TransactionExpired') ||
    code.includes('epoch') ||
    code.includes('expired')
  )
}

// ── internal ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
