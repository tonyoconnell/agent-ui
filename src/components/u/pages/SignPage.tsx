import { useState } from 'react'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  challenge?: string
  onSigned?: (signature: string) => void
}

export function SignPage({ challenge = '', onSigned }: Props) {
  const [message, setMessage] = useState(challenge)
  const [signature, setSignature] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'signing' | 'done' | 'error'>('idle')

  async function handleSign() {
    emitClick('ui:u:sign-challenge')
    setStatus('signing')
    try {
      // In production: calls signer.signMessage(utf8Encode(message))
      // For now: structural stub
      const mockSig = `sig_${Date.now()}_${message.slice(0, 8)}`
      setSignature(mockSig)
      setStatus('done')
      void fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'substrate:u:sign',
          data: {
            weight: 1,
            tags: ['u', 'vault'],
            content: { verb: 'sign', outcome: 'ok' },
          },
        }),
      })
      onSigned?.(mockSig)
    } catch (_err) {
      setStatus('error')
      void fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'substrate:u:sign',
          data: { weight: 1, tags: ['u', 'vault'], content: { verb: 'sign', outcome: 'fail' } },
        }),
      })
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Sign Message</h1>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground" htmlFor="message-input">
          Message to sign
        </label>
        <textarea
          id="message-input"
          value={message}
          onChange={(e) => {
            emitClick('ui:u:sign-message-edit')
            setMessage(e.target.value)
          }}
          className="w-full min-h-[80px] rounded-md border bg-background p-2 text-sm font-mono"
          placeholder="Enter message or challenge..."
        />
      </div>
      <button
        onClick={handleSign}
        disabled={status === 'signing' || !message.trim()}
        aria-label="Sign message with current signer"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {status === 'signing' ? 'Signing…' : 'Sign'}
      </button>
      {signature && (
        <div className="rounded-md border bg-muted p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Signature</p>
          <span
            className="text-xs font-mono break-all cursor-pointer block"
            onClick={() => {
              emitClick('ui:u:copy-signature')
              void navigator.clipboard.writeText(signature)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                emitClick('ui:u:copy-signature')
                void navigator.clipboard.writeText(signature)
              }
            }}
            aria-label="Copy signature to clipboard"
          >
            {signature}
          </span>
        </div>
      )}
      {status === 'error' && <p className="text-sm text-destructive">Signing failed. Check your signer.</p>}
    </div>
  )
}
