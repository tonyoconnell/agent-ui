// VaultSetupWizard — 3-step onboarding: welcome → auth → recovery → done.
// The recovery phrase lives only in component state, never persisted here.

import { Check, Copy, Download, Fingerprint, KeyRound, Loader2, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import * as Vault from '@/components/u/lib/vault/vault'
import type { VaultStatus } from '@/components/u/lib/vault/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { emitClick } from '@/lib/ui-signal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

type Step = 0 | 1 | 2 | 3
type Method = 'passkey' | 'password'

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']

function scorePassword(pw: string): number {
  if (pw.length < 8) return 0
  let score = 0
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

export function VaultSetupWizard({ open, onOpenChange, onComplete }: Props) {
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null)
  const refreshStatus = useCallback(async () => {
    try { setVaultStatus(await Vault.getStatus()) } catch { /* ignore */ }
  }, [])
  useEffect(() => { void refreshStatus() }, [refreshStatus])

  const [step, setStep] = useState<Step>(0)
  const [methods, setMethods] = useState<Set<Method>>(new Set())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null)
  const [wroteItDown, setWroteItDown] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const prfAvailable = !!vaultStatus?.capabilities.prf

  useEffect(() => {
    if (!open) {
      setStep(0)
      setMethods(new Set())
      setPassword('')
      setConfirmPassword('')
      setRecoveryPhrase(null)
      setWroteItDown(false)
      setCopied(false)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (open && !prfAvailable && methods.size === 0) {
      setMethods(new Set(['password']))
    }
  }, [open, prfAvailable, methods.size])

  const strength = useMemo(() => scorePassword(password), [password])
  const words = useMemo(() => (recoveryPhrase ? recoveryPhrase.split(/\s+/) : []), [recoveryPhrase])

  const toggleMethod = (m: Method) => {
    emitClick('ui:vault-setup:toggle-method', { method: m })
    setMethods((prev) => {
      const next = new Set(prev)
      if (next.has(m)) next.delete(m)
      else next.add(m)
      return next
    })
  }

  const handleNextFromWelcome = () => {
    emitClick('ui:vault-setup:next', { from: 0 })
    if (methods.size === 0) {
      setError('Pick at least one unlock method')
      return
    }
    setError(null)
    setStep(1)
  }

  const handleSetup = () => {
    emitClick('ui:vault-setup:setup')
    setError(null)

    const wantsPassword = methods.has('password')
    const wantsPasskey = methods.has('passkey') && prfAvailable

    if (wantsPassword) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match")
        return
      }
    }

    startTransition(async () => {
      try {
        const result = await Vault.setup({
          enrollPasskey: wantsPasskey,
          password: wantsPassword ? password : undefined,
          userIdentifier: 'ONE Vault',
        })
        await refreshStatus()
        setRecoveryPhrase(result.recoveryPhrase)
        setPassword('')
        setConfirmPassword('')
        setStep(2)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Setup failed')
      }
    })
  }

  const handleCopy = async () => {
    emitClick('ui:vault-setup:copy-phrase')
    if (!recoveryPhrase) return
    try {
      await navigator.clipboard.writeText(recoveryPhrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — please write down the phrase manually')
    }
  }

  const handleDownload = () => {
    emitClick('ui:vault-setup:download-phrase')
    if (!recoveryPhrase) return
    const blob = new Blob([recoveryPhrase], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `one-vault-recovery-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDone = () => {
    emitClick('ui:vault-setup:done')
    setRecoveryPhrase(null)
    setStep(3)
  }

  useEffect(() => {
    if (step !== 3) return
    const t = setTimeout(() => {
      onComplete?.()
      onOpenChange(false)
    }, 1500)
    return () => clearTimeout(t)
  }, [step, onComplete, onOpenChange])

  const handleOpen = () => {
    emitClick('ui:vault-setup:open-vault')
    onComplete?.()
    onOpenChange(false)
  }

  const handleClose = () => {
    emitClick('ui:vault-setup:close')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0f] border-[#252538] text-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            {step === 0 && 'Set up your vault'}
            {step === 1 && 'Secure it'}
            {step === 2 && 'Recovery phrase'}
            {step === 3 && 'All set'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {step === 0 && 'Your wallet vault, on this device, locked by you.'}
            {step === 1 && 'Your device handles the auth. We never see it.'}
            {step === 2 && 'Write this down. Store it offline.'}
            {step === 3 && 'Your vault is ready.'}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3 py-2">
            <button
              type="button"
              onClick={() => toggleMethod('passkey')}
              disabled={!prfAvailable}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                methods.has('passkey')
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-[#252538] bg-[#161622] hover:border-[#3a3a52]'
              } ${!prfAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <Fingerprint className="w-6 h-6 text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">Touch ID / Face ID / Windows Hello</span>
                    {prfAvailable && (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {prfAvailable
                      ? 'Unlock with biometrics. Fastest and most secure.'
                      : 'Not available on this device or browser.'}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => toggleMethod('password')}
              className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                methods.has('password')
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-[#252538] bg-[#161622] hover:border-[#3a3a52]'
              }`}
            >
              <div className="flex items-start gap-3">
                <KeyRound className="w-6 h-6 text-sky-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">Password</span>
                    {!prfAvailable && <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40">Fallback</Badge>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Works everywhere. Choose a strong one.</p>
                </div>
              </div>
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={handleClose} className="text-slate-400 hover:text-slate-200">
                Cancel
              </Button>
              <Button onClick={handleNextFromWelcome} className="bg-emerald-600 hover:bg-emerald-500">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 py-2">
            {methods.has('passkey') && prfAvailable && (
              <Card className="bg-[#161622] border-[#252538]">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Fingerprint className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      Your device will prompt you when you continue. Approve it to enroll your passkey.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {methods.has('password') && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="bg-[#161622] border-[#252538] text-slate-100"
                  />
                  {password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= strength ? STRENGTH_COLORS[strength] : 'bg-[#252538]'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400">{STRENGTH_LABELS[strength]}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Confirm password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    className="bg-[#161622] border-[#252538] text-slate-100"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  emitClick('ui:vault-setup:back', { from: 1 })
                  setStep(0)
                }}
                className="text-slate-400 hover:text-slate-200"
                disabled={pending}
              >
                Back
              </Button>
              <Button onClick={handleSetup} disabled={pending} className="bg-emerald-600 hover:bg-emerald-500">
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Securing…
                  </>
                ) : (
                  'Create vault'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && recoveryPhrase && (
          <div className="space-y-4 py-2">
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="text-sm text-red-200">
                    <strong>Write this down. Store it offline.</strong>
                    <br />
                    This is the only way to recover your vault if you lose this device. We cannot help you recover it.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-4 gap-2">
              {words.map((w, i) => (
                <div
                  key={`${i}-${w}`}
                  className="rounded-lg border border-[#252538] bg-[#161622] px-2 py-2 text-center"
                >
                  <span className="text-[10px] text-slate-500 mr-1">{i + 1}</span>
                  <span className="font-mono text-sm text-slate-100">{w}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopy}
                className="border-[#252538] bg-[#161622] text-slate-200 hover:bg-[#1f1f2e]"
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="border-[#252538] bg-[#161622] text-slate-200 hover:bg-[#1f1f2e]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .txt
              </Button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={wroteItDown}
                onChange={(e) => {
                  emitClick('ui:vault-setup:confirm-saved', { checked: e.target.checked })
                  setWroteItDown(e.target.checked)
                }}
                className="mt-1 accent-emerald-500"
              />
              <span className="text-sm text-slate-300">I have written down or saved my recovery phrase</span>
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end pt-2">
              <Button onClick={handleDone} disabled={!wroteItDown} className="bg-emerald-600 hover:bg-emerald-500">
                Done
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-100">Your vault is ready</h3>
              <p className="text-sm text-slate-400 mt-1">
                {vaultStatus?.walletCount ?? 0} wallets. Locked by{' '}
                {methods.has('passkey') ? 'your device' : 'your password'}.
              </p>
            </div>
            <Button onClick={handleOpen} className="bg-emerald-600 hover:bg-emerald-500">
              Open my vault
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
