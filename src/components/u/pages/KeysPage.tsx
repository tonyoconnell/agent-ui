/**
 * KeysPage - Secure Key Management
 *
 * Features:
 * - Store recovery phrases (mnemonics)
 * - Store private keys
 * - View and copy keys securely
 * - Security best practices
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { UNav } from '../UNav'

interface StoredKey {
  id: string
  name: string
  type: 'mnemonic' | 'private_key'
  value: string
  createdAt: number
  chain?: string
  walletId?: string
}

export function KeysPage() {
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([])
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyType, setNewKeyType] = useState<'mnemonic' | 'private_key'>('mnemonic')
  const [selectedKey, setSelectedKey] = useState<StoredKey | null>(null)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [showDeleteKeyDialog, setShowDeleteKeyDialog] = useState(false)
  const [keyRevealed, setKeyRevealed] = useState(false)

  useEffect(() => {
    const storedKeysData = localStorage.getItem('u_keys')
    if (storedKeysData) {
      setStoredKeys(JSON.parse(storedKeysData))
    }
  }, [])

  const addKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return
    const newKey: StoredKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      type: newKeyType,
      value: newKeyValue.trim(),
      createdAt: Date.now(),
    }
    const updated = [...storedKeys, newKey]
    setStoredKeys(updated)
    localStorage.setItem('u_keys', JSON.stringify(updated))
    setShowAddKeyDialog(false)
    setNewKeyName('')
    setNewKeyValue('')
    setNewKeyType('mnemonic')
  }

  const deleteKey = (keyId: string) => {
    const updated = storedKeys.filter((k) => k.id !== keyId)
    setStoredKeys(updated)
    localStorage.setItem('u_keys', JSON.stringify(updated))
    setShowDeleteKeyDialog(false)
    setSelectedKey(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <UNav active="keys" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>🔑</span> Keys
            </h1>
            <p className="text-muted-foreground mt-1">Store and manage your recovery phrases and private keys</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Stored Keys</div>
            <div className="text-3xl font-bold">{storedKeys.length}</div>
          </div>
        </div>

        {/* Keys Introduction Card */}
        <Card className="overflow-hidden border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 shrink-0">
                🔐
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Your Secret Keys</h2>
                <p className="text-muted-foreground mb-4">
                  Store and manage your recovery phrases and private keys securely. These keys give complete access to
                  your crypto — keep them safe!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Write them down on paper</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Store in a safe place</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Never share with anyone</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Don't screenshot or email</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Never enter on websites</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Don't store in cloud</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Key Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => setShowAddKeyDialog(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
          >
            <span className="mr-2">+</span> Add Key
          </Button>
        </div>

        {/* Keys List */}
        {storedKeys.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="text-6xl mb-4">🔑</div>
            <h3 className="text-xl font-semibold mb-2">No Keys Stored</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your recovery phrases or private keys here for safekeeping. Keys are also automatically saved when you
              generate new wallets.
            </p>
            <Button
              onClick={() => setShowAddKeyDialog(true)}
              variant="outline"
              className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
            >
              <span className="mr-2">🔑</span> Store Your First Key
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storedKeys.map((key) => (
              <Card
                key={key.id}
                className="group relative overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1"
                onClick={() => {
                  setSelectedKey(key)
                  setKeyRevealed(false)
                  setShowKeyDialog(true)
                }}
              >
                {/* Beautiful gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-yellow-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-bl-full" />

                <CardContent className="relative pt-6 pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl ${key.type === 'mnemonic' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-violet-400 to-purple-500'} flex items-center justify-center text-2xl shadow-lg`}
                      >
                        {key.type === 'mnemonic' ? '📜' : '🔐'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{key.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${key.type === 'mnemonic' ? 'border-amber-500/50 text-amber-600' : 'border-violet-500/50 text-violet-600'}`}
                          >
                            {key.type === 'mnemonic' ? '🌱 Recovery Phrase' : '🔑 Private Key'}
                          </Badge>
                          {key.walletId && (
                            <Badge variant="secondary" className="text-xs">
                              Auto-saved
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedKey(key)
                        setShowDeleteKeyDialog(true)
                      }}
                      title="Delete Key"
                    >
                      🗑️
                    </Button>
                  </div>

                  {/* Masked preview */}
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-lg mb-4 font-mono text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>🔒</span>
                      <span className="tracking-widest">••••••••••••••••••••••••</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Added {new Date(key.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1">
                      <span>👆</span> Click to view
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Security Tips */}
        <Card className="mt-8 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span>🛡️</span> Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Physical Backup</h4>
                    <p className="text-sm text-muted-foreground">
                      Write your recovery phrase on paper and store it in a fireproof safe or safety deposit box.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Multiple Copies</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider keeping copies in different secure locations in case of disasters.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Verify Recovery</h4>
                    <p className="text-sm text-muted-foreground">
                      Test that you can recover your wallet with the backup phrase before storing significant funds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">Hardware Wallet</h4>
                    <p className="text-sm text-muted-foreground">
                      For large amounts, consider using a hardware wallet like Ledger or Trezor for extra security.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Key Dialog */}
      <Dialog
        open={showAddKeyDialog}
        onOpenChange={(open) => {
          setShowAddKeyDialog(open)
          if (!open) {
            setNewKeyName('')
            setNewKeyValue('')
            setNewKeyType('mnemonic')
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>🔑</span> Add New Key
            </DialogTitle>
            <DialogDescription>Store a recovery phrase or private key securely</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Key Name</label>
              <Input
                placeholder="e.g., Main Wallet, Hardware Backup"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Key Type</label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={newKeyType === 'mnemonic' ? 'default' : 'outline'}
                  className={newKeyType === 'mnemonic' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  onClick={() => setNewKeyType('mnemonic')}
                >
                  <span className="mr-2">📜</span> Recovery Phrase
                </Button>
                <Button
                  variant={newKeyType === 'private_key' ? 'default' : 'outline'}
                  className={newKeyType === 'private_key' ? 'bg-violet-500 hover:bg-violet-600' : ''}
                  onClick={() => setNewKeyType('private_key')}
                >
                  <span className="mr-2">🔐</span> Private Key
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                {newKeyType === 'mnemonic' ? 'Recovery Phrase (12 or 24 words)' : 'Private Key'}
              </label>
              <Textarea
                placeholder={
                  newKeyType === 'mnemonic'
                    ? 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
                    : '0x...'
                }
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                className="mt-1 font-mono text-sm"
                rows={4}
              />
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                🔒 Your keys are stored locally in your browser. For maximum security, also keep a physical backup.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKeyDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newKeyName.trim() || !newKeyValue.trim()}
              onClick={addKey}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
            >
              Save Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Key Dialog */}
      <Dialog
        open={showKeyDialog}
        onOpenChange={(open) => {
          setShowKeyDialog(open)
          if (!open) {
            setKeyRevealed(false)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedKey?.type === 'mnemonic' ? '📜' : '🔐'} {selectedKey?.name}
            </DialogTitle>
            <DialogDescription>
              View and copy your {selectedKey?.type === 'mnemonic' ? 'recovery phrase' : 'private key'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              {!keyRevealed ? (
                <div
                  className="p-6 bg-muted rounded-lg text-center cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setKeyRevealed(true)}
                >
                  <div className="text-4xl mb-3">👁️</div>
                  <p className="font-medium">Click to reveal</p>
                  <p className="text-sm text-muted-foreground">Make sure no one is watching</p>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border-2 border-amber-200 dark:border-amber-800">
                  {selectedKey?.type === 'mnemonic' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedKey?.value.split(' ').map((word, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-black/20 rounded text-sm">
                          <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                          <span className="font-mono font-medium">{word}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <code className="block font-mono text-sm break-all p-2 bg-white dark:bg-black/20 rounded">
                      {selectedKey?.value}
                    </code>
                  )}
                </div>
              )}
            </div>

            {keyRevealed && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedKey?.value || '')
                  }}
                >
                  📋 Copy to Clipboard
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setKeyRevealed(false)}>
                  🙈 Hide Key
                </Button>
              </div>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Where to use this key:</p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Import into MetaMask, Trust Wallet, or other wallets</li>
                <li>• Recover your wallet on a new device</li>
                <li>• Use with hardware wallets like Ledger or Trezor</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKeyDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Key Dialog */}
      <Dialog open={showDeleteKeyDialog} onOpenChange={setShowDeleteKeyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <span className="text-5xl">🗑️</span>
            </div>
            <DialogTitle className="text-center text-2xl">Delete Key?</DialogTitle>
            <DialogDescription className="text-center">
              This will permanently remove "{selectedKey?.name}" from your stored keys.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">⚠️ Warning</p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Make sure you have another backup of this key before deleting. Without it, you may lose access to your
                crypto forever.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteKeyDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => selectedKey && deleteKey(selectedKey.id)} className="flex-1">
              🗑️ Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
