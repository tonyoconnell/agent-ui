/**
 * SecureStorageDialog - Password Setup, Unlock, and Backup UI
 *
 * Beautiful dialogs for:
 * - First-time password setup
 * - Unlock wallet
 * - Export encrypted backup
 * - Import backup
 * - Change password
 * - View/copy mnemonic
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
import { checkPasswordStrength, formatMnemonic, generateStrongPassword, SecureKeyStorage } from './lib/SecureKeyStorage'

// ============================================
// PASSWORD SETUP DIALOG
// ============================================

interface SetupPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSetup: () => void
}

export function SetupPasswordDialog({ open, onOpenChange, onSetup }: SetupPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = checkPasswordStrength(password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']

  const handleSetup = async () => {
    setError('')

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await SecureKeyStorage.setupPassword(password)
      onSetup()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setPassword(generated)
    setConfirmPassword(generated)
    setShowPassword(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl">
              🔐
            </div>
            Secure Your Wallet
          </DialogTitle>
          <DialogDescription>
            Create a password to encrypt your private keys. This password never leaves your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Security Notice */}
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="text-sm">
                  <strong>Important:</strong> If you forget this password, your keys cannot be recovered. Make sure to
                  backup your encrypted wallet after setup.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Input */}
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="pr-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </div>

            {/* Strength Meter */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strengthColors[strength.score] : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strength.feedback}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>

          {/* Generate Button */}
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleGeneratePassword}>
            <span className="mr-2">🎲</span>
            Generate Strong Password
          </Button>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSetup} disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              <>
                <span className="mr-2">🔐</span>
                Secure My Wallet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// UNLOCK DIALOG
// ============================================

interface UnlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlock: () => void
}

export function UnlockDialog({ open, onOpenChange, onUnlock }: UnlockDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleUnlock = async () => {
    setError('')
    setLoading(true)

    try {
      const success = await SecureKeyStorage.unlock(password)
      if (success) {
        setPassword('')
        setAttempts(0)
        onUnlock()
        onOpenChange(false)
      } else {
        setAttempts((prev) => prev + 1)
        setError(`Incorrect password. ${5 - attempts} attempts remaining.`)
        if (attempts >= 4) {
          setError('Too many attempts. Please wait before trying again.')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl">
              🔓
            </div>
            Unlock Wallet
          </DialogTitle>
          <DialogDescription>Enter your password to access your encrypted keys</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUnlock} disabled={loading || attempts >= 5}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Unlocking...
              </>
            ) : (
              <>
                <span className="mr-2">🔓</span>
                Unlock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// BACKUP EXPORT DIALOG
// ============================================

interface BackupExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackupExportDialog({ open, onOpenChange }: BackupExportDialogProps) {
  const [password, setPassword] = useState('')
  const [backupData, setBackupData] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    setError('')
    setLoading(true)

    try {
      const data = await SecureKeyStorage.exportBackup(password)
      setBackupData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (backupData) {
      await navigator.clipboard.writeText(backupData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (backupData) {
      const blob = new Blob([backupData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `one-wallet-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xl">
              💾
            </div>
            Backup Wallet
          </DialogTitle>
          <DialogDescription>Export an encrypted backup of all your wallets. Store it safely!</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!backupData ? (
            <>
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔒</span>
                    <div className="text-sm">
                      Your backup will be encrypted with the password you enter. You'll need this password to restore
                      the backup.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Encryption Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to encrypt backup"
                />
                <p className="text-xs text-muted-foreground">
                  Use a strong password. You'll need it to restore this backup.
                </p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button onClick={handleExport} disabled={loading || !password} className="w-full">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔐</span>
                    Create Encrypted Backup
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✅</span>
                    <div className="text-sm">
                      <strong>Backup created!</strong> Download the file or copy the encrypted data.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Encrypted Backup Data</Label>
                <div className="p-3 bg-muted rounded-lg max-h-32 overflow-auto">
                  <code className="text-xs break-all">{backupData.slice(0, 200)}...</code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
                </Button>
                <Button onClick={handleDownload}>
                  <span className="mr-2">💾</span>
                  Download File
                </Button>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setBackupData(null)
              setPassword('')
            }}
          >
            {backupData ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// BACKUP IMPORT DIALOG
// ============================================

interface BackupImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (count: number) => void
}

export function BackupImportDialog({ open, onOpenChange, onImport }: BackupImportDialogProps) {
  const [password, setPassword] = useState('')
  const [backupData, setBackupData] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBackupData(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleImport = async () => {
    setError('')
    setLoading(true)

    try {
      const count = await SecureKeyStorage.importBackup(backupData, password)
      onImport(count)
      onOpenChange(false)
      setBackupData('')
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl">
              📥
            </div>
            Import Backup
          </DialogTitle>
          <DialogDescription>Restore wallets from an encrypted backup file</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Backup File</Label>
            <Input type="file" accept=".json" onChange={handleFileUpload} className="cursor-pointer" />
            <p className="text-xs text-muted-foreground">Or paste the encrypted backup data below</p>
          </div>

          <div className="space-y-2">
            <Label>Backup Data (optional if file uploaded)</Label>
            <textarea
              value={backupData}
              onChange={(e) => setBackupData(e.target.value)}
              placeholder="Paste encrypted backup data..."
              className="w-full h-20 p-3 text-xs rounded-lg border bg-background resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Decryption Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the backup password"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={loading || !backupData || !password}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <span className="mr-2">📥</span>
                Import Wallets
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// VIEW MNEMONIC DIALOG
// ============================================

interface ViewMnemonicDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletId: string
  walletName: string
}

export function ViewMnemonicDialog({ open, onOpenChange, walletId, walletName }: ViewMnemonicDialogProps) {
  const [password, setPassword] = useState('')
  const [mnemonic, setMnemonic] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showWords, setShowWords] = useState(false)

  const handleReveal = async () => {
    setError('')
    setLoading(true)

    try {
      // First unlock if needed
      const unlocked = await SecureKeyStorage.unlock(password)
      if (!unlocked) {
        setError('Incorrect password')
        setLoading(false)
        return
      }

      const result = await SecureKeyStorage.getMnemonic(walletId, password)
      setMnemonic(result)
      setShowWords(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reveal')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (mnemonic) {
      await navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const words = mnemonic ? formatMnemonic(mnemonic) : []

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setMnemonic(null)
          setPassword('')
          setShowWords(false)
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl">
              🔑
            </div>
            Recovery Phrase
          </DialogTitle>
          <DialogDescription>
            View the recovery phrase for <strong>{walletName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showWords ? (
            <>
              {/* Warning */}
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm">
                      <strong>Never share your recovery phrase!</strong>
                      <br />
                      Anyone with these words can steal your funds.
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Enter Password to Reveal</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your wallet password"
                  onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button onClick={handleReveal} disabled={loading || !password} className="w-full" variant="destructive">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <span className="mr-2">👁️</span>
                    Reveal Recovery Phrase
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Word Grid */}
              <div className="grid grid-cols-3 gap-2">
                {words.map((word, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg text-center">
                    <span className="text-xs text-muted-foreground mr-1">{index + 1}.</span>
                    <span className="font-mono font-medium">{word}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? '✓ Copied!' : '📋 Copy All'}
                </Button>
                <Button variant="outline" onClick={() => setShowWords(false)}>
                  🙈 Hide
                </Button>
              </div>

              <Card className="bg-amber-500/10 border-amber-500/20">
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-center">Write these words down and store them securely offline.</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// SECURITY STATUS BADGE
// ============================================

interface SecurityStatusProps {
  onSetupPassword: () => void
  onUnlock: () => void
  onBackup: () => void
}

export function SecurityStatus({ onSetupPassword, onUnlock, onBackup }: SecurityStatusProps) {
  const [status, setStatus] = useState(SecureKeyStorage.getStatus())

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(SecureKeyStorage.getStatus())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!status.hasPassword) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSetupPassword}
        className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
      >
        <span className="mr-2">⚠️</span>
        Set Up Security
      </Button>
    )
  }

  if (status.isLocked) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onUnlock}
        className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
      >
        <span className="mr-2">🔒</span>
        Unlock Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="border-green-500/50 text-green-600">
        <span className="mr-1">🔓</span>
        Unlocked
      </Badge>
      <Button variant="ghost" size="sm" onClick={onBackup}>
        <span className="mr-1">💾</span>
        Backup
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          SecureKeyStorage.lock()
          setStatus(SecureKeyStorage.getStatus())
        }}
      >
        🔒
      </Button>
    </div>
  )
}
