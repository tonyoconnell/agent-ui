/**
 * Cat Sale Setup - Generate wallet and create $100 cat product
 */

import { useState } from 'react'
import PayService from '@/components/u/lib/PayService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WalletResult {
  address: string
  chain: string
  success: boolean
  error?: string
}

interface ProductResult {
  id: string
  paymentLink: string
  success: boolean
  error?: string
}

const SUPPORTED_CHAINS = [
  { id: 'eth', name: 'Ethereum', icon: '⟠', color: 'from-blue-500 to-indigo-600' },
  { id: 'base', name: 'Base', icon: '🔵', color: 'from-blue-400 to-blue-600' },
  { id: 'sui', name: 'Sui', icon: '💧', color: 'from-cyan-500 to-blue-500' },
  { id: 'sol', name: 'Solana', icon: '◎', color: 'from-purple-500 to-pink-500' },
]

export function CatSaleSetup() {
  const [wallets, setWallets] = useState<WalletResult[]>([])
  const [product, setProduct] = useState<ProductResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [catName, setCatName] = useState('Adorable Tabby Cat')
  const [walletName, setWalletName] = useState('Cat Sale Wallet')

  const generateWallets = async () => {
    setLoading(true)
    const results: WalletResult[] = []

    for (const chain of SUPPORTED_CHAINS) {
      try {
        const response = await PayService.generateWallet({
          chain: chain.id,
          type: 'standard',
        })

        if (response.success && response.data) {
          results.push({
            address: response.data.address,
            chain: chain.name,
            success: true,
          })

          // Save wallet to localStorage
          const storedWallets = localStorage.getItem('u_wallets')
          const walletsList = storedWallets ? JSON.parse(storedWallets) : []
          walletsList.push({
            id: `wallet_${Date.now()}_${chain.id}`,
            chain: chain.id,
            address: response.data.address,
            balance: '0',
            usdValue: 0,
            createdAt: Date.now(),
            name: `${walletName} (${chain.name})`,
            privateKey: response.data.privateKey,
          })
          localStorage.setItem('u_wallets', JSON.stringify(walletsList))
        } else {
          results.push({
            address: '',
            chain: chain.name,
            success: false,
            error: response.error?.message || 'Failed to generate wallet',
          })
        }
      } catch (error) {
        results.push({
          address: '',
          chain: chain.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    setWallets(results)
    setLoading(false)
  }

  const createCatProduct = async () => {
    if (wallets.length === 0 || !wallets[0].success) {
      alert('Please generate wallets first!')
      return
    }

    setLoading(true)

    try {
      // Create product in localStorage
      const productId = `product_${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
      const paymentLink = PayService.getPaymentUrl({
        to: wallets[0].address, // Use first wallet address
        amount: '10000', // $100.00 (in cents)
        type: 'product',
        product: catName,
      })

      const storedProducts = localStorage.getItem('u_products')
      const productsList = storedProducts ? JSON.parse(storedProducts) : []

      const newProduct = {
        id: productId,
        name: catName,
        description: 'A beautiful and loving cat, ready for a new home. Purr-fectly adorable! 🐱',
        price: '100',
        currency: 'usdc',
        image: '🐱',
        sales: 0,
        revenue: 0,
        paymentLink: paymentLink,
        createdAt: Date.now(),
        active: true,
        walletAddresses: wallets.filter((w) => w.success).map((w) => w.address),
      }

      productsList.push(newProduct)
      localStorage.setItem('u_products', JSON.stringify(productsList))

      setProduct({
        id: productId,
        paymentLink: paymentLink,
        success: true,
      })
    } catch (error) {
      setProduct({
        id: '',
        paymentLink: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create product',
      })
    }

    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🐱 Sell Your Cat for $100</CardTitle>
          <CardDescription>Generate crypto wallets across multiple chains and create a payment link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Inputs */}
          <div className="space-y-4">
            <div>
              <Label>Cat Name/Description</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g., Adorable Tabby Cat"
              />
            </div>
            <div>
              <Label>Wallet Name</Label>
              <Input
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="e.g., Cat Sale Wallet"
              />
            </div>
          </div>

          {/* Step 1: Generate Wallets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Step 1: Generate Wallets</h3>
                <p className="text-sm text-muted-foreground">Create wallets on {SUPPORTED_CHAINS.length} blockchains</p>
              </div>
              <Button
                onClick={generateWallets}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                {loading ? 'Generating...' : 'Generate Wallets'}
              </Button>
            </div>

            {wallets.length > 0 && (
              <div className="space-y-3">
                {wallets.map((wallet, idx) => (
                  <div key={idx} className="p-4 bg-muted rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant={wallet.success ? 'default' : 'destructive'}>{wallet.chain}</Badge>
                        {wallet.success ? (
                          <div className="mt-2 font-mono text-sm break-all text-green-600">✅ {wallet.address}</div>
                        ) : (
                          <div className="mt-2 text-sm text-destructive">❌ {wallet.error}</div>
                        )}
                      </div>
                      {wallet.success && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(wallet.address)}
                          className="ml-2"
                        >
                          📋 Copy
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Create Product */}
          {wallets.length > 0 && wallets.some((w) => w.success) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Step 2: Create Cat Product</h3>
                  <p className="text-sm text-muted-foreground">Create a $100 payment link</p>
                </div>
                <Button
                  onClick={createCatProduct}
                  disabled={loading}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </Button>
              </div>

              {product && (
                <div className="p-4 bg-muted rounded-lg border space-y-3">
                  {product.success ? (
                    <>
                      <div>
                        <h4 className="font-semibold text-green-600">✅ Product Created!</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Product ID: <code className="bg-background px-2 py-1 rounded">{product.id}</code>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Payment Link:</Label>
                        <div className="p-3 bg-background rounded border cursor-pointer hover:bg-background/80 transition-colors">
                          <code className="text-xs break-all text-primary">{product.paymentLink}</code>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(product.paymentLink)}
                          className="w-full"
                        >
                          📋 Copy Payment Link
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(product.paymentLink, '_blank')}
                          className="w-full"
                        >
                          🔗 Open Payment Link
                        </Button>
                      </div>

                      {/* QR Code */}
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-semibold">QR Code:</Label>
                        <div className="mt-3 flex justify-center p-4 bg-white rounded-lg">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(product.paymentLink)}`}
                            alt="Payment QR Code"
                            className="w-48 h-48"
                          />
                        </div>
                      </div>

                      {/* Share Info */}
                      <div className="pt-4 border-t space-y-2">
                        <h4 className="font-semibold">🎉 Your Cat is for Sale!</h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>✅ Wallets generated on {wallets.filter((w) => w.success).length} chains</li>
                          <li>✅ Product created: {catName}</li>
                          <li>✅ Price: $100 USD</li>
                          <li>✅ Buyers can pay with any supported cryptocurrency</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="text-destructive">❌ Error: {product.error}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {product?.success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-3">🐱 Your Cat Sale is Live!</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Payment Link:</strong>
                <br />
                <code className="bg-white px-2 py-1 rounded text-xs break-all">{product.paymentLink}</code>
              </p>
              <p>
                <strong>Supported Chains:</strong>{' '}
                {wallets
                  .filter((w) => w.success)
                  .map((w) => w.chain)
                  .join(', ')}
              </p>
              <p>
                <strong>Price:</strong> $100 USD
              </p>
              <p>
                <strong>Share via:</strong> Link, QR Code, or Direct Wallet Address
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
