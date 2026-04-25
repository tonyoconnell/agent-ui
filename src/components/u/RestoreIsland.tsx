// src/components/u/RestoreIsland.tsx — 24-word vault recovery phrase restore.
// DO NOT accept seed phrases anywhere else in the product.

import { wordlist } from '@scure/bip39/wordlists/english.js'
import { useCallback, useRef, useState } from 'react'
import { assertValidRecoveryPhrase, masterFromRecoveryPhrase } from '@/components/u/lib/vault/recovery'
import * as Vault from '@/components/u/lib/vault/vault'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { emitClick } from '@/lib/ui-signal'

type Phase = 'entry' | 'restored' | 'error'

const WORD_COUNT = 24

function isValidBip39Word(word: string): boolean {
  return wordlist.includes(word.trim().toLowerCase())
}

export function RestoreIsland() {
  const [words, setWords] = useState<string[]>(Array(WORD_COUNT).fill(''))
  const [wordErrors, setWordErrors] = useState<boolean[]>(Array(WORD_COUNT).fill(false))
  const [phase, setPhase] = useState<Phase>('entry')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(WORD_COUNT).fill(null))

  const setRef = useCallback(
    (i: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[i] = el
    },
    [],
  )

  function handleWordChange(i: number, value: string) {
    const next = [...words]
    next[i] = value
    setWords(next)
    if (value.trim().length > 0) {
      const nextErrors = [...wordErrors]
      nextErrors[i] = !isValidBip39Word(value)
      setWordErrors(nextErrors)
    } else {
      const nextErrors = [...wordErrors]
      nextErrors[i] = false
      setWordErrors(nextErrors)
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === ' ' || e.key === 'Tab' || e.key === 'Enter') {
      if (e.key === ' ' || e.key === 'Enter') e.preventDefault()
      const next = i + 1
      if (next < WORD_COUNT) {
        inputRefs.current[next]?.focus()
      } else if (e.key === 'Enter') {
        void handleSubmit()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    const pasted = text.trim().split(/\s+/)
    if (pasted.length === WORD_COUNT) {
      e.preventDefault()
      setWords(pasted)
      const errors = pasted.map((w) => w.length > 0 && !isValidBip39Word(w))
      setWordErrors(errors)
      inputRefs.current[WORD_COUNT - 1]?.focus()
    }
  }

  async function handleSubmit() {
    emitClick('ui:wallet:restore')
    setSubmitting(true)
    setErrorMsg('')

    const errors = words.map((w) => w.trim().length === 0 || !isValidBip39Word(w))
    setWordErrors(errors)

    const phrase = words.map((w) => w.trim().toLowerCase()).join(' ')

    try {
      assertValidRecoveryPhrase(phrase)
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : "Those words don't match a recovery phrase.")
      setSubmitting(false)
      return
    }

    try {
      const master = masterFromRecoveryPhrase(phrase)
      if (await Vault.hasVault()) {
        await Vault.wipeAll()
      }
      await Vault.adoptMaster(master)
      setPhase('restored')
    } catch (err) {
      setPhase('error')
      setErrorMsg(err instanceof Error ? err.message : 'Restore failed. Check your words and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setWords(Array(WORD_COUNT).fill(''))
    setWordErrors(Array(WORD_COUNT).fill(false))
    setPhase('entry')
    setErrorMsg('')
    setTimeout(() => inputRefs.current[0]?.focus(), 50)
  }

  const allFilled = words.every((w) => w.trim().length > 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Restore your vault</h1>
          <p className="text-slate-400 text-sm">Enter your 24-word recovery phrase to restore access on this device.</p>
        </div>

        {phase === 'restored' ? (
          /* Success state */
          <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-6 text-center space-y-4">
            <div className="text-emerald-400 text-sm font-medium">Vault restored</div>
            <p className="text-slate-400 text-xs">
              Your vault is unlocked. Recreate your wallets in the dashboard — they&apos;ll have the same addresses as
              before.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full bg-white text-black hover:bg-slate-100 font-medium"
                onClick={() => {
                  window.location.href = '/u'
                }}
              >
                Go to wallet
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-500 hover:text-slate-300 text-xs"
                onClick={handleReset}
              >
                Enter different words
              </Button>
            </div>
          </div>
        ) : (
          /* Entry state */
          <div className="space-y-6">
            {/* 24-word grid — 4 columns */}
            <div className="grid grid-cols-4 gap-1.5">
              {words.map((word, i) => (
                <div key={i} className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] select-none w-4 text-right">
                    {i + 1}
                  </span>
                  <Input
                    ref={setRef(i)}
                    value={word}
                    onChange={(e) => handleWordChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    tabIndex={i + 1}
                    aria-label={`Word ${i + 1}`}
                    className={[
                      'pl-6 pr-1 py-2 text-xs font-mono bg-[#161622] border text-white placeholder-slate-600',
                      'focus:ring-1 focus:ring-white/20 focus:border-white/20',
                      wordErrors[i]
                        ? 'border-red-700/60 focus:border-red-600/60 focus:ring-red-600/20'
                        : 'border-[#252538]',
                    ].join(' ')}
                  />
                </div>
              ))}
            </div>

            {/* Paste hint */}
            <p className="text-center text-slate-600 text-xs">You can paste all 24 words into the first field.</p>

            {/* Error message */}
            {phase === 'error' && errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-red-400 text-sm text-center"
              >
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <Button
              className="w-full bg-white text-black hover:bg-slate-100 font-medium disabled:opacity-40"
              disabled={!allFilled || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Restoring…' : 'Restore vault'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
