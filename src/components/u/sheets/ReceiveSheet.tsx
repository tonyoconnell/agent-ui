/**
 * ReceiveSheet - Beautiful QR code display for receiving crypto
 *
 * Features:
 * - Large, scannable QR code
 * - One-tap copy
 * - Share functionality
 * - Payment link generation
 */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { BottomSheet, BottomSheetContent, BottomSheetFooter } from '../BottomSheet'
import { useResponsive } from '../hooks/useResponsive'

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
}

interface ReceiveSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet: Wallet
  chain: Chain
}

export function ReceiveSheet({ open, onOpenChange, wallet, chain }: ReceiveSheetProps) {
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const { isMobile } = useResponsive()

  // Generate QR code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wallet.address)}&bgcolor=ffffff&color=000000&margin=2`

  // Payment link
  const paymentLink = `https://pay.one.ie/to/${wallet.address}?chain=${chain.id}`

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(paymentLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleShare = async () => {
    const shareData = {
      title: `My ${chain.name} Address`,
      text: `Send ${chain.symbol} to: ${wallet.address}`,
      url: paymentLink,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  // QR code size based on device
  const qrSize = isMobile ? 'w-56 h-56' : 'w-64 h-64'

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Receive ${chain.symbol}`}
      description="Scan QR code or share address"
      headerGradient={chain.color}
      headerIcon={
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      }
    >
      <BottomSheetContent className="flex flex-col items-center space-y-6">
        {/* QR Code Container */}
        <div className="relative">
          {/* Glow Effect */}
          <div className={`absolute -inset-4 bg-gradient-to-br ${chain.color} opacity-20 rounded-3xl blur-xl`} />

          {/* QR Code */}
          <div className="relative bg-white p-4 rounded-2xl shadow-lg">
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${wallet.address}`}
              className={`${qrSize} rounded-lg`}
              onError={(e) => {
                // Fallback QR service
                ;(e.target as HTMLImageElement).src =
                  `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(wallet.address)}`
              }}
            />
          </div>

          {/* Chain Badge */}
          <div
            className={`
              absolute -bottom-3 left-1/2 -translate-x-1/2
              bg-gradient-to-r ${chain.color}
              text-white px-4 py-1.5 rounded-full
              text-sm font-medium shadow-lg
              flex items-center gap-2
            `}
          >
            <span>{chain.icon}</span>
            <span>{chain.name}</span>
          </div>
        </div>

        {/* Address Display */}
        <div className="w-full space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Your {chain.symbol} Address</Label>
          <button
            onClick={handleCopyAddress}
            className={`
              w-full p-4
              bg-muted/50 rounded-xl
              border-2 border-dashed
              ${copied ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/40'}
              transition-all duration-200
              text-left
              active:scale-[0.99]
            `}
          >
            <code className="text-xs sm:text-sm font-mono break-all leading-relaxed block">{wallet.address}</code>
            <div className="flex justify-center mt-3">
              <span
                className={`
                  text-xs font-medium
                  ${copied ? 'text-green-500' : 'text-muted-foreground'}
                `}
              >
                {copied ? 'Copied to clipboard!' : 'Tap to copy'}
              </span>
            </div>
          </button>
        </div>

        {/* Payment Link */}
        <div className="w-full space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">Payment Link</Label>
          <button
            onClick={handleCopyLink}
            className={`
              w-full p-3
              bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl
              border border-primary/20
              ${copiedLink ? 'border-green-500/50 bg-green-500/5' : 'hover:border-primary/40'}
              transition-all duration-200
              text-left
              active:scale-[0.99]
            `}
          >
            <code className="text-xs text-primary/80 break-all line-clamp-2">{paymentLink}</code>
            <div className="text-xs text-muted-foreground mt-2">{copiedLink ? 'Link copied!' : 'Tap to copy link'}</div>
          </button>
        </div>
      </BottomSheetContent>

      <BottomSheetFooter className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-13 gap-2 text-base font-medium"
          onClick={() => {
            emitClick('ui:receive:copy-address')
            handleCopyAddress()
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button
          className={`h-13 gap-2 text-base font-medium bg-gradient-to-r ${chain.color} text-white hover:opacity-90`}
          onClick={() => {
            emitClick('ui:receive:share-qr')
            handleShare()
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share
        </Button>
      </BottomSheetFooter>
    </BottomSheet>
  )
}
