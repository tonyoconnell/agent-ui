/**
 * ReceiveDetailPage - Single Wallet Receive View
 *
 * Large QR code, full address, one-tap copy.
 * "Send X USDC on Solana" style messaging.
 */

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as Vault from '../lib/vault/vault'

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  name?: string
}

const CHAINS: Record<string, { name: string; icon: string; color: string; symbol: string; network: string }> = {
  eth: {
    name: 'Ethereum',
    icon: '⟠',
    color: 'from-blue-500 to-indigo-600',
    symbol: 'ETH',
    network: 'Ethereum Mainnet',
  },
  btc: {
    name: 'Bitcoin',
    icon: '₿',
    color: 'from-orange-400 to-orange-600',
    symbol: 'BTC',
    network: 'Bitcoin Network',
  },
  sol: { name: 'Solana', icon: '◎', color: 'from-purple-500 to-pink-500', symbol: 'SOL', network: 'Solana Mainnet' },
  sui: { name: 'Sui', icon: '💧', color: 'from-cyan-400 to-blue-500', symbol: 'SUI', network: 'Sui Mainnet' },
  usdc: { name: 'USDC', icon: '💵', color: 'from-blue-400 to-blue-600', symbol: 'USDC', network: 'Multiple Networks' },
  one: { name: 'ONE', icon: '①', color: 'from-emerald-400 to-teal-600', symbol: 'ONE', network: 'ONE Network' },
}

interface ReceiveDetailPageProps {
  walletId: string
}

export function ReceiveDetailPage({ walletId }: ReceiveDetailPageProps) {
  const [wallet, _setWallet] = useState<Wallet | null>(null)
  const [copied, setCopied] = useState(false)
  const [requestAmount, setRequestAmount] = useState('')
  const [showRequest, setShowRequest] = useState(false)
  const sharingRef = useRef(false)

  useEffect(() => {
    void Vault.getWallet(walletId).then((v) => {
      if (!v) return
      _setWallet({
        id: v.id,
        name: v.name ?? `My ${v.chain.toUpperCase()} Wallet`,
        address: v.address,
        chain: v.chain.toLowerCase(),
        balance: v.balance,
        context: v.id.startsWith('testnet-') ? 'testnet' : 'mainnet',
        publicKey: v.publicKey || undefined,
        usdValue: v.usdValue,
        lastUpdated: v.createdAt,
      } as Wallet)
    })
  }, [walletId])

  const copyAddress = async () => {
    if (!wallet) return
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareAddress = async () => {
    if (!wallet) return
    // Web Share API forbids concurrent share() calls — ignore double-taps
    // while the native sheet is still open.
    if (sharingRef.current) return

    const chain = CHAINS[wallet.chain] || CHAINS.eth
    const text = requestAmount
      ? `Send ${requestAmount} ${chain.symbol} on ${chain.network}\n\nAddress: ${wallet.address}`
      : `Send ${chain.symbol} on ${chain.network}\n\nAddress: ${wallet.address}`

    if (navigator.share) {
      sharingRef.current = true
      try {
        await navigator.share({ title: `Receive ${chain.symbol}`, text })
      } catch (err) {
        // User-cancelled shares throw AbortError — silent by design.
        if ((err as DOMException)?.name !== 'AbortError') throw err
      } finally {
        sharingRef.current = false
      }
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Generate QR code URL using a free API
  const getQRUrl = (data: string, size = 280) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=000000&margin=10`
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Wallet Not Found</h2>
          <p className="text-muted-foreground mb-4">This wallet doesn't exist</p>
          <Button asChild>
            <a href="/u/receive">← Back to Wallets</a>
          </Button>
        </div>
      </div>
    )
  }

  const chain = CHAINS[wallet.chain] || CHAINS.eth

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Back Link */}
        <a
          href="/u/receive"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          ← All Wallets
        </a>

        {/* Main Card */}
        <Card className="overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-br ${chain.color} p-6 text-white text-center`}>
            <div className="text-4xl mb-2">{chain.icon}</div>
            <h1 className="text-xl font-bold">{wallet.name || `${chain.name} Wallet`}</h1>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-0">
              {chain.network}
            </Badge>
          </div>

          <CardContent className="p-6">
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-2xl shadow-lg">
                <img src={getQRUrl(wallet.address)} alt="QR Code" className="w-56 h-56" loading="eager" />
              </div>
            </div>

            {/* Send Message */}
            <div className="text-center mb-6">
              <p className="text-lg font-medium">
                Send{' '}
                <span className={`font-bold`}>
                  {requestAmount ? `${requestAmount} ` : ''}
                  {chain.symbol}
                </span>{' '}
                on <span className="font-bold">{chain.network}</span>
              </p>
            </div>

            {/* Full Address */}
            <div className="mb-6">
              <Label className="text-sm text-muted-foreground mb-2 block">Wallet Address</Label>
              <div
                className="p-3 bg-muted rounded-lg font-mono text-sm break-all cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={copyAddress}
              >
                {wallet.address}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Tap address to copy</p>
            </div>

            {/* Request Amount Toggle */}
            {!showRequest ? (
              <Button variant="outline" className="w-full mb-4" onClick={() => setShowRequest(true)}>
                + Request Specific Amount
              </Button>
            ) : (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm mb-2 block">Request Amount</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    className="text-lg"
                  />
                  <span className="flex items-center text-muted-foreground font-medium px-3">{chain.symbol}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setShowRequest(false)
                    setRequestAmount('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" variant="outline" onClick={copyAddress} className="h-14">
                {copied ? '✓ Copied!' : '📋 Copy Address'}
              </Button>
              <Button size="lg" onClick={shareAddress} className="h-14">
                📤 Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 text-center">
            ⚠️ Only send <strong>{chain.symbol}</strong> on <strong>{chain.network}</strong> to this address
          </p>
        </div>
      </div>
    </div>
  )
}
