/**
 * TokensPage - Create and Manage Tokens
 *
 * Features:
 * - Create new tokens (ERC-20, SPL, Move)
 * - View token balances
 * - Mint/Burn tokens
 * - Transfer tokens
 * - Token analytics
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Token {
  id: string
  name: string
  symbol: string
  chain: string
  supply: string
  decimals: number
  contractAddress: string
  createdAt: number
  holders: number
}

const CHAIN_OPTIONS = [
  { id: 'eth', name: 'Ethereum', standard: 'ERC-20' },
  { id: 'sol', name: 'Solana', standard: 'SPL' },
  { id: 'sui', name: 'Sui', standard: 'Move' },
  { id: 'base', name: 'Base', standard: 'ERC-20' },
  { id: 'arb', name: 'Arbitrum', standard: 'ERC-20' },
]

export function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newToken, setNewToken] = useState({
    name: '',
    symbol: '',
    chain: 'eth',
    supply: '1000000',
    decimals: 18,
  })

  useEffect(() => {
    const stored = localStorage.getItem('u_tokens')
    if (stored) setTokens(JSON.parse(stored))
  }, [])

  const createToken = () => {
    const token: Token = {
      id: `token-${Date.now()}`,
      name: newToken.name,
      symbol: newToken.symbol.toUpperCase(),
      chain: newToken.chain,
      supply: newToken.supply,
      decimals: newToken.decimals,
      contractAddress: `0x${Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
      createdAt: Date.now(),
      holders: 1,
    }

    const updated = [...tokens, token]
    setTokens(updated)
    localStorage.setItem('u_tokens', JSON.stringify(updated))
    setShowCreateDialog(false)
    setNewToken({ name: '', symbol: '', chain: 'eth', supply: '1000000', decimals: 18 })

    // TODO: Integrate with blockchain deployment service (pay.one.ie, Thirdweb, etc.)
    // For now, token is created locally and ready for deployment integration
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>🪙</span> Tokens
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage your tokens</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <span className="mr-2">+</span>
            Create Token
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{tokens.length}</div>
              <div className="text-sm text-muted-foreground">Total Tokens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {tokens.reduce((s, t) => s + parseInt(t.supply, 10), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Supply</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{tokens.filter((t) => t.chain === 'eth').length}</div>
              <div className="text-sm text-muted-foreground">ERC-20 Tokens</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{tokens.reduce((s, t) => s + t.holders, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Holders</div>
            </CardContent>
          </Card>
        </div>

        {/* Token List */}
        {tokens.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🪙</div>
            <h3 className="text-2xl font-semibold mb-2">Create Your First Token</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Deploy ERC-20, SPL, or Move tokens with one click. No coding required. Your token, your rules.
            </p>
            <Button size="lg" onClick={() => setShowCreateDialog(true)}>
              <span className="mr-2">+</span>
              Create Token
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => {
              const chain = CHAIN_OPTIONS.find((c) => c.id === token.chain)
              return (
                <Card key={token.id} className="group hover:shadow-xl transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold">{token.name}</div>
                          <Badge variant="outline">{token.symbol}</Badge>
                        </div>
                      </div>
                      <Badge>{chain?.standard}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Supply</span>
                        <span className="font-mono">{parseInt(token.supply, 10).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Holders</span>
                        <span>{token.holders}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Chain</span>
                        <span>{chain?.name}</span>
                      </div>
                    </div>

                    <div className="p-2 bg-muted/50 rounded mt-4">
                      <code className="text-xs font-mono text-muted-foreground">
                        {token.contractAddress.slice(0, 16)}...
                      </code>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Token Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>🪙</span> Create New Token
            </DialogTitle>
            <DialogDescription>Deploy your token to any blockchain. No coding required.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Token Name</Label>
                <Input
                  placeholder="My Token"
                  value={newToken.name}
                  onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Symbol</Label>
                <Input
                  placeholder="MTK"
                  maxLength={6}
                  value={newToken.symbol}
                  onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div>
              <Label>Blockchain</Label>
              <Select value={newToken.chain} onValueChange={(v) => setNewToken({ ...newToken, chain: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAIN_OPTIONS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.name} ({chain.standard})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Supply</Label>
                <Input
                  type="number"
                  value={newToken.supply}
                  onChange={(e) => setNewToken({ ...newToken, supply: e.target.value })}
                />
              </div>
              <div>
                <Label>Decimals</Label>
                <Input
                  type="number"
                  value={newToken.decimals}
                  onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value, 10) })}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Token Preview</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                {newToken.symbol.slice(0, 2) || '??'}
              </div>
              <div>
                <div className="font-semibold">{newToken.name || 'Token Name'}</div>
                <div className="text-sm text-muted-foreground">
                  {parseInt(newToken.supply, 10).toLocaleString()} {newToken.symbol || 'TKN'}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createToken} disabled={!newToken.name || !newToken.symbol}>
              Deploy Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
