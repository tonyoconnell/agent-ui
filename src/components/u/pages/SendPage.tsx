/**
 * SendPage — passkey-PRF send flow for SUI.
 *
 * Flow (SUI):
 *  1. Enter recipient + amount in USD
 *  2. Pre-flight: State 1 cap check
 *  3. POST /api/sponsor/build → txBytes
 *  4. Touch ID → signWithPasskey(txBytes, credId) → senderSig
 *  5. POST /api/sponsor/execute → digest
 *  6. Success screen
 *
 * Non-SUI chains fall through to the same UI but skip sponsor flow
 * and show a "chain not yet supported" message at confirm.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SuiNSPicker } from '@/components/u/SuiNSPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { trackEvent } from '@/lib/analytics'
import { emitClick } from '@/lib/ui-signal'
import type { ScopedWalletStruct } from '../../../../interfaces/move/scoped-wallet/struct.move'
import { getScopedWallet } from '../lib/scoped-wallet'
import { signWithPasskey } from '../lib/signer'
import * as Vault from '../lib/vault/vault'
import { UNav } from '../UNav'

// ===== CONSTANTS =====

/** State 1 wallets (no passkey enrolled) cap: $5 ≈ 5_000_000 MIST at $1/SUI fallback */
const STATE1_CAP_USD = 5
/** MIST per SUI */
const MIST_PER_SUI = 1_000_000_000

// ===== ERROR COPY =====

const ERROR_COPY: Record<string, string> = {
  'build-failed': 'Could not build transaction. Please try again.',
  'sign-cancelled': 'Touch ID was cancelled. Tap Send to try again.',
  'sign-failed': 'Signing failed. Please check your passkey and try again.',
  'execute-failed': 'Transaction failed on chain. Your balance was not changed.',
  'no-passkey': 'No passkey enrolled. Save your wallet first to enable Touch ID signing.',
  'state1-cap': `State 1 wallets are capped at $${STATE1_CAP_USD}. Save your wallet first.`,
  'chain-unsupported': 'Only SUI transfers are supported right now.',
  'address-invalid': 'Invalid recipient address.',
  'amount-invalid': 'Enter a valid amount greater than 0.',
  network: 'Network error. Check your connection and try again.',
}

// ===== TYPES =====

type SendStep = 1 | 2 | 3 | 4

interface WalletInfo {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  name?: string
  /** passkey credentialId — base64, present when vault is enrolled */
  credentialId?: string
  /** wallet lifecycle state: 1 = ephemeral, 2 = passkey-saved, 3 = linked */
  walletState?: 1 | 2 | 3
  /** ScopedWallet object ID on-chain (optional for scoped wallets) */
  scopedWalletId?: string
}

// ===== CHAIN CONFIG =====

const CHAINS: Record<string, { name: string; icon: string; color: string; symbol: string; usdPrice: number }> = {
  eth: { name: 'Ethereum', icon: '⟠', color: 'from-blue-500 to-indigo-600', symbol: 'ETH', usdPrice: 3850 },
  btc: { name: 'Bitcoin', icon: '₿', color: 'from-orange-400 to-orange-600', symbol: 'BTC', usdPrice: 98500 },
  sol: { name: 'Solana', icon: '◎', color: 'from-purple-500 to-pink-500', symbol: 'SOL', usdPrice: 245 },
  sui: { name: 'Sui', icon: '💧', color: 'from-cyan-400 to-blue-500', symbol: 'SUI', usdPrice: 4.12 },
  base: { name: 'Base', icon: '🔵', color: 'from-blue-400 to-blue-600', symbol: 'ETH', usdPrice: 3850 },
  arbitrum: { name: 'Arbitrum', icon: '🔷', color: 'from-blue-500 to-blue-700', symbol: 'ETH', usdPrice: 3850 },
  polygon: { name: 'Polygon', icon: '💜', color: 'from-purple-400 to-purple-600', symbol: 'MATIC', usdPrice: 0.85 },
  usdc: { name: 'USDC', icon: '💵', color: 'from-blue-400 to-blue-600', symbol: 'USDC', usdPrice: 1.0 },
  one: { name: 'ONE', icon: '①', color: 'from-emerald-400 to-teal-600', symbol: 'ONE', usdPrice: 0.1 },
}

const CHAIN_COMPATIBILITY: Record<string, string[]> = {
  sui: ['sui'],
  eth: ['eth', 'base', 'arbitrum', 'polygon', 'usdc'],
  base: ['eth', 'base', 'arbitrum', 'polygon', 'usdc'],
  arbitrum: ['eth', 'base', 'arbitrum', 'polygon', 'usdc'],
  polygon: ['eth', 'base', 'arbitrum', 'polygon', 'usdc'],
  sol: ['sol'],
  btc: ['btc'],
}

// ===== HELPERS =====

function formatAddress(addr: string): string {
  if (!addr) return 'No address'
  if (addr.length < 16) return addr
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

function usdToMist(usdAmount: number, suiPriceUsd: number): bigint {
  // usd / price = SUI, SUI × MIST_PER_SUI = MIST
  const sui = usdAmount / suiPriceUsd
  return BigInt(Math.floor(sui * MIST_PER_SUI))
}

function base64ToUint8Array(b64: string): Uint8Array {
  // Accept both standard and base64url
  const std = b64.replace(/-/g, '+').replace(/_/g, '/')
  const padded = std + '=='.slice(0, (4 - (std.length % 4)) % 4)
  const binary = atob(padded)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

// ===== COMPONENT =====

export function SendPage() {
  const [step, setStep] = useState<SendStep>(1)
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [destinationAddress, setDestinationAddress] = useState('')
  const [resolvedDisplayName, setResolvedDisplayName] = useState<string | undefined>(undefined)
  const [amountUsd, setAmountUsd] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [txDigest, setTxDigest] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [scopedWalletData, setScopedWalletData] = useState<ScopedWalletStruct | null>(null)

  // Load wallets from vault
  useEffect(() => {
    const loadData = async () => {
      try {
        const status = await Vault.getStatus()
        if (!status.hasVault || status.isLocked) return

        const vaultWallets = await Vault.listWallets()
        if (vaultWallets.length === 0) return

        // Get the first enrolled passkey credentialId (shared across all wallets)
        const credIds = await Vault.getEnrolledPasskeyCredentialIds()
        const credentialId =
          credIds.length > 0
            ? btoa(String.fromCharCode(...credIds[0]))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '')
            : undefined

        const mapped: WalletInfo[] = vaultWallets.map((w) => ({
          id: w.id,
          chain: w.chain,
          address: w.address,
          balance: w.balance,
          usdValue: w.usdValue,
          name: w.name,
          credentialId,
          walletState: credentialId ? 2 : 1,
        }))

        setWallets(mapped)
        setUserAddress(vaultWallets.find((w) => w.chain === 'sui')?.address ?? vaultWallets[0]?.address ?? null)
      } catch {
        // vault locked or unavailable — leave wallets empty
      }
    }

    void loadData()

    const initial: Record<string, number> = {}
    for (const [k, v] of Object.entries(CHAINS)) initial[k] = v.usdPrice
    setPrices(initial)
  }, [])

  // Load scoped wallet data when selectedWallet has scopedWalletId
  useEffect(() => {
    const loadScopedWallet = async () => {
      if (!selectedWallet?.scopedWalletId) {
        setScopedWalletData(null)
        return
      }

      try {
        const data = await getScopedWallet(selectedWallet.scopedWalletId)
        setScopedWalletData(data)
      } catch {
        // ignore errors, just clear data
        setScopedWalletData(null)
      }
    }

    void loadScopedWallet()
  }, [selectedWallet?.scopedWalletId])

  // Detect chain from address format
  const detectChain = useCallback((addr: string): { chain: string; confidence: 'high' | 'medium' | 'low' } | null => {
    if (!addr || addr.length < 10) return null
    const t = addr.trim()
    if (t.startsWith('0x') && t.length === 66 && /^0x[a-fA-F0-9]{64}$/.test(t))
      return { chain: 'sui', confidence: 'high' }
    if (t.startsWith('0x') && t.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(t))
      return { chain: 'eth', confidence: 'high' }
    if (/^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/.test(t)) return { chain: 'btc', confidence: 'high' }
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(t)) return { chain: 'btc', confidence: 'high' }
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t) && !t.startsWith('0x')) return { chain: 'sol', confidence: 'high' }
    if (t.length >= 20) return { chain: 'eth', confidence: 'low' }
    return null
  }, [])

  const detectedChainInfo = useMemo(() => {
    const r = detectChain(destinationAddress)
    if (!r) return null
    return { ...r, chainData: CHAINS[r.chain] ?? CHAINS.eth }
  }, [destinationAddress, detectChain])

  const isValidAddress = detectedChainInfo !== null && detectedChainInfo.confidence !== 'low'

  // Compatible wallets for detected chain
  const compatibleWallets = useMemo(() => {
    if (!detectedChainInfo) return []
    const dest = detectedChainInfo.chain
    return wallets
      .filter((w) => {
        const wc = w.chain.toLowerCase()
        const compat = CHAIN_COMPATIBILITY[wc] ?? [wc]
        if (['eth', 'base', 'arbitrum', 'polygon'].includes(dest)) {
          return ['eth', 'base', 'arbitrum', 'polygon'].includes(wc)
        }
        return compat.includes(dest) || wc === dest
      })
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
  }, [wallets, detectedChainInfo])

  // Derived values
  const numAmount = parseFloat(amountUsd) || 0
  const suiPrice = prices.sui ?? 4.12
  const amountSui = numAmount / suiPrice
  const amountMist = usdToMist(numAmount, suiPrice)

  // State 1 cap check (SUI only)
  const isState1 = selectedWallet?.walletState === 1 || (!selectedWallet?.walletState && !selectedWallet?.credentialId)
  const exceedsState1Cap = isState1 && detectedChainInfo?.chain === 'sui' && numAmount > STATE1_CAP_USD
  const isSuiChain = detectedChainInfo?.chain === 'sui'

  // ===== PASSKEY-PRF SEND FLOW =====
  const handleSend = async () => {
    if (!selectedWallet || !destinationAddress || !amountUsd) return
    setSendError(null)
    setIsSending(true)

    emitClick('ui:send:initiate', {
      type: 'payment',
      payment: { receiver: destinationAddress, amount: numAmount, action: 'send' },
    })

    try {
      // Guard: only SUI is wired through the sponsor flow
      if (!isSuiChain) {
        setSendError(ERROR_COPY['chain-unsupported'])
        setIsSending(false)
        return
      }

      // Guard: State 1 cap
      if (exceedsState1Cap) {
        setSendError(ERROR_COPY['state1-cap'])
        setIsSending(false)
        return
      }

      // Guard: passkey required
      if (!selectedWallet.credentialId) {
        setSendError(ERROR_COPY['no-passkey'])
        setIsSending(false)
        return
      }

      // 1. Build tx on server
      const buildRes = await fetch('/api/sponsor/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: selectedWallet.address,
          txKind: 'transfer',
          params: { to: destinationAddress, amount: amountMist.toString() },
          walletState: selectedWallet.walletState ?? 1,
        }),
      })

      if (!buildRes.ok) {
        const body = (await buildRes.json().catch(() => ({}))) as { error?: string }
        setSendError(body?.error ?? ERROR_COPY['build-failed'])
        setIsSending(false)
        return
      }

      const { txBytes } = (await buildRes.json()) as { txBytes: string }
      const txBytesArr = base64ToUint8Array(txBytes)

      // 2. Touch ID → sign
      const credIdArr = base64ToUint8Array(selectedWallet.credentialId)
      let senderSig: Uint8Array
      try {
        emitClick('ui:send:touch-id')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        senderSig = await signWithPasskey(txBytesArr as any, credIdArr as any)
      } catch (err) {
        const msg = (err as Error)?.message ?? ''
        if (msg.includes('cancelled')) {
          setSendError(ERROR_COPY['sign-cancelled'])
        } else {
          setSendError(ERROR_COPY['sign-failed'])
        }
        setIsSending(false)
        return
      }

      // 3. Execute on server
      const execRes = await fetch('/api/sponsor/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txBytes, senderSig }),
      })

      if (!execRes.ok) {
        const body = (await execRes.json().catch(() => ({}))) as { error?: string }
        setSendError(body?.error ?? ERROR_COPY['execute-failed'])
        setIsSending(false)
        return
      }

      const { digest } = (await execRes.json()) as { digest: string }
      setTxDigest(digest)

      // Emit commerce signal if applicable
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      if (qs && (qs.has('product') || qs.has('seller'))) {
        emitClick('ui:send:submit-commerce', {
          type: 'payment',
          payment: { receiver: destinationAddress, amount: numAmount, action: 'send' },
        })
      } else {
        emitClick('ui:send:submit-private')
      }

      // Persist tx record
      const tx = {
        id: digest,
        hash: digest,
        type: 'send',
        from: selectedWallet.address,
        to: destinationAddress,
        amountUsd: numAmount,
        amountSui,
        chain: 'sui',
        status: 'confirmed',
        timestamp: Date.now(),
        walletId: selectedWallet.id,
      }
      const stored = localStorage.getItem('u_transactions')
      const history = stored ? (JSON.parse(stored) as unknown[]) : []
      localStorage.setItem('u_transactions', JSON.stringify([tx, ...history]))

      trackEvent('wallet:tx_sent', { chain: 'sui' })
      setStep(4)
    } catch {
      setSendError(ERROR_COPY.network)
    } finally {
      setIsSending(false)
    }
  }

  const resetFlow = () => {
    setStep(1)
    setDestinationAddress('')
    setResolvedDisplayName(undefined)
    setAmountUsd('')
    setSelectedWallet(null)
    setSendError(null)
    setTxDigest(null)
  }

  // ===== STEPS =====

  const steps = [
    { num: 1, label: 'To', icon: '📍' },
    { num: 2, label: 'Amount', icon: '💰' },
    { num: 3, label: 'From', icon: '👛' },
    { num: 4, label: 'Done', icon: '✅' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <UNav active="send" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">↗️</div>
          <h1 className="text-3xl font-bold">Send</h1>
          <p className="text-muted-foreground mt-1">Fast, secure transfers</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <button
                onClick={() => {
                  if (s.num < step && step !== 4) setStep(s.num as SendStep)
                }}
                disabled={s.num > step || step === 4}
                className={`flex flex-col items-center transition-all ${s.num <= step ? 'opacity-100' : 'opacity-40'} ${s.num < step && step !== 4 ? 'cursor-pointer hover:scale-105' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    step === s.num
                      ? 'bg-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/20'
                      : s.num < step
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s.num < step ? '✓' : s.icon}
                </div>
                <span
                  className={`text-xs mt-1.5 font-medium ${step === s.num ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 mt-[-16px] transition-all ${s.num < step ? 'bg-green-500' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Destination */}
        {step === 1 && (
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">📍</div>
                <h2 className="text-xl font-bold">Where to send?</h2>
                <p className="text-muted-foreground text-sm">Enter the recipient's wallet address</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <SuiNSPicker
                    value={destinationAddress}
                    onChange={(address, displayName) => {
                      emitClick('ui:send:recipient-resolved')
                      setDestinationAddress(address)
                      setResolvedDisplayName(displayName)
                    }}
                    placeholder="0x... or SuiNS name (e.g. alice.sui)"
                  />
                  {resolvedDisplayName && destinationAddress && (
                    <p className="text-xs text-muted-foreground px-1">
                      Resolved: <span className="font-medium">{resolvedDisplayName}</span> →{' '}
                      <span className="font-mono">{destinationAddress.slice(0, 10)}…</span>
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={async () => {
                      emitClick('ui:send:paste-address')
                      const text = await navigator.clipboard.readText()
                      setDestinationAddress(text.trim())
                      setResolvedDisplayName(undefined)
                    }}
                  >
                    📋 Paste address
                  </Button>
                </div>

                {destinationAddress && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      detectedChainInfo
                        ? detectedChainInfo.confidence === 'high'
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {detectedChainInfo ? (
                      <>
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${detectedChainInfo.chainData.color} flex items-center justify-center text-white text-lg`}
                        >
                          {detectedChainInfo.chainData.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {detectedChainInfo.chainData.name} Address
                            {detectedChainInfo.confidence === 'high' && (
                              <span className="text-green-500 text-sm">✓ Verified</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            You'll be sending {detectedChainInfo.chainData.symbol}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500">
                        <span>⚠</span>
                        <span>Invalid address format</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  disabled={!isValidAddress}
                  onClick={() => {
                    emitClick('ui:send:step1-next')
                    setStep(2)
                  }}
                >
                  Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Amount (USD) */}
        {step === 2 && detectedChainInfo && (
          <Card className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${detectedChainInfo.chainData.color}`} />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-6">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${detectedChainInfo.chainData.color} flex items-center justify-center text-white text-lg`}
                >
                  {detectedChainInfo.chainData.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Sending {detectedChainInfo.chainData.symbol} to</div>
                  <code className="text-sm font-mono">{formatAddress(destinationAddress)}</code>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Edit
                </Button>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{detectedChainInfo.chainData.icon}</div>
                <h2 className="text-xl font-bold">How much to send?</h2>
                <p className="text-muted-foreground text-sm">Enter amount in USD</p>
              </div>

              <div className="space-y-4">
                <div className="relative p-6 bg-muted/30 rounded-2xl">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amountUsd}
                      onChange={(e) => setAmountUsd(e.target.value)}
                      className="h-20 text-4xl font-bold text-center bg-transparent border-none shadow-none focus-visible:ring-0 w-48"
                    />
                  </div>
                  <div className="text-center text-lg text-muted-foreground font-medium">USD</div>
                </div>

                {isSuiChain && numAmount > 0 && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl">
                    <span className="text-2xl">💧</span>
                    <div className="text-center">
                      <div className="text-xl font-bold">{amountSui.toFixed(4)} SUI</div>
                      <div className="text-sm text-muted-foreground">1 SUI = ${suiPrice.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                {exceedsState1Cap && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600 dark:text-amber-400">
                    <strong>Wallet limit:</strong> {ERROR_COPY['state1-cap']}
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  disabled={!amountUsd || numAmount <= 0 || exceedsState1Cap}
                  onClick={() => {
                    emitClick('ui:send:step2-next')
                    setStep(3)
                  }}
                >
                  Continue →
                </Button>

                <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
                  ← Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Wallet selection + confirm */}
        {step === 3 && detectedChainInfo && (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${detectedChainInfo.chainData.color}`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${detectedChainInfo.chainData.color} flex items-center justify-center text-white text-xl`}
                    >
                      {detectedChainInfo.chainData.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        ${numAmount.toFixed(2)}
                        {isSuiChain && (
                          <span className="text-base font-normal text-muted-foreground ml-2">
                            ≈ {amountSui.toFixed(4)} SUI
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        to <code className="text-xs">{formatAddress(destinationAddress)}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mb-4">
              <div className="text-4xl mb-2">👛</div>
              <h2 className="text-xl font-bold">Send from which wallet?</h2>
              <p className="text-muted-foreground text-sm">
                {compatibleWallets.length > 0
                  ? `${compatibleWallets.length} compatible wallet${compatibleWallets.length > 1 ? 's' : ''} found`
                  : `No ${detectedChainInfo.chainData.name} wallets available`}
              </p>

              {/* Scoped Wallet Subtitle (when owner ≠ human) */}
              {selectedWallet?.scopedWalletId &&
                scopedWalletData &&
                userAddress &&
                scopedWalletData.owner !== userAddress && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
                    <div className="text-blue-600 dark:text-blue-400 font-medium">
                      Cap set by <span className="font-bold">{selectedWallet.name || 'Agent'}</span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {(Number(scopedWalletData.spentToday) / 1e9).toFixed(4)} /{' '}
                      {(Number(scopedWalletData.dailyCap) / 1e9).toFixed(4)} SUI used today
                    </div>
                  </div>
                )}
            </div>

            {compatibleWallets.length === 0 ? (
              <Card className="p-8 text-center">
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${detectedChainInfo.chainData.color} flex items-center justify-center text-white text-4xl opacity-50`}
                >
                  {detectedChainInfo.chainData.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">No {detectedChainInfo.chainData.name} Wallet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  You need a {detectedChainInfo.chainData.name} wallet to send {detectedChainInfo.chainData.symbol}
                </p>
                <Button asChild size="lg">
                  <a href="/u/wallets">Create {detectedChainInfo.chainData.name} Wallet →</a>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {compatibleWallets.map((wallet, idx) => {
                  const chain = CHAINS[wallet.chain] ?? CHAINS.eth
                  const hasEnough = parseFloat(wallet.balance) >= amountSui
                  const isSelected = selectedWallet?.id === wallet.id
                  const needsPasskey = isSuiChain && !wallet.credentialId

                  return (
                    <Card
                      key={wallet.id || `wallet-${idx}`}
                      className={`transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-primary shadow-lg scale-[1.02]'
                          : hasEnough && !needsPasskey
                            ? 'hover:shadow-lg hover:border-primary/50 hover:scale-[1.01]'
                            : 'opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => hasEnough && !needsPasskey && setSelectedWallet(wallet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-white text-2xl shrink-0 shadow-lg`}
                          >
                            {chain.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-lg">{wallet.name || `${chain.name} Wallet`}</div>
                            <code className="text-sm text-muted-foreground">{formatAddress(wallet.address)}</code>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${hasEnough ? '' : 'text-red-500'}`}>
                              {parseFloat(wallet.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                            <div className="text-sm text-muted-foreground">{chain.symbol}</div>
                          </div>
                          {isSelected && (
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg">
                              ✓
                            </div>
                          )}
                        </div>
                        {!hasEnough && (
                          <div className="mt-3 text-sm text-red-500 flex items-center gap-1">
                            <span>⚠</span> Insufficient balance (need {amountSui.toFixed(4)} {chain.symbol})
                          </div>
                        )}
                        {needsPasskey && (
                          <div className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <span>🔐</span>{' '}
                            <a href="/u/keys" className="underline hover:no-underline">
                              Save wallet first to enable Touch ID signing
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Error */}
            {sendError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                {sendError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                className="flex-1 h-12"
                disabled={!selectedWallet || isSending}
                onClick={() => {
                  emitClick('ui:send:confirm')
                  void handleSend()
                }}
              >
                {isSending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : (
                  '🔐 Touch ID & Send →'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && detectedChainInfo && (
          <Card className="overflow-hidden text-center">
            <div className={`h-2 bg-gradient-to-r ${detectedChainInfo.chainData.color}`} />
            <CardContent className="p-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-6xl">✅</span>
              </div>

              <h2 className="text-2xl font-bold mb-2">Sent!</h2>
              <p className="text-muted-foreground mb-6">
                ${numAmount.toFixed(2)} · {amountSui.toFixed(4)} SUI to {formatAddress(destinationAddress)}
              </p>

              {txDigest && (
                <div className="p-4 bg-muted/50 rounded-xl mb-6 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Transaction</span>
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline"
                    >
                      {txDigest.slice(0, 10)}…
                    </a>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Status</span>
                    <span className="text-green-500 font-medium text-sm">Confirmed</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={resetFlow}>
                  New Send
                </Button>
                <Button className="flex-1" asChild>
                  <a href="/u/transactions">View History</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
