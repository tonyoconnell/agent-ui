/**
 * Vault — shared types
 *
 * The public type contract every vault module codes against. Importing
 * from siblings (e.g. crypto.ts) MUST re-use these types, never redefine.
 *
 * Design notes:
 *   - All ciphertext is `Uint8Array` (binary-native via IndexedDB).
 *     Base64 only at the API boundary (export/import/sync).
 *   - `EncryptedRecord` carries its own salt + iv + tag — self-describing,
 *     so re-decryption needs only the master key and the record itself.
 *   - HKDF `info` field domain-separates per-wallet keys from auth keys
 *     so a leak of one ciphertext can never cross-decrypt another.
 */

// ============================================
// SCHEMA
// ============================================

export const VAULT_SCHEMA_VERSION = 2 as const

/** Encrypted blob — self-describing, binary-native. */
export interface EncryptedRecord {
  /** AES-256-GCM ciphertext (includes auth tag) */
  ciphertext: Uint8Array
  /** 12-byte initialization vector */
  iv: Uint8Array
  /** HKDF info string used to derive the per-record subkey */
  info: string
  /** Schema version for future migrations */
  version: number
}

/** Stored wallet record — secrets always encrypted. */
export interface VaultWallet {
  /** Stable id (e.g. "eth-0", "sui-0") */
  id: string
  /** Chain identifier (e.g. "eth", "btc", "sol", "sui", "usdc", "one") */
  chain: string
  /** Public address */
  address: string
  /** Public key hex (or empty if not applicable) */
  publicKey: string
  /** Encrypted BIP-39 mnemonic, if wallet was generated from one */
  encryptedMnemonic?: EncryptedRecord
  /** Encrypted raw private key */
  encryptedPrivateKey?: EncryptedRecord
  /** Cached balance string (display only, not security-critical) */
  balance: string
  /** Cached USD value (display only) */
  usdValue: number
  /** Created at, ms epoch */
  createdAt: number
  /** Optional user-supplied label */
  name?: string
}

// ============================================
// PASSKEY
// ============================================

/** Persisted passkey enrollment metadata. */
export interface PasskeyEnrollment {
  /** WebAuthn credential id (raw bytes) */
  credentialId: Uint8Array
  /** Random 32-byte salt used for PRF eval — stable for life of enrollment */
  prfSalt: Uint8Array
  /** Hint for UX ("Touch ID", "Face ID", "YubiKey…") */
  authenticatorLabel?: string
  /** Created at, ms epoch */
  createdAt: number
}

/** Result of a passkey unlock attempt. */
export type PasskeyUnlockResult =
  | { ok: true; secret: Uint8Array }
  | { ok: false; reason: 'cancelled' | 'no-prf' | 'no-credential' | 'unsupported' | 'error'; detail?: string }

/** Capability detection result. */
export interface PasskeyCapabilities {
  /** WebAuthn API present */
  webauthn: boolean
  /** Platform authenticator present (Touch ID, Windows Hello, etc.) */
  platformAuthenticator: boolean
  /** PRF extension supported (key feature for our flow) */
  prf: boolean
}

// ============================================
// VAULT META
// ============================================

/** Top-level vault configuration record (one per origin). */
export interface VaultMeta {
  /** Always "singleton" — there's exactly one of these */
  id: 'singleton'
  /** Schema version */
  version: number
  /** Created at, ms epoch */
  createdAt: number
  /** True iff a password fallback is configured */
  hasPassword: boolean
  /** Encrypted "ONE_VAULT_CHECK" sentinel for password verification.
   *  When present, decrypt with password-derived key to verify password. */
  passwordCheck?: EncryptedRecord
  /** Salt used to derive password key (separate from per-record salts) */
  passwordSalt?: Uint8Array
  /** Passkey enrollment(s). Multiple supported for cross-device. */
  passkeys: PasskeyEnrollment[]
  /** Encrypted recovery seed sentinel — proves the recovery phrase
   *  re-derives the same vault master. Optional (set if user accepted
   *  recovery phrase during setup). */
  recoveryCheck?: EncryptedRecord
  /** Auto-lock idle timeout in ms (default 30 min) */
  autoLockMs: number
  /** Lock on tab close? */
  lockOnTabClose: boolean
}

// ============================================
// AUDIT
// ============================================

/** Append-only audit event — one per security-relevant action. */
export interface AuditEvent {
  /** Auto-incremented id */
  id?: number
  /** ms epoch */
  at: number
  /** Verb: setup | unlock | lock | save | reveal | sign | export | import | delete | step-up */
  verb: string
  /** Outcome */
  outcome: 'ok' | 'fail' | 'cancelled'
  /** Auth method used: passkey | password | recovery */
  method?: 'passkey' | 'password' | 'recovery'
  /** Subject: walletId for wallet-scoped events */
  subject?: string
  /** Optional detail (never includes secrets) */
  detail?: string
}

// ============================================
// SESSION
// ============================================

/** Live unlock session — held in memory, never persisted. */
export interface VaultSession {
  /** AES master key (CryptoKey, non-extractable) */
  masterKey: CryptoKey
  /** Method that produced the master key */
  method: 'passkey' | 'password' | 'recovery'
  /** ms epoch of unlock */
  unlockedAt: number
  /** ms epoch of last activity */
  lastActivityAt: number
}

/** Public, redacted view of vault state — safe to render in React. */
export interface VaultStatus {
  hasVault: boolean
  hasPasskey: boolean
  hasPassword: boolean
  isLocked: boolean
  walletCount: number
  unlockMethod?: 'passkey' | 'password' | 'recovery'
  unlockedAt?: number
  capabilities: PasskeyCapabilities
}

// ============================================
// HKDF DOMAINS
// ============================================

/** HKDF info strings — domain separation. NEVER reuse across domains. */
export const HKDF_DOMAINS = {
  /** Per-wallet AES key for mnemonic encryption */
  walletMnemonic: (walletId: string) => `vault.v${VAULT_SCHEMA_VERSION}.wallet.${walletId}.mnemonic`,
  /** Per-wallet AES key for private key encryption */
  walletPrivateKey: (walletId: string) => `vault.v${VAULT_SCHEMA_VERSION}.wallet.${walletId}.pk`,
  /** Master key check sentinel */
  masterCheck: () => `vault.v${VAULT_SCHEMA_VERSION}.master.check`,
  /** Recovery phrase verification sentinel */
  recoveryCheck: () => `vault.v${VAULT_SCHEMA_VERSION}.recovery.check`,
  /** Backup export key */
  backupExport: () => `vault.v${VAULT_SCHEMA_VERSION}.backup.export`,
  /** Deterministic wallet seed — Touch ID → PRF → master → this seed → keypair.
   *  Stable wallet ID format: "<context>-<chain>-<index>" e.g. "mainnet-sui-0". */
  walletSeed: (chain: string, index: number, context: 'mainnet' | 'testnet') =>
    `vault.v${VAULT_SCHEMA_VERSION}.wallet.seed.${context}.${chain}.${index}`,
} as const

// ============================================
// ERRORS
// ============================================

export class VaultError extends Error {
  constructor(
    message: string,
    public code: VaultErrorCode,
  ) {
    super(message)
    this.name = 'VaultError'
  }
}

export type VaultErrorCode =
  | 'locked'
  | 'no-vault'
  | 'wrong-password'
  | 'wrong-recovery'
  | 'passkey-cancelled'
  | 'passkey-unsupported'
  | 'tamper-detected'
  | 'rate-limited'
  | 'invalid-mnemonic'
  | 'storage-error'
  | 'crypto-error'
  | 'server-error'
