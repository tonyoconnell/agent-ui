/**
 * GenerateWalletDialog - Create new wallets
 *
 * Beautiful dialog for generating wallets across chains
 * Keys are generated locally and never leave the browser
 */

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Chain {
  id: string
  name: string
  symbol: string
  color: string
  icon: string
  description?: string
}

interface GenerateWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chains: Chain[]
  onGenerate: (chainId: string) => void
  existingWallets?: string[]
}

export function GenerateWalletDialog({
  open,
  onOpenChange,
  chains,
  onGenerate,
  existingWallets = [],
}: GenerateWalletDialogProps) {
  const [generating, setGenerating] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)

  const handleGenerate = async (chainId: string) => {
    setGenerating(chainId)
    await onGenerate(chainId)
    setGenerating(null)
  }

  const handleGenerateAll = async () => {
    setGeneratingAll(true)

    for (const chain of chains) {
      if (!existingWallets.includes(chain.id)) {
        await onGenerate(chain.id)
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    setGeneratingAll(false)
    onOpenChange(false)
  }

  const missingChains = chains.filter((c) => !existingWallets.includes(c.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl shadow-lg">
                👛
              </div>
              Generate Wallet
            </DialogTitle>
            <DialogDescription className="text-sm">
              Choose a blockchain to create your wallet. Keys are generated locally and stored securely.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {/* Create All Button */}
          {missingChains.length > 1 && (
            <Button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              className="w-full mb-6 h-14 bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90 shadow-lg font-semibold"
            >
              {generatingAll ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Creating {missingChains.length} Wallets...
                </>
              ) : (
                <>
                  <span className="text-xl mr-2">✨</span>
                  Create All {missingChains.length} Wallets
                </>
              )}
            </Button>
          )}

          {/* Individual Chain Cards - 3x2 Grid */}
          <div className="grid grid-cols-3 gap-3">
            {chains.map((chain) => {
              const exists = existingWallets.includes(chain.id)
              const isGenerating = generating === chain.id

              return (
                <Card
                  key={chain.id}
                  className={`
                    cursor-pointer transition-all duration-300 overflow-hidden
                    ${
                      exists
                        ? 'opacity-50 cursor-not-allowed border-green-500/30'
                        : 'hover:shadow-xl hover:-translate-y-1 hover:border-primary/30'
                    }
                    ${isGenerating ? 'animate-pulse' : ''}
                  `}
                  onClick={() => !exists && !generating && handleGenerate(chain.id)}
                >
                  {/* Top gradient line */}
                  <div className={`h-1.5 bg-gradient-to-r ${chain.color} ${exists ? 'opacity-50' : ''}`} />

                  <CardContent className="pt-4 pb-4 text-center relative">
                    {/* Chain Icon */}
                    <div
                      className={`
                        w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center text-xl shadow-lg transition-all
                        ${exists ? 'bg-muted text-muted-foreground' : `bg-gradient-to-br ${chain.color} text-white`}
                      `}
                    >
                      {isGenerating ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : exists ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        chain.icon
                      )}
                    </div>

                    {/* Chain Info */}
                    <div className="font-semibold text-sm">{chain.name}</div>
                    <div className="text-xs text-muted-foreground">{chain.symbol}</div>

                    {/* Status Badge */}
                    <div className="mt-2">
                      {exists ? (
                        <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                          Created
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          + Add
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <div>
                <div className="font-medium text-sm">Your Keys, Your Crypto</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Private keys and recovery phrases are saved to your{' '}
                  <a href="/u/keys" className="text-primary hover:underline font-medium">
                    Keys page
                  </a>
                  . View and backup your keys anytime.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
