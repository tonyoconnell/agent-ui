// src/components/u/ScopeChangeBanner.tsx — Non-alarming scope change notification banner.
//
// Shown on /u/agents/[id] when a ScopeChangedEvent is detected for the agent's
// ScopedWallet. Listens via WebSocket (WsHub DO) with a polling fallback.
//
// Design:
//   - Subtle, bottom-anchored strip — no modal, no alarm color
//   - Appears once per detected change; dismissable by the user
//   - Links to /u/agents/[id]/scope for full diff view
//   - emitClick('ui:scope:banner-view') on "view changes" click

import { Info, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScopeChangeBannerProps {
  agentId: string
  walletId?: string
}

/** Shape of the ScopeChangedEvent message received over WsHub. */
interface ScopeChangedEvent {
  type: 'scope:changed'
  agentId: string
  walletId: string
  at: number // Unix ms
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WS_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws`
    : null

/** Poll every 30 s when WebSocket is unavailable. */
const POLL_INTERVAL_MS = 30_000

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScopeChangeBanner({ agentId, walletId }: ScopeChangeBannerProps) {
  const [visible, setVisible] = useState(false)
  const [changedAt, setChangedAt] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dismissedRef = useRef(false)

  // -------------------------------------------------------------------------
  // Detect a change via polling fallback
  // -------------------------------------------------------------------------
  const pollForChange = async () => {
    if (dismissedRef.current) return
    try {
      const target = walletId
        ? `/api/agents/${encodeURIComponent(agentId)}/scope?walletId=${encodeURIComponent(walletId)}&check=changed`
        : `/api/agents/${encodeURIComponent(agentId)}/scope?check=changed`

      const res = await fetch(target, { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as { changed?: boolean; at?: number }
      if (json.changed && !dismissedRef.current) {
        setVisible(true)
        setChangedAt(json.at ?? Date.now())
      }
    } catch {
      // Network errors are silently swallowed — banner is non-critical
    }
  }

  // -------------------------------------------------------------------------
  // WebSocket listener + polling fallback
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!WS_URL) return

    let connected = false

    const openWs = () => {
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.addEventListener('open', () => {
          connected = true
          // Cancel polling now that WS is up
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        })

        ws.addEventListener('message', (evt) => {
          if (dismissedRef.current) return
          try {
            const msg = JSON.parse(typeof evt.data === 'string' ? evt.data : '') as ScopeChangedEvent
            if (msg.type === 'scope:changed' && msg.agentId === agentId && (!walletId || msg.walletId === walletId)) {
              setVisible(true)
              setChangedAt(msg.at ?? Date.now())
            }
          } catch {
            // Ignore non-JSON or unrelated messages
          }
        })

        ws.addEventListener('close', () => {
          connected = false
          // Fall back to polling when WS closes
          if (!dismissedRef.current && !pollRef.current) {
            pollRef.current = setInterval(pollForChange, POLL_INTERVAL_MS)
          }
        })

        ws.addEventListener('error', () => {
          if (!connected && !pollRef.current) {
            // WS never connected — start polling immediately
            pollRef.current = setInterval(pollForChange, POLL_INTERVAL_MS)
            pollForChange()
          }
        })
      } catch {
        // WebSocket constructor can throw in some environments
        if (!pollRef.current) {
          pollRef.current = setInterval(pollForChange, POLL_INTERVAL_MS)
          pollForChange()
        }
      }
    }

    openWs()

    return () => {
      dismissedRef.current = true
      if (wsRef.current) wsRef.current.close()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [agentId, walletId, pollForChange]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleDismiss = () => {
    setVisible(false)
    dismissedRef.current = true
  }

  const handleView = () => {
    emitClick('ui:scope:banner-view', { agentId, walletId, at: changedAt })
    window.location.href = `/u/agents/${encodeURIComponent(agentId)}/scope`
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3',
        'rounded-2xl border border-sky-500/20 bg-sky-950/90 backdrop-blur-sm shadow-lg',
        'px-4 py-3 text-sm',
        'animate-in fade-in slide-in-from-bottom-2 duration-200',
        'max-w-[calc(100vw-2rem)] w-full sm:w-auto sm:min-w-[340px] sm:max-w-md',
      )}
    >
      <Info className="h-4 w-4 text-sky-400 shrink-0" strokeWidth={1.75} aria-hidden="true" />

      <span className="flex-1 text-sky-100/90 font-medium">Agent scope updated</span>

      <button
        type="button"
        onClick={handleView}
        className="text-sky-300 hover:text-sky-100 underline underline-offset-2 text-sm font-medium whitespace-nowrap transition-colors"
      >
        view changes
      </button>

      <button
        type="button"
        aria-label="Dismiss scope change notification"
        onClick={handleDismiss}
        className="ml-1 text-sky-400/60 hover:text-sky-200 transition-colors shrink-0"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}
