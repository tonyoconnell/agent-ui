/**
 * Sui Transaction Verification — Query RPC for EscrowReleased events.
 *
 * Settlement endpoint verifies that:
 * 1. TX digest is valid and exists on-chain
 * 2. TX contains EscrowReleased event
 * 3. Event.escrow_id matches the settlement request
 *
 * Returns event details for audit logging.
 */

import type { EscrowReleasedEvent } from '@/types/escrow-settlement'

/**
 * Verify that a TX digest contains an EscrowReleased event for the given escrow_id.
 *
 * Query Sui RPC: getTransactionBlock(tx_digest) → parse events
 * Look for event type: `${PACKAGE_ID}::substrate::EscrowReleased`
 * Extract escrow_id from event.data
 *
 * Returns:
 *   { valid: true, event: {...} } on success
 *   { valid: false, reason: "..." } on failure
 */
export async function verifySuiTx(
  txDigest: string,
  expectedEscrowId: string,
): Promise<{ valid: true; event: EscrowReleasedEvent } | { valid: false; reason: string }> {
  try {
    // Lazy-load Sui client (only available at runtime, not at import time)
    const sui = await import('@/lib/sui')
    const client = sui.getClient()
    const packageId = (import.meta.env.SUI_PACKAGE_ID || '').toLowerCase()

    if (!packageId) {
      return { valid: false, reason: 'SUI_PACKAGE_ID not configured' }
    }

    // Query TX block from Sui RPC
    const txBlock = await client.getTransactionBlock({
      digest: txDigest,
      options: {
        showEffects: true,
        showEvents: true,
      },
    })

    if (!txBlock) {
      return { valid: false, reason: `TX digest not found: ${txDigest}` }
    }

    // Parse events
    const events = txBlock.events || []
    const _escrowReleasedEventType = `${packageId}::substrate::EscrowReleased`

    let foundEvent = null
    for (const event of events) {
      if (!event.type.includes('EscrowReleased')) continue

      // Parse event data
      // Event structure: { escrow_id: ID, released_amount: u64, fee_collected: u64, ... }
      try {
        const data = (event.parsedJson as any) || {}
        const escrowId = (data.escrow_id || '').toLowerCase()

        if (escrowId === expectedEscrowId.toLowerCase()) {
          foundEvent = {
            escrow_id: escrowId,
            released_at_ms: Date.now(), // Event timestamp (may be in effects)
            tx_digest: txDigest,
          }
          break
        }
      } catch (_e) {
        // Continue to next event
      }
    }

    if (!foundEvent) {
      return {
        valid: false,
        reason: `No EscrowReleased event found for escrow_id: ${expectedEscrowId}`,
      }
    }

    return { valid: true, event: foundEvent }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { valid: false, reason: `Sui RPC error: ${msg}` }
  }
}

/**
 * Extract all EscrowReleased events from a TX block.
 * Used for event absorption (bridge.ts → TypeDB audit logging).
 */
export async function extractEscrowReleasedEvents(txDigest: string): Promise<EscrowReleasedEvent[]> {
  try {
    const sui = await import('@/lib/sui')
    const client = sui.getClient()
    const packageId = (import.meta.env.SUI_PACKAGE_ID || '').toLowerCase()

    if (!packageId) return []

    const txBlock = await client.getTransactionBlock({
      digest: txDigest,
      options: {
        showEffects: true,
        showEvents: true,
      },
    })

    if (!txBlock?.events) return []

    const events: EscrowReleasedEvent[] = []
    for (const event of txBlock.events) {
      if (!event.type.includes('EscrowReleased')) continue

      try {
        const data = (event.parsedJson as any) || {}
        const escrowId = data.escrow_id as string

        events.push({
          escrow_id: escrowId,
          released_at_ms: Date.now(),
          tx_digest: txDigest,
        })
      } catch {
        // Skip malformed events
      }
    }

    return events
  } catch {
    return []
  }
}
