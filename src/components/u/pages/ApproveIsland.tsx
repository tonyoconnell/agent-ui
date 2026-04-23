/**
 * ApproveIsland — Human co-sign approval UI
 *
 * Pattern A (agents.md): agent drafted + signed first; human reviews and
 * approves with Touch ID (vault unlock → sign txBytes → PUT /api/agent/pending/:id).
 *
 * States:
 *   loading  → fetching request from GET /api/agent/pending/:id
 *   ready    → request loaded, awaiting human decision
 *   signing  → Touch ID prompted, vault signing in progress
 *   done     → approval submitted; shows tx digest or rejection confirmation
 *   expired  → request TTL elapsed (410 from server)
 *   error    → network or vault failure
 */

import { CheckCircle2, Clock, Loader2, ShieldAlert, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { emitClick } from '@/lib/ui-signal'
import { approveCoSign, rejectCoSign } from '../lib/agent-sign'

// ── Types ──────────────────────────────────────────────────────────────────

interface CoSignRequestWire {
  id: string
  agentUid: string
  txBytesB64: string
  agentSigB64: string
  summary: string
  expiresAt: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  targetAddress: string
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'ready'; request: CoSignRequestWire; secondsLeft: number }
  | { kind: 'signing' }
  | { kind: 'done'; action: 'approved'; digest: string }
  | { kind: 'done'; action: 'rejected' }
  | { kind: 'expired' }
  | { kind: 'error'; message: string }

// ── Props ──────────────────────────────────────────────────────────────────

interface ApproveIslandProps {
  requestId: string
}

// ── Component ──────────────────────────────────────────────────────────────

export function ApproveIsland({ requestId }: ApproveIslandProps) {
  const [state, setState] = useState<PageState>({ kind: 'loading' })

  // Fetch the co-sign request on mount
  useEffect(() => {
    if (!requestId) {
      setState({ kind: 'error', message: 'No request ID in URL.' })
      return
    }

    void fetchRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, fetchRequest])

  // Countdown ticker — updates secondsLeft every second while in 'ready' state
  useEffect(() => {
    if (state.kind !== 'ready') return

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.kind !== 'ready') return prev
        const secondsLeft = Math.max(0, Math.round((prev.request.expiresAt - Date.now()) / 1000))
        if (secondsLeft === 0) {
          return { kind: 'expired' }
        }
        return { ...prev, secondsLeft }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [state.kind])

  async function fetchRequest() {
    try {
      const res = await fetch(`/api/agent/pending/${encodeURIComponent(requestId)}`, {
        credentials: 'include',
      })
      if (res.status === 410) {
        setState({ kind: 'expired' })
        return
      }
      if (!res.ok) {
        const text = await res.text()
        setState({ kind: 'error', message: `Failed to load request (${res.status}): ${text}` })
        return
      }
      const request = (await res.json()) as CoSignRequestWire
      const secondsLeft = Math.max(0, Math.round((request.expiresAt - Date.now()) / 1000))
      if (secondsLeft === 0) {
        setState({ kind: 'expired' })
        return
      }
      setState({ kind: 'ready', request, secondsLeft })
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message ?? 'Network error' })
    }
  }

  async function handleApprove() {
    emitClick('ui:wallet:cosign-approve')
    setState({ kind: 'signing' })
    try {
      const { digest } = await approveCoSign(requestId)
      setState({ kind: 'done', action: 'approved', digest })
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message ?? 'Approval failed' })
    }
  }

  async function handleReject() {
    emitClick('ui:wallet:cosign-reject')
    setState({ kind: 'signing' })
    try {
      await rejectCoSign(requestId)
      setState({ kind: 'done', action: 'rejected' })
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message ?? 'Rejection failed' })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading */}
        {state.kind === 'loading' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Loading co-sign request…</p>
            </CardContent>
          </Card>
        )}

        {/* Ready — waiting for human decision */}
        {state.kind === 'ready' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" aria-hidden="true" />
                <CardTitle className="text-base text-slate-100">Co-sign request</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Agent <span className="font-mono text-xs text-slate-300">{state.request.agentUid}</span> is requesting
                your approval.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Transaction summary */}
              <div className="rounded-md border border-[#252538] bg-[#0a0a0f] p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Transaction summary</p>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{state.request.summary}</p>
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  This request expires in{' '}
                  <span
                    className={state.secondsLeft <= 30 ? 'font-semibold text-red-400' : 'font-semibold text-slate-300'}
                    aria-live="polite"
                  >
                    {state.secondsLeft}s
                  </span>
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[#252538] text-slate-300 hover:bg-[#252538]"
                onClick={() => void handleReject()}
                aria-label="Reject this co-sign request"
              >
                Reject
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => void handleApprove()}
                aria-label="Approve this co-sign request with Touch ID"
              >
                Approve with Touch ID
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Signing in progress */}
        {state.kind === 'signing' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-slate-300">Touch ID prompt active…</p>
              <p className="text-xs text-muted-foreground">Waiting for biometric confirmation</p>
            </CardContent>
          </Card>
        )}

        {/* Done — approved */}
        {state.kind === 'done' && state.action === 'approved' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <CheckCircle2 className="h-10 w-10 text-green-400" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-slate-100">Transaction submitted</p>
                <p className="text-xs text-muted-foreground">
                  Digest: <span className="font-mono text-slate-400 break-all">{state.digest}</span>
                </p>
              </div>
              <Button
                variant="outline"
                className="border-[#252538] text-slate-300 hover:bg-[#252538]"
                onClick={() => {
                  emitClick('ui:wallet:cosign-done-back')
                  window.location.href = '/u'
                }}
              >
                Back to wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Done — rejected */}
        {state.kind === 'done' && state.action === 'rejected' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <XCircle className="h-10 w-10 text-slate-400" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-slate-100">Request rejected</p>
                <p className="text-sm text-muted-foreground">The agent has been notified.</p>
              </div>
              <Button
                variant="outline"
                className="border-[#252538] text-slate-300 hover:bg-[#252538]"
                onClick={() => {
                  emitClick('ui:wallet:cosign-done-back')
                  window.location.href = '/u'
                }}
              >
                Back to wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Expired */}
        {state.kind === 'expired' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <Clock className="h-10 w-10 text-amber-400" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-slate-100">Request expired</p>
                <p className="text-sm text-muted-foreground">
                  This co-sign request has expired (5-minute TTL). Ask the agent to re-submit.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-[#252538] text-slate-300 hover:bg-[#252538]"
                onClick={() => {
                  emitClick('ui:wallet:cosign-expired-back')
                  window.location.href = '/u'
                }}
              >
                Back to wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {state.kind === 'error' && (
          <Card className="border-[#252538] bg-[#161622]">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-slate-100">Something went wrong</p>
                <p className="text-sm text-destructive">{state.message}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-[#252538] text-slate-300 hover:bg-[#252538]"
                  onClick={() => {
                    emitClick('ui:wallet:cosign-error-retry')
                    setState({ kind: 'loading' })
                    void fetchRequest()
                  }}
                >
                  Retry
                </Button>
                <Button
                  variant="outline"
                  className="border-[#252538] text-slate-300 hover:bg-[#252538]"
                  onClick={() => {
                    emitClick('ui:wallet:cosign-error-back')
                    window.location.href = '/u'
                  }}
                >
                  Back to wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
