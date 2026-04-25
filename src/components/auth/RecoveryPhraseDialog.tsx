/**
 * RecoveryPhraseDialog — shown exactly once after a new account is created
 * via passkey sign-in. The 24-word BIP-39 phrase is the only path back if
 * both the passkey and every cloud copy of the vault disappear.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  phrase: string
  onConfirm: () => void
}

export function RecoveryPhraseDialog({ phrase, onConfirm }: Props) {
  const [copied, setCopied] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      emitClick('ui:header:signin-copy-recovery')
    } catch {
      // ignore — user can still read the phrase
    }
  }

  const words = phrase.split(/\s+/).filter(Boolean)

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-zinc-800 bg-[#0a0a0f] p-6 text-white">
        <DialogTitle className="sr-only">Your recovery phrase</DialogTitle>
        <DialogDescription className="sr-only">
          Save these 24 words. They restore your wallets if you lose this device and your passkey isn't synced.
        </DialogDescription>
        <div className="space-y-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              Write this down
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Your recovery phrase</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              The only way to restore your wallets if you lose this device <strong>and</strong> your passkey isn't
              synced. ONE cannot recover it for you. Keep it somewhere safe and offline.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 font-mono text-xs text-amber-100 sm:grid-cols-4">
            {words.map((w, i) => (
              <div key={`${i}-${w}`} className="flex items-baseline gap-1.5">
                <span className="w-5 text-right tabular-nums text-zinc-600">{i + 1}</span>
                <span>{w}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full rounded-md border border-white/10 bg-white/[0.03] py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            {copied ? 'Copied ✓' : 'Copy to clipboard'}
          </button>

          <label className="flex items-start gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 accent-amber-500"
            />
            <span>I've written it down or saved it somewhere only I can reach.</span>
          </label>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged}
            className="h-11 w-full bg-white text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
