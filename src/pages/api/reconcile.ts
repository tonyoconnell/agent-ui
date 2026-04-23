/**
 * POST /api/reconcile
 *
 * Run reconciliation tick — compare on-chain Sui balance vs TypeDB signal
 * ledger per wallet. Mismatch → auto-pause wallet + write security hypothesis.
 *
 * Called by workers/sync/index.ts Job 5 every 60s.
 * Also callable manually for diagnostics.
 *
 * Returns: { ok, mismatch, error, results[] }
 */
import type { APIRoute } from 'astro'
import { reconcileAll } from '@/lib/reconcile'

export const POST: APIRoute = async () => {
  try {
    const results = await reconcileAll()

    const summary = results.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Response.json({
      ok: summary.ok ?? 0,
      mismatch: summary.mismatch ?? 0,
      error: summary.error ?? 0,
      results: results.map((r) => ({
        uid: r.uid,
        address: r.address,
        status: r.status,
        // BigInt serialization: convert to string
        onChainMist: r.onChainMist.toString(),
        expectedMist: r.expectedMist.toString(),
        delta: r.delta.toString(),
        ...(r.errorMessage ? { errorMessage: r.errorMessage } : {}),
      })),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg, ok: 0, mismatch: 0, error_count: 1 }, { status: 500 })
  }
}
