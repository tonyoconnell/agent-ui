// VaultUnlockChip — header status pill. Owns unlock dialog + setup wizard.

import { Loader2, Lock, LockOpen, ShieldPlus } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import '@/components/u/lib/vault/sync' // side-effect: register cloud-sync on mutations
import type { VaultStatus } from '@/components/u/lib/vault/types'
import * as Vault from '@/components/u/lib/vault/vault'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import { VaultUnlockDialog } from './VaultDialogs'
import { VaultSetupWizard } from './VaultSetupWizard'

interface Props {
  className?: string
}

// Minimal reactive vault state — replaces useVault() for this component.
function useVaultStatus() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<VaultStatus | null>(null)

  const refresh = useCallback(async () => {
    try {
      const s = await Vault.getStatus()
      setStatus(s)
    } catch {
      // ignore — chip will show loading state
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const s = await Vault.getStatus()
        if (!cancelled) setStatus(s)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const unlockWithPasskey = useCallback(async () => {
    await Vault.unlockWithPasskey()
    await refresh()
  }, [refresh])

  const lock = useCallback(() => {
    Vault.lock()
    void refresh()
  }, [refresh])

  return { loading, status, refresh, unlockWithPasskey, lock }
}

export function VaultUnlockChip({ className }: Props) {
  const vault = useVaultStatus()
  const [showUnlock, setShowUnlock] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  const [pending, startTransition] = useTransition()

  const base =
    'inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium border transition-colors disabled:opacity-60'

  if (vault.loading) {
    return (
      <button type="button" disabled className={cn(base, 'bg-[#161622] border-[#252538] text-slate-400', className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Loading</span>
      </button>
    )
  }

  const s = vault.status
  const hasVault = s?.hasVault ?? false
  const isLocked = s?.isLocked ?? true
  const hasPasskey = s?.hasPasskey ?? false
  const prf = s?.capabilities.prf ?? false
  const walletCount = s?.walletCount ?? 0

  if (!hasVault) {
    const handle = () => {
      emitClick('ui:vault-chip:setup')
      setShowSetup(true)
    }
    return (
      <>
        <button
          type="button"
          onClick={handle}
          className={cn(base, 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20', className)}
        >
          <ShieldPlus className="w-3.5 h-3.5" />
          <span>Set up vault</span>
        </button>
        <VaultSetupWizard open={showSetup} onOpenChange={setShowSetup} onComplete={vault.refresh} />
      </>
    )
  }

  if (isLocked) {
    const canPasskey = hasPasskey && prf
    // Always open the dialog — let the user pick the unlock method explicitly.
    // Silent passkey attempts that fail look like "nothing happened" to users.
    const handle = () => {
      emitClick(canPasskey ? 'ui:vault-chip:unlock-open' : 'ui:vault-chip:unlock-password')
      setShowUnlock(true)
    }
    return (
      <>
        <button
          type="button"
          onClick={handle}
          disabled={pending}
          className={cn(base, 'bg-sky-500/10 border-sky-500/40 text-sky-300 hover:bg-sky-500/20', className)}
        >
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
          <span>{canPasskey ? 'Locked — Tap to unlock' : 'Locked — Enter password'}</span>
        </button>
        <VaultUnlockDialog open={showUnlock} onOpenChange={setShowUnlock} onUnlocked={vault.refresh} />
      </>
    )
  }

  const handleLock = () => {
    emitClick('ui:vault-chip:lock')
    vault.lock()
  }

  return (
    <button
      type="button"
      onClick={handleLock}
      className={cn(
        base,
        'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20',
        'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
        className,
      )}
    >
      <LockOpen className="w-3.5 h-3.5" />
      <span>
        Unlocked · <span className="font-mono tabular-nums">{walletCount}</span> wallets
      </span>
    </button>
  )
}
