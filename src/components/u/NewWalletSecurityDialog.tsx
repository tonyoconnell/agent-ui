/**
 * NewWalletSecurityDialog - Critical Security Dialog After Wallet Generation
 *
 * This dialog MUST be shown after generating a new wallet.
 * It displays the mnemonic/private key and explains:
 * - Where keys are stored
 * - How to back them up
 * - Security implications
 * - What happens if they clear browser data
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface NewWalletSecurityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: {
    chain: string
    address: string
    mnemonic?: string
    privateKey?: string
  } | null
  chainInfo: {
    name: string
    symbol: string
    icon: string
    color: string
  } | null
  onConfirmBackup: () => void
}

export function NewWalletSecurityDialog({
  open,
  onOpenChange,
  wallet,
  chainInfo,
  onConfirmBackup,
}: NewWalletSecurityDialogProps) {
  const [step, setStep] = useState<'reveal' | 'backup' | 'confirm'>('reveal')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmations, setConfirmations] = useState({
    written: false,
    understand: false,
    storage: false,
  })

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('reveal')
      setShowMnemonic(false)
      setCopied(false)
      setConfirmations({ written: false, understand: false, storage: false })
    }
  }, [open])

  const words = wallet?.mnemonic?.split(' ') || []
  const allConfirmed = confirmations.written && confirmations.understand && confirmations.storage

  const handleCopy = async () => {
    if (wallet?.mnemonic) {
      await navigator.clipboard.writeText(wallet.mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleContinue = () => {
    if (step === 'reveal') {
      setStep('backup')
    } else if (step === 'backup') {
      setStep('confirm')
    } else {
      onConfirmBackup()
      onOpenChange(false)
    }
  }

  if (!wallet || !chainInfo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${chainInfo.color} flex items-center justify-center text-white text-2xl shadow-lg`}
            >
              {chainInfo.icon}
            </div>
            <div>
              <div>New {chainInfo.name} Wallet Created!</div>
              <div className="text-sm font-normal text-muted-foreground">Secure your recovery phrase now</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1: Reveal */}
          {step === 'reveal' && (
            <>
              {/* Critical Warning */}
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚨</span>
                    <div>
                      <div className="font-bold text-red-600 dark:text-red-400">
                        CRITICAL: Save Your Recovery Phrase
                      </div>
                      <div className="text-sm mt-1">
                        Your recovery phrase is the <strong>ONLY</strong> way to restore your wallet. If you lose it,
                        your funds will be <strong>permanently lost</strong>.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Address */}
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="text-xs text-muted-foreground mb-1">Your New Wallet Address</div>
                <code className="text-sm font-mono break-all">{wallet.address}</code>
              </div>

              {/* Reveal Button */}
              {!showMnemonic ? (
                <Button onClick={() => setShowMnemonic(true)} className="w-full h-14 text-lg" variant="destructive">
                  <span className="mr-2">👁️</span>
                  Click to Reveal Recovery Phrase
                </Button>
              ) : (
                <>
                  {/* Mnemonic Display */}
                  <Card className="border-2 border-amber-500/30 bg-amber-500/5">
                    <CardContent className="pt-6 pb-6">
                      <div className="text-center mb-4">
                        <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                          🔑 12-Word Recovery Phrase
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {words.map((word, index) => (
                          <div key={index} className="p-3 bg-background rounded-lg text-center border">
                            <span className="text-xs text-muted-foreground mr-1">{index + 1}.</span>
                            <span className="font-mono font-semibold">{word}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1" onClick={handleCopy}>
                          {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Button onClick={handleContinue} className="w-full">
                    I've Saved My Recovery Phrase →
                  </Button>
                </>
              )}
            </>
          )}

          {/* Step 2: Backup Instructions */}
          {step === 'backup' && (
            <>
              <div className="text-center mb-4">
                <span className="text-4xl">📝</span>
                <h3 className="text-lg font-semibold mt-2">How to Backup Safely</h3>
              </div>

              {/* Storage Info */}
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💾</span>
                    <div>
                      <div className="font-semibold">Where Your Keys Are Stored</div>
                      <div className="text-sm mt-1 text-muted-foreground">
                        Your encrypted wallet data is stored in your browser's <strong>localStorage</strong>. This
                        means:
                      </div>
                      <ul className="text-sm mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Data stays on your device only</li>
                        <li>We never see your private keys</li>
                        <li>Clearing browser data will delete your wallet</li>
                        <li>Different browsers = different wallets</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Best Practices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">✅</span>
                      <span className="font-semibold text-green-600">DO</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• Write it on paper</li>
                      <li>• Store in a safe/vault</li>
                      <li>• Use a password manager</li>
                      <li>• Make multiple copies</li>
                      <li>• Use encrypted backups</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">❌</span>
                      <span className="font-semibold text-red-600">DON'T</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• Screenshot on your phone</li>
                      <li>• Email it to yourself</li>
                      <li>• Store in cloud notes</li>
                      <li>• Share with anyone</li>
                      <li>• Enter on any website</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Export Backup Reminder */}
              <Card className="bg-purple-500/10 border-purple-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">💾</span>
                    <div>
                      <div className="font-semibold">Pro Tip: Use Encrypted Backups</div>
                      <div className="text-sm mt-1 text-muted-foreground">
                        After setting up a wallet password, you can export an encrypted backup file. This backup is
                        protected by your password and can be restored on any device.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleContinue} className="w-full">
                Continue to Confirmation →
              </Button>
            </>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <>
              <div className="text-center mb-4">
                <span className="text-4xl">✅</span>
                <h3 className="text-lg font-semibold mt-2">Confirm Your Backup</h3>
                <p className="text-sm text-muted-foreground">Please confirm you understand these important points</p>
              </div>

              <div className="space-y-4">
                <Card className="border-2 transition-colors hover:border-primary/30">
                  <CardContent className="pt-4 pb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={confirmations.written}
                        onCheckedChange={(checked) =>
                          setConfirmations((prev) => ({ ...prev, written: checked === true }))
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium">I've written down my recovery phrase</div>
                        <div className="text-sm text-muted-foreground">
                          I have safely stored my 12-word recovery phrase in a secure location that I can access later.
                        </div>
                      </div>
                    </label>
                  </CardContent>
                </Card>

                <Card className="border-2 transition-colors hover:border-primary/30">
                  <CardContent className="pt-4 pb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={confirmations.understand}
                        onCheckedChange={(checked) =>
                          setConfirmations((prev) => ({ ...prev, understand: checked === true }))
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium">I understand the risks</div>
                        <div className="text-sm text-muted-foreground">
                          If I lose my recovery phrase, my wallet and all funds in it will be permanently unrecoverable.
                          No one can help me recover it.
                        </div>
                      </div>
                    </label>
                  </CardContent>
                </Card>

                <Card className="border-2 transition-colors hover:border-primary/30">
                  <CardContent className="pt-4 pb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={confirmations.storage}
                        onCheckedChange={(checked) =>
                          setConfirmations((prev) => ({ ...prev, storage: checked === true }))
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium">I understand browser storage</div>
                        <div className="text-sm text-muted-foreground">
                          My wallet is stored in this browser's localStorage. Clearing browser data, reinstalling, or
                          using a different browser will require my recovery phrase to restore access.
                        </div>
                      </div>
                    </label>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={handleContinue} className="w-full h-12" disabled={!allConfirmed}>
                {allConfirmed ? (
                  <>
                    <span className="mr-2">🎉</span>
                    Complete Setup
                  </>
                ) : (
                  'Please confirm all checkboxes'
                )}
              </Button>
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step !== 'reveal' && (
            <Button
              variant="ghost"
              onClick={() => setStep(step === 'confirm' ? 'backup' : 'reveal')}
              className="sm:mr-auto"
            >
              ← Back
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={step === 'reveal' ? 'bg-primary/10' : ''}>
              1. Reveal
            </Badge>
            <Badge variant="outline" className={step === 'backup' ? 'bg-primary/10' : ''}>
              2. Backup
            </Badge>
            <Badge variant="outline" className={step === 'confirm' ? 'bg-primary/10' : ''}>
              3. Confirm
            </Badge>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
