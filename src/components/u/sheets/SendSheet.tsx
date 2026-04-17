/**
 * SendSheet - Apple Pay-style send interface
 *
 * Mobile: Full-screen bottom sheet with large inputs
 * Desktop: Centered dialog
 *
 * Features:
 * - Large numpad-friendly amount input
 * - USD conversion live preview
 * - Contact suggestions
 * - Recent recipients
 * - Network fee preview
 */
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomSheet, BottomSheetContent, BottomSheetFooter } from '../BottomSheet'

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
}

interface Wallet {
  id: string
  address: string
  balance: string
  usdValue: number
}

interface SendSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: Wallet
  chain: Chain
  onSend: (to: string, amount: string) => void
}

export function SendSheet({ open, onOpenChange, wallet, chain, onSend }: SendSheetProps) {
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [step, setStep] = useState<'amount' | 'recipient' | 'confirm'>('amount')
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Calculate USD value
  const pricePerToken = parseFloat(wallet.balance) > 0 ? wallet.usdValue / parseFloat(wallet.balance) : 0
  const usdAmount = parseFloat(amount || '0') * pricePerToken

  // Network fee estimate (placeholder)
  const networkFee = 0.001
  const totalAmount = parseFloat(amount || '0') + networkFee

  // Focus amount input when sheet opens
  useEffect(() => {
    if (open && step === 'amount') {
      setTimeout(() => amountInputRef.current?.focus(), 300)
    }
  }, [open, step])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setAmount('')
        setRecipient('')
        setStep('amount')
      }, 300)
    }
  }, [open])

  const handleContinue = () => {
    if (step === 'amount' && parseFloat(amount) > 0) {
      setStep('recipient')
    } else if (step === 'recipient' && recipient) {
      setStep('confirm')
    } else if (step === 'confirm') {
      onSend(recipient, amount)
      onOpenChange(false)
    }
  }

  const handleBack = () => {
    if (step === 'recipient') setStep('amount')
    else if (step === 'confirm') setStep('recipient')
    else onOpenChange(false)
  }

  const handleUseMax = () => {
    const maxAmount = Math.max(0, parseFloat(wallet.balance) - networkFee)
    setAmount(maxAmount.toFixed(8).replace(/\.?0+$/, ''))
  }

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    setRecipient(text.trim())
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Send ${chain.symbol}`}
      description={
        step === 'amount' ? 'Enter amount' : step === 'recipient' ? 'Enter recipient' : 'Confirm transaction'
      }
      headerGradient={chain.color}
      headerIcon={
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      }
    >
      {/* Balance Card - Floating */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-card rounded-2xl shadow-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-white text-lg`}
              >
                {chain.icon}
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Available</div>
                <div className="font-bold">
                  {parseFloat(wallet.balance).toFixed(6)} {chain.symbol}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">USD</div>
              <div className="font-semibold">${wallet.usdValue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <BottomSheetContent className="space-y-5">
        {/* Step 1: Amount */}
        {step === 'amount' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-sm text-primary hover:text-primary/80 font-medium"
                  onClick={handleUseMax}
                >
                  Use Max
                </Button>
              </div>
              <div className="relative">
                <Input
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    // Only allow numbers and decimal
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    setAmount(value)
                  }}
                  className="text-4xl sm:text-5xl h-20 sm:h-24 text-center font-bold border-2 focus:border-primary rounded-2xl"
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <span className="text-lg">=</span>
                <span className="text-2xl font-semibold">
                  ${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm">USD</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {['25%', '50%', '75%', 'MAX'].map((pct) => (
                <Button
                  key={pct}
                  variant="outline"
                  size="sm"
                  className="h-11 font-medium"
                  onClick={() => {
                    const percentage = pct === 'MAX' ? 1 : parseInt(pct, 10) / 100
                    const maxAmount = Math.max(0, parseFloat(wallet.balance) - networkFee)
                    const newAmount = maxAmount * percentage
                    setAmount(newAmount.toFixed(8).replace(/\.?0+$/, ''))
                  }}
                >
                  {pct}
                </Button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Recipient */}
        {step === 'recipient' && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Recipient Address</Label>
              <Input
                placeholder={`${chain.symbol} address or ENS name`}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-14 font-mono text-sm border-2 focus:border-primary rounded-xl"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-11" onClick={handlePaste}>
                  <span className="mr-2">📋</span>
                  Paste
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-11">
                  <span className="mr-2">📷</span>
                  Scan QR
                </Button>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sending</span>
                <span className="font-semibold">
                  {amount} {chain.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD Value</span>
                <span>${usdAmount.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <>
            {/* Transaction Summary Card */}
            <div className="bg-muted/50 rounded-2xl p-5 space-y-4">
              {/* To */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">To</div>
                <code className="text-sm font-mono break-all">{recipient}</code>
              </div>

              <div className="h-px bg-border" />

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <div className="text-right">
                  <div className="font-bold text-xl">
                    {amount} {chain.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">${usdAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Network Fee */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span>
                  ~{networkFee} {chain.symbol}
                </span>
              </div>

              <div className="h-px bg-border" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg">
                  {totalAmount.toFixed(6)} {chain.symbol}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600 dark:text-amber-500">
              <strong>Double-check the address!</strong> Transactions cannot be reversed.
            </div>
          </>
        )}
      </BottomSheetContent>

      <BottomSheetFooter className="flex gap-3">
        <Button variant="outline" className="flex-1 h-13 text-base font-medium" onClick={handleBack}>
          {step === 'amount' ? 'Cancel' : 'Back'}
        </Button>
        <Button
          className={`flex-1 h-13 text-base font-semibold bg-gradient-to-r ${chain.color} text-white hover:opacity-90`}
          onClick={handleContinue}
          disabled={
            (step === 'amount' &&
              (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(wallet.balance))) ||
            (step === 'recipient' && !recipient) ||
            (step === 'confirm' && totalAmount > parseFloat(wallet.balance))
          }
        >
          {step === 'confirm' ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Send Now
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </BottomSheetFooter>
    </BottomSheet>
  )
}
