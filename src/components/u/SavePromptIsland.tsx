/**
 * SavePromptIsland — wires SavePrompt to the real passkey enrollment ceremony.
 *
 * Called from /u/save when the user wants to protect their wallet with Touch ID.
 * Runs createAccountWithPasskey() which tries the cloud blob first (restores
 * existing wallets if the passkey matches), then falls back to a fresh vault.
 * Shows RecoveryPhraseDialog exactly once if a new vault is created.
 */
import { useState } from 'react'
import { RecoveryPhraseDialog } from '@/components/auth/RecoveryPhraseDialog'
import { createAccountWithPasskey } from '@/components/u/lib/vault/passkey-cloud'
import { VaultError } from '@/components/u/lib/vault/types'
import { SavePrompt } from '@/components/u/SavePrompt'

export function SavePromptIsland() {
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null)

  async function handleSave(): Promise<void> {
    setError(null)
    try {
      const result = await createAccountWithPasskey()
      if (result.recoveryPhrase) {
        setRecoveryPhrase(result.recoveryPhrase)
      } else {
        window.location.href = '/u'
      }
    } catch (err) {
      if (err instanceof VaultError && err.code === 'passkey-cancelled') return
      setError(err instanceof Error ? err.message : 'Failed to enroll passkey')
    }
  }

  function handleDismiss(): void {
    setDismissed(true)
    window.location.href = '/u'
  }

  if (dismissed) return null

  return (
    <>
      <SavePrompt onSave={handleSave} onDismiss={handleDismiss} isDismissable={true} />
      {error && (
        <p role="alert" className="mt-3 text-center text-xs text-red-400">
          {error}
        </p>
      )}
      {recoveryPhrase && (
        <RecoveryPhraseDialog
          phrase={recoveryPhrase}
          onConfirm={() => {
            setRecoveryPhrase(null)
            window.location.href = '/u'
          }}
        />
      )}
    </>
  )
}
