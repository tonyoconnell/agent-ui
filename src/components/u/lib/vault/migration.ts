// vault/migration.ts — one-shot migration from legacy localStorage to IndexedDB.
// u_wallets (plaintext) → migrate automatically post-unlock.
// u_secure_wallets (old PBKDF2 100k) → migrate only when caller passes the old password.

import { base64ToBytes, decryptWithKey, encryptUnderMaster } from './crypto'
import { listWallets, putWallet } from './storage'
import { type EncryptedRecord, HKDF_DOMAINS, VaultError, type VaultWallet } from './types'

// ============================================
// LEGACY KEYS (from old SecureKeyStorage.ts)
// ============================================

const LEGACY_PLAINTEXT_KEY = 'u_wallets'
const LEGACY_ENCRYPTED_KEY = 'u_secure_wallets'
const LEGACY_PASSWORD_CHECK_KEY = 'u_password_check'
const LEGACY_BACKUP_KEY = 'u_wallets_backup_unencrypted'

// Old-format ciphertext (base64-encoded fields).
interface LegacyEncryptedData {
  ciphertext: string
  iv: string
  salt: string
  version: number
}

interface LegacyPlainWallet {
  id: string
  chain: string
  address: string
  publicKey?: string
  mnemonic?: string
  balance?: string
  usdValue?: number
  name?: string
}

interface LegacySecureWallet {
  id: string
  chain: string
  address: string
  publicKey?: string
  encryptedMnemonic?: LegacyEncryptedData
  encryptedPrivateKey?: LegacyEncryptedData
  balance?: string
  usdValue?: number
  createdAt?: number
  name?: string
}

// ============================================
// CAPABILITY
// ============================================

function readLocal<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export interface LegacyInventory {
  plaintextCount: number
  encryptedCount: number
  hasOldPasswordCheck: boolean
}

export function inspectLegacy(): LegacyInventory {
  const plaintext = readLocal<LegacyPlainWallet[]>(LEGACY_PLAINTEXT_KEY) ?? []
  const encrypted = readLocal<LegacySecureWallet[]>(LEGACY_ENCRYPTED_KEY) ?? []
  const hasCheck = typeof localStorage !== 'undefined' && localStorage.getItem(LEGACY_PASSWORD_CHECK_KEY) !== null
  return {
    plaintextCount: plaintext.length,
    encryptedCount: encrypted.length,
    hasOldPasswordCheck: hasCheck,
  }
}

export function hasLegacyData(): boolean {
  const inv = inspectLegacy()
  return inv.plaintextCount + inv.encryptedCount > 0
}

// ============================================
// MIGRATION
// ============================================

export interface MigrationResult {
  migratedPlaintext: number
  migratedEncrypted: number
  skipped: number
  errors: string[]
}

/** Decrypt a legacy EncryptedData record. Throws on auth failure. */
async function decryptLegacy(rec: LegacyEncryptedData, password: string): Promise<string> {
  const salt = base64ToBytes(rec.salt)
  const iv = base64ToBytes(rec.iv)
  const ciphertext = base64ToBytes(rec.ciphertext)
  // Old format: PBKDF2 100k → AES-GCM. We re-derive the key with the SAME 100k count
  // by calling crypto.subtle directly (deriveKeyFromPassword uses the new 600k count).
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as unknown as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  // Use existing decryptWithKey shape — wrap as a one-off EncryptedRecord.
  const record: EncryptedRecord = { ciphertext, iv, info: 'legacy', version: 1 }
  const pt = await decryptWithKey(record, key)
  return new TextDecoder().decode(pt)
}

/**
 * Migrate legacy data into the new vault. Caller MUST hold an unlocked session
 * and pass the master key from `vault.session.masterKey`.
 *
 * - Plaintext wallets are migrated unconditionally (re-encrypted under master).
 * - Encrypted-with-old-password wallets are migrated only if `oldPassword` is provided.
 * - Already-present addresses (same chain+address) are skipped (no overwrite).
 *
 * After successful migration, legacy keys are renamed to *_backup so the user
 * can recover them manually if anything went wrong; nothing is deleted outright.
 */
export async function migrateLegacy(masterKey: CryptoKey, oldPassword?: string): Promise<MigrationResult> {
  const result: MigrationResult = { migratedPlaintext: 0, migratedEncrypted: 0, skipped: 0, errors: [] }

  if (typeof localStorage === 'undefined') return result

  const existing = await listWallets()
  const known = new Set(existing.map((w) => `${w.chain}:${w.address}`))

  // 1. Plaintext wallets (the unforgivable old format).
  const plain = readLocal<LegacyPlainWallet[]>(LEGACY_PLAINTEXT_KEY) ?? []
  for (const w of plain) {
    const key = `${w.chain}:${w.address}`
    if (known.has(key)) {
      result.skipped++
      continue
    }
    try {
      const wallet: VaultWallet = {
        id: w.id,
        chain: w.chain,
        address: w.address,
        publicKey: w.publicKey ?? '',
        balance: w.balance ?? '0.00',
        usdValue: w.usdValue ?? 0,
        createdAt: Date.now(),
        name: w.name,
      }
      if (w.mnemonic) {
        wallet.encryptedMnemonic = await encryptUnderMaster(w.mnemonic, masterKey, HKDF_DOMAINS.walletMnemonic(w.id))
      }
      await putWallet(wallet)
      known.add(key)
      result.migratedPlaintext++
    } catch (e) {
      result.errors.push(`plaintext ${w.id}: ${(e as Error).message}`)
    }
  }
  if (plain.length > 0) {
    // Rotate to backup name so user can still recover, but normal code path won't
    // try to re-migrate next time.
    localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(plain))
    localStorage.removeItem(LEGACY_PLAINTEXT_KEY)
  }

  // 2. Encrypted-with-old-password wallets — needs the old password.
  if (oldPassword) {
    const enc = readLocal<LegacySecureWallet[]>(LEGACY_ENCRYPTED_KEY) ?? []
    for (const w of enc) {
      const key = `${w.chain}:${w.address}`
      if (known.has(key)) {
        result.skipped++
        continue
      }
      try {
        const wallet: VaultWallet = {
          id: w.id,
          chain: w.chain,
          address: w.address,
          publicKey: w.publicKey ?? '',
          balance: w.balance ?? '0.00',
          usdValue: w.usdValue ?? 0,
          createdAt: w.createdAt ?? Date.now(),
          name: w.name,
        }
        if (w.encryptedMnemonic) {
          const mnemonic = await decryptLegacy(w.encryptedMnemonic, oldPassword)
          wallet.encryptedMnemonic = await encryptUnderMaster(mnemonic, masterKey, HKDF_DOMAINS.walletMnemonic(w.id))
        }
        if (w.encryptedPrivateKey) {
          const pk = await decryptLegacy(w.encryptedPrivateKey, oldPassword)
          wallet.encryptedPrivateKey = await encryptUnderMaster(pk, masterKey, HKDF_DOMAINS.walletPrivateKey(w.id))
        }
        await putWallet(wallet)
        known.add(key)
        result.migratedEncrypted++
      } catch (e) {
        // Most likely cause: wrong old password. We don't throw — surface per-wallet
        // so partial migration still works.
        result.errors.push(`encrypted ${w.id}: ${(e as Error).message}`)
      }
    }

    // Only retire LEGACY_ENCRYPTED_KEY if every entry migrated without error.
    if (enc.length > 0 && result.errors.length === 0) {
      localStorage.setItem(`${LEGACY_ENCRYPTED_KEY}_backup`, JSON.stringify(enc))
      localStorage.removeItem(LEGACY_ENCRYPTED_KEY)
      localStorage.removeItem(LEGACY_PASSWORD_CHECK_KEY)
    }
  }

  return result
}

/**
 * Convenience: throws if there's legacy ENCRYPTED data that needs the user to
 * supply their old password. Call before deciding which migration path to run.
 */
export function requiresOldPassword(): boolean {
  const enc = readLocal<LegacySecureWallet[]>(LEGACY_ENCRYPTED_KEY) ?? []
  return enc.length > 0
}

/**
 * Surface a typed error if migration was requested but legacy storage is empty.
 * Useful for guards in UI flows.
 */
export function ensureHasLegacy(): void {
  if (!hasLegacyData()) throw new VaultError('no legacy data to migrate', 'storage-error')
}
