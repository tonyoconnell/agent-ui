import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { b64urlDecode, b64urlEncode, hmacSign as signBody } from '@/lib/owner-crypto'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = 'unknown' | 'locked' | 'unlocked' | 'unlocking' | 'error'

interface SessionStatus {
  locked: boolean
  expiresAt?: number
}

interface Props {
  /** Daemon base URL. Must be localhost. */
  daemonUrl?: string
  /** HMAC signing key, base64url-encoded. Read from server-rendered meta tag at page load — do NOT bundle into static JS. */
  daemonKey: string
  /** Touch-ID-derived PRF bytes. Caller runs the WebAuthn ceremony; this component does not. */
  getPrf: () => Promise<Uint8Array>
  /** Session TTL in seconds. Default 3600 (1 hour). */
  defaultTtlSec?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionUnlockButton({
  daemonUrl = 'http://127.0.0.1:48923',
  daemonKey,
  getPrf,
  defaultTtlSec = 3600,
  className,
}: Props) {
  const [status, setStatus] = useState<Status>('unknown')
  const [expiresAt, setExpiresAt] = useState<number | undefined>(undefined)
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined)
  const [isPending, startTransition] = useTransition()
  // Tick every minute so the TTL countdown stays current
  const [tick, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Localhost safety check
  const isLocalhost = daemonUrl.startsWith('http://127.0.0.1') || daemonUrl.startsWith('http://localhost')

  // ---------------------------------------------------------------------------
  // 1-minute countdown tick
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (status === 'unlocked' && expiresAt !== undefined) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 60_000)
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [status, expiresAt])

  // ---------------------------------------------------------------------------
  // Poll /session/status
  // ---------------------------------------------------------------------------

  const fetchStatus = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${daemonUrl}/session/status`, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const json: SessionStatus = await res.json()
      if (json.locked) {
        setStatus('locked')
        setExpiresAt(undefined)
      } else {
        // If TTL has passed, treat as locked
        if (json.expiresAt !== undefined && json.expiresAt * 1000 < Date.now()) {
          setStatus('locked')
          setExpiresAt(undefined)
        } else {
          setStatus('unlocked')
          setExpiresAt(json.expiresAt)
        }
      }
      setErrorMsg(undefined)
    } catch {
      setStatus('error')
      setErrorMsg(`Daemon offline — start with: bun run apps/owner-daemon/index.ts`)
    }
  }, [daemonUrl])

  // Mount: initial status check
  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  // 30-second polling
  useEffect(() => {
    const id = setInterval(() => void fetchStatus(), 30_000)
    return () => clearInterval(id)
  }, [fetchStatus])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleUnlock(): Promise<void> {
    if (!isLocalhost) {
      setErrorMsg('daemonUrl must be 127.0.0.1 or localhost — refusing remote key transmission')
      setStatus('error')
      return
    }

    setStatus('unlocking')
    setErrorMsg(undefined)
    emitClick('ui:owner:unlock')

    try {
      const prf = await getPrf()
      const prfB64 = b64urlEncode(prf)
      const bodyObj = { prfB64, ttlSec: defaultTtlSec }
      const bodyStr = JSON.stringify(bodyObj)
      const keyBytes = b64urlDecode(daemonKey)
      const sig = await signBody(bodyStr, keyBytes)

      const res = await fetch(`${daemonUrl}/session/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Daemon-Sig': sig,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(10_000),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => res.status.toString())
        throw new Error(`unlock failed: ${text}`)
      }

      const json: { ok: boolean; expiresAt: number } = await res.json()
      if (json.ok) {
        setStatus('unlocked')
        setExpiresAt(json.expiresAt)
      } else {
        throw new Error('daemon returned ok:false')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus('error')
      setErrorMsg(
        msg.includes('fetch') || msg.includes('Failed')
          ? `Daemon offline — start with: bun run apps/owner-daemon/index.ts`
          : msg,
      )
    }
  }

  async function handleLock(): Promise<void> {
    emitClick('ui:owner:lock')

    try {
      const bodyStr = JSON.stringify({})
      const keyBytes = b64urlDecode(daemonKey)
      const sig = await signBody(bodyStr, keyBytes)

      const res = await fetch(`${daemonUrl}/session/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Daemon-Sig': sig,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(5_000),
      })

      if (!res.ok) throw new Error(`lock failed: ${res.status}`)
      setStatus('locked')
      setExpiresAt(undefined)
      setErrorMsg(undefined)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus('error')
      setErrorMsg(msg)
    }
  }

  function handleClick(): void {
    if (status === 'locked' || status === 'error') {
      startTransition(() => {
        void handleUnlock()
      })
    }
  }

  function handleLockClick(): void {
    startTransition(() => {
      void handleLock()
    })
  }

  // ---------------------------------------------------------------------------
  // Derived label — tick dependency ensures countdown re-renders each minute
  // ---------------------------------------------------------------------------

  function label(): string {
    void tick // consumed to trigger re-render
    if (status === 'unlocking' || isPending) return 'Unlocking…'
    if (status === 'unlocked' && expiresAt !== undefined) {
      const minsLeft = Math.max(0, Math.ceil((expiresAt * 1000 - Date.now()) / 60_000))
      return `Unlocked — ${minsLeft}m remaining`
    }
    if (status === 'unlocked') return 'Unlocked'
    if (status === 'unknown') return 'Checking session…'
    if (status === 'error') return 'Unlock owner session'
    return 'Unlock owner session'
  }

  const isDisabled = status === 'unknown' || status === 'unlocking' || isPending

  return (
    <div className={cn('space-y-3', className)}>
      {!isLocalhost && (
        <p className="text-xs text-amber-400" role="alert">
          Warning: daemonUrl is not localhost — refusing to operate over non-local origin.
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary action: unlock (when locked/error) */}
        {status !== 'unlocked' && (
          <Button
            onClick={handleClick}
            disabled={isDisabled || !isLocalhost}
            variant="default"
            className={cn(
              'transition-colors',
              status === 'error' && 'bg-amber-600/80 hover:bg-amber-600 text-white border-amber-500/50',
              status === 'unknown' && 'opacity-60',
            )}
            aria-label="Unlock owner session"
          >
            {label()}
          </Button>
        )}

        {/* Unlocked state: status badge + lock-now button */}
        {status === 'unlocked' && (
          <>
            <div
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-md text-sm text-green-400"
              aria-live="polite"
              role="status"
            >
              <span
                className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]"
                aria-hidden="true"
              />
              <span className="font-mono text-xs">{label()}</span>
            </div>
            <Button
              onClick={handleLockClick}
              disabled={isPending}
              variant="outline"
              className="border-slate-600 text-slate-400 hover:border-slate-400 hover:text-white text-xs"
              aria-label="Lock owner session now"
            >
              Lock now
            </Button>
          </>
        )}
      </div>

      {errorMsg !== undefined && (
        <p className="text-xs text-red-400 font-mono" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
