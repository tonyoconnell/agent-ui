/**
 * ProductsPage - Sell Products with Crypto
 *
 * Features:
 * - List products for sale
 * - Accept crypto payments
 * - Generate payment links to pay.one.ie Cloudflare worker
 * - Track sales and revenue
 * - QR code generation for payment links
 * - Share functionality
 * - Wallet connection for receiving payments
 */

import { useEffect, useState } from 'react'
import { ShareButtons } from '@/components/ShareButtons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { UNav } from '../UNav'

interface Product {
  id: string
  name: string
  description: string
  price: string
  currency: string
  image?: string
  sales: number
  revenue: number
  paymentLink: string
  paymentLinkManual?: string // Manual verification link (escrow=false)
  createdAt: number
  active: boolean
  autoDetect: boolean // Whether to enable escrow auto-detection (default true)
  walletAddress?: string // Legacy single wallet
  walletAddresses?: string[] // Multiple wallets for customer choice
}

interface Wallet {
  id: string
  chain: string
  address: string
  balance: string
  usdValue: number
  createdAt: number
  name?: string
  privateKey?: string
}

const CURRENCIES = [
  { id: 'usdc', name: 'USDC', icon: '💵', color: 'from-green-500 to-emerald-600' },
  { id: 'eth', name: 'ETH', icon: '⟠', color: 'from-blue-500 to-indigo-600' },
  { id: 'btc', name: 'BTC', icon: '₿', color: 'from-orange-500 to-amber-600' },
  { id: 'sol', name: 'SOL', icon: '◎', color: 'from-purple-500 to-violet-600' },
  { id: 'sui', name: 'SUI', icon: '💧', color: 'from-cyan-500 to-blue-600' },
  { id: 'one', name: 'ONE', icon: '①', color: 'from-pink-500 to-rose-600' },
]

// pay.one.ie Cloudflare Worker base URL
const PAY_WORKER_URL = 'https://pay.one.ie'

// Generate a unique product ID
const generateProductId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

// Generate payment link for pay.one.ie Cloudflare worker
const generatePaymentLink = (product: {
  id: string
  name: string
  price: string
  currency: string
  description?: string
  walletAddress?: string
  walletAddresses?: string[]
  autoDetect?: boolean
}) => {
  const params = new URLSearchParams({
    type: 'product', // Mark as product sale (not token sale)
    product: product.id,
    amount: product.price,
    currency: product.currency,
    name: product.name,
  })

  if (product.description) {
    params.set('description', product.description)
  }

  // Get all wallets - prefer walletAddresses array, fallback to single walletAddress
  const allWallets = product.walletAddresses?.length
    ? product.walletAddresses
    : product.walletAddress
      ? [product.walletAddress]
      : []

  // Always set 'to' with the first/primary wallet (required by worker)
  if (allWallets.length > 0) {
    params.set('to', allWallets[0])
  }

  // Always pass ALL wallets to pay.one.ie so merchant can accept multiple currencies
  // Wallets are comma-separated so the payment worker can distribute/select
  if (allWallets.length > 0) {
    params.set('wallets', allWallets.join(','))
  }

  // Add escrow parameter (defaults to true for auto-detection unless explicitly disabled)
  if (product.autoDetect === false) {
    params.set('escrow', 'false')
  }

  return `${PAY_WORKER_URL}/pay?${params.toString()}`
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState<Product | null>(null)
  const [showEditDialog, setShowEditDialog] = useState<Product | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<Product | null>(null)
  const [showStatsDialog, setShowStatsDialog] = useState<Product | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'usdc',
    walletAddress: '',
    walletAddresses: [] as string[],
    autoDetect: true, // Default to auto-detection enabled
  })
  const [quickWalletAddress, setQuickWalletAddress] = useState('')
  const [newWalletInput, setNewWalletInput] = useState('')
  const [editWalletInput, setEditWalletInput] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('u_products')
    if (stored) {
      const loadedProducts = JSON.parse(stored) as Product[]
      // Ensure all products have autoDetect field (default to true for legacy products)
      const productsWithDefaults = loadedProducts.map((p) => ({
        ...p,
        autoDetect: p.autoDetect !== undefined ? p.autoDetect : true,
      }))
      setProducts(productsWithDefaults)
    }

    const storedWallets = localStorage.getItem('u_wallets')
    if (storedWallets) setWallets(JSON.parse(storedWallets))
  }, [])

  // Save products to localStorage
  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
    localStorage.setItem('u_products', JSON.stringify(updatedProducts))
  }

  const createProduct = () => {
    const productId = generateProductId()

    // Combine legacy walletAddress into walletAddresses if present
    const finalWalletAddresses =
      newProduct.walletAddresses.length > 0
        ? newProduct.walletAddresses
        : newProduct.walletAddress
          ? [newProduct.walletAddress]
          : []

    // Generate auto-detect link (default)
    const paymentLink = generatePaymentLink({
      id: productId,
      name: newProduct.name,
      price: newProduct.price,
      currency: newProduct.currency,
      description: newProduct.description,
      walletAddresses: finalWalletAddresses,
      autoDetect: newProduct.autoDetect,
    })

    // Generate manual verification link (escrow=false)
    const paymentLinkManual = generatePaymentLink({
      id: productId,
      name: newProduct.name,
      price: newProduct.price,
      currency: newProduct.currency,
      description: newProduct.description,
      walletAddresses: finalWalletAddresses,
      autoDetect: false,
    })

    const product: Product = {
      id: productId,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      currency: newProduct.currency,
      walletAddress: finalWalletAddresses[0] || '',
      walletAddresses: finalWalletAddresses,
      sales: 0,
      revenue: 0,
      paymentLink,
      paymentLinkManual,
      createdAt: Date.now(),
      active: true,
      autoDetect: newProduct.autoDetect,
    }

    saveProducts([...products, product])

    // Write product as discoverable capability to substrate (fire-and-forget)
    const _sellerId = wallets?.[0]?.id || 'unknown'
    fetch('/api/agents/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markdown: `---\nname: ${product.name}\nskills:\n  - name: ${product.id}\n    price: ${parseFloat(product.price) || 0}\n    tags: [product, commerce]\n---\n${product.description}`,
      }),
    }).catch(() => null)

    setShowCreateDialog(false)
    setNewProduct({
      name: '',
      description: '',
      price: '',
      currency: 'usdc',
      walletAddress: '',
      walletAddresses: [],
      autoDetect: true,
    })
    setNewWalletInput('')

    // Show the payment link dialog
    setShowPaymentLinkDialog(product)
  }

  const updateProduct = () => {
    if (!showEditDialog) return

    // Generate both auto-detect and manual verification links
    const paymentLink = generatePaymentLink({
      id: showEditDialog.id,
      name: showEditDialog.name,
      price: showEditDialog.price,
      currency: showEditDialog.currency,
      description: showEditDialog.description,
      walletAddresses: showEditDialog.walletAddresses,
      walletAddress: showEditDialog.walletAddress,
      autoDetect: showEditDialog.autoDetect,
    })

    const paymentLinkManual = generatePaymentLink({
      id: showEditDialog.id,
      name: showEditDialog.name,
      price: showEditDialog.price,
      currency: showEditDialog.currency,
      description: showEditDialog.description,
      walletAddresses: showEditDialog.walletAddresses,
      walletAddress: showEditDialog.walletAddress,
      autoDetect: false,
    })

    const updated = products.map((p) =>
      p.id === showEditDialog.id ? { ...showEditDialog, paymentLink, paymentLinkManual } : p,
    )
    saveProducts(updated)
    setShowEditDialog(null)
  }

  const deleteProduct = () => {
    if (!showDeleteDialog) return
    const updated = products.filter((p) => p.id !== showDeleteDialog.id)
    saveProducts(updated)
    setShowDeleteDialog(null)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openPaymentLink = (url: string) => {
    window.open(url, '_blank')
  }

  const navigateToProduct = (productId: string) => {
    window.location.href = `/u/product/${productId}`
  }

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalSales = products.reduce((s, p) => s + p.sales, 0)

  return (
    <div className="min-h-screen bg-background">
      <UNav active="products" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>🛍️</span> Products
            </h1>
            <p className="text-muted-foreground mt-1">Sell products and accept crypto payments</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <span className="mr-2">+</span>
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{products.filter((p) => p.active).length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{totalSales}</div>
              <div className="text-sm text-muted-foreground">Total Sales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-2xl font-semibold mb-2">Start Selling</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              List your first product and start accepting crypto payments. Get a payment link instantly.
            </p>
            <Button size="lg" onClick={() => setShowCreateDialog(true)}>
              <span className="mr-2">+</span>
              Add Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const currency = CURRENCIES.find((c) => c.id === product.currency)
              return (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigateToProduct(product.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xl shadow-lg">
                          🛍️
                        </div>
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <Badge variant={product.active ? 'default' : 'secondary'}>
                            {product.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description || 'No description'}
                    </p>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-4">
                      <span className="text-2xl font-bold">{product.price}</span>
                      <Badge variant="outline" className="text-lg">
                        {currency?.icon} {product.currency.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <div className="text-muted-foreground">Sales</div>
                        <div className="font-semibold">{product.sales}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-semibold">${product.revenue}</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowPaymentLinkDialog(product)
                        }}
                      >
                        🔗 Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowEditDialog(product)
                        }}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowStatsDialog(product)
                        }}
                      >
                        📊 Stats
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>🛍️</span> Add New Product
            </DialogTitle>
            <DialogDescription>Create a product and get a payment link instantly</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Product Name</Label>
              <Input
                placeholder="My Awesome Product"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your product..."
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  placeholder="99.00"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={newProduct.currency}
                  onValueChange={(v) => setNewProduct({ ...newProduct, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="auto-detect">Auto-Detect Payments</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically check for transactions (no tx hash needed)
                </p>
              </div>
              <Switch
                id="auto-detect"
                checked={newProduct.autoDetect}
                onCheckedChange={(checked) => setNewProduct({ ...newProduct, autoDetect: checked })}
              />
            </div>

            <div>
              <Label>Receiving Wallets</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add multiple wallets - customers can choose which to pay to
              </p>

              {/* List of added wallets */}
              {newProduct.walletAddresses.length > 0 && (
                <div className="space-y-2 mb-3">
                  {newProduct.walletAddresses.map((addr, idx) => {
                    const matchingWallet = wallets.find((w) => w.address === addr)
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <div className="flex-1 font-mono text-sm truncate">
                          {matchingWallet ? (
                            <span>
                              {matchingWallet.name || matchingWallet.chain}: {addr.slice(0, 8)}...{addr.slice(-6)}
                            </span>
                          ) : (
                            <span>
                              {addr.slice(0, 12)}...{addr.slice(-8)}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            const updated = newProduct.walletAddresses.filter((_, i) => i !== idx)
                            setNewProduct({ ...newProduct, walletAddresses: updated })
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Quick add from saved wallets */}
              {wallets.length > 0 && (
                <Select
                  value="_add"
                  onValueChange={(v) => {
                    if (v !== '_add' && !newProduct.walletAddresses.includes(v)) {
                      setNewProduct({
                        ...newProduct,
                        walletAddresses: [...newProduct.walletAddresses, v],
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="➕ Add from saved wallets..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_add" disabled>
                      ➕ Add from saved wallets...
                    </SelectItem>
                    {wallets
                      .filter((w) => w.address && !newProduct.walletAddresses.includes(w.address))
                      .map((w) => (
                        <SelectItem key={w.id} value={w.address}>
                          {w.name || w.chain} (
                          {w.address ? `${w.address.slice(0, 6)}...${w.address.slice(-4)}` : 'No address'})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              {/* Manual wallet input */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Or paste wallet address manually..."
                  value={newWalletInput}
                  onChange={(e) => setNewWalletInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newWalletInput && !newProduct.walletAddresses.includes(newWalletInput)) {
                      setNewProduct({
                        ...newProduct,
                        walletAddresses: [...newProduct.walletAddresses, newWalletInput],
                      })
                      setNewWalletInput('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!newWalletInput || newProduct.walletAddresses.includes(newWalletInput)}
                  onClick={() => {
                    if (newWalletInput && !newProduct.walletAddresses.includes(newWalletInput)) {
                      setNewProduct({
                        ...newProduct,
                        walletAddresses: [...newProduct.walletAddresses, newWalletInput],
                      })
                      setNewWalletInput('')
                    }
                  }}
                >
                  Add
                </Button>
              </div>

              {newProduct.walletAddresses.length === 0 && (
                <p className="text-xs text-amber-500 mt-2">⚠️ Add at least one wallet to receive payments</p>
              )}
              {newProduct.walletAddresses.length > 1 && (
                <p className="text-xs text-green-600 mt-2">
                  ✅ Customers will choose from {newProduct.walletAddresses.length} payment options
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createProduct} disabled={!newProduct.name || !newProduct.price}>
              Create & Get Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Link Dialog */}
      <Dialog
        open={!!showPaymentLinkDialog}
        onOpenChange={() => {
          setShowPaymentLinkDialog(null)
          setShowQR(false)
          setCopiedLink(false)
          setQuickWalletAddress('')
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>🔗</span> Payment Link
            </DialogTitle>
            <DialogDescription>Share this link to accept payments for {showPaymentLinkDialog?.name}</DialogDescription>
          </DialogHeader>

          {showPaymentLinkDialog && (
            <div className="py-4 space-y-4">
              {/* Warning if no wallet */}
              {!showPaymentLinkDialog.walletAddress &&
                (!showPaymentLinkDialog.walletAddresses || showPaymentLinkDialog.walletAddresses.length === 0) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                      ⚠️ No receiving wallet set
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter wallet address..."
                        value={quickWalletAddress}
                        onChange={(e) => setQuickWalletAddress(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        disabled={!quickWalletAddress}
                        onClick={() => {
                          // Update product with wallet address and regenerate both links
                          const paymentLink = generatePaymentLink({
                            id: showPaymentLinkDialog.id,
                            name: showPaymentLinkDialog.name,
                            price: showPaymentLinkDialog.price,
                            currency: showPaymentLinkDialog.currency,
                            description: showPaymentLinkDialog.description,
                            walletAddresses: [quickWalletAddress],
                            autoDetect: showPaymentLinkDialog.autoDetect,
                          })
                          const paymentLinkManual = generatePaymentLink({
                            id: showPaymentLinkDialog.id,
                            name: showPaymentLinkDialog.name,
                            price: showPaymentLinkDialog.price,
                            currency: showPaymentLinkDialog.currency,
                            description: showPaymentLinkDialog.description,
                            walletAddresses: [quickWalletAddress],
                            autoDetect: false,
                          })
                          const updatedProduct = {
                            ...showPaymentLinkDialog,
                            walletAddress: quickWalletAddress,
                            walletAddresses: [quickWalletAddress],
                            paymentLink,
                            paymentLinkManual,
                          }
                          const updated = products.map((p) => (p.id === showPaymentLinkDialog.id ? updatedProduct : p))
                          saveProducts(updated)
                          setShowPaymentLinkDialog(updatedProduct)
                          setQuickWalletAddress('')
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}

              {/* Show wallet addresses */}
              {((showPaymentLinkDialog.walletAddresses?.length || 0) > 0 || showPaymentLinkDialog.walletAddress) && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    {(showPaymentLinkDialog.walletAddresses?.length || 1) > 1
                      ? `Customers can pay to ${showPaymentLinkDialog.walletAddresses?.length} wallets:`
                      : 'Payments go to:'}
                  </p>
                  {(showPaymentLinkDialog.walletAddresses?.length || 0) > 0 ? (
                    <div className="space-y-1">
                      {showPaymentLinkDialog.walletAddresses?.map((addr, idx) => (
                        <code key={idx} className="block text-sm font-mono">
                          {addr.slice(0, 10)}...{addr.slice(-8)}
                        </code>
                      ))}
                    </div>
                  ) : (
                    <code className="text-sm font-mono">
                      {showPaymentLinkDialog.walletAddress?.slice(0, 10)}...
                      {showPaymentLinkDialog.walletAddress?.slice(-8)}
                    </code>
                  )}
                </div>
              )}

              {/* Payment Link Options */}
              <div className="space-y-3">
                {/* Auto-Detect Link (Default) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={showPaymentLinkDialog.autoDetect ? 'default' : 'outline'}>
                      {showPaymentLinkDialog.autoDetect ? '✓ ' : ''}Auto-Detect
                    </Badge>
                    <span className="text-xs text-muted-foreground">Automatically checks for payment</span>
                  </div>
                  <div
                    className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => openPaymentLink(showPaymentLinkDialog.paymentLink)}
                  >
                    <code className="text-xs break-all text-primary hover:underline">
                      {showPaymentLinkDialog.paymentLink}
                    </code>
                  </div>
                </div>

                {/* Manual Verification Link */}
                {showPaymentLinkDialog.paymentLinkManual && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Manual Verify</Badge>
                      <span className="text-xs text-muted-foreground">Requires transaction hash input</span>
                    </div>
                    <div
                      className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => showPaymentLinkDialog.paymentLinkManual && openPaymentLink(showPaymentLinkDialog.paymentLinkManual)}
                    >
                      <code className="text-xs break-all text-muted-foreground hover:text-primary">
                        {showPaymentLinkDialog.paymentLinkManual}
                      </code>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={() => copyToClipboard(showPaymentLinkDialog.paymentLink)}>
                  {copiedLink ? '✓ Copied!' : '📋 Copy Link'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openPaymentLink(showPaymentLinkDialog.paymentLink)}
                >
                  🔗 Open
                </Button>
                <Button variant="outline" onClick={() => setShowQR(!showQR)}>
                  📱 {showQR ? 'Hide' : 'QR'}
                </Button>
              </div>

              {/* QR Code */}
              {showQR && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(showPaymentLinkDialog.paymentLink)}`}
                    alt="Payment QR Code"
                    className="w-48 h-48"
                  />
                </div>
              )}

              {/* Share Buttons */}
              <div className="pt-4 border-t">
                <ShareButtons
                  title={`Pay for ${showPaymentLinkDialog.name} - ${showPaymentLinkDialog.price} ${showPaymentLinkDialog.currency.toUpperCase()}`}
                  url={showPaymentLinkDialog.paymentLink}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!showEditDialog} onOpenChange={() => setShowEditDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>✏️</span> Edit Product
            </DialogTitle>
            <DialogDescription>Update your product details</DialogDescription>
          </DialogHeader>

          {showEditDialog && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={showEditDialog.name}
                  onChange={(e) => setShowEditDialog({ ...showEditDialog, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={showEditDialog.description}
                  onChange={(e) => setShowEditDialog({ ...showEditDialog, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={showEditDialog.price}
                    onChange={(e) => setShowEditDialog({ ...showEditDialog, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={showEditDialog.currency}
                    onValueChange={(v) => setShowEditDialog({ ...showEditDialog, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="edit-auto-detect">Auto-Detect Payments</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically check for transactions (no tx hash needed)
                  </p>
                </div>
                <Switch
                  id="edit-auto-detect"
                  checked={showEditDialog.autoDetect}
                  onCheckedChange={(checked) => setShowEditDialog({ ...showEditDialog, autoDetect: checked })}
                />
              </div>

              <div>
                <Label>Receiving Wallets</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Add multiple wallets - customers can choose which to pay to
                </p>

                {/* List of added wallets */}
                {(showEditDialog.walletAddresses?.length || 0) > 0 && (
                  <div className="space-y-2 mb-3">
                    {showEditDialog.walletAddresses?.map((addr, idx) => {
                      const matchingWallet = wallets.find((w) => w.address === addr)
                      return (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <div className="flex-1 font-mono text-sm truncate">
                            {matchingWallet ? (
                              <span>
                                {matchingWallet.name || matchingWallet.chain}: {addr.slice(0, 8)}...{addr.slice(-6)}
                              </span>
                            ) : (
                              <span>
                                {addr.slice(0, 12)}...{addr.slice(-8)}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              const updated = showEditDialog.walletAddresses?.filter((_, i) => i !== idx) || []
                              setShowEditDialog({
                                ...showEditDialog,
                                walletAddresses: updated,
                                walletAddress: updated[0] || '',
                              })
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Legacy: show single wallet if no walletAddresses */}
                {(!showEditDialog.walletAddresses || showEditDialog.walletAddresses.length === 0) &&
                  showEditDialog.walletAddress && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <div className="flex-1 font-mono text-sm truncate">
                          {showEditDialog.walletAddress.slice(0, 12)}...{showEditDialog.walletAddress.slice(-8)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Convert legacy to array
                            setShowEditDialog({
                              ...showEditDialog,
                              walletAddresses: [showEditDialog.walletAddress!],
                            })
                          }}
                        >
                          Convert
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Quick add from saved wallets */}
                {wallets.length > 0 && (
                  <Select
                    value="_add"
                    onValueChange={(v) => {
                      if (v !== '_add' && !showEditDialog.walletAddresses?.includes(v)) {
                        const updated = [...(showEditDialog.walletAddresses || []), v]
                        setShowEditDialog({
                          ...showEditDialog,
                          walletAddresses: updated,
                          walletAddress: updated[0],
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="➕ Add from saved wallets..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_add" disabled>
                        ➕ Add from saved wallets...
                      </SelectItem>
                      {wallets
                        .filter((w) => w.address && !showEditDialog.walletAddresses?.includes(w.address))
                        .map((w) => (
                          <SelectItem key={w.id} value={w.address}>
                            {w.name || w.chain} (
                            {w.address ? `${w.address.slice(0, 6)}...${w.address.slice(-4)}` : 'No address'})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Manual wallet input */}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Or paste wallet address manually..."
                    value={editWalletInput}
                    onChange={(e) => setEditWalletInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        editWalletInput &&
                        !showEditDialog.walletAddresses?.includes(editWalletInput)
                      ) {
                        const updated = [...(showEditDialog.walletAddresses || []), editWalletInput]
                        setShowEditDialog({
                          ...showEditDialog,
                          walletAddresses: updated,
                          walletAddress: updated[0],
                        })
                        setEditWalletInput('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!editWalletInput || showEditDialog.walletAddresses?.includes(editWalletInput)}
                    onClick={() => {
                      if (editWalletInput && !showEditDialog.walletAddresses?.includes(editWalletInput)) {
                        const updated = [...(showEditDialog.walletAddresses || []), editWalletInput]
                        setShowEditDialog({
                          ...showEditDialog,
                          walletAddresses: updated,
                          walletAddress: updated[0],
                        })
                        setEditWalletInput('')
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>

                {(!showEditDialog.walletAddresses || showEditDialog.walletAddresses.length === 0) &&
                  !showEditDialog.walletAddress && (
                    <p className="text-xs text-amber-500 mt-2">⚠️ No wallet set - payments won't have a destination</p>
                  )}
                {(showEditDialog.walletAddresses?.length || 0) > 1 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✅ Customers will choose from {showEditDialog.walletAddresses?.length} payment options
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-active"
                    checked={showEditDialog.active}
                    onCheckedChange={(checked) => setShowEditDialog({ ...showEditDialog, active: checked })}
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setShowDeleteDialog(showEditDialog)
                    setShowEditDialog(null)
                  }}
                >
                  🗑️ Delete
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(null)}>
              Cancel
            </Button>
            <Button onClick={updateProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!showStatsDialog} onOpenChange={() => setShowStatsDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>📊</span> Product Statistics
            </DialogTitle>
            <DialogDescription>{showStatsDialog?.name}</DialogDescription>
          </DialogHeader>

          {showStatsDialog && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">{showStatsDialog.sales}</div>
                    <div className="text-sm text-muted-foreground">Total Sales</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold">${showStatsDialog.revenue}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Created</div>
                <div className="font-medium">
                  {new Date(showStatsDialog.createdAt).toLocaleDateString()} at{' '}
                  {new Date(showStatsDialog.createdAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Price</div>
                <div className="font-medium text-lg">
                  {showStatsDialog.price} {showStatsDialog.currency.toUpperCase()}
                </div>
              </div>

              {showStatsDialog.walletAddress && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Receiving Wallet</div>
                  <code className="font-mono text-xs break-all">{showStatsDialog.walletAddress}</code>
                </div>
              )}

              <Button className="w-full" onClick={() => navigateToProduct(showStatsDialog.id)}>
                View Full Details
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{showDeleteDialog?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProduct} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
