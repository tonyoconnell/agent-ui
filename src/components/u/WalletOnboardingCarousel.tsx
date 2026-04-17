/**
 * WalletOnboardingCarousel - Wallet Details After Creation
 *
 * Triggered after user clicks "Create All X Wallets"
 *
 * Features:
 * - Carousel to swipe through created wallets
 * - Beautiful QR codes for each wallet
 * - Address, private key, recovery phrase display
 * - 3 backup options: Copy, Write Down, Done
 * - Auto-saves keys to Keys Manager
 */

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  createdAt: number
  name?: string
  privateKey?: string
  mnemonic?: string
}

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
  decimals: number
}

interface StoredKey {
  id: string
  name: string
  type: 'mnemonic' | 'private_key'
  value: string
  createdAt: number
  chain?: string
  walletId?: string
}

const CHAINS: Chain[] = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: 'from-blue-500 to-indigo-600', icon: '⟠', decimals: 18 },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', color: 'from-orange-400 to-orange-600', icon: '₿', decimals: 8 },
  { id: 'sol', name: 'Solana', symbol: 'SOL', color: 'from-purple-500 to-pink-500', icon: '◎', decimals: 9 },
  { id: 'sui', name: 'Sui', symbol: 'SUI', color: 'from-cyan-400 to-blue-500', icon: '💧', decimals: 9 },
  { id: 'usdc', name: 'USDC', symbol: 'USDC', color: 'from-blue-400 to-blue-600', icon: '💵', decimals: 6 },
  { id: 'one', name: 'ONEIE', symbol: 'ONE', color: 'from-emerald-400 to-teal-600', icon: '①', decimals: 18 },
]

interface WalletOnboardingCarouselProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallets: Wallet[]
  onClose?: () => void
}

export function WalletOnboardingCarousel({ open, onOpenChange, wallets, onClose }: WalletOnboardingCarouselProps) {
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [showWriteDownModal, setShowWriteDownModal] = useState(false)
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([])
  const touchStartX = useRef(0)

  // Load stored keys
  useEffect(() => {
    const stored = localStorage.getItem('u_keys')
    if (stored) {
      setStoredKeys(JSON.parse(stored))
    }
  }, [])

  const copyToClipboard = (text: string, type: 'address' | 'privateKey' | 'mnemonic') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    showToast('✓ Copied to clipboard!', 'success')
    setTimeout(() => setCopied(null), 2000)
  }

  const saveToKeysManager = (wallet: Wallet) => {
    const existingKey = storedKeys.find((k) => k.walletId === wallet.id)
    if (existingKey) {
      showToast('Key already saved!', 'info')
      return
    }

    const newKey: StoredKey = {
      id: `key-${wallet.id}`,
      name: `${wallet.name} Private Key`,
      type: 'private_key',
      value: wallet.privateKey || '',
      createdAt: Date.now(),
      chain: wallet.chain,
      walletId: wallet.id,
    }

    const updatedKeys = [...storedKeys, newKey]
    setStoredKeys(updatedKeys)
    localStorage.setItem('u_keys', JSON.stringify(updatedKeys))
    showToast('🔐 Key saved to Keys Manager', 'success')
  }

  // Touch handlers for carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentWalletIndex < wallets.length - 1) {
        setCurrentWalletIndex(currentWalletIndex + 1)
      } else if (diff < 0 && currentWalletIndex > 0) {
        setCurrentWalletIndex(currentWalletIndex - 1)
      }
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
  }

  const currentWallet = wallets[currentWalletIndex]
  const currentChain = CHAINS.find((c) => c.id === currentWallet?.chain)

  // QR Code URL
  const qrCodeUrl =
    currentWallet &&
    `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
      currentWallet.address,
    )}&bgcolor=ffffff&color=000000&margin=2`

  if (!currentWallet || !currentChain) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Secure Your Wallets</DialogTitle>
          <DialogDescription>View your wallet details and choose how to back up your keys</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Wallet Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {wallets.map((w, idx) => {
              const chain = CHAINS.find((c) => c.id === w.chain)
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentWalletIndex(idx)}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-medium ${
                    idx === currentWalletIndex
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span className="mr-1">{chain?.icon}</span>
                  {chain?.symbol}
                </button>
              )
            })}
          </div>

          {/* Current Wallet Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWalletIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Wallet Header */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl`}>{currentChain.icon}</div>
                  <div>
                    <p className="font-semibold">{currentChain.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentWalletIndex + 1} of {wallets.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Scan to Receive</p>
                <div className="bg-white p-3 rounded-lg inline-flex mx-auto">
                  <img src={qrCodeUrl} alt={`QR Code`} className="w-44 h-44" />
                </div>
              </div>

              {/* Address Section */}
              <Card className="border-0 bg-muted/50">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Wallet Address</p>
                  <code className="block bg-background p-3 rounded text-xs font-mono break-all border">
                    {currentWallet.address}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentWallet.address, 'address')}
                      className="flex-1"
                    >
                      {copied === 'address' ? '✓ Copied' : '📋 Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`Send to: ${currentWallet.address}`)
                        showToast('Share link copied!', 'success')
                      }}
                      className="flex-1"
                    >
                      🔗 Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Private Key Section */}
              <Card className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>⚠️</span> Private Key
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Keep this secret. Never share with anyone!</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <code className="block bg-background p-3 rounded text-xs font-mono break-all border border-amber-500/30">
                    {currentWallet.privateKey}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentWallet.privateKey || '', 'privateKey')}
                      className="flex-1"
                    >
                      {copied === 'privateKey' ? '✓ Copied' : '📋 Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowWriteDownModal(true)} className="flex-1">
                      ✍️ Write Down
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Phrase Section */}
              <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>🔑</span> Recovery Phrase
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Use this to restore your wallet anywhere</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-background p-3 rounded border border-green-500/30">
                    <p className="text-sm font-mono">{currentWallet.mnemonic}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(currentWallet.mnemonic || '', 'mnemonic')}
                      className="flex-1"
                    >
                      {copied === 'mnemonic' ? '✓ Copied' : '📋 Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowWriteDownModal(true)} className="flex-1">
                      ✍️ Write Down
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex justify-center gap-2">
                {wallets.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentWalletIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentWalletIndex ? 'w-8 bg-primary' : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => saveToKeysManager(currentWallet)} className="flex-1">
              💾 Save Key
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
            >
              ✓ Done
            </Button>
          </div>
        </div>

        {/* Write Down Modal */}
        <Dialog open={showWriteDownModal} onOpenChange={setShowWriteDownModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Write Down Your Keys</DialogTitle>
              <DialogDescription>
                For maximum security, write down your private key and recovery phrase on paper.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded space-y-2">
                <p className="text-xs font-medium text-muted-foreground">PRIVATE KEY</p>
                <code className="text-xs font-mono break-all block">{currentWallet.privateKey}</code>
              </div>
              <div className="bg-muted p-3 rounded space-y-2">
                <p className="text-xs font-medium text-muted-foreground">RECOVERY PHRASE</p>
                <code className="text-xs font-mono break-all block">{currentWallet.mnemonic}</code>
              </div>
              <Button
                onClick={() => {
                  window.print()
                  setShowWriteDownModal(false)
                }}
                className="w-full"
              >
                🖨️ Print Keys
              </Button>
              <Button variant="outline" onClick={() => setShowWriteDownModal(false)} className="w-full">
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

function showToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
  const toast = document.createElement('div')
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'

  toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`
  toast.style.transform = 'translateY(100px)'
  toast.style.opacity = '0'
  toast.textContent = message
  document.body.appendChild(toast)

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)'
    toast.style.opacity = '1'
  })

  setTimeout(() => {
    toast.style.transform = 'translateY(100px)'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 2700)
}
