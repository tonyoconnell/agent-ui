'use client'
import { useState } from 'react'
import { UserPlus, Copy, Check, X } from 'lucide-react'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  gid: string
  groupLabel?: string
  role?: string
}

export function InviteButton({ gid, groupLabel, role = 'member' }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    emitClick('ui:invite:generate')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gid, role, email: email || undefined }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? 'Failed to create invite')
      }
      const data = await res.json() as { url: string }
      setInviteUrl(`${window.location.origin}${data.url}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    emitClick('ui:invite:copy-link')
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    emitClick('ui:invite:close')
    setOpen(false)
    setInviteUrl('')
    setEmail('')
    setError('')
  }

  const label = groupLabel ?? gid.replace(/^group:/, '')

  return (
    <>
      <button
        onClick={() => { emitClick('ui:invite:open'); setOpen(true) }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-on-secondary text-sm"
      >
        <UserPlus size={14} />
        Invite
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
          <div
            className="relative w-full max-w-sm rounded-2xl bg-background p-6"
            style={{ boxShadow: 'var(--shadow-pop)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={handleClose} className="absolute top-4 right-4 text-font/40 hover:text-font/80">
              <X size={16} />
            </button>

            <h2 className="text-base font-semibold text-font mb-1">Invite to {label}</h2>
            <p className="text-sm text-font/60 mb-4">They join as {role}.</p>

            {!inviteUrl ? (
              <>
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-foreground text-font border text-sm mb-3"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                {error && <p className="text-xs text-destructive mb-2">{error}</p>}
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-primary text-on-primary text-sm disabled:opacity-50"
                >
                  {loading ? 'Generating…' : email ? 'Send invite' : 'Generate link'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-font/60 mb-1">
                  {email ? `Invite sent to ${email}.` : 'Share this link:'}
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 mb-3" style={{ borderColor: 'var(--color-border)', border: '1px solid' }}>
                  <span className="text-xs text-font/80 truncate flex-1">{inviteUrl}</span>
                  <button onClick={handleCopy} className="text-primary shrink-0">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <button onClick={handleGenerate} className="text-xs text-font/60 underline">
                  Generate another
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
