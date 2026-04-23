/**
 * SecureKeyStorage - Encrypted Local Storage for Wallet Keys
 *
 * Zero-knowledge architecture:
 * - Keys encrypted with AES-256-GCM
 * - Password-derived keys using PBKDF2
 * - All crypto happens in browser via Web Crypto API
 * - Server NEVER sees passwords or private keys
 *
 * Security Model:
 * 1. User sets a password (never stored)
 * 2. Password → PBKDF2 → AES key
 * 3. Private keys/mnemonics encrypted with AES key
 * 4. Only encrypted data stored in localStorage
 */

// ============================================
// TYPES
// ============================================

export interface EncryptedData {
  ciphertext: string // Base64 encoded
  iv: string // Base64 encoded initialization vector
  salt: string // Base64 encoded salt for PBKDF2
  version: number // Schema version for future migrations
}

export interface SecureWallet {
  id: string
  chain: string
  address: string
  publicKey: string
  encryptedMnemonic?: EncryptedData
  encryptedPrivateKey?: EncryptedData
  balance: string
  usdValue: number
  createdAt: number
  name?: string
}

export interface WalletBackup {
  version: number
  createdAt: string
  wallets: SecureWallet[]
  checksum: string
}

export interface StorageStatus {
  isLocked: boolean
  hasPassword: boolean
  walletCount: number
  lastUnlocked?: number
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'u_secure_wallets'
const PASSWORD_CHECK_KEY = 'u_password_check'
const _SETTINGS_KEY = 'u_secure_settings'
const PBKDF2_ITERATIONS = 100000
const SCHEMA_VERSION = 1
const AUTO_LOCK_MS = 15 * 60 * 1000 // 15 minutes

// ============================================
// CRYPTO UTILITIES (Web Crypto API)
// ============================================

/**
 * Generate cryptographically secure random bytes
 */
function getRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * Convert Uint8Array to Base64 string
 */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Convert Base64 string to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Derive an AES key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ])

  // Derive AES-256-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypt data with AES-256-GCM
 */
async function encrypt(plaintext: string, password: string): Promise<EncryptedData> {
  const salt = getRandomBytes(16)
  const iv = getRandomBytes(12)
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    new TextEncoder().encode(plaintext),
  )

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    version: SCHEMA_VERSION,
  }
}

/**
 * Decrypt data with AES-256-GCM
 */
async function decrypt(encrypted: EncryptedData, password: string): Promise<string> {
  const salt = fromBase64(encrypted.salt)
  const iv = fromBase64(encrypted.iv)
  const ciphertext = fromBase64(encrypted.ciphertext)
  const key = await deriveKey(password, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  )

  return new TextDecoder().decode(plaintext)
}

/**
 * Generate SHA-256 hash for checksums
 */
async function sha256(data: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return toBase64(new Uint8Array(hashBuffer))
}

// ============================================
// SECURE KEY STORAGE CLASS
// ============================================

class SecureKeyStorageClass {
  private cachedKey: CryptoKey | null = null
  private lastActivity: number = 0
  private autoLockTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * Check if a password has been set up
   */
  hasPassword(): boolean {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(PASSWORD_CHECK_KEY) !== null
  }

  /**
   * Check if the storage is currently locked
   */
  isLocked(): boolean {
    if (!this.hasPassword()) return false
    if (!this.cachedKey) return true

    // Check auto-lock timeout
    if (Date.now() - this.lastActivity > AUTO_LOCK_MS) {
      this.lock()
      return true
    }

    return false
  }

  /**
   * Get current storage status
   */
  getStatus(): StorageStatus {
    const wallets = this.getEncryptedWallets()
    return {
      isLocked: this.isLocked(),
      hasPassword: this.hasPassword(),
      walletCount: wallets.length,
      lastUnlocked: this.lastActivity || undefined,
    }
  }

  /**
   * Set up a new password (first time setup)
   * DEPRECATED: use Vault.setPassword() instead
   * TODO: migrate to vault.ts which stores in IndexedDB
   */
  async setupPassword(password: string): Promise<void> {
    if (this.hasPassword()) {
      throw new Error('Password already set. Use changePassword() instead.')
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Create a check value to verify password later
    const checkValue = `ONE_WALLET_CHECK_${Date.now()}`
    const encrypted = await encrypt(checkValue, password)

    // REMOVED: localStorage.setItem(PASSWORD_CHECK_KEY, JSON.stringify(encrypted))
    // TODO: read from IndexedDB via vault.ts instead

    // Cache the derived key
    const salt = fromBase64(encrypted.salt)
    this.cachedKey = await deriveKey(password, salt)
    this.lastActivity = Date.now()
    this.startAutoLockTimer()

    // Migrate any existing unencrypted wallets
    await this.migrateUnencryptedWallets(password)
  }

  /**
   * Unlock storage with password
   * DEPRECATED: use Vault.unlockWithPassword() instead
   * TODO: migrate to vault.ts which stores in IndexedDB
   */
  async unlock(password: string): Promise<boolean> {
    // REMOVED: const checkData = localStorage.getItem(PASSWORD_CHECK_KEY)
    // TODO: read from IndexedDB via vault.ts instead
    throw new Error('SecureKeyStorage is deprecated. Use Vault.unlockWithPassword() instead.')
  }

  /**
   * Lock the storage
   */
  lock(): void {
    this.cachedKey = null
    this.lastActivity = 0
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer)
      this.autoLockTimer = null
    }
  }

  /**
   * Change password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // Verify old password
    const unlocked = await this.unlock(oldPassword)
    if (!unlocked) {
      throw new Error('Current password is incorrect')
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters')
    }

    // Get all wallets decrypted
    const wallets = await this.getAllWallets(oldPassword)

    // REMOVED: Re-encrypt everything with new password via localStorage
    // TODO: read from IndexedDB via vault.ts instead

    // Re-encrypt all wallets
    for (const wallet of wallets) {
      if (wallet.mnemonic) {
        await this.saveWallet(
          {
            ...wallet,
            mnemonic: wallet.mnemonic,
          },
          newPassword,
        )
      }
    }

    // Update cached key
    const salt = fromBase64(encrypted.salt)
    this.cachedKey = await deriveKey(newPassword, salt)
    this.lastActivity = Date.now()
  }

  /**
   * Save a wallet with encrypted mnemonic/private key
   */
  async saveWallet(
    wallet: {
      id: string
      chain: string
      address: string
      publicKey?: string
      mnemonic?: string
      privateKey?: string
      balance?: string
      usdValue?: number
      name?: string
    },
    password?: string,
  ): Promise<SecureWallet> {
    this.touchActivity()

    const pwd = password || (await this.getPasswordFromCache())
    if (!pwd && (wallet.mnemonic || wallet.privateKey)) {
      throw new Error('Storage is locked. Please unlock first.')
    }

    const secureWallet: SecureWallet = {
      id: wallet.id,
      chain: wallet.chain,
      address: wallet.address,
      publicKey: wallet.publicKey || '',
      balance: wallet.balance || '0.00',
      usdValue: wallet.usdValue || 0,
      createdAt: Date.now(),
      name: wallet.name,
    }

    // Encrypt sensitive data
    if (wallet.mnemonic && pwd) {
      secureWallet.encryptedMnemonic = await encrypt(wallet.mnemonic, pwd)
    }
    if (wallet.privateKey && pwd) {
      secureWallet.encryptedPrivateKey = await encrypt(wallet.privateKey, pwd)
    }

    // REMOVED: Save to storage via localStorage
    // TODO: read from IndexedDB via vault.ts instead
    // SecureKeyStorage is deprecated — use Vault.saveWallet() instead
    return secureWallet
  }

  /**
   * Get all wallets (encrypted mnemonics not decrypted)
   */
  getEncryptedWallets(): SecureWallet[] {
    if (typeof localStorage === 'undefined') return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    try {
      return JSON.parse(stored) as SecureWallet[]
    } catch {
      return []
    }
  }

  /**
   * Get all wallets with decrypted mnemonics
   */
  async getAllWallets(password?: string): Promise<Array<SecureWallet & { mnemonic?: string; privateKey?: string }>> {
    this.touchActivity()

    const pwd = password || (await this.getPasswordFromCache())
    const wallets = this.getEncryptedWallets()

    return Promise.all(
      wallets.map(async (wallet) => {
        const result: SecureWallet & { mnemonic?: string; privateKey?: string } = { ...wallet }

        if (wallet.encryptedMnemonic && pwd) {
          try {
            result.mnemonic = await decrypt(wallet.encryptedMnemonic, pwd)
          } catch {
            // Decryption failed, mnemonic stays undefined
          }
        }

        if (wallet.encryptedPrivateKey && pwd) {
          try {
            result.privateKey = await decrypt(wallet.encryptedPrivateKey, pwd)
          } catch {
            // Decryption failed, privateKey stays undefined
          }
        }

        return result
      }),
    )
  }

  /**
   * Get a single wallet's mnemonic
   */
  async getMnemonic(walletId: string, password?: string): Promise<string | null> {
    this.touchActivity()

    const pwd = password || (await this.getPasswordFromCache())
    if (!pwd) {
      throw new Error('Storage is locked. Please unlock first.')
    }

    const wallets = this.getEncryptedWallets()
    const wallet = wallets.find((w) => w.id === walletId)

    if (!wallet?.encryptedMnemonic) {
      return null
    }

    try {
      return await decrypt(wallet.encryptedMnemonic, pwd)
    } catch {
      throw new Error('Failed to decrypt mnemonic. Wrong password?')
    }
  }

  /**
   * Delete a wallet
   * DEPRECATED: use Vault.deleteWallet() instead
   * TODO: migrate to vault.ts which stores in IndexedDB
   */
  deleteWallet(walletId: string): void {
    // REMOVED: localStorage wallet deletion
    // Use Vault.deleteWallet(walletId) instead
  }

  /**
   * Update wallet balance (no password needed)
   * DEPRECATED: use Vault.updateBalance() instead
   * TODO: migrate to vault.ts which stores in IndexedDB
   */
  updateBalance(walletId: string, balance: string, usdValue: number): void {
    // REMOVED: localStorage wallet update
    // Use Vault.updateBalance(walletId, balance, usdValue) instead
  }

  /**
   * Export wallets as encrypted backup
   */
  async exportBackup(password: string): Promise<string> {
    const wallets = this.getEncryptedWallets()

    const backup: WalletBackup = {
      version: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      wallets,
      checksum: await sha256(JSON.stringify(wallets)),
    }

    // Double encrypt the entire backup
    const encrypted = await encrypt(JSON.stringify(backup), password)
    return JSON.stringify(encrypted)
  }

  /**
   * Import wallets from encrypted backup
   */
  async importBackup(backupData: string, password: string): Promise<number> {
    try {
      const encrypted = JSON.parse(backupData) as EncryptedData
      const decrypted = await decrypt(encrypted, password)
      const backup = JSON.parse(decrypted) as WalletBackup

      // Verify checksum
      const calculatedChecksum = await sha256(JSON.stringify(backup.wallets))
      if (calculatedChecksum !== backup.checksum) {
        throw new Error('Backup checksum mismatch - file may be corrupted')
      }

      // Merge with existing wallets (don't overwrite)
      const existing = this.getEncryptedWallets()
      const existingIds = new Set(existing.map((w) => w.address))

      let imported = 0
      for (const wallet of backup.wallets) {
        if (!existingIds.has(wallet.address)) {
          existing.push(wallet)
          imported++
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      return imported
    } catch (e) {
      if (e instanceof Error && e.message.includes('checksum')) {
        throw e
      }
      throw new Error('Failed to import backup. Wrong password or corrupted file.')
    }
  }

  /**
   * Migrate unencrypted wallets from old storage
   * DEPRECATED: wallet storage now uses IndexedDB (vault) only.
   * This method is kept for backward compatibility but no longer performs migrations.
   * TODO: read from IndexedDB via vault.ts instead
   */
  private async migrateUnencryptedWallets(password: string): Promise<void> {
    // Migration from localStorage to IndexedDB vault is handled by vault.ts migration.ts
    // If you need to migrate old unencrypted wallets, use useVault.migrate() instead
    return
  }

  /**
   * Get password from cached key (not possible - keys are one-way)
   * This is a placeholder - in practice, user must re-enter password
   */
  private async getPasswordFromCache(): Promise<string | null> {
    // Cannot recover password from CryptoKey
    // This method exists for API consistency
    // Real implementation requires password to be passed or stored temporarily
    return null
  }

  /**
   * Update last activity timestamp
   */
  private touchActivity(): void {
    this.lastActivity = Date.now()
  }

  /**
   * Start auto-lock timer
   */
  private startAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer)
    }

    this.autoLockTimer = setTimeout(() => {
      this.lock()
    }, AUTO_LOCK_MS)
  }

  /**
   * Clear all data (DANGER - irreversible!)
   * DEPRECATED: use Vault.wipeAll() instead
   * TODO: migrate to vault.ts which stores in IndexedDB
   */
  clearAll(): void {
    this.lock()
    // REMOVED: localStorage.removeItem calls
    // Use Vault.wipeAll() instead
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const SecureKeyStorage = new SecureKeyStorageClass()

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a strong random password suggestion
 */
export function generateStrongPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const bytes = getRandomBytes(16)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string
} {
  let score = 0
  const feedback: string[] = []

  if (password.length >= 8) score++
  else feedback.push('At least 8 characters')

  if (password.length >= 12) score++

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  else feedback.push('Mix upper and lowercase')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Add numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('Add special characters')

  return {
    score: Math.min(score, 4),
    feedback: feedback.length > 0 ? feedback.join(', ') : 'Strong password!',
  }
}

/**
 * Format mnemonic for display (add line breaks)
 */
export function formatMnemonic(mnemonic: string): string[] {
  return mnemonic.split(' ')
}

/**
 * Validate mnemonic format
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/)
  return words.length === 12 || words.length === 24
}
