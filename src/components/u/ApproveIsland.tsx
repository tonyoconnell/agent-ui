/**
 * ApproveIsland — Co-sign approval UI (/u/approve)
 *
 * Pattern A co-sign flow (agents.md): human reviews a pending agent transaction
 * and approves or rejects it with Touch ID.
 *
 * Security invariant: the summary shown to the user is ALWAYS re-derived from
 * txBytes — never trusted from the agent. `verifySummaryMatch` enforces this.
 * If the derived summary doesn't match the stored summary, the UI refuses to
 * show the agent's description and warns the user not to sign.
 *
 * Flow:
 *   1. Mount: load pending request (requestId from URL ?id=)
 *   2. Re-derive summary from txBytes via verifySummaryMatch
 *   3. If mismatch → show fabrication warning with derived summary
 *   4. If match → show summary, Approve / Reject buttons
 *   5. Approve: approveCoSign(id) → Touch ID → combined sig → Sui digest
 *   6. Reject: rejectCoSign(id)
 */

import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import {
  getPendingRequests,
  approveCoSign,
  rejectCoSign,
  verifySummaryMatch,
  type CoSignRequest,
} from './lib/agent-sign'

// ── Types ──────────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'mismatch' | 'ready' | 'approving' | 'done' | 'rejected' | 'error'

// ── Component ──────────────────────────────────────────────────────────────

export function ApproveIsland() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [request, setRequest] = useState<CoSignRequest | null>(null)
  const [derived, setDerived] = useState<string>('')
  const [digest, setDigest] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // ── Load + verify ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // Resolve wallet address from vault for pending request lookup
        const { getWallet } = await import('./lib/idb')
        const wallet = await getWallet()
        if (!wallet?.address) {
          if (!cancelled) {
            setErrorMsg('No wallet found. Please create or restore a wallet first.')
            setLoadState('error')
          }
          return
        }

        // Determine requestId — prefer ?id= query param, else take first pending
        const params = new URLSearchParams(
          typeof window !== 'undefined' ? window.location.search : '',
        )
        const requestId = params.get('id')

        const all = await getPendingRequests(wallet.address)
        const req = requestId
          ? all.find((r) => r.id === requestId) ?? null
          : all.filter((r) => r.status === 'pending')[0] ?? null

        if (!req) {
          if (!cancelled) {
            setErrorMsg('No pending co-sign request found.')
            setLoadState('error')
          }
          return
        }

        // Security invariant: re-derive summary from txBytes, never trust stored
        const { match, derived: derivedSummary } = await verifySummaryMatch(
          req.txBytes,
          req.summary,
        )

        if (cancelled) return

        setRequest(req)
        setDerived(derivedSummary)

        if (!match) {
          // Agent-provided summary doesn't match — fabrication detected
          setLoadState('mismatch')
        } else {
          setLoadState('ready')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err))
          setLoadState('error')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handleApprove() {
    if (!request) return
    emitClick('ui:approve:approve', { requestId: request.id })
    setLoadState('approving')
    try {
      const { digest: txDigest } = await approveCoSign(request.id)
      setDigest(txDigest)
      setLoadState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setLoadState('error')
    }
  }

  async function handleReject() {
    if (!request) return
    emitClick('ui:approve:reject', { requestId: request.id })
    try {
      await rejectCoSign(request.id)
      setLoadState('rejected')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setLoadState('error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Loading co-sign request…</p>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#161622] border border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-400 font-semibold mb-2">Error</p>
          <p className="text-slate-300 text-sm">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (loadState === 'done') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#161622] border border-green-800 rounded-2xl p-6 text-center">
          <p className="text-green-400 font-semibold mb-2">Transaction submitted</p>
          <p className="text-slate-400 text-xs font-mono break-all">{digest}</p>
        </div>
      </div>
    )
  }

  if (loadState === 'rejected') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#161622] border border-[#252538] rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm">Transaction rejected.</p>
        </div>
      </div>
    )
  }

  // mismatch or ready
  const isMismatch = loadState === 'mismatch'
  const isApproving = loadState === 'approving'

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-white font-semibold text-lg">Agent transaction</h1>
          <p className="text-slate-400 text-xs mt-1">
            Agent:{' '}
            <span className="text-slate-300 font-mono">{request?.agentUid ?? '—'}</span>
          </p>
        </div>

        {/* Mismatch warning — shown when agent summary doesn't match txBytes */}
        {isMismatch && (
          <div className="bg-red-950 border border-red-700 rounded-2xl p-4">
            <p className="text-red-300 font-semibold text-sm mb-1">
              Warning: the transaction summary doesn&apos;t match. Do NOT sign.
            </p>
            <p className="text-red-200 text-xs leading-relaxed">
              The agent described this transaction differently than what the raw bytes contain.
              This may indicate a fabricated or tampered description.
            </p>
            <div className="mt-3">
              <p className="text-slate-400 text-xs mb-1">
                What the transaction actually does:
              </p>
              <p className="text-white text-sm font-mono bg-[#0a0a0f] rounded-lg p-3 break-all">
                {derived}
              </p>
            </div>
            <div className="mt-3">
              <p className="text-slate-400 text-xs mb-1">
                What the agent claimed:
              </p>
              <p className="text-red-300 text-sm font-mono bg-[#0a0a0f] rounded-lg p-3 break-all line-through opacity-60">
                {request?.summary ?? '—'}
              </p>
            </div>
          </div>
        )}

        {/* Summary — shown only when match === true */}
        {!isMismatch && (
          <div className="bg-[#161622] border border-[#252538] rounded-2xl p-4">
            <p className="text-slate-400 text-xs mb-2">Transaction summary</p>
            <p className="text-white text-sm font-mono leading-relaxed">{derived}</p>
          </div>
        )}

        {/* Expiry */}
        {request && (
          <p className="text-slate-500 text-xs text-center">
            Expires{' '}
            {new Date(request.expiresAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { void handleReject() }}
            disabled={isApproving}
            className="flex-1 min-h-[44px] rounded-xl border border-[#252538] bg-[#161622] text-slate-300 text-sm font-medium hover:bg-[#1e1e30] disabled:opacity-50 transition-colors"
          >
            Reject
          </button>

          <button
            type="button"
            onClick={() => { void handleApprove() }}
            disabled={isApproving || isMismatch}
            className="flex-1 min-h-[44px] rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApproving ? 'Signing…' : 'Approve'}
          </button>
        </div>

        {/* Extra note when mismatch blocks approval */}
        {isMismatch && (
          <p className="text-red-400 text-xs text-center">
            Approval is blocked. Only reject is allowed when the summary doesn&apos;t match.
          </p>
        )}
      </div>
    </div>
  )
}
