// lib/useVault.ts — React hook around the Vault singleton.
// Moved from vault/useVault.ts. Reactive status + bound action methods.
// Auto-unlock on mount if a passkey is enrolled and the platform supports it.
// Emits ui:vault:* signals.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { hasLegacyData, inspectLegacy, type LegacyInventory, migrateLegacy, requiresOldPassword } from './migration'
import type { PasskeyEnrollment, VaultStatus, VaultWallet } from './vault/types'
import { VaultError } from './vault/types'
import * as Vault from './vault/vault'

export interface UseVaultResult {
  // ===== STATE =====
  status: VaultStatus | null
  loading: boolean
  error: string | null
  /** True if the vault has any data this device hasn't migrated yet. */
  legacy: LegacyInventory | null

  // ===== LIFECYCLE =====
  setup: (opts: Vault.SetupOptions) => Promise<Vault.SetupResult>
  unlockWithPasskey: () => Promise<void>
  unlockWithPassword: (password: string) => Promise<void>
  unlockWithRecovery: (phrase: string) => Promise<void>
  lock: () => void
  refresh: () => Promise<void>

  // ===== WALLETS =====
  wallets: VaultWallet[]
  saveWallet: (input: Vault.SaveWalletInput) => Promise<VaultWallet>
  deleteWallet: (id: string) => Promise<void>
  getMnemonic: (id: string) => Promise<string | null>
  getPrivateKey: (id: string) => Promise<string | null>
  updateBalance: (id: string, balance: string, usdValue: number) => Promise<void>

  // ===== PASSKEY MANAGEMENT =====
  addPasskey: (label?: string) => Promise<PasskeyEnrollment>
  removePasskey: (credentialId: Uint8Array) => Promise<void>

  // ===== PASSWORD MANAGEMENT =====
  setPassword: (password: string) => Promise<void>
  changePassword: (oldP: string, newP: string) => Promise<void>
  removePassword: () => Promise<void>

  // ===== STEP-UP =====
  stepUp: () => Promise<boolean>

  // ===== BACKUP =====
  exportBackup: (password: string) => Promise<string>
  importBackup: (blob: string, password: string) => Promise<number>

  // ===== MIGRATION =====
  migrate: (oldPassword?: string) => Promise<{ migrated: number; errors: string[] }>

  // ===== SETTINGS =====
  setAutoLockMs: (ms: number) => Promise<void>
  setLockOnTabClose: (enabled: boolean) => Promise<void>

  // ===== DESTRUCTIVE =====
  wipeAll: () => Promise<void>
}

interface Options {
  /** Try silent passkey unlock on mount (default true). */
  autoUnlock?: boolean
  /** Try passkey unlock again when the tab regains focus (default true). */
  unlockOnFocus?: boolean
}

export function useVault(opts: Options = {}): UseVaultResult {
  const { autoUnlock = true, unlockOnFocus = true } = opts

  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [wallets, setWallets] = useState<VaultWallet[]>([])
  const [legacy, setLegacy] = useState<LegacyInventory | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const autoUnlockTried = useRef(false)

  // ---- refresh ----
  const refresh = useCallback(async () => {
    try {
      const s = await Vault.getStatus()
      setStatus(s)
      if (!s.isLocked) setWallets(await Vault.listWallets())
      setLegacy(hasLegacyData() ? inspectLegacy() : null)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  // ---- mount: refresh + maybe auto-unlock ----
  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const s = await Vault.getStatus()
        if (cancelled) return
        setStatus(s)
        setLegacy(hasLegacyData() ? inspectLegacy() : null)

        // Auto-unlock if: vault exists, has passkey, capabilities support PRF,
        // and we haven't tried this session yet.
        if (autoUnlock && !autoUnlockTried.current && s.hasVault && s.hasPasskey && s.isLocked && s.capabilities.prf) {
          autoUnlockTried.current = true
          try {
            await Vault.unlockWithPasskey()
            const s2 = await Vault.getStatus()
            if (!cancelled) {
              setStatus(s2)
              setWallets(await Vault.listWallets())
              emitClick('ui:vault:auto-unlock', { method: 'passkey' })
            }
          } catch {
            // Silent fail — user can still unlock manually. Don't surface error.
          }
        } else if (!s.isLocked) {
          setWallets(await Vault.listWallets())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [autoUnlock])

  // ---- focus: silent re-unlock attempt if locked + has passkey ----
  useEffect(() => {
    if (!unlockOnFocus) return
    const onFocus = async () => {
      const s = await Vault.getStatus()
      if (s.hasVault && s.hasPasskey && s.isLocked && s.capabilities.prf) {
        try {
          await Vault.unlockWithPasskey()
          await refresh()
          emitClick('ui:vault:focus-unlock')
        } catch {
          // ignore — user can tap unlock chip
        }
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [unlockOnFocus, refresh])

  // ---- visibilitychange: lock on tab hide if configured ----
  useEffect(() => {
    if (!status?.isLocked === false) return
    const onVis = async () => {
      if (document.visibilityState !== 'hidden') return
      const meta = await Vault.getStatus()
      if (meta.hasVault && !meta.isLocked) {
        // Read the per-vault preference rather than caching — user may toggle it.
        // We can't get lockOnTabClose from VaultStatus directly, so call into vault.
        // Cheapest path: query meta via getStatus alone is enough — settings stored
        // in IndexedDB; if user wants tab-close lock, they'll have set it.
        // For simplicity: skip in this hook; let the dashboard call lock() explicitly.
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [status?.isLocked])

  // ---- bound actions ----
  const setup = useCallback(
    async (o: Vault.SetupOptions) => {
      setError(null)
      const result = await Vault.setup(o)
      await refresh()
      emitClick('ui:vault:setup', { passkey: !!o.enrollPasskey, password: !!o.password })
      return result
    },
    [refresh],
  )

  const unlockWithPasskey = useCallback(async () => {
    setError(null)
    try {
      await Vault.unlockWithPasskey()
      await refresh()
      emitClick('ui:vault:unlock', { method: 'passkey' })
      void fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'substrate:u:unlock',
          data: { weight: 1, tags: ['u', 'vault'], content: { verb: 'unlock', method: 'passkey', outcome: 'ok' } },
        }),
      })
    } catch (e) {
      setError((e as Error).message)
      void fetch('/api/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'substrate:u:unlock',
          data: {
            weight: 1,
            tags: ['u', 'vault'],
            content: {
              verb: 'unlock',
              method: 'passkey',
              outcome: 'fail',
              reason: (e as VaultError)?.code ?? 'unknown',
            },
          },
        }),
      })
      throw e
    }
  }, [refresh])

  const unlockWithPassword = useCallback(
    async (password: string) => {
      setError(null)
      try {
        await Vault.unlockWithPassword(password)
        await refresh()
        emitClick('ui:vault:unlock', { method: 'password' })
        void fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: 'substrate:u:unlock',
            data: { weight: 1, tags: ['u', 'vault'], content: { verb: 'unlock', method: 'password', outcome: 'ok' } },
          }),
        })
      } catch (e) {
        setError((e as Error).message)
        void fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: 'substrate:u:unlock',
            data: {
              weight: 1,
              tags: ['u', 'vault'],
              content: {
                verb: 'unlock',
                method: 'password',
                outcome: 'fail',
                reason: (e as VaultError)?.code ?? 'unknown',
              },
            },
          }),
        })
        throw e
      }
    },
    [refresh],
  )

  const unlockWithRecovery = useCallback(
    async (phrase: string) => {
      setError(null)
      try {
        await Vault.unlockWithRecovery(phrase)
        await refresh()
        emitClick('ui:vault:unlock', { method: 'recovery' })
        void fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: 'substrate:u:unlock',
            data: { weight: 1, tags: ['u', 'vault'], content: { verb: 'unlock', method: 'recovery', outcome: 'ok' } },
          }),
        })
      } catch (e) {
        setError((e as Error).message)
        void fetch('/api/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: 'substrate:u:unlock',
            data: {
              weight: 1,
              tags: ['u', 'vault'],
              content: {
                verb: 'unlock',
                method: 'recovery',
                outcome: 'fail',
                reason: (e as VaultError)?.code ?? 'unknown',
              },
            },
          }),
        })
        throw e
      }
    },
    [refresh],
  )

  const lock = useCallback(() => {
    Vault.lock()
    void refresh()
    emitClick('ui:vault:lock')
    void fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver: 'substrate:u:lock',
        data: { weight: 1, tags: ['u', 'vault'], content: { verb: 'lock', outcome: 'ok' } },
      }),
    })
  }, [refresh])

  const saveWallet = useCallback(async (input: Vault.SaveWalletInput) => {
    const w = await Vault.saveWallet(input)
    setWallets(await Vault.listWallets())
    emitClick('ui:vault:save', { walletId: input.id, chain: input.chain })
    return w
  }, [])

  const deleteWallet = useCallback(async (id: string) => {
    await Vault.deleteWallet(id)
    setWallets(await Vault.listWallets())
    emitClick('ui:vault:delete', { walletId: id })
  }, [])

  const getMnemonic = useCallback(async (id: string) => {
    const m = await Vault.getMnemonic(id)
    emitClick('ui:vault:reveal', { walletId: id, kind: 'mnemonic' })
    return m
  }, [])

  const getPrivateKey = useCallback(async (id: string) => {
    const pk = await Vault.getPrivateKey(id)
    emitClick('ui:vault:reveal', { walletId: id, kind: 'private-key' })
    return pk
  }, [])

  const updateBalance = useCallback(async (id: string, balance: string, usdValue: number) => {
    await Vault.updateBalance(id, balance, usdValue)
    setWallets(await Vault.listWallets())
  }, [])

  const addPasskey = useCallback(
    async (label?: string) => {
      const e = await Vault.addPasskey(label)
      await refresh()
      emitClick('ui:vault:passkey-add')
      return e
    },
    [refresh],
  )

  const removePasskey = useCallback(
    async (credentialId: Uint8Array) => {
      await Vault.removePasskey(credentialId)
      await refresh()
      emitClick('ui:vault:passkey-remove')
    },
    [refresh],
  )

  const setPassword = useCallback(
    async (password: string) => {
      await Vault.setPassword(password)
      await refresh()
      emitClick('ui:vault:password-set')
    },
    [refresh],
  )

  const changePassword = useCallback(
    async (oldP: string, newP: string) => {
      await Vault.changePassword(oldP, newP)
      await refresh()
      emitClick('ui:vault:password-change')
    },
    [refresh],
  )

  const removePassword = useCallback(async () => {
    await Vault.removePassword()
    await refresh()
    emitClick('ui:vault:password-remove')
  }, [refresh])

  const stepUp = useCallback(async () => {
    const ok = await Vault.stepUpPasskey()
    emitClick('ui:vault:step-up', { ok })
    return ok
  }, [])

  const exportBackup = useCallback(async (password: string) => {
    const blob = await Vault.exportBackup(password)
    emitClick('ui:vault:export')
    return blob
  }, [])

  const importBackup = useCallback(async (blob: string, password: string) => {
    const n = await Vault.importBackup(blob, password)
    setWallets(await Vault.listWallets())
    emitClick('ui:vault:import', { count: n })
    return n
  }, [])

  /** Inline migration that uses public Vault.saveWallet — requires unlock. */
  const runInlineMigration = useCallback(
    async (oldPassword?: string): Promise<{ migrated: number; errors: string[] }> => {
      const errors: string[] = []
      const migrated = 0
      const inv = inspectLegacy()
      const existing = await Vault.listWallets()
      const known = new Set(existing.map((w) => `${w.chain}:${w.address}`))

      // Plaintext migration
      if (inv.plaintextCount > 0) {
        errors.push('plaintext wallet migration: direct localStorage reads removed. Use migration.ts instead.')
      }

      // Encrypted requires the old password. Delegate to migration.ts so we share
      // the legacy decrypt path.
      if (inv.encryptedCount > 0 && oldPassword) {
        try {
          // We can't reach the in-memory master CryptoKey from here, so re-route
          // via migration.ts which writes directly to storage.ts. That writes
          // ciphertext under the master via vault internals — except it needs
          // the master. The clean fix: expose a vault.getMasterKey() function.
          // Until then, log a clear error.
          errors.push('encrypted migration requires upcoming Vault.runMigration() helper')
        } catch (e) {
          errors.push(`encrypted: ${(e as Error).message}`)
        }
      } else if (inv.encryptedCount > 0 && !oldPassword) {
        errors.push(`${inv.encryptedCount} encrypted wallets require old password`)
      }

      void migrateLegacy // referenced to keep import alive for future encrypted-path fix
      void requiresOldPassword
      void known
      void migrated
      return { migrated: 0, errors }
    },
    [],
  )

  const migrate = useCallback(
    async (oldPassword?: string) => {
      const s = await Vault.getStatus()
      if (s.isLocked) throw new VaultError('vault must be unlocked before migration', 'locked')
      const result = await runInlineMigration(oldPassword)
      setWallets(await Vault.listWallets())
      setLegacy(hasLegacyData() ? inspectLegacy() : null)
      emitClick('ui:vault:migrate', { migrated: result.migrated })
      return result
    },
    [runInlineMigration],
  )

  const setAutoLockMs = useCallback(
    async (ms: number) => {
      await Vault.setAutoLockMs(ms)
      await refresh()
    },
    [refresh],
  )

  const setLockOnTabClose = useCallback(
    async (enabled: boolean) => {
      await Vault.setLockOnTabClose(enabled)
      await refresh()
    },
    [refresh],
  )

  const wipeAll = useCallback(async () => {
    await Vault.wipeAll()
    await refresh()
    setWallets([])
    emitClick('ui:vault:wipe')
  }, [refresh])

  return useMemo<UseVaultResult>(
    () => ({
      status,
      loading,
      error,
      legacy,
      wallets,
      setup,
      unlockWithPasskey,
      unlockWithPassword,
      unlockWithRecovery,
      lock,
      refresh,
      saveWallet,
      deleteWallet,
      getMnemonic,
      getPrivateKey,
      updateBalance,
      addPasskey,
      removePasskey,
      setPassword,
      changePassword,
      removePassword,
      stepUp,
      exportBackup,
      importBackup,
      migrate,
      setAutoLockMs,
      setLockOnTabClose,
      wipeAll,
    }),
    [
      status,
      loading,
      error,
      legacy,
      wallets,
      setup,
      unlockWithPasskey,
      unlockWithPassword,
      unlockWithRecovery,
      lock,
      refresh,
      saveWallet,
      deleteWallet,
      getMnemonic,
      getPrivateKey,
      updateBalance,
      addPasskey,
      removePasskey,
      setPassword,
      changePassword,
      removePassword,
      stepUp,
      exportBackup,
      importBackup,
      migrate,
      setAutoLockMs,
      setLockOnTabClose,
      wipeAll,
    ],
  )
}
