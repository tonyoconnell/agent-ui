import { useEffect, useRef, useState } from 'react'
import { Bell, Fingerprint } from '@/components/icons/security'
import { emitClick } from '@/lib/ui-signal'

type Phase = 'idle' | 'approving' | 'approved'

interface Props {
  className?: string
}

const SEQUENCE: { p: Phase; ms: number }[] = [
  { p: 'idle', ms: 1500 },
  { p: 'approving', ms: 1500 },
  { p: 'approved', ms: 1000 },
]

export default function MockApprovalCard({ className = '' }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualRef = useRef(false)

  // Auto-cycle when not paused and not in a manual override
  useEffect(() => {
    if (paused || manualRef.current) return

    let i = 0
    const schedule = () => {
      const step = SEQUENCE[i]
      setPhase(step.p)
      timerRef.current = setTimeout(() => {
        i = (i + 1) % SEQUENCE.length
        schedule()
      }, step.ms)
    }
    schedule()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [paused])

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleApprove = () => {
    emitClick('ui:security:approve', { surface: 'mock-card' })
    clearTimer()
    manualRef.current = true
    setPhase('approving')
    setTimeout(() => {
      setPhase('approved')
      setTimeout(() => {
        manualRef.current = false
        setPhase('idle')
        // re-trigger cycle by toggling paused state harmlessly
        setPaused((p) => p)
      }, 1500)
    }, 1500)
  }

  const handleReject = () => {
    emitClick('ui:security:reject', { surface: 'mock-card' })
    clearTimer()
    manualRef.current = true
    setPhase('idle')
    setTimeout(() => {
      manualRef.current = false
      setPaused((p) => p)
    }, 400)
  }

  const onMouseEnter = () => setPaused(true)
  const onMouseLeave = () => setPaused(false)

  const isApproving = phase === 'approving'
  const isApproved = phase === 'approved'
  const capPercent = isApproved ? 88 : 82
  const rejectDisabled = isApproving || isApproved

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`bg-card border border-border rounded-lg p-6 transition-all duration-300 ${className}`}
      style={{
        boxShadow: isApproving ? '0 0 60px hsl(var(--color-primary-bright) / 0.25)' : undefined,
        borderColor: isApproved ? 'hsl(var(--color-tertiary-bright))' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center"
            style={{ color: 'hsl(var(--color-primary-bright))' }}
          >
            <Bell size={20} />
          </span>
          <div>
            <div className="eyebrow">treasury-ops needs approval</div>
            <div className="text-xs text-muted-foreground mt-0.5">expires in 4 hours</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="py-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Action</span>
          <span className="text-foreground">Send payment</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="text-foreground font-mono">2,500 USDC</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">To</span>
          <span className="text-foreground font-mono">0x1a2b…3c4d</span>
        </div>
        <div className="text-xs" style={{ color: 'hsl(var(--color-primary-bright))' }}>
          ⚠ New recipient
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground mb-1">Agent's reason</div>
          <div className="text-foreground">Monthly SLA settlement — invoice #INV-847</div>
        </div>

        {/* Cap progress */}
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Daily cap after approval</span>
            <span className="text-foreground font-mono">{capPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                background: 'hsl(var(--color-primary-bright))',
                width: `${capPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* CTA region */}
      <div aria-live="polite" className="pt-4 border-t border-border space-y-2">
        {isApproved ? (
          <div
            className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-sm font-medium transition-all duration-300"
            style={{ color: 'hsl(var(--color-tertiary-bright))' }}
          >
            <CheckIcon size={18} />
            <span className="font-mono">Approved · 0x4e2a…f1c8</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleApprove}
            disabled={isApproving}
            aria-label="Approve with Touch ID"
            className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-sm font-medium text-primary-foreground transition-all duration-300 disabled:cursor-default"
            style={{ background: 'hsl(var(--color-primary-bright))' }}
          >
            {isApproving ? (
              <>
                <TouchIdRing />
                <span>Verifying…</span>
              </>
            ) : (
              <>
                <Fingerprint size={18} />
                <span>Approve with Touch ID</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleReject}
          disabled={rejectDisabled}
          aria-label="Reject"
          className={`w-full rounded-md py-2.5 text-sm font-medium border border-border bg-transparent text-foreground transition-all duration-300 ${
            rejectDisabled ? 'opacity-40 cursor-default' : 'hover:bg-muted'
          }`}
        >
          Reject
        </button>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Approving signs the exact transaction above. Nothing else.
        </p>
      </div>
    </div>
  )
}

// Inline check icon — uses currentColor so parent style sets color
function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth={1.5} fill="currentColor" fillOpacity={0.12} />
      <path
        d="M5.5 9.2l2.4 2.4 4.6-4.8"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Touch ID ring — three concentric expanding rings using animate-ping
function TouchIdRing() {
  return (
    <span className="relative inline-flex items-center justify-center w-[18px] h-[18px]">
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
        style={{ background: 'hsl(var(--color-primary-foreground) / 0.4)' }}
      />
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
        style={{
          background: 'hsl(var(--color-primary-foreground) / 0.3)',
          animationDelay: '0.3s',
        }}
      />
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
        style={{
          background: 'hsl(var(--color-primary-foreground) / 0.2)',
          animationDelay: '0.6s',
        }}
      />
      <span className="relative inline-flex items-center justify-center text-primary-foreground">
        <Fingerprint size={14} />
      </span>
    </span>
  )
}
