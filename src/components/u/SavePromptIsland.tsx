/**
 * SavePromptIsland — wires SavePrompt to real navigation for the /u/save route.
 *
 * The Astro page can't pass async callback props, so this island owns the
 * onSave / onDismiss logic and renders SavePrompt as a pure display component.
 *
 * onSave:    placeholder — the actual WebAuthn / passkey creation flow will be
 *            wired here once the vault PRF enroll API is available. For now it
 *            navigates to /u (dashboard) after a tick so downstream code can
 *            hook in without re-architecting.
 * onDismiss: returns the user to /u without enrolling.
 */
import { useState } from 'react'
import { SavePrompt } from '@/components/u/SavePrompt'

export function SavePromptIsland() {
  const [dismissed, setDismissed] = useState(false)

  async function handleSave(): Promise<void> {
    // TODO: call vault PRF enroll (passkeys.md § State 1 → 2 flow).
    // Placeholder: navigate to dashboard after simulated enroll tick.
    await Promise.resolve()
    window.location.href = '/u'
  }

  function handleDismiss(): void {
    setDismissed(true)
    window.location.href = '/u'
  }

  if (dismissed) return null

  return <SavePrompt onSave={handleSave} onDismiss={handleDismiss} isDismissable={true} />
}
