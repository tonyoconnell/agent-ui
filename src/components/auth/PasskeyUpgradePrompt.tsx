'use client'
import { useState, useEffect } from 'react'
import { Shield, X } from 'lucide-react'
import { emitClick } from '@/lib/ui-signal'

export function PasskeyUpgradePrompt() {
  const [visible, setVisible] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('passkey-prompt-dismissed')) return
    let cancelled = false

    async function check() {
      // Check platform authenticator availability
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false)
      if (!available || cancelled) return

      // Check if user already has credentials
      const res = await fetch('/api/auth/passkey-webauthn/credentials').catch(() => null)
      if (!res?.ok || cancelled) return
      const data = await res.json().catch(() => ({ credentials: [] })) as { credentials?: unknown[] }
      if ((data.credentials?.length ?? 0) > 0) return

      if (!cancelled) setVisible(true)
    }

    check()
    return () => { cancelled = true }
  }, [])

  async function handleRegister() {
    emitClick('ui:auth:add-passkey')
    setRegistering(true)
    try {
      const { startRegistration } = await import('@simplewebauthn/browser')
      const optRes = await fetch('/api/auth/passkey-webauthn/register/options', { method: 'POST' })
      if (!optRes.ok) throw new Error('Failed to get registration options')
      const options = await optRes.json()
      const attResp = await startRegistration({ optionsJSON: options })
      const verRes = await fetch('/api/auth/passkey-webauthn/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(attResp),
      })
      if (!verRes.ok) throw new Error('Registration failed')
      setDone(true)
      setTimeout(() => setVisible(false), 2000)
    } catch {
      setRegistering(false)
    }
  }

  function handleDismiss() {
    emitClick('ui:auth:dismiss-passkey-prompt')
    sessionStorage.setItem('passkey-prompt-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 shadow-lg"
      style={{ boxShadow: 'var(--shadow-pop)', borderColor: 'var(--color-border)', border: '1px solid' }}
    >
      <Shield size={16} className="text-primary shrink-0" />
      {done ? (
        <span className="text-sm text-font">Touch ID added.</span>
      ) : (
        <>
          <span className="text-sm text-font">Secure this workspace with Touch ID.</span>
          <button
            onClick={handleRegister}
            disabled={registering}
            className="text-sm px-3 py-1 rounded-lg bg-primary text-on-primary disabled:opacity-50"
          >
            {registering ? 'Adding…' : 'Add Touch ID'}
          </button>
          <button onClick={handleDismiss} className="text-font/40 hover:text-font/80">
            <X size={14} />
          </button>
        </>
      )}
    </div>
  )
}
