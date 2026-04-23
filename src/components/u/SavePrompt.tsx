import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { emitClick } from '@/lib/ui-signal'

export interface SavePromptProps {
  onSave: () => Promise<void>
  onDismiss: () => void
  isDismissable?: boolean
}

export function SavePrompt({ onSave, onDismiss, isDismissable = false }: SavePromptProps) {
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    emitClick('ui:wallet:save-prompt')
    setSaving(true)
    try {
      await onSave()
    } finally {
      setSaving(false)
    }
  }

  function handleDismiss() {
    emitClick('ui:wallet:save-dismiss')
    onDismiss()
  }

  return (
    <Card className="w-full max-w-sm bg-[#161622] border-[#252538] text-white shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-1">
          {/* Touch ID icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#252538]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-indigo-400"
              aria-hidden="true"
            >
              <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04.054-.09A13.916 13.916 0 0 0 8 11a4 4 0 1 1 8 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0 0 15.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 0 0 8 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <CardTitle className="text-base font-semibold text-white">
            Save this wallet with Touch ID?
          </CardTitle>
        </div>
        <CardDescription className="text-slate-400 text-sm leading-relaxed">
          One tap to protect your wallet. You'll also get your recovery phrase to keep offline.
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <ul className="space-y-1.5 text-sm text-slate-400">
          <li className="flex items-center gap-2">
            <span className="text-indigo-400" aria-hidden="true">✓</span>
            Secured by your device biometrics
          </li>
          <li className="flex items-center gap-2">
            <span className="text-indigo-400" aria-hidden="true">✓</span>
            BIP39 recovery phrase shown once
          </li>
          <li className="flex items-center gap-2">
            <span className="text-indigo-400" aria-hidden="true">✓</span>
            No account or password needed
          </li>
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          onClick={handleSave}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'Saving…' : 'Save with Touch ID'}
        </Button>

        {isDismissable && (
          <button
            type="button"
            onClick={handleDismiss}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors py-1"
          >
            Not now
          </button>
        )}
      </CardFooter>
    </Card>
  )
}
