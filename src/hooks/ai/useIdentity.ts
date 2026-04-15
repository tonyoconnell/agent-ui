/**
 * useIdentity — visitor uid cookie + Telegram claim ceremony.
 *
 * On mount: reads or generates a visitor uid (visitor:{uuid}) from the
 * `one-uid` cookie. After a successful /claim → /link flow, the cookie
 * is updated to the Telegram canonical uid (e.g. telegram:123456).
 *
 * The uid flows into /api/chat/turn as actorUid so buildPack() loads the
 * right actor's memory from TypeDB.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const COOKIE_NAME = 'one-uid'
const POLL_INTERVAL_MS = 2000
const CLAIM_API = '/api/identity/claim'

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, maxAgeSecs = 365 * 24 * 3600): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSecs}; samesite=lax`
}

export interface UseIdentityReturn {
  /** Stable actor uid — visitor:uuid or telegram:userId after claim. */
  uid: string
  /** True if the uid has been claimed (linked to a Telegram account). */
  isClaimed: boolean
  /** True while a claim flow is in progress (polling nanoclaw). */
  isClaiming: boolean
  /** The nonce to show the user in the ClaimDialog. Null when not claiming. */
  claimNonce: string | null
  /** Start the claim ceremony. Returns the nonce to display, or null on error. */
  startClaim: () => Promise<string | null>
  /** Cancel polling and reset claim state. */
  cancelClaim: () => void
}

export function useIdentity(): UseIdentityReturn {
  const [uid, setUid] = useState<string>('')
  const [isClaimed, setIsClaimed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimNonce, setClaimNonce] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mount: read or generate visitor uid
  useEffect(() => {
    const stored = readCookie(COOKIE_NAME)
    if (stored) {
      setUid(stored)
      setIsClaimed(!stored.startsWith('visitor:'))
    } else {
      const fresh = `visitor:${crypto.randomUUID()}`
      writeCookie(COOKIE_NAME, fresh)
      setUid(fresh)
      setIsClaimed(false)
    }
  }, [])

  // Cleanup poll on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const cancelClaim = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsClaiming(false)
    setClaimNonce(null)
  }, [])

  const startClaim = useCallback(async (): Promise<string | null> => {
    if (!uid) return null
    try {
      const res = await fetch(CLAIM_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: uid }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { nonce?: string }
      if (!data.nonce) return null

      setClaimNonce(data.nonce)
      setIsClaiming(true)

      // Poll for claim completion
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${CLAIM_API}?sessionId=${encodeURIComponent(uid)}`)
          if (!statusRes.ok) return
          const status = (await statusRes.json()) as { linked?: boolean; canonicalUid?: string }
          if (status.linked && status.canonicalUid) {
            // Upgrade cookie to claimed uid
            writeCookie(COOKIE_NAME, status.canonicalUid)
            setUid(status.canonicalUid)
            setIsClaimed(true)
            cancelClaim()
          }
        } catch {
          // Network blip — keep polling
        }
      }, POLL_INTERVAL_MS)

      return data.nonce
    } catch {
      return null
    }
  }, [uid, cancelClaim])

  return { uid, isClaimed, isClaiming, claimNonce, startClaim, cancelClaim }
}
