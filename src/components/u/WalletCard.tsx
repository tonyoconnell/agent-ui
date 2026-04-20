/**
 * WalletCard - Individual wallet display
 *
 * Beautiful, minimal wallet card with:
 * - Chain-specific gradient
 * - Address with copy
 * - Balance display
 * - QR code for receiving
 * - Quick actions via pay.one.ie
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { emitClick } from '@/lib/ui-signal'
import { getPaymentQRUrl, getPaymentUrl, openPaymentWindow } from './lib/PayService'

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
}

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  createdAt: number
}

interface WalletCardProps {
  wallet: Wallet
  chain: Chain
}

export function WalletCard({ wallet, chain }: WalletCardProps) {
  const [copied, setCopied] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showSwapDialog, setShowSwapDialog] = useState(false)
  const [sendForm, setSendForm] = useState({ to: '', amount: '' })

  const copyAddress = async () => {
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const truncateAddress = (addr: string) => {
    if (addr.length <= 16) return addr
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  const handleSend = () => {
    // Open pay.one.ie for sending
    const url = `https://pay.one.ie/send?from=${wallet.address}&to=${sendForm.to}&amount=${sendForm.amount}&token=${chain.symbol}&chain=${chain.id}`
    openPaymentWindow(url)
    setShowSendDialog(false)
  }

  const _handleReceive = () => {
    // Generate payment link via pay.one.ie
    const paymentUrl = getPaymentUrl({
      to: wallet.address,
      token: chain.symbol,
      chain: chain.id,
    })
    navigator.clipboard.writeText(paymentUrl)
  }

  const handleSwap = () => {
    // Open pay.one.ie swap interface
    const url = `https://pay.one.ie/swap?from=${wallet.address}&chain=${chain.id}`
    openPaymentWindow(url)
    setShowSwapDialog(false)
  }

  const qrCodeUrl = getPaymentQRUrl(wallet.address, chain.id)

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${chain.color} opacity-10 group-hover:opacity-15 transition-opacity`}
        />

        <CardContent className="relative pt-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-white text-xl shadow-lg`}
              >
                {chain.icon}
              </div>
              <div>
                <div className="font-semibold">{chain.name}</div>
                <Badge variant="outline" className="text-xs">
                  {chain.symbol}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Wallet options">
                  ⋮
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowReceiveDialog(true)}>
                  <span className="mr-2">📱</span> Show QR Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    emitClick('ui:wallet:copy-address')
                    copyAddress()
                  }}
                >
                  <span className="mr-2">📋</span> Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    window.open(`https://pay.one.ie/wallet/${wallet.address}?chain=${chain.id}`, '_blank')
                  }}
                >
                  <span className="mr-2">🔍</span> View on Explorer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    emitClick('ui:wallet:export')
                    window.open(
                      `https://pay.one.ie/export?address=${wallet.address}`,
                      'pay_one_ie',
                      'width=500,height=400',
                    )
                  }}
                >
                  <span className="mr-2">🔑</span> Export Key
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <span className="mr-2">🗑️</span> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Address */}
          <div
            className="mb-4 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
            onClick={copyAddress}
          >
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-muted-foreground">{truncateAddress(wallet.address)}</code>
              <span className="text-xs text-muted-foreground">{copied ? '✓ Copied' : 'Click to copy'}</span>
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-1">
            <div className="text-3xl font-bold">
              {wallet.balance} <span className="text-lg text-muted-foreground">{chain.symbol}</span>
            </div>
            <div className="text-sm text-muted-foreground">≈ ${wallet.usdValue.toLocaleString()} USD</div>
          </div>

          {/* Quick Actions - Beautiful Interactive Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-muted">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 group relative overflow-hidden transition-all duration-300 hover:border-green-500/50 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
              onClick={() => {
                emitClick('ui:send:open')
                setShowSendDialog(true)
              }}
            >
              <span className="mr-1.5 text-base group-hover:scale-110 transition-transform">↗</span>
              <span>Send</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 group relative overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
              onClick={() => {
                emitClick('ui:receive:open')
                setShowReceiveDialog(true)
              }}
            >
              <span className="mr-1.5 text-base group-hover:scale-110 transition-transform">↙</span>
              <span>Receive</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 group relative overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              onClick={() => {
                emitClick('ui:swap:open')
                setShowSwapDialog(true)
              }}
            >
              <span className="mr-1.5 text-base group-hover:scale-110 transition-transform">⇄</span>
              <span>Swap</span>
            </Button>
          </div>

          {/* Created Date */}
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Created {new Date(wallet.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Send Dialog - Beautiful Apple-like Design */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Gradient Header */}
          <div className={`relative bg-gradient-to-br ${chain.color} p-6 pb-10`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
                  ↗
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">Send {chain.symbol}</DialogTitle>
                  <DialogDescription className="text-white/80">Transfer to any address</DialogDescription>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Balance Card */}
          <div className="px-6 -mt-6 relative z-10">
            <div className="bg-background rounded-xl shadow-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${chain.color} flex items-center justify-center text-white`}
                  >
                    {chain.icon}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Available Balance</div>
                    <div className="font-bold">
                      {wallet.balance} {chain.symbol}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">≈ USD</div>
                  <div className="font-semibold">${wallet.usdValue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 pt-4 space-y-5">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={sendForm.amount}
                  onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                  className="text-2xl h-14 pr-20 font-semibold"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Badge variant="secondary">{chain.symbol}</Badge>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  ≈ $
                  {sendForm.amount
                    ? (parseFloat(sendForm.amount) * (wallet.usdValue / (parseFloat(wallet.balance) || 1))).toFixed(2)
                    : '0.00'}{' '}
                  USD
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-0 px-2 text-xs text-primary hover:text-primary"
                  onClick={() => setSendForm({ ...sendForm, amount: wallet.balance })}
                >
                  Use Max
                </Button>
              </div>
            </div>

            {/* Recipient Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recipient</Label>
              <Input
                placeholder="Enter address or ENS name"
                value={sendForm.to}
                onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                className="h-12 font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  📋 Paste
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  📱 Scan QR
                </Button>
              </div>
            </div>

            {/* Transaction Preview */}
            {sendForm.amount && sendForm.to && (
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-dashed">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span>~0.001 {chain.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {(parseFloat(sendForm.amount) + 0.001).toFixed(4)} {chain.symbol}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <Button variant="outline" onClick={() => setShowSendDialog(false)} className="flex-1 h-12">
              Cancel
            </Button>
            <Button
              onClick={() => {
                emitClick('ui:send:submit-commerce')
                handleSend()
              }}
              disabled={!sendForm.to || !sendForm.amount}
              className={`flex-1 h-12 bg-gradient-to-r ${chain.color} text-white hover:opacity-90 transition-opacity`}
            >
              <span className="mr-2">↗</span>
              Send Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog - Beautiful QR Experience */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Gradient Header */}
          <div className={`relative bg-gradient-to-br ${chain.color} p-6`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative text-white text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl mx-auto mb-3">
                ↙
              </div>
              <DialogTitle className="text-xl font-semibold text-white">Receive {chain.symbol}</DialogTitle>
              <DialogDescription className="text-white/80">Scan QR or share your address</DialogDescription>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="p-6 space-y-4">
            {/* Beautiful QR Container */}
            <div className="relative mx-auto w-fit">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-xl" />
              <div className="relative bg-white p-4 rounded-2xl shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  className="w-48 h-48"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(wallet.address)}`
                  }}
                />
              </div>
              {/* Chain Badge */}
              <div
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r ${chain.color} text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg`}
              >
                {chain.icon} {chain.name}
              </div>
            </div>

            {/* Address Display */}
            <div className="mt-8 space-y-2">
              <Label className="text-xs text-muted-foreground">Your {chain.symbol} Address</Label>
              <div className="relative group">
                <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors">
                  <code className="text-xs font-mono break-all leading-relaxed">{wallet.address}</code>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={copyAddress}
                  aria-label="Copy address"
                >
                  {copied ? '✓' : '📋'}
                </Button>
              </div>
            </div>

            {/* Payment Link */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Payment Link (pay.one.ie)</Label>
              <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl">
                <code className="text-xs text-primary/80 break-all line-clamp-2">
                  {getPaymentUrl({ to: wallet.address, token: chain.symbol, chain: chain.id })}
                </code>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 gap-2"
              onClick={() => {
                emitClick('ui:receive:copy-address')
                copyAddress()
              }}
            >
              <span className="text-lg">📋</span>
              Copy Address
            </Button>
            <Button
              className={`h-12 gap-2 bg-gradient-to-r ${chain.color} text-white hover:opacity-90`}
              onClick={() => {
                emitClick('ui:receive:share-qr')
                const url = getPaymentUrl({ to: wallet.address, token: chain.symbol, chain: chain.id })
                navigator.clipboard.writeText(url)
              }}
            >
              <span className="text-lg">🔗</span>
              Share Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Dialog - Beautiful DEX Interface */}
      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Gradient Header */}
          <div className={`relative bg-gradient-to-br ${chain.color} p-6`}>
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative text-white text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl mx-auto mb-3">
                ⇄
              </div>
              <DialogTitle className="text-xl font-semibold text-white">Swap {chain.symbol}</DialogTitle>
              <DialogDescription className="text-white/80">Best rates from multiple DEXs</DialogDescription>
            </div>
          </div>

          {/* Swap Interface */}
          <div className="p-6 space-y-4">
            {/* From Token */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">You Pay</Label>
              <div className="relative bg-muted/50 rounded-xl p-4 border-2 border-transparent focus-within:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="text-2xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0 w-32"
                  />
                  <div
                    className={`flex items-center gap-2 bg-gradient-to-r ${chain.color} text-white px-3 py-2 rounded-full`}
                  >
                    <span className="text-lg">{chain.icon}</span>
                    <span className="font-medium">{chain.symbol}</span>
                    <span className="text-white/60">▼</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>≈ $0.00</span>
                  <span>Balance: {wallet.balance}</span>
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center -my-1">
              <div className="w-10 h-10 rounded-full bg-background border-4 border-muted flex items-center justify-center text-lg cursor-pointer hover:bg-muted transition-colors">
                ↓
              </div>
            </div>

            {/* To Token */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">You Receive</Label>
              <div className="relative bg-muted/30 rounded-xl p-4 border-2 border-dashed border-muted-foreground/20">
                <div className="flex items-center justify-between mb-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="text-2xl font-bold border-0 bg-transparent p-0 focus-visible:ring-0 w-32"
                    readOnly
                  />
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full cursor-pointer hover:bg-muted/80 transition-colors">
                    <span className="text-lg">🪙</span>
                    <span className="font-medium text-muted-foreground">Select</span>
                    <span className="text-muted-foreground">▼</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">≈ $0.00</div>
              </div>
            </div>

            {/* Swap Details */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span>🔄</span> Rate
                </span>
                <span>1 {chain.symbol} = -- USDC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span>⛽</span> Network Fee
                </span>
                <span>~$0.50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <span>📊</span> Slippage
                </span>
                <Badge variant="outline" className="text-xs">
                  0.5%
                </Badge>
              </div>
            </div>

            {/* DEX Sources */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Powered by</span>
              <Badge variant="secondary" className="text-xs">
                Uniswap
              </Badge>
              <Badge variant="secondary" className="text-xs">
                1inch
              </Badge>
              <Badge variant="secondary" className="text-xs">
                0x
              </Badge>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <Button variant="outline" onClick={() => setShowSwapDialog(false)} className="flex-1 h-12">
              Cancel
            </Button>
            <Button
              onClick={() => {
                emitClick('ui:swap:submit')
                handleSwap()
              }}
              className={`flex-1 h-12 bg-gradient-to-r ${chain.color} text-white hover:opacity-90 transition-opacity`}
            >
              <span className="mr-2">⇄</span>
              Connect & Swap
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
