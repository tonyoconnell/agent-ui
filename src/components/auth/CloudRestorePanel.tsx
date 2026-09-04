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
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--color-tertiary-bright)/0.3)] bg-[hsl(var(--color-tertiary-bright)/0.1)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--color-tertiary-bright))]">
          <span className="size-1.5 rounded-full bg-[hsl(var(--color-tertiary-bright))] animate-pulse" />
          Cloud backup found
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-font sm:text-3xl">Restore your wallets</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Enter your 24-word recovery phrase to decrypt and restore your vault on this device.
        </p>
      </div>

      <form onSubmit={handleRestore} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="phrase" className="text-font">
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
            className="border-border bg-card font-mono text-sm text-font placeholder:text-muted-foreground focus-visible:border-[hsl(var(--color-tertiary-bright)/0.6)] focus-visible:ring-[hsl(var(--color-tertiary-bright)/0.2)]"
          />
          <p className="text-[11px] text-muted-foreground">
            The phrase stays on this device — the server holds only encrypted ciphertext.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-[hsl(var(--color-destructive)/0.3)] bg-[hsl(var(--color-destructive)/0.1)] px-3 py-2.5 text-sm text-[hsl(var(--color-destructive))]"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending || phrase.trim().length === 0}
          className="h-11 w-full bg-font text-sm font-semibold text-background hover:bg-foreground disabled:opacity-60"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-background/20 border-t-background" />
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
          className="w-full text-center text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-60"
        >
          Skip for now
        </button>
      </form>
    </div>
  )
}
