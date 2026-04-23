/**
 * CloudRestorePanel — shown on sign-in when the server has an encrypted
 * vault envelope for this user but this device has no local vault.
 *
 * The user pastes their 24-word BIP-39 recovery phrase; the client derives
 * the vault master, decrypts the envelope, and seeds IndexedDB. Afterwards
 * the caller redirects to the post-signin destination.
 */

import { useState, useTransition } from 'react'
import { restoreFromCloud } from '@/components/u/lib/vault/sync'
import { VaultError } from '@/components/u/lib/vault/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  onRestored: (count: number) => void
  onSkip: () => void
}

export function CloudRestorePanel({ onRestored, onSkip }: Props) {
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    emitClick('ui:signin:restore-submit')

    startTransition(async () => {
      try {
        const { walletsRestored } = await restoreFromCloud(phrase.trim())
        emitClick('ui:signin:restore-success', { count: walletsRestored })
        onRestored(walletsRestored)
      } catch (err) {
        const message = err instanceof VaultError ? err.message : err instanceof Error ? err.message : 'Restore failed'
        emitClick('ui:signin:restore-error', { message })
        setError(message)
      }
    })
  }

  const handleSkip = () => {
    emitClick('ui:signin:restore-skip')
    onSkip()
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Cloud backup found
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Restore your wallets</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Enter your 24-word recovery phrase to decrypt and restore your vault on this device.
        </p>
      </div>

      <form onSubmit={handleRestore} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="phrase" className="text-zinc-300">
            Recovery phrase
          </Label>
          <Textarea
            id="phrase"
            name="phrase"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="word1 word2 word3 … word24"
            required
            rows={4}
            autoFocus
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            className="border-zinc-800 bg-zinc-950/60 font-mono text-sm text-white placeholder:text-zinc-600 focus-visible:border-emerald-500/60 focus-visible:ring-emerald-500/20"
          />
          <p className="text-[11px] text-zinc-500">
            The phrase stays on this device — the server holds only encrypted ciphertext.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending || phrase.trim().length === 0}
          className="h-11 w-full bg-white text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-60"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              Restoring…
            </span>
          ) : (
            <>
              Restore wallets
              <span aria-hidden="true">→</span>
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="w-full text-center text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline disabled:opacity-60"
        >
          Skip for now
        </button>
      </form>
    </div>
  )
}
