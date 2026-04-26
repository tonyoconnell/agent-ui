import { CheckCircle2, Inbox, Key, Loader2, LogOut, Mail, Pencil, Wallet, XCircle } from 'lucide-react'
import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface UserData {
  id: string
  name: string
  email: string
  image: string | null
  createdAt: string
}

interface Props {
  user: UserData
}

function makeInitials(name: string, email: string) {
  const source = name || email || 'U'
  return source
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type FieldStatus = 'idle' | 'saving' | 'saved' | 'error'

const NAV = [
  {
    href: '/settings/keys',
    label: 'API Keys',
    desc: 'Manage your stored keys',
    Icon: Key,
    gradient: 'from-red-500/80 to-orange-500/80',
    signal: 'api-keys',
  },
  {
    href: '/u',
    label: 'Wallet',
    desc: 'Sui wallet and assets',
    Icon: Wallet,
    gradient: 'from-amber-500/80 to-orange-500/80',
    signal: 'wallet',
  },
  {
    href: '/in',
    label: 'Inbox',
    desc: 'Agent signals and messages',
    Icon: Inbox,
    gradient: 'from-[hsl(216_55%_35%)] to-[hsl(216_63%_50%)]',
    signal: 'inbox',
  },
]

export function AccountPanel({ user }: Props) {
  const [displayName, setDisplayName] = useState(user.name ?? '')
  const [displayEmail, setDisplayEmail] = useState(user.email)

  const [name, setName] = useState(user.name ?? '')
  const [nameStatus, setNameStatus] = useState<FieldStatus>('idle')

  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle')
  const [emailError, setEmailError] = useState('')

  const joined = new Date(user.createdAt).toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const abbr = makeInitials(displayName, displayEmail)
  const nameDirty = name.trim() !== displayName.trim() && name.trim().length > 0

  async function saveName() {
    if (nameStatus === 'saving' || !nameDirty) return
    emitClick('ui:account:save-name')
    setNameStatus('saving')
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        setDisplayName(name.trim())
        setNameStatus('saved')
      } else {
        setNameStatus('error')
      }
    } catch {
      setNameStatus('error')
    }
  }

  async function saveEmail() {
    if (emailStatus === 'saving') return
    emitClick('ui:account:save-email')
    setEmailError('')
    setEmailStatus('saving')
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setDisplayEmail(newEmail.trim().toLowerCase())
        setEmailStatus('saved')
        setEditingEmail(false)
        setNewEmail('')
      } else {
        setEmailStatus('error')
        setEmailError(data.error ?? 'Failed to update email')
      }
    } catch {
      setEmailStatus('error')
      setEmailError('Something went wrong. Try again.')
    }
  }

  function cancelEmailEdit() {
    setEditingEmail(false)
    setNewEmail('')
    setEmailStatus('idle')
    setEmailError('')
  }

  async function handleSignOut() {
    emitClick('ui:account:signout')
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/signin'
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: 'hsl(var(--color-background))' }}>
      {/* Theme-coloured ambient gradients — navy primary family */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse 60% 40% at 10% 15%, hsl(var(--color-primary) / 0.35) 0px, transparent 100%)',
              'radial-gradient(ellipse 50% 35% at 90% 85%, hsl(var(--color-muted) / 0.6) 0px, transparent 100%)',
              'radial-gradient(ellipse 40% 30% at 55% 5%,  hsl(var(--color-ring)   / 0.08) 0px, transparent 100%)',
            ].join(', '),
          }}
        />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-5 pt-12 pb-16 space-y-4">
        {/* Identity card */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: 'hsl(var(--color-card) / 0.7)',
            borderColor: 'hsl(var(--color-border))',
          }}
        >
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="size-[72px] rounded-full overflow-hidden grid place-items-center ring-2 ring-offset-2"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(var(--color-primary)) 0%, hsl(var(--color-muted)) 60%, hsl(var(--color-ring) / 0.5) 100%)',
                  ringOffsetColor: 'hsl(var(--color-background))',
                  outlineColor: 'hsl(var(--color-primary) / 0.4)',
                }}
              >
                {user.image ? (
                  <img src={user.image} alt={displayName} className="size-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold tracking-tight text-white/90 select-none">{abbr}</span>
                )}
              </div>
              <span
                className="absolute bottom-0.5 right-0.5 size-[11px] rounded-full bg-emerald-400 ring-[2px]"
                style={{ ringColor: 'hsl(var(--color-background))' }}
                title="Active"
              />
            </div>

            {/* Identity text */}
            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'hsl(var(--color-muted-foreground))' }}
              >
                Account
              </p>
              <h1
                className="text-xl font-semibold truncate leading-tight"
                style={{ color: 'hsl(var(--color-foreground))' }}
              >
                {displayName || 'Unnamed'}
              </h1>
              <p className="text-sm truncate mt-0.5" style={{ color: 'hsl(var(--color-muted-foreground))' }}>
                {displayEmail}
              </p>
              <p className="text-[11px] mt-2" style={{ color: 'hsl(var(--color-muted-foreground) / 0.6)' }}>
                Member since {joined}
              </p>
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: 'hsl(var(--color-card) / 0.7)',
            borderColor: 'hsl(var(--color-border))',
          }}
        >
          <div className="flex items-center px-5 py-3.5 border-b" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <h2
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'hsl(var(--color-muted-foreground))' }}
            >
              Profile
            </h2>
          </div>

          <div className="divide-y" style={{ borderColor: 'hsl(var(--color-border))' }}>
            {/* Display name */}
            <div className="px-5 py-4 space-y-2.5">
              <label
                htmlFor="display-name"
                className="block text-xs font-medium"
                style={{ color: 'hsl(var(--color-muted-foreground))' }}
              >
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  id="display-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameStatus('idle')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  placeholder="Your name"
                  maxLength={100}
                  className="flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none"
                  style={{
                    backgroundColor: 'hsl(var(--color-input))',
                    border: '1px solid hsl(var(--color-border))',
                    color: 'hsl(var(--color-foreground))',
                  }}
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameStatus === 'saving' || !nameDirty}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                  style={{
                    backgroundColor: 'hsl(var(--color-primary))',
                    color: 'hsl(var(--color-primary-foreground))',
                  }}
                >
                  {nameStatus === 'saving' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Pencil className="size-3" />
                  )}
                  <span>{nameStatus === 'saving' ? 'Saving' : 'Save'}</span>
                </button>
              </div>
              {nameStatus === 'saved' && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3.5 shrink-0" /> Name updated
                </p>
              )}
              {nameStatus === 'error' && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <XCircle className="size-3.5 shrink-0" /> Failed to save — try again
                </p>
              )}
            </div>

            {/* Email */}
            <div className="px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: 'hsl(var(--color-muted-foreground))' }}>
                  Email address
                </label>
                {!editingEmail && (
                  <button
                    type="button"
                    onClick={() => {
                      emitClick('ui:account:edit-email')
                      setEditingEmail(true)
                      setEmailStatus('idle')
                      setEmailError('')
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium transition-colors"
                    style={{ color: 'hsl(var(--color-ring))' }}
                  >
                    <Mail className="size-3" />
                    Change
                  </button>
                )}
              </div>

              {!editingEmail ? (
                <div
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                  style={{
                    backgroundColor: 'hsl(var(--color-muted) / 0.3)',
                    border: '1px solid hsl(var(--color-border))',
                  }}
                >
                  <Mail className="size-3.5 shrink-0" style={{ color: 'hsl(var(--color-muted-foreground))' }} />
                  <span className="text-sm select-all truncate" style={{ color: 'hsl(var(--color-muted-foreground))' }}>
                    {displayEmail}
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2 opacity-50"
                    style={{
                      backgroundColor: 'hsl(var(--color-muted) / 0.2)',
                      border: '1px solid hsl(var(--color-border))',
                    }}
                  >
                    <Mail className="size-3.5 shrink-0" style={{ color: 'hsl(var(--color-muted-foreground))' }} />
                    <span className="text-xs truncate" style={{ color: 'hsl(var(--color-muted-foreground))' }}>
                      Current: {displayEmail}
                    </span>
                  </div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value)
                      setEmailStatus('idle')
                      setEmailError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEmail()
                      if (e.key === 'Escape') cancelEmailEdit()
                    }}
                    placeholder="new@example.com"
                    className="w-full rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none"
                    style={{
                      backgroundColor: 'hsl(var(--color-input))',
                      border: '1px solid hsl(var(--color-border))',
                      color: 'hsl(var(--color-foreground))',
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={saveEmail}
                      disabled={emailStatus === 'saving' || !newEmail.trim()}
                      className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      style={{
                        backgroundColor: 'hsl(var(--color-primary))',
                        color: 'hsl(var(--color-primary-foreground))',
                      }}
                    >
                      {emailStatus === 'saving' ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      {emailStatus === 'saving' ? 'Updating…' : 'Update email'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEmailEdit}
                      className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl transition-colors"
                      style={{ color: 'hsl(var(--color-muted-foreground))' }}
                    >
                      <XCircle className="size-3.5" />
                      Cancel
                    </button>
                  </div>
                  {emailError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400">
                      <XCircle className="size-3.5 shrink-0" /> {emailError}
                    </p>
                  )}
                  {emailStatus === 'saved' && (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="size-3.5 shrink-0" /> Email updated
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings nav card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: 'hsl(var(--color-card) / 0.7)',
            borderColor: 'hsl(var(--color-border))',
          }}
        >
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'hsl(var(--color-border))' }}>
            <h2
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'hsl(var(--color-muted-foreground))' }}
            >
              Settings
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'hsl(var(--color-border))' }}>
            {NAV.map(({ href, label, desc, Icon, gradient, signal }) => (
              <a
                key={href}
                href={href}
                onClick={() => emitClick(`ui:account:nav-${signal}`)}
                className="flex items-center gap-4 px-5 py-3.5 group transition-colors hover:brightness-110"
                style={{ color: 'hsl(var(--color-foreground))' }}
              >
                <div
                  className={`size-8 rounded-lg bg-gradient-to-br ${gradient} grid place-items-center shrink-0 ring-1 ring-white/10`}
                >
                  <Icon className="size-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight" style={{ color: 'hsl(var(--color-foreground))' }}>
                    {label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--color-muted-foreground))' }}>
                    {desc}
                  </p>
                </div>
                <span className="text-sm transition-colors" style={{ color: 'hsl(var(--color-muted-foreground))' }}>
                  →
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-sm transition-all group hover:brightness-110"
          style={{
            borderColor: 'hsl(var(--color-border))',
            color: 'hsl(var(--color-muted-foreground))',
          }}
        >
          <LogOut className="size-4 transition-colors" />
          Sign out
        </button>
      </div>
    </div>
  )
}
