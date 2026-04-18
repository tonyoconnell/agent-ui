// VaultUnlockChip — header status pill. Owns unlock dialog + setup wizard.

import { Loader2, Lock, LockOpen, ShieldPlus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useVault } from '@/components/u/lib/vault/useVault'
import { emitClick } from '@/lib/ui-signal'
import { cn } from '@/lib/utils'
import { VaultUnlockDialog } from './VaultDialogs'
import { VaultSetupWizard } from './VaultSetupWizard'

interface Props {
  className?: string
}

export function VaultUnlockChip({ className }: Props) {
  const vault = useVault()
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
        <VaultSetupWizard open={showSetup} onOpenChange={setShowSetup} />
      </>
    )
  }

  if (isLocked) {
    const canPasskey = hasPasskey && prf
    const handle = () => {
      if (canPasskey) {
        emitClick('ui:vault-chip:unlock-passkey')
        startTransition(async () => {
          try {
            await vault.unlockWithPasskey()
          } catch {
            setShowUnlock(true)
          }
        })
      } else {
        emitClick('ui:vault-chip:unlock-password')
        setShowUnlock(true)
      }
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
        <VaultUnlockDialog open={showUnlock} onOpenChange={setShowUnlock} />
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
