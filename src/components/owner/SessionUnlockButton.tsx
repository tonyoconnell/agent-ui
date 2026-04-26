import { useCallback, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// HMAC helpers (Web Crypto — browser only)
// ---------------------------------------------------------------------------

function b64urlDecode(s: string): Uint8Array {
  const padded = s
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(s.length + ((4 - (s.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function b64urlEncode(b: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < b.length; i++) binary += String.fromCharCode(b[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function signBody(body: string, keyBytes: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return b64urlEncode(new Uint8Array(sig))
}

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

  // Localhost safety check
  const isLocalhost = daemonUrl.startsWith('http://127.0.0.1') || daemonUrl.startsWith('http://localhost')

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
    } else if (status === 'unlocked') {
      startTransition(() => {
        void handleLock()
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Derived label
  // ---------------------------------------------------------------------------

  function label(): string {
    if (status === 'unlocking' || isPending) return 'Unlocking…'
    if (status === 'unlocked' && expiresAt !== undefined) {
      const minsLeft = Math.ceil((expiresAt * 1000 - Date.now()) / 60_000)
      return `🔓 Unlocked — ${minsLeft}m remaining`
    }
    if (status === 'unlocked') return '🔓 Unlocked'
    if (status === 'unknown') return 'Checking session…'
    return 'Unlock owner session'
  }

  const isDisabled = status === 'unknown' || status === 'unlocking' || isPending

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {!isLocalhost && (
        <p className="text-xs text-amber-400">
          Warning: daemonUrl is not localhost — refusing to operate over non-local origin.
        </p>
      )}
      <Button
        onClick={handleClick}
        disabled={isDisabled || !isLocalhost}
        variant={status === 'unlocked' ? 'outline' : 'default'}
        className={cn(
          status === 'unlocked' && 'border-green-500/50 text-green-400 hover:bg-green-500/10',
          status === 'error' && 'border-red-500/50 text-red-400 hover:bg-red-500/10',
        )}
      >
        {label()}
      </Button>
      {errorMsg !== undefined && <p className="text-xs text-red-400 font-mono">{errorMsg}</p>}
    </div>
  )
}
