// VaultDialogs — unlock, recovery reveal, backup, settings. All use useVault().

import {
  AlertTriangle,
  Check,
  Download,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { isValidRecoveryPhrase, RECOVERY_WORD_COUNT, suggestWords } from '@/components/u/lib/vault'
import { useVault } from '@/components/u/lib/vault/useVault'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { emitClick } from '@/lib/ui-signal'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// =====================================================================
// VaultUnlockDialog
// =====================================================================

export function VaultUnlockDialog({ open, onOpenChange }: DialogProps) {
  const vault = useVault()
  const prf = vault.status?.capabilities.prf ?? false
  const hasPasskey = vault.status?.hasPasskey ?? false
  const hasPassword = vault.status?.hasPassword ?? false

  const defaultTab: 'passkey' | 'password' | 'recovery' =
    hasPasskey && prf ? 'passkey' : hasPassword ? 'password' : 'recovery'

  const [tab, setTab] = useState<string>(defaultTab)
  const [password, setPassword] = useState('')
  const [words, setWords] = useState<string[]>(() => Array(RECOVERY_WORD_COUNT).fill(''))
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setTab(defaultTab)
      setPassword('')
      setWords(Array(RECOVERY_WORD_COUNT).fill(''))
      setAttempts(0)
      setError(null)
    }
  }, [open, defaultTab])

  const close = () => {
    emitClick('ui:vault-unlock:close')
    onOpenChange(false)
  }

  const handlePasskey = () => {
    emitClick('ui:vault-unlock:passkey')
    setError(null)
    startTransition(async () => {
      try {
        await vault.unlockWithPasskey()
        onOpenChange(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Passkey unlock failed')
      }
    })
  }

  const handlePassword = () => {
    emitClick('ui:vault-unlock:password')
    setError(null)
    startTransition(async () => {
      try {
        await vault.unlockWithPassword(password)
        onOpenChange(false)
      } catch (e) {
        setAttempts((n) => n + 1)
        setError(e instanceof Error ? e.message : 'Wrong password — try again')
      }
    })
  }

  const handleRecovery = () => {
    emitClick('ui:vault-unlock:recovery')
    setError(null)
    const phrase = words.map((w) => w.trim().toLowerCase()).join(' ')
    if (!isValidRecoveryPhrase(phrase)) {
      setError('That phrase is not valid. Check spelling and order.')
      return
    }
    startTransition(async () => {
      try {
        await vault.unlockWithRecovery(phrase)
        onOpenChange(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not unlock with recovery phrase')
      }
    })
  }

  const updateWord = (i: number, v: string) => {
    setWords((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0f] border-[#252538] text-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            Unlock vault
          </DialogTitle>
          <DialogDescription className="text-slate-400">Choose how you want to unlock.</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            emitClick('ui:vault-unlock:tab', { tab: v })
            setTab(v)
            setError(null)
          }}
          className="w-full"
        >
          <TabsList className="bg-[#161622] border border-[#252538]">
            {hasPasskey && prf && <TabsTrigger value="passkey">Passkey</TabsTrigger>}
            {hasPassword && <TabsTrigger value="password">Password</TabsTrigger>}
            <TabsTrigger value="recovery">Recovery phrase</TabsTrigger>
          </TabsList>

          {hasPasskey && prf && (
            <TabsContent value="passkey" className="pt-4 space-y-3">
              <Card className="bg-[#161622] border-[#252538]">
                <CardContent className="pt-4 pb-4 flex items-start gap-3">
                  <Fingerprint className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    Your device will ask for Touch ID, Face ID, or Windows Hello.
                  </div>
                </CardContent>
              </Card>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button onClick={handlePasskey} disabled={pending} className="w-full bg-emerald-600 hover:bg-emerald-500">
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unlocking…
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Unlock with device
                  </>
                )}
              </Button>
            </TabsContent>
          )}

          {hasPassword && (
            <TabsContent value="password" className="pt-4 space-y-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePassword()}
                  placeholder="Your vault password"
                  className="bg-[#161622] border-[#252538] text-slate-100"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {attempts >= 3 && (
                <p className="text-xs text-slate-400">
                  If you've forgotten your password, use the recovery phrase tab.
                </p>
              )}
              <Button
                onClick={handlePassword}
                disabled={pending || !password}
                className="w-full bg-emerald-600 hover:bg-emerald-500"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Unlocking…
                  </>
                ) : (
                  'Unlock'
                )}
              </Button>
            </TabsContent>
          )}

          <TabsContent value="recovery" className="pt-4 space-y-3">
            <p className="text-xs text-slate-400">Enter your 24-word recovery phrase.</p>
            <div className="grid grid-cols-4 gap-2">
              {words.map((w, i) => (
                <RecoveryWordInput key={i} index={i} value={w} onChange={(v) => updateWord(i, v)} />
              ))}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={handleRecovery} disabled={pending} className="w-full bg-emerald-600 hover:bg-emerald-500">
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unlocking…
                </>
              ) : (
                'Unlock with recovery phrase'
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-slate-400 hover:text-slate-200">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface WordInputProps {
  index: number
  value: string
  onChange: (v: string) => void
}

function RecoveryWordInput({ index, value, onChange }: WordInputProps) {
  const listId = `vault-word-${index}`
  const suggestions = useMemo(() => (value.length >= 2 ? suggestWords(value, 6) : []), [value])
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">
        {index + 1}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        autoComplete="off"
        spellCheck={false}
        className="w-full h-9 pl-6 pr-2 rounded-md bg-[#161622] border border-[#252538] text-slate-100 text-sm font-mono focus:outline-none focus:border-emerald-500/60"
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}

// =====================================================================
// VaultRecoveryRevealDialog
// =====================================================================

export function VaultRecoveryRevealDialog({ open, onOpenChange }: DialogProps) {
  const [confirmWord, setConfirmWord] = useState('')

  useEffect(() => {
    if (!open) setConfirmWord('')
  }, [open])

  const close = () => {
    emitClick('ui:vault-recovery:close')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0f] border-[#252538] text-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            Recovery phrase
          </DialogTitle>
          <DialogDescription className="text-slate-400">Destructive action — read carefully.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="pt-4 pb-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="text-sm text-red-200">
                <strong>Your recovery phrase is not stored on this device.</strong>
                <br />
                To view it you must restore from a backup (which contains it), or you already wrote it down during
                setup. If you need a new recovery phrase, you must reset your vault.
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label className="text-slate-300">
              Type <span className="font-mono text-red-300">REVEAL</span> to acknowledge
            </Label>
            <Input
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
              placeholder="REVEAL"
              className="bg-[#161622] border-[#252538] text-slate-100 font-mono"
            />
          </div>

          {confirmWord === 'REVEAL' && (
            <Card className="bg-[#161622] border-[#252538]">
              <CardContent className="pt-4 pb-4 text-sm text-slate-300">
                You acknowledged the warning. The phrase is not retrievable from this device — please import a backup or
                reset the vault.
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-slate-400 hover:text-slate-200">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================================
// VaultBackupDialog
// =====================================================================

export function VaultBackupDialog({ open, onOpenChange }: DialogProps) {
  const vault = useVault()
  const [tab, setTab] = useState<string>('export')

  const [exportPassword, setExportPassword] = useState('')
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportDone, setExportDone] = useState(false)

  const [importFile, setImportFile] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importCount, setImportCount] = useState<number | null>(null)

  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setExportPassword('')
      setExportError(null)
      setExportDone(false)
      setImportFile('')
      setImportPassword('')
      setImportError(null)
      setImportCount(null)
    }
  }, [open])

  const close = () => {
    emitClick('ui:vault-backup:close')
    onOpenChange(false)
  }

  const handleExport = () => {
    emitClick('ui:vault-backup:export')
    setExportError(null)
    startTransition(async () => {
      try {
        const blob = await vault.exportBackup(exportPassword)
        const file = new Blob([blob], { type: 'application/json' })
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = `one-vault-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        setExportDone(true)
      } catch (e) {
        setExportError(e instanceof Error ? e.message : 'Export failed')
      }
    })
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImportFile((ev.target?.result as string) ?? '')
    reader.readAsText(file)
  }

  const handleImport = () => {
    emitClick('ui:vault-backup:import')
    setImportError(null)
    startTransition(async () => {
      try {
        const n = await vault.importBackup(importFile, importPassword)
        setImportCount(n)
      } catch (e) {
        setImportError(e instanceof Error ? e.message : 'Import failed')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0f] border-[#252538] text-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            Backup vault
          </DialogTitle>
          <DialogDescription className="text-slate-400">Encrypted export and restore.</DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            emitClick('ui:vault-backup:tab', { tab: v })
            setTab(v)
          }}
        >
          <TabsList className="bg-[#161622] border border-[#252538]">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Export password</Label>
              <Input
                type="password"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                placeholder="Encrypts the backup file"
                className="bg-[#161622] border-[#252538] text-slate-100"
              />
              <p className="text-xs text-slate-400">Can be different from your vault password.</p>
            </div>
            {exportError && <p className="text-sm text-red-400">{exportError}</p>}
            {exportDone && (
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-3 pb-3 flex items-center gap-2 text-sm text-emerald-300">
                  <Check className="w-4 h-4" />
                  Backup downloaded.
                </CardContent>
              </Card>
            )}
            <Button
              onClick={handleExport}
              disabled={pending || !exportPassword}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Encrypting…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export backup
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Backup file</Label>
              <Input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="bg-[#161622] border-[#252538] text-slate-100 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Backup password</Label>
              <Input
                type="password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Password used at export"
                className="bg-[#161622] border-[#252538] text-slate-100"
              />
            </div>
            {importError && <p className="text-sm text-red-400">{importError}</p>}
            {importCount !== null && (
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-3 pb-3 flex items-center gap-2 text-sm text-emerald-300">
                  <Check className="w-4 h-4" />
                  {importCount} wallets imported.
                </CardContent>
              </Card>
            )}
            <Button
              onClick={handleImport}
              disabled={pending || !importFile || !importPassword}
              className="w-full bg-emerald-600 hover:bg-emerald-500"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import wallets
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-slate-400 hover:text-slate-200">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================================
// VaultSettingsDialog
// =====================================================================

const AUTO_LOCK_OPTIONS: Array<{ label: string; ms: number }> = [
  { label: '1 minute', ms: 60_000 },
  { label: '5 minutes', ms: 5 * 60_000 },
  { label: '15 minutes', ms: 15 * 60_000 },
  { label: '30 minutes', ms: 30 * 60_000 },
  { label: '1 hour', ms: 60 * 60_000 },
  { label: 'Never', ms: 0 },
]

export function VaultSettingsDialog({ open, onOpenChange }: DialogProps) {
  const vault = useVault()
  const [autoLockMs, setAutoLockMs] = useState<number>(30 * 60_000)
  const [lockOnTabClose, setLockOnTabClose] = useState<boolean>(false)

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [confirmRemovePw, setConfirmRemovePw] = useState(false)

  const [wipeConfirmText, setWipeConfirmText] = useState('')
  const [wipeStage, setWipeStage] = useState<0 | 1>(0)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setShowChangePassword(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setConfirmRemovePw(false)
      setWipeConfirmText('')
      setWipeStage(0)
      setMessage(null)
      setError(null)
    }
  }, [open])

  const close = () => {
    emitClick('ui:vault-settings:close')
    onOpenChange(false)
  }

  const flash = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2500)
  }

  const handleAutoLock = (ms: number) => {
    emitClick('ui:vault-settings:auto-lock', { ms })
    setAutoLockMs(ms)
    startTransition(async () => {
      try {
        await vault.setAutoLockMs(ms)
        flash('Auto-lock updated')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update auto-lock')
      }
    })
  }

  const handleLockOnClose = (enabled: boolean) => {
    emitClick('ui:vault-settings:lock-on-close', { enabled })
    setLockOnTabClose(enabled)
    startTransition(async () => {
      try {
        await vault.setLockOnTabClose(enabled)
        flash('Preference saved')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update preference')
      }
    })
  }

  const handleAddPasskey = () => {
    emitClick('ui:vault-settings:add-passkey')
    setError(null)
    startTransition(async () => {
      try {
        await vault.addPasskey()
        flash('Passkey enrolled')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to enroll passkey')
      }
    })
  }

  const handleChangePassword = () => {
    emitClick('ui:vault-settings:change-password')
    setError(null)
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError("New passwords don't match")
      return
    }
    startTransition(async () => {
      try {
        await vault.changePassword(oldPassword, newPassword)
        setOldPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
        setShowChangePassword(false)
        flash('Password changed')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to change password')
      }
    })
  }

  const handleRemovePassword = () => {
    emitClick('ui:vault-settings:remove-password', { confirm: confirmRemovePw })
    if (!confirmRemovePw) {
      setConfirmRemovePw(true)
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await vault.removePassword()
        setConfirmRemovePw(false)
        flash('Password removed')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to remove password')
      }
    })
  }

  const handleWipe = () => {
    emitClick('ui:vault-settings:wipe', { stage: wipeStage })
    if (wipeStage === 0) {
      setWipeStage(1)
      return
    }
    if (wipeConfirmText !== 'DELETE EVERYTHING') {
      setError('Type DELETE EVERYTHING to confirm')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await vault.wipeAll()
        onOpenChange(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to wipe vault')
      }
    })
  }

  const hasPassword = vault.status?.hasPassword ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0f] border-[#252538] text-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            Vault settings
          </DialogTitle>
          <DialogDescription className="text-slate-400">Configure auto-lock, auth, and danger zone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label className="text-slate-300">Auto-lock idle timeout</Label>
            <div className="grid grid-cols-3 gap-2">
              {AUTO_LOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.ms}
                  type="button"
                  onClick={() => handleAutoLock(opt.ms)}
                  className={`text-xs rounded-md border px-2 py-2 transition-colors ${
                    autoLockMs === opt.ms
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                      : 'border-[#252538] bg-[#161622] text-slate-300 hover:border-[#3a3a52]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-md border border-[#252538] bg-[#161622] px-3 py-3 cursor-pointer">
            <div>
              <div className="text-sm text-slate-200">Lock on tab close</div>
              <div className="text-xs text-slate-400">Re-auth when you return.</div>
            </div>
            <input
              type="checkbox"
              checked={lockOnTabClose}
              onChange={(e) => handleLockOnClose(e.target.checked)}
              className="accent-emerald-500"
            />
          </label>

          <div className="space-y-2">
            <Label className="text-slate-300">Authentication</Label>
            <Button
              variant="outline"
              onClick={handleAddPasskey}
              disabled={pending}
              className="w-full justify-start border-[#252538] bg-[#161622] text-slate-200 hover:bg-[#1f1f2e]"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Add another passkey
            </Button>

            {hasPassword ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    emitClick('ui:vault-settings:toggle-change-pw')
                    setShowChangePassword((v) => !v)
                  }}
                  className="w-full justify-start border-[#252538] bg-[#161622] text-slate-200 hover:bg-[#1f1f2e]"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Change password
                </Button>

                {showChangePassword && (
                  <div className="space-y-2 rounded-md border border-[#252538] bg-[#0a0a0f] p-3">
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Current password"
                      className="bg-[#161622] border-[#252538] text-slate-100"
                    />
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="bg-[#161622] border-[#252538] text-slate-100"
                    />
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-[#161622] border-[#252538] text-slate-100"
                    />
                    <Button
                      onClick={handleChangePassword}
                      disabled={pending || !oldPassword || !newPassword}
                      className="w-full bg-emerald-600 hover:bg-emerald-500"
                    >
                      {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Update password
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleRemovePassword}
                  disabled={pending}
                  className="w-full justify-start border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {confirmRemovePw ? 'Tap again to confirm — remove password' : 'Remove password'}
                </Button>
              </>
            ) : (
              <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">No password set</Badge>
            )}
          </div>

          <div className="space-y-2 rounded-md border border-red-500/30 bg-red-500/5 p-3">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Danger zone</span>
            </div>
            <p className="text-xs text-slate-400">
              Wipes every wallet, every passkey, and all encrypted data from this device.
            </p>

            {wipeStage === 1 && (
              <Input
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="Type DELETE EVERYTHING"
                className="bg-[#161622] border-[#252538] text-slate-100 font-mono"
              />
            )}

            <Button
              onClick={handleWipe}
              disabled={pending || (wipeStage === 1 && wipeConfirmText !== 'DELETE EVERYTHING')}
              className="w-full bg-red-600 hover:bg-red-500 text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wiping…
                </>
              ) : wipeStage === 0 ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Wipe vault
                </>
              ) : (
                'I understand — wipe everything'
              )}
            </Button>
          </div>

          {message && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              {message}
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close} className="text-slate-400 hover:text-slate-200">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
