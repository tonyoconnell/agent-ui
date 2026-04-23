/**
 * POST /api/reconcile — Wallet balance reconciliation tick
 *
 * Compares on-chain SUI balances against TypeDB signal event log.
 * Emits a warn signal and push notification for any wallet whose
 * on-chain balance change deviates >5% AND >0.1 SUI from the
 * TypeDB-recorded delta over the last 24 h.
 *
 * Designed to be called by cron (every 60 min) or manually.
 * Wire up in wrangler.toml: cron trigger "0 * * * *" → POST /api/reconcile
 *
 * Returns: { checked: N, mismatches: M, ok: boolean, detail: MismatchRecord[] }
 */

import type { APIRoute } from 'astro'
import { getNet } from '@/lib/net'
import { getClient } from '@/lib/sui'
import { escapeTqlString, readParsed } from '@/lib/typedb'

// Alert thresholds
const DEVIATION_THRESHOLD = 0.05 // 5 %
const MIN_SUI_THRESHOLD = 0.1 // minimum gap to alert (in SUI units)
const MIST_PER_SUI = 1_000_000_000n // 1 SUI = 10^9 MIST
const LOOKBACK_MS = 24 * 60 * 60 * 1000 // 24 h in ms

// Ops push subscription: read from OPS_PUSH_SUBSCRIPTION env var (JSON string).
// Production: replace with a D1 table of per-user subscriptions.
async function getOpsSubscription(): Promise<{
  endpoint: string
  keys: { p256dh: string; auth: string }
} | null> {
  const raw =
    typeof process !== 'undefined' && process.env && process.env.OPS_PUSH_SUBSCRIPTION
      ? process.env.OPS_PUSH_SUBSCRIPTION
      : null
  if (!raw) return null
  try {
    return JSON.parse(raw) as { endpoint: string; keys: { p256dh: string; auth: string } }
  } catch {
    return null
  }
}

export interface MismatchRecord {
  address: string
  uid: string
  onChainMist: string
  typedbDeltaMist: string
  deviation: number
}

export interface ReconcileResult {
  checked: number
  mismatches: number
  ok: boolean
  detail: MismatchRecord[]
  error?: string
}

export const POST: APIRoute = async () => {
  const mismatches: MismatchRecord[] = []
  let checked = 0

  try {
    // ── 1. Query TypeDB for all units with a wallet attribute ───────────────
    let wallets: { uid: string; wallet: string }[]
    try {
      const rows = await readParsed(`
        match
          $u isa unit, has uid $uid, has wallet $wallet;
        select $uid, $wallet;
      `)
      wallets = rows
        .filter((r) => typeof r.uid === 'string' && typeof r.wallet === 'string')
        .map((r) => ({ uid: r.uid as string, wallet: r.wallet as string }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[reconcile] TypeDB wallet query failed:', msg)
      return Response.json(
        { checked: 0, mismatches: 0, ok: false, detail: [], error: `TypeDB query failed: ${msg}` },
        { status: 500 },
      )
    }

    if (wallets.length === 0) {
      return Response.json({ checked: 0, mismatches: 0, ok: true, detail: [] })
    }

    const suiClient = getClient()
    const since = Date.now() - LOOKBACK_MS

    // ── 2. Per-wallet: on-chain balance + TypeDB signal delta ───────────────
    await Promise.all(
      wallets.map(async ({ uid, wallet }) => {
        try {
          checked++

          // On-chain total balance (MIST)
          const balanceResp = await suiClient
            .getBalance({ owner: wallet, coinType: '0x2::sui::SUI' })
            .catch((e: unknown) => {
              console.warn(`[reconcile] getBalance failed for ${wallet}:`, e instanceof Error ? e.message : e)
              return null
            })

          if (!balanceResp) return

          const onChainMist = BigInt(balanceResp.totalBalance ?? '0')

          // TypeDB: signed delta from signals over last 24 h.
          // Inbound (received by this unit) is positive, outbound negative.
          // Weights are stored in SUI; convert to MIST for comparison.
          const safeWallet = escapeTqlString(wallet)
          const safeUid = escapeTqlString(uid)

          let typedbDeltaMist = 0n
          try {
            // Inbound: signals whose receiver contains the wallet address
            const inRows = await readParsed(`
              match
                $s isa signal,
                  has receiver $rcv,
                  has weight $w,
                  has timestamp $ts;
                $rcv contains "${safeWallet}";
                $ts >= ${since};
              select $w;
            `)
            for (const row of inRows) {
              const w = row.w
              if (typeof w === 'number' && Number.isFinite(w) && w > 0) {
                typedbDeltaMist += BigInt(Math.round(w * Number(MIST_PER_SUI)))
              }
            }

            // Outbound: signals whose sender matches the unit uid
            const outRows = await readParsed(`
              match
                $s isa signal,
                  has sender $snd,
                  has weight $w,
                  has timestamp $ts;
                $snd contains "${safeUid}";
                $ts >= ${since};
              select $w;
            `)
            for (const row of outRows) {
              const w = row.w
              if (typeof w === 'number' && Number.isFinite(w) && w > 0) {
                typedbDeltaMist -= BigInt(Math.round(w * Number(MIST_PER_SUI)))
              }
            }
          } catch (e) {
            console.warn(
              `[reconcile] TypeDB signal query failed for ${uid}:`,
              e instanceof Error ? e.message : e,
            )
            // Continue with delta = 0n — deviation check runs against full on-chain balance
          }

          // ── 3. Deviation check ─────────────────────────────────────────────
          // |onChainMist - typedbDeltaMist| / max(onChainMist, 1) > 5%
          // AND absolute gap > 0.1 SUI
          const diff = onChainMist - typedbDeltaMist
          const absDiff = diff < 0n ? -diff : diff
          const baseline = onChainMist > 0n ? onChainMist : 1n
          const deviation = Number(absDiff) / Number(baseline)
          const absDiffSui = Number(absDiff) / Number(MIST_PER_SUI)

          if (deviation > DEVIATION_THRESHOLD && absDiffSui > MIN_SUI_THRESHOLD) {
            const record: MismatchRecord = {
              address: wallet,
              uid,
              onChainMist: onChainMist.toString(),
              typedbDeltaMist: typedbDeltaMist.toString(),
              deviation,
            }
            mismatches.push(record)

            // ── 4a. Emit warn signal into substrate ──────────────────────────
            try {
              const net = await getNet()
              net.signal({
                receiver: 'reconcile:mismatch',
                data: {
                  tags: ['reconcile', 'mismatch', 'wallet'],
                  weight: -1,
                  content: record,
                },
              })
              net.warn(`${uid}→reconcile:mismatch`, 1)
            } catch (e) {
              console.warn('[reconcile] net.signal failed:', e instanceof Error ? e.message : e)
            }

            // ── 4b. Push notification if VAPID keys are configured ───────────
            const subscription = await getOpsSubscription()
            if (subscription) {
              try {
                const { sendPush } = await import('@/lib/notify/push')
                await sendPush(subscription, {
                  title: 'Wallet Reconciliation Mismatch',
                  body: `${uid} | deviation ${(deviation * 100).toFixed(1)}% | diff ${absDiffSui.toFixed(4)} SUI`,
                  data: record as unknown as Record<string, unknown>,
                })
              } catch (e) {
                console.warn('[reconcile] push notification failed:', e instanceof Error ? e.message : e)
              }
            }
          }
        } catch (e) {
          console.warn(`[reconcile] skipping wallet ${wallet}:`, e instanceof Error ? e.message : e)
        }
      }),
    )

    return Response.json({
      checked,
      mismatches: mismatches.length,
      ok: mismatches.length === 0,
      detail: mismatches,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[reconcile] fatal error:', msg)
    return Response.json(
      { checked, mismatches: mismatches.length, ok: false, detail: mismatches, error: msg },
      { status: 500 },
    )
  }
}
