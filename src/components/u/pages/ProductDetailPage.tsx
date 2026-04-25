/**
 * ProductDetailPage - View and Edit Product Details
 *
 * Features:
 * - View full product details
 * - Edit product inline
 * - Connect wallets to receive payments
 * - View payment link, QR code, share
 * - Sales and revenue stats
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import * as Vault from '../lib/vault/vault'

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
  createdAt: number
  active: boolean
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

const PAY_WORKER_URL = 'https://pay.one.ie'

// Generate payment link for pay.one.ie
const generatePaymentLink = (product: {
  id: string
  name: string
  price: string
  currency: string
  description?: string
  walletAddress?: string
  walletAddresses?: string[]
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

  return `${PAY_WORKER_URL}/pay?${params.toString()}`
}

interface ProductDetailPageProps {
  productId: string
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProduct, setEditedProduct] = useState<Product | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQR, setShowQR] = useState(true) // QR tab shown by default
  const [editWalletInput, setEditWalletInput] = useState('')

  useEffect(() => {
    // Load product
    const stored = localStorage.getItem('u_products')
    if (stored) {
      const products: Product[] = JSON.parse(stored)
      const found = products.find((p) => p.id === productId)
      if (found) {
        setProduct(found)
        setEditedProduct(found)
      }
    }

    void Vault.listWallets()
      .then((vws) =>
        setWallets(
          vws.map((w) => ({
            id: w.id,
            chain: w.chain,
            address: w.address,
            balance: w.balance,
            usdValue: w.usdValue,
            createdAt: w.createdAt,
            name: w.name,
          })),
        ),
      )
      .catch(() => {})
  }, [productId])

  const saveProduct = (updatedProduct: Product) => {
    const stored = localStorage.getItem('u_products')
    const products: Product[] = stored ? JSON.parse(stored) : []
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    localStorage.setItem('u_products', JSON.stringify(updated))
    setProduct(updatedProduct)
    setEditedProduct(updatedProduct)
  }

  const handleSave = () => {
    if (!editedProduct) return

    // Regenerate payment link with new details
    const paymentLink = generatePaymentLink({
      id: editedProduct.id,
      name: editedProduct.name,
      price: editedProduct.price,
      currency: editedProduct.currency,
      description: editedProduct.description,
      walletAddress: editedProduct.walletAddress,
      walletAddresses: editedProduct.walletAddresses,
    })

    const updatedProduct = { ...editedProduct, paymentLink }
    saveProduct(updatedProduct)
    setIsEditing(false)
    setEditWalletInput('')
  }

  const handleDelete = () => {
    const stored = localStorage.getItem('u_products')
    const products: Product[] = stored ? JSON.parse(stored) : []
    const updated = products.filter((p) => p.id !== productId)
    localStorage.setItem('u_products', JSON.stringify(updated))
    // Navigate back to products
    window.location.href = '/u/products'
  }

  const toggleActive = () => {
    if (!product) return
    const updatedProduct = { ...product, active: !product.active }
    saveProduct(updatedProduct)
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

  const openPaymentLink = () => {
    if (product?.paymentLink) {
      window.open(product.paymentLink, '_blank')
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">Product Not Found</h3>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={() => (window.location.href = '/u/products')}>Back to Products</Button>
          </Card>
        </div>
      </div>
    )
  }

  const currency = CURRENCIES.find((c) => c.id === product.currency)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(product.paymentLink)}`

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => (window.location.href = '/u/products')}>
          ← Back to Products
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl shadow-lg">
              🛍️
            </div>
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={product.active ? 'default' : 'secondary'}>
                  {product.active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-muted-foreground">
                  Created {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Label htmlFor="active-toggle" className="text-sm">
                Active
              </Label>
              <Switch id="active-toggle" checked={product.active} onCheckedChange={toggleActive} />
            </div>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedProduct(product)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  🗑️ Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
                <CardDescription>
                  {isEditing ? 'Edit your product information' : 'View product information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && editedProduct ? (
                  <>
                    <div>
                      <Label>Product Name</Label>
                      <Input
                        value={editedProduct.name}
                        onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editedProduct.description}
                        onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={editedProduct.price}
                          onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={editedProduct.currency}
                          onValueChange={(v) => setEditedProduct({ ...editedProduct, currency: v })}
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
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground text-sm">Description</Label>
                      <p className="mt-1">{product.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <span className="text-3xl font-bold">{product.price}</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {currency?.icon} {product.currency.toUpperCase()}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Wallet Connection */}
            <Card>
              <CardHeader>
                <CardTitle>💰 Payment Wallets</CardTitle>
                <CardDescription>
                  Add wallets to receive payments - customers can choose which to pay to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing && editedProduct ? (
                  <div className="space-y-4">
                    {/* List of added wallets */}
                    {(editedProduct.walletAddresses?.length || 0) > 0 && (
                      <div className="space-y-2">
                        <Label>Added Wallets</Label>
                        {editedProduct.walletAddresses?.map((addr, idx) => {
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
                                  const updated = editedProduct.walletAddresses?.filter((_, i) => i !== idx) || []
                                  setEditedProduct({
                                    ...editedProduct,
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

                    {/* Legacy single wallet display */}
                    {(!editedProduct.walletAddresses || editedProduct.walletAddresses.length === 0) &&
                      editedProduct.walletAddress && (
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Legacy wallet:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 font-mono text-sm truncate">
                              {editedProduct.walletAddress.slice(0, 12)}...{editedProduct.walletAddress.slice(-8)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditedProduct({
                                  ...editedProduct,
                                  walletAddresses: [editedProduct.walletAddress!],
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
                      <div>
                        <Label>Add from Saved Wallets</Label>
                        <Select
                          value="_add"
                          onValueChange={(v) => {
                            if (v !== '_add' && !editedProduct.walletAddresses?.includes(v)) {
                              const updated = [...(editedProduct.walletAddresses || []), v]
                              setEditedProduct({
                                ...editedProduct,
                                walletAddresses: updated,
                                walletAddress: updated[0],
                              })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="➕ Add wallet..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_add" disabled>
                              ➕ Add wallet...
                            </SelectItem>
                            {wallets
                              .filter((w) => !editedProduct.walletAddresses?.includes(w.address))
                              .map((w) => (
                                <SelectItem key={w.id} value={w.address}>
                                  {w.name || w.chain} ({w.address.slice(0, 6)}...{w.address.slice(-4)})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Manual wallet input */}
                    <div>
                      <Label>Or Enter Manually</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="0x... or SOL... or SUI..."
                          value={editWalletInput}
                          onChange={(e) => setEditWalletInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter' &&
                              editWalletInput &&
                              !editedProduct.walletAddresses?.includes(editWalletInput)
                            ) {
                              const updated = [...(editedProduct.walletAddresses || []), editWalletInput]
                              setEditedProduct({
                                ...editedProduct,
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
                          disabled={!editWalletInput || editedProduct.walletAddresses?.includes(editWalletInput)}
                          onClick={() => {
                            if (editWalletInput && !editedProduct.walletAddresses?.includes(editWalletInput)) {
                              const updated = [...(editedProduct.walletAddresses || []), editWalletInput]
                              setEditedProduct({
                                ...editedProduct,
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
                    </div>

                    {(!editedProduct.walletAddresses || editedProduct.walletAddresses.length === 0) &&
                      !editedProduct.walletAddress && (
                        <p className="text-xs text-amber-500">⚠️ No wallet set - payments won't have a destination</p>
                      )}
                    {(editedProduct.walletAddresses?.length || 0) > 1 && (
                      <p className="text-xs text-green-600">
                        ✅ Customers will choose from {editedProduct.walletAddresses?.length} payment options
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {(product.walletAddresses?.length || 0) > 0 || product.walletAddress ? (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">
                          {(product.walletAddresses?.length || 1) > 1
                            ? `Customers can pay to ${product.walletAddresses?.length} wallets:`
                            : 'Payments go to:'}
                        </p>
                        {(product.walletAddresses?.length || 0) > 0 ? (
                          <div className="space-y-1">
                            {product.walletAddresses?.map((addr, idx) => (
                              <code key={idx} className="block font-mono text-sm break-all">
                                {addr}
                              </code>
                            ))}
                          </div>
                        ) : (
                          <code className="font-mono text-sm break-all">{product.walletAddress}</code>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No wallet connected. Click Edit to add one.</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Link */}
            <Card>
              <CardHeader>
                <CardTitle>🔗 Payment Link</CardTitle>
                <CardDescription>Share this link to accept payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!product.walletAddress && (!product.walletAddresses || product.walletAddresses.length === 0) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      ⚠️ No receiving wallet set! Click <strong>Edit</strong> above to add one.
                    </p>
                  </div>
                )}
                {(product.walletAddresses?.length || 0) > 1 && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ Customers will be able to choose from {product.walletAddresses?.length} payment wallets
                    </p>
                  </div>
                )}
                <div
                  className="p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={openPaymentLink}
                >
                  <code className="text-sm break-all text-primary hover:underline">{product.paymentLink}</code>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => copyToClipboard(product.paymentLink)}>
                    {copiedLink ? '✓ Copied!' : '📋 Copy Link'}
                  </Button>
                  <Button variant="outline" onClick={openPaymentLink}>
                    🔗 Open Link
                  </Button>
                  <Button variant="outline" onClick={() => setShowQR(!showQR)}>
                    {showQR ? 'Hide QR' : '📱 Show QR'}
                  </Button>
                </div>

                {showQR && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                )}

                <div className="pt-4 border-t">
                  <ShareButtons
                    title={`Pay for ${product.name} - ${product.price} ${product.currency.toUpperCase()}`}
                    url={product.paymentLink}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Total Sales</span>
                  <span className="text-2xl font-bold">{product.sales}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="text-2xl font-bold">${product.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Link Clicks</span>
                  <span className="text-2xl font-bold">—</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>⚡ Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => copyToClipboard(product.paymentLink)}
                >
                  📋 Copy Payment Link
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={openPaymentLink}>
                  🔗 Open Payment Page
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setShowQR(true)}>
                  📱 Generate QR Code
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    // Duplicate product
                    const stored = localStorage.getItem('u_products')
                    const products: Product[] = stored ? JSON.parse(stored) : []
                    const newId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
                    const duplicated: Product = {
                      ...product,
                      id: newId,
                      name: `${product.name} (Copy)`,
                      sales: 0,
                      revenue: 0,
                      createdAt: Date.now(),
                      paymentLink: generatePaymentLink({
                        id: newId,
                        name: `${product.name} (Copy)`,
                        price: product.price,
                        currency: product.currency,
                        description: product.description,
                        walletAddress: product.walletAddress,
                        walletAddresses: product.walletAddresses,
                      }),
                    }
                    localStorage.setItem('u_products', JSON.stringify([...products, duplicated]))
                    window.location.href = `/u/product/${newId}`
                  }}
                >
                  📄 Duplicate Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
