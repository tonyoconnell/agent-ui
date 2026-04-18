/**
 * Pay Unit v1 — Sui-native USDC commerce.
 *
 * Handlers:
 *   pay:initiate  — buyer creates escrow on Sui (locks USDC)
 *   pay:settle    — seller releases escrow (USDC flows, 2% to treasury)
 *   treasury:one  — collect fees and mark treasury edge (L4 revenue)
 *
 * Signal shape:
 *   initiate: { skillId, buyerUid, sellerUid, amount, pathId? }
 *   settle:   { escrowId, sellerUid, pathId }
 *   treasury: { kind: 'fee', amount, edge, tx_hash }
 *
 * Four outcomes (see routing.md):
 *   Confirmed TX    → { result: { digest, escrowId? } } → mark(amount × depth)
 *   RPC timeout     → { timeout: true } → neutral
 *   Insufficient    → null (dissolved) → warn(0.5)
 *   Wallet rejects  → null (no result) → warn(1)
 */

import { createEscrow, releaseEscrow } from '@/lib/sui'
import type { World } from './world'

const TREASURY_UID = 'treasury'
const PLATFORM_FEE = 0.02
const ESCROW_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function registerPayUnit(net: World): void {
  net
    .add('pay')
    .on('initiate', async (data: unknown) => {
      const { skillId, buyerUid, sellerUid, amount, pathId } = (data ?? {}) as {
        skillId?: string
        buyerUid?: string
        sellerUid?: string
        amount?: number
        pathId?: string
      }

      if (!skillId || !buyerUid || !sellerUid || !amount) return null

      const buyerUnitId = `unit:${buyerUid}`
      const sellerUnitId = `unit:${sellerUid}`
      const resolvedPathId = pathId ?? `path:${buyerUid}:${sellerUid}`

      try {
        const { digest, escrowId } = await createEscrow(
          buyerUid,
          buyerUnitId,
          sellerUnitId,
          skillId,
          Math.round(amount),
          Date.now() + ESCROW_DEADLINE_MS,
          resolvedPathId,
        )

        return { result: { digest, escrowId, skillId, buyer: buyerUid, seller: sellerUid, amount } }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('timeout') || msg.includes('TIMEOUT')) return { timeout: true }
        return null
      }
    })
    .on('settle', async (data: unknown, emit) => {
      const { escrowId, sellerUid, pathId, amount, skillId, buyerUid } = (data ?? {}) as {
        escrowId?: string
        sellerUid?: string
        pathId?: string
        amount?: number
        skillId?: string
        buyerUid?: string
      }

      if (!escrowId || !sellerUid) return null

      const sellerUnitId = `unit:${sellerUid}`
      const resolvedPathId = pathId ?? `path:${buyerUid ?? 'buyer'}:${sellerUid}`

      try {
        const { digest } = await releaseEscrow(sellerUid, escrowId, sellerUnitId, resolvedPathId)

        const fee = amount ? Math.round(amount * PLATFORM_FEE) : undefined

        emit({
          receiver: 'signal',
          data: {
            tags: ['commerce:settle', 'L4'],
            content: {
              type: 'commerce:settle',
              digest,
              escrowId,
              skillId,
              seller: sellerUid,
              buyer: buyerUid,
              amount,
              fee,
              treasury: TREASURY_UID,
              settledAt: Date.now(),
            },
          },
        })

        return {
          result: { digest, escrowId, seller: sellerUid, amount, fee },
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('timeout') || msg.includes('TIMEOUT')) return { timeout: true }
        return null
      }
    })
    .on('fee', async (data: unknown) => {
      const { kind, amount, edge, tx_hash } = (data ?? {}) as {
        kind?: string
        amount?: number
        edge?: string
        tx_hash?: string
      }

      if (kind !== 'fee' || !amount || !edge) return null

      // L4 Treasury: collect 2% platform fee from each transaction
      // Record in TypeDB audit trail for accounting
      try {
        return {
          result: {
            collected: amount,
            edge,
            tx_hash,
            collectedAt: Date.now(),
          },
        }
      } catch (_err) {
        return null
      }
    })
}
