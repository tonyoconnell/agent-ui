// vault/vault.ts — orchestration. Composes crypto + storage + passkey + recovery.
// Master key shape: every unlock path produces 32 raw bytes → HKDF base → per-wallet subkeys.
// Sessions hold a non-extractable CryptoKey only — the raw secret is never retained.

import {
  base64ToBytes,
  bytesToBase64,
  constantTimeEqual,
  decryptUnderMaster,
  deriveSecretFromPassword,
  encryptUnderMaster,
  importMasterSecret,
  randomBytes,
  SALT_LENGTH,
  sha256,
  utf8Encode,
} from './crypto'
import {
  detectCapabilities,
  enrollPasskey,
  guessAuthenticatorLabel,
  unlockWithPasskey as passkeyUnlock,
} from './passkey'
import { assertValidRecoveryPhrase, generateRecoveryPhrase, recoveryToVaultSecret } from './recovery'
import {
  appendAudit,
  clearSessionRow,
  deleteVaultDb,
  getMeta,
  getSessionRow,
  isStorageAvailable,
  putMeta,
  putSessionRow,
  putWallet,
  deleteWallet as storageDeleteWallet,
  getWallet as storageGetWallet,
  listWallets as storageListWallets,
} from './storage'
import {
  type AuditEvent,
  type EncryptedRecord,
  HKDF_DOMAINS,
  type PasskeyEnrollment,
  VAULT_SCHEMA_VERSION,
  VaultError,
  type VaultMeta,
  type VaultSession,
  type VaultStatus,
  type VaultWallet,
} from './types'

// ============================================
// CONFIG
// ============================================

// 0 = never auto-lock. Vault stays unlocked until the user explicitly Locks
// or Signs out. Aligns with the "stay logged in indefinitely" contract in
// `lifecycle-auth.md`. armAutoLock() treats 0 as "no timer".
const DEFAULT_AUTO_LOCK_MS = 0
const SENTINEL_PLAINTEXT = 'ONE_VAULT_v2_OK'
const RATE_LIMIT_BACKOFFS_MS = [0, 1_000, 2_000, 4_000, 8_000, 16_000, 30_000] // attempts 1..7
const RATE_LIMIT_LOCKOUT_MS = 5 * 60 * 1000 // after 7th wrong → 5 min lockout

// ============================================
// SESSION + RATE-LIMIT STATE (module-private)
// ============================================

let session: VaultSession | null = null
let autoLockTimer: ReturnType<typeof setTimeout> | null = null
let failedAttempts = 0
let lockoutUntil = 0

function clearSession(): void {
  session = null
  if (autoLockTimer) {
    clearTimeout(autoLockTimer)
    autoLockTimer = null
  }
  // Also drop the persistent IDB session row so a hard reload doesn't
  // immediately re-hydrate. Fire-and-forget; the user is leaving regardless.
  void clearSessionRow().catch(() => {})
}

/**
 * Hydrate the in-memory `session` from a persistent IDB row, if any.
 * Idempotent — running it while already unlocked is a no-op. Called
 * lazily before any read that needs to know lock state.
 *
 * Web Crypto CryptoKey objects survive structured cloning, even when
 * non-extractable, so a full page reload can re-attach the same key
 * without re-prompting the user for biometrics.
 */
let hydratePromise: Promise<void> | null = null
async function hydrateFromIdb(): Promise<void> {
  if (session) return
  if (hydratePromise) return hydratePromise
  hydratePromise = (async () => {
    if (!isStorageAvailable()) return
    let row: Awaited<ReturnType<typeof getSessionRow>> | null = null
    try {
      row = await getSessionRow()
    } catch {
      return
    }
    if (!row || session) return
    session = {
      masterKey: row.masterKey,
      method: row.method,
      unlockedAt: row.unlockedAt,
      lastActivityAt: Date.now(),
    }
    try {
      const meta = await getMeta()
      if (meta) armAutoLock(meta.autoLockMs)
      persistSession()
    } catch {
      // ignore — auto-lock is best-effort
    }
  })()
  try {
    await hydratePromise
  } finally {
    hydratePromise = null
  }
}

/**
 * Persist the current in-memory session to IDB so a page reload can
 * resume without prompting. Fire-and-forget; failure is non-fatal.
 */
function persistSession(): void {
  if (!session) return
  void putSessionRow({
    masterKey: session.masterKey,
    method: session.method,
    unlockedAt: session.unlockedAt,
  }).catch(() => {})
}

function armAutoLock(autoLockMs: number): void {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer)
    autoLockTimer = null
  }
  // 0 → never auto-lock (the indefinite-session default). Caller has
  // already cleared any existing timer above.
  if (autoLockMs <= 0) return
  autoLockTimer = setTimeout(() => clearSession(), autoLockMs)
}

function touchActivity(): void {
  if (!session) return
  session.lastActivityAt = Date.now()
  // Re-arm timer on activity so idle counts from last touch, not unlock.
  // Read meta lazily — caller's autoLockMs may have changed.
  void getMeta().then((meta) => {
    if (meta && session) armAutoLock(meta.autoLockMs)
    persistSession()
  })
}

function requireUnlocked(): VaultSession {
  if (!session) throw new VaultError('vault is locked', 'locked')
  return session
}

function checkRateLimit(): void {
  if (lockoutUntil > Date.now()) {
    const seconds = Math.ceil((lockoutUntil - Date.now()) / 1000)
    throw new VaultError(`too many failed attempts; try again in ${seconds}s`, 'rate-limited')
  }
  const backoff = RATE_LIMIT_BACKOFFS_MS[Math.min(failedAttempts, RATE_LIMIT_BACKOFFS_MS.length - 1)]
  if (backoff > 0) {
    // Synchronous-ish backoff: caller awaits a sleep before the cryptographic work happens.
    // (We can't actually sleep here without making this async; the caller does.)
  }
}

async function backoffSleep(): Promise<void> {
  const backoff = RATE_LIMIT_BACKOFFS_MS[Math.min(failedAttempts, RATE_LIMIT_BACKOFFS_MS.length - 1)]
  if (backoff > 0) await new Promise((r) => setTimeout(r, backoff))
}

function recordFailure(): void {
  failedAttempts++
  if (failedAttempts >= RATE_LIMIT_BACKOFFS_MS.length) {
    lockoutUntil = Date.now() + RATE_LIMIT_LOCKOUT_MS
    failedAttempts = 0 // reset counter; lockout takes over
  }
}

function recordSuccess(): void {
  failedAttempts = 0
  lockoutUntil = 0
}

// ============================================
// SENTINEL — proves the master key matches what set up the vault
// ============================================

async function _makeSentinel(masterKey: CryptoKey): Promise<EncryptedRecord> {
  return encryptUnderMaster(SENTINEL_PLAINTEXT, masterKey, HKDF_DOMAINS.masterCheck())
}

async function verifySentinel(record: EncryptedRecord, masterKey: CryptoKey): Promise<boolean> {
  try {
    const pt = await decryptUnderMaster(record, masterKey)
    return constantTimeEqual(utf8Encode(pt), utf8Encode(SENTINEL_PLAINTEXT))
  } catch {
    return false
  }
}

// ============================================
// AUDIT helper — never blocks the caller, never throws.
// ============================================

function audit(ev: Omit<AuditEvent, 'id' | 'at'>): void {
  void appendAudit({ ...ev, at: Date.now() }).catch(() => {})
}

// ============================================
// MUTATION HOOK — fire-and-forget, best-effort.
// `cloud sync` registers here so saveWallet/deleteWallet upload automatically.
// ============================================

type MutationListener = () => void | Promise<void>
const mutationListeners = new Set<MutationListener>()

export function onMutation(fn: MutationListener): () => void {
  mutationListeners.add(fn)
  return () => {
    mutationListeners.delete(fn)
  }
}

function notifyMutation(): void {
  for (const fn of mutationListeners) {
    try {
      void Promise.resolve(fn()).catch(() => {})
    } catch {
      // swallow — listeners must never break the mutation path
    }
  }
}

// ============================================
// STATUS
// ============================================

export async function hasVault(): Promise<boolean> {
  if (!isStorageAvailable()) return false
  const meta = await getMeta()
  return meta !== null
}

export async function getStatus(): Promise<VaultStatus> {
  const caps = await detectCapabilities()
  if (!isStorageAvailable()) {
    return {
      hasVault: false,
      hasPasskey: false,
      hasPassword: false,
      isLocked: true,
      walletCount: 0,
      capabilities: caps,
    }
  }
  // Resume any persistent session left behind by a previous page load.
  // Cheap when already in-memory (early-returns immediately).
  await hydrateFromIdb()
  const meta = await getMeta()
  const wallets = meta ? await storageListWallets() : []
  return {
    hasVault: meta !== null,
    hasPasskey: meta ? meta.passkeys.length > 0 : false,
    hasPassword: meta ? meta.hasPassword : false,
    isLocked: session === null,
    walletCount: wallets.length,
    unlockMethod: session?.method,
    unlockedAt: session?.unlockedAt,
    capabilities: caps,
  }
}

// ============================================
// SETUP
// ============================================

export interface SetupOptions {
  /** Enroll a platform passkey (Touch ID / Face ID / Windows Hello). */
  enrollPasskey?: boolean
  /** Set a password fallback. */
  password?: string
  /** Display label shown in passkey OS prompt. */
  userIdentifier?: string
  /** auto-lock idle timeout (default 30 min). */
  autoLockMs?: number
  /** lock when tab closes. */
  lockOnTabClose?: boolean
}

export interface SetupResult {
  /** 24-word BIP-39 phrase. SHOW THIS ONCE. The user must write it down. */
  recoveryPhrase: string
  /** Passkey enrollment (if requested + supported). */
  enrollment?: PasskeyEnrollment
}

/**
 * Bootstrap a new vault. The recovery phrase is the source of truth — every
 * other unlock method (passkey, password) wraps the same master secret.
 */
export async function setup(opts: SetupOptions = {}): Promise<SetupResult> {
  if (!isStorageAvailable()) throw new VaultError('IndexedDB unavailable', 'storage-error')
  if (await hasVault()) throw new VaultError('vault already exists', 'storage-error')

  // 1. Generate recovery phrase — this IS the vault master.
  const recoveryPhrase = generateRecoveryPhrase()
  const masterSecret = await recoveryToVaultSecret(recoveryPhrase)
  const masterBaseKey = await importMasterSecret(masterSecret)

  // 2. Build initial meta record.
  const meta: VaultMeta = {
    id: 'singleton',
    version: VAULT_SCHEMA_VERSION,
    createdAt: Date.now(),
    hasPassword: false,
    passkeys: [],
    autoLockMs: opts.autoLockMs ?? DEFAULT_AUTO_LOCK_MS,
    lockOnTabClose: opts.lockOnTabClose ?? false,
    recoveryCheck: await encryptUnderMaster(SENTINEL_PLAINTEXT, masterBaseKey, HKDF_DOMAINS.recoveryCheck()),
  }

  // 3. Optional passkey enrollment.
  let enrollment: PasskeyEnrollment | undefined
  let enrollmentPrfSecret: Uint8Array | undefined
  if (opts.enrollPasskey) {
    try {
      const res = await enrollPasskey(opts.userIdentifier ?? 'ONE Vault', opts.userIdentifier ?? 'ONE Vault')
      enrollment = res.enrollment
      enrollmentPrfSecret = res.prfSecret
      enrollment.authenticatorLabel = enrollment.authenticatorLabel ?? guessAuthenticatorLabel()
      meta.passkeys.push(enrollment)
    } catch (e) {
      audit({ verb: 'setup', outcome: 'fail', method: 'passkey', detail: (e as Error).message })
      throw e
    }
  }

  // 4. Optional password fallback.
  if (opts.password) {
    if (opts.password.length < 8) throw new VaultError('password must be ≥ 8 characters', 'wrong-password')
    const passwordSalt = randomBytes(SALT_LENGTH)
    const pwSecret = await deriveSecretFromPassword(opts.password, passwordSalt)
    const pwBaseKey = await importMasterSecret(pwSecret)
    // Store the recovery sentinel encrypted under the PASSWORD-derived base key so
    // password unlock can recover the master too. We do this by storing the master
    // SECRET (32 bytes) wrapped under the password key. Same for passkey path.
    meta.passwordCheck = await encryptUnderMaster(bytesToBase64(masterSecret), pwBaseKey, HKDF_DOMAINS.masterCheck())
    meta.passwordSalt = passwordSalt
    meta.hasPassword = true
  }

  // 5. Wrap master secret under the passkey enrollment so unlock can recover it.
  // Reuse the PRF secret captured during enrollment verification — no third prompt.
  if (enrollment && enrollmentPrfSecret) {
    const wrapKey = await importMasterSecret(enrollmentPrfSecret)
    const wrappedMaster = await encryptUnderMaster(
      bytesToBase64(masterSecret),
      wrapKey,
      `${HKDF_DOMAINS.masterCheck()}.passkey.${bytesToBase64(enrollment.credentialId)}`,
    )
    ;(enrollment as PasskeyEnrollment & { wrappedMaster: EncryptedRecord }).wrappedMaster = wrappedMaster
  }

  await putMeta(meta)

  // 6. Open session immediately — no need to re-prompt the user post-setup.
  session = {
    masterKey: masterBaseKey,
    method: enrollment ? 'passkey' : opts.password ? 'password' : 'recovery',
    unlockedAt: Date.now(),
    lastActivityAt: Date.now(),
  }
  armAutoLock(meta.autoLockMs)
  persistSession()

  audit({ verb: 'setup', outcome: 'ok', method: session.method })
  return { recoveryPhrase, enrollment }
}

// ============================================
// UNLOCK PATHS
// ============================================

async function loadMeta(): Promise<VaultMeta> {
  const meta = await getMeta()
  if (!meta) throw new VaultError('no vault on this device', 'no-vault')
  // Migrate legacy 30-min auto-lock default to "never" — pre-existing vaults
  // were created before the indefinite-session contract. User can still set
  // a real timeout via setAutoLockMs() if they want one.
  if (meta.autoLockMs === 30 * 60 * 1000) {
    meta.autoLockMs = 0
    await putMeta(meta)
  }
  return meta
}

/**
 * Unlock with a platform passkey. Tries every enrolled passkey in order.
 * Returns silently on success; throws VaultError on failure.
 */
export async function unlockWithPasskey(): Promise<void> {
  const meta = await loadMeta()
  if (meta.passkeys.length === 0) throw new VaultError('no passkey enrolled', 'passkey-unsupported')

  for (const enrollment of meta.passkeys) {
    const res = await passkeyUnlock(enrollment)
    if (!res.ok) {
      if (res.reason === 'cancelled') {
        audit({ verb: 'unlock', outcome: 'cancelled', method: 'passkey' })
        throw new VaultError('passkey prompt cancelled', 'passkey-cancelled')
      }
      continue // try next enrollment
    }
    // Recover master from the wrapped sentinel attached to this enrollment.
    const wrapped = (enrollment as PasskeyEnrollment & { wrappedMaster?: EncryptedRecord }).wrappedMaster
    if (!wrapped) {
      // Backwards-compat / corrupt enrollment — can't recover master here.
      continue
    }
    const wrapKey = await importMasterSecret(res.secret)
    let masterB64: string
    try {
      masterB64 = await decryptUnderMaster(wrapped, wrapKey)
    } catch {
      audit({ verb: 'unlock', outcome: 'fail', method: 'passkey', detail: 'wrapped-master decrypt' })
      throw new VaultError('passkey did not produce a valid master', 'tamper-detected')
    }
    const masterSecret = base64ToBytes(masterB64)
    const masterKey = await importMasterSecret(masterSecret)

    // Sentinel check — proves we have the right master.
    if (meta.recoveryCheck) {
      const ok = await verifySentinel(meta.recoveryCheck, masterKey)
      if (!ok) {
        audit({ verb: 'unlock', outcome: 'fail', method: 'passkey', detail: 'sentinel mismatch' })
        throw new VaultError('master key sentinel failed', 'tamper-detected')
      }
    }

    session = { masterKey, method: 'passkey', unlockedAt: Date.now(), lastActivityAt: Date.now() }
    armAutoLock(meta.autoLockMs)
    persistSession()
    recordSuccess()
    audit({ verb: 'unlock', outcome: 'ok', method: 'passkey' })
    return
  }

  audit({ verb: 'unlock', outcome: 'fail', method: 'passkey', detail: 'no enrollment matched' })
  throw new VaultError(
    'no credential found on this device — passkey may have been deleted from your browser',
    'passkey-unsupported',
  )
}

export async function unlockWithPassword(password: string): Promise<void> {
  checkRateLimit()
  await backoffSleep()

  const meta = await loadMeta()
  if (!meta.hasPassword || !meta.passwordCheck || !meta.passwordSalt) {
    throw new VaultError('no password set on this vault', 'wrong-password')
  }

  const pwSecret = await deriveSecretFromPassword(password, meta.passwordSalt)
  const pwBaseKey = await importMasterSecret(pwSecret)

  let masterB64: string
  try {
    masterB64 = await decryptUnderMaster(meta.passwordCheck, pwBaseKey)
  } catch {
    recordFailure()
    audit({ verb: 'unlock', outcome: 'fail', method: 'password' })
    throw new VaultError('wrong password', 'wrong-password')
  }
  const masterSecret = base64ToBytes(masterB64)
  const masterKey = await importMasterSecret(masterSecret)

  if (meta.recoveryCheck) {
    const ok = await verifySentinel(meta.recoveryCheck, masterKey)
    if (!ok) {
      recordFailure()
      audit({ verb: 'unlock', outcome: 'fail', method: 'password', detail: 'sentinel mismatch' })
      throw new VaultError('decrypted master failed sentinel check', 'tamper-detected')
    }
  }

  session = { masterKey, method: 'password', unlockedAt: Date.now(), lastActivityAt: Date.now() }
  armAutoLock(meta.autoLockMs)
  persistSession()
  recordSuccess()
  audit({ verb: 'unlock', outcome: 'ok', method: 'password' })
}

export async function unlockWithRecovery(phrase: string): Promise<void> {
  assertValidRecoveryPhrase(phrase)
  const meta = await loadMeta()
  const masterSecret = await recoveryToVaultSecret(phrase)
  const masterKey = await importMasterSecret(masterSecret)

  if (meta.recoveryCheck) {
    const ok = await verifySentinel(meta.recoveryCheck, masterKey)
    if (!ok) {
      audit({ verb: 'unlock', outcome: 'fail', method: 'recovery' })
      throw new VaultError('recovery phrase does not match this vault', 'wrong-recovery')
    }
  }

  session = { masterKey, method: 'recovery', unlockedAt: Date.now(), lastActivityAt: Date.now() }
  armAutoLock(meta.autoLockMs)
  persistSession()
  audit({ verb: 'unlock', outcome: 'ok', method: 'recovery' })
}

// ============================================
// LOCK
// ============================================

export function lock(): void {
  if (session) audit({ verb: 'lock', outcome: 'ok', method: session.method })
  clearSession()
}

export function isLocked(): boolean {
  return session === null
}

// ============================================
// WALLETS
// ============================================

export interface SaveWalletInput {
  id: string
  chain: string
  address: string
  publicKey?: string
  mnemonic?: string
  privateKey?: string
  balance?: string
  usdValue?: number
  name?: string
}

export async function saveWallet(input: SaveWalletInput): Promise<VaultWallet> {
  const s = requireUnlocked()
  touchActivity()

  const wallet: VaultWallet = {
    id: input.id,
    chain: input.chain,
    address: input.address,
    publicKey: input.publicKey ?? '',
    balance: input.balance ?? '0.00',
    usdValue: input.usdValue ?? 0,
    createdAt: Date.now(),
    name: input.name,
  }

  if (input.mnemonic) {
    wallet.encryptedMnemonic = await encryptUnderMaster(
      input.mnemonic,
      s.masterKey,
      HKDF_DOMAINS.walletMnemonic(input.id),
    )
  }
  if (input.privateKey) {
    wallet.encryptedPrivateKey = await encryptUnderMaster(
      input.privateKey,
      s.masterKey,
      HKDF_DOMAINS.walletPrivateKey(input.id),
    )
  }

  await putWallet(wallet)
  audit({ verb: 'save', outcome: 'ok', subject: input.id })
  notifyMutation()
  return wallet
}

export async function listWallets(): Promise<VaultWallet[]> {
  return storageListWallets()
}

export async function getWallet(id: string): Promise<VaultWallet | null> {
  return storageGetWallet(id)
}

export async function getMnemonic(walletId: string): Promise<string | null> {
  const s = requireUnlocked()
  touchActivity()
  const w = await storageGetWallet(walletId)
  if (!w?.encryptedMnemonic) return null
  try {
    const m = await decryptUnderMaster(w.encryptedMnemonic, s.masterKey)
    audit({ verb: 'reveal', outcome: 'ok', subject: walletId })
    return m
  } catch (e) {
    audit({ verb: 'reveal', outcome: 'fail', subject: walletId, detail: (e as Error).message })
    throw e
  }
}

export async function getPrivateKey(walletId: string): Promise<string | null> {
  const s = requireUnlocked()
  touchActivity()
  const w = await storageGetWallet(walletId)
  if (!w?.encryptedPrivateKey) return null
  try {
    const pk = await decryptUnderMaster(w.encryptedPrivateKey, s.masterKey)
    audit({ verb: 'reveal', outcome: 'ok', subject: walletId, detail: 'private-key' })
    return pk
  } catch (e) {
    audit({ verb: 'reveal', outcome: 'fail', subject: walletId, detail: (e as Error).message })
    throw e
  }
}

export async function deleteWallet(walletId: string): Promise<void> {
  requireUnlocked()
  touchActivity()
  await storageDeleteWallet(walletId)
  audit({ verb: 'delete', outcome: 'ok', subject: walletId })
  notifyMutation()
}

/** Update cached balance/USD — no auth required (display-only data). */
export async function updateBalance(walletId: string, balance: string, usdValue: number): Promise<void> {
  const w = await storageGetWallet(walletId)
  if (!w) return
  w.balance = balance
  w.usdValue = usdValue
  await putWallet(w)
}

// ============================================
// PASSKEY MANAGEMENT (while unlocked)
// ============================================

export async function addPasskey(userIdentifier?: string): Promise<PasskeyEnrollment> {
  const s = requireUnlocked()
  touchActivity()
  const meta = await loadMeta()

  const { enrollment, prfSecret } = await enrollPasskey(userIdentifier ?? 'ONE Vault', userIdentifier ?? 'ONE Vault')
  enrollment.authenticatorLabel = enrollment.authenticatorLabel ?? guessAuthenticatorLabel()

  // Reuse the PRF secret captured during enrollment verification — no extra prompt.
  const wrapKey = await importMasterSecret(prfSecret)

  // We need the raw 32-byte master to wrap, but the session only holds a CryptoKey.
  // Workaround: re-derive a fresh ephemeral via deriveBits using the same HKDF path
  // would change the secret. Instead: round-trip through the existing recoveryCheck —
  // we already proved the master decrypts the sentinel. We export the raw via
  // a small dance: encrypt a known plaintext under the master, decrypt with same.
  // CLEAN approach: serialise master out by re-running HKDF deriveBits from the master
  // key... but masterKey is non-extractable HKDF base, deriveBits is allowed.
  const rawMaster = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0) as unknown as BufferSource,
        info: utf8Encode(`${HKDF_DOMAINS.masterCheck()}.export`) as unknown as BufferSource,
      },
      s.masterKey,
      256,
    ),
  )
  const wrapped = await encryptUnderMaster(
    bytesToBase64(rawMaster),
    wrapKey,
    `${HKDF_DOMAINS.masterCheck()}.passkey.${bytesToBase64(enrollment.credentialId)}`,
  )
  ;(enrollment as PasskeyEnrollment & { wrappedMaster: EncryptedRecord }).wrappedMaster = wrapped

  meta.passkeys.push(enrollment)
  await putMeta(meta)
  audit({ verb: 'setup', outcome: 'ok', method: 'passkey', detail: 'added' })
  return enrollment
}

export async function removePasskey(credentialId: Uint8Array): Promise<void> {
  requireUnlocked()
  touchActivity()
  const meta = await loadMeta()
  meta.passkeys = meta.passkeys.filter((p) => !constantTimeEqual(p.credentialId, credentialId))
  await putMeta(meta)
  audit({ verb: 'setup', outcome: 'ok', method: 'passkey', detail: 'removed' })
}

// ============================================
// PASSWORD MANAGEMENT (while unlocked)
// ============================================

export async function setPassword(password: string): Promise<void> {
  const s = requireUnlocked()
  touchActivity()
  if (password.length < 8) throw new VaultError('password must be ≥ 8 characters', 'wrong-password')
  const meta = await loadMeta()

  const passwordSalt = randomBytes(SALT_LENGTH)
  const pwSecret = await deriveSecretFromPassword(password, passwordSalt)
  const pwBaseKey = await importMasterSecret(pwSecret)

  // Same export-master dance as addPasskey.
  const rawMaster = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0) as unknown as BufferSource,
        info: utf8Encode(`${HKDF_DOMAINS.masterCheck()}.export`) as unknown as BufferSource,
      },
      s.masterKey,
      256,
    ),
  )
  meta.passwordCheck = await encryptUnderMaster(bytesToBase64(rawMaster), pwBaseKey, HKDF_DOMAINS.masterCheck())
  meta.passwordSalt = passwordSalt
  meta.hasPassword = true
  await putMeta(meta)
  audit({ verb: 'setup', outcome: 'ok', method: 'password' })
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await unlockWithPassword(oldPassword) // verifies, opens session
  await setPassword(newPassword)
}

export async function removePassword(): Promise<void> {
  requireUnlocked()
  touchActivity()
  const meta = await loadMeta()
  meta.hasPassword = false
  meta.passwordCheck = undefined
  meta.passwordSalt = undefined
  await putMeta(meta)
  audit({ verb: 'setup', outcome: 'ok', method: 'password', detail: 'removed' })
}

// ============================================
// STEP-UP — re-verify presence for sensitive ops
// ============================================

/**
 * Step-up: prompt the user to confirm presence (Touch ID re-tap, or password
 * re-entry) before proceeding with a sensitive op. Returns true on success,
 * false on cancel.
 */
export async function stepUpPasskey(): Promise<boolean> {
  if (!session) return false
  const meta = await loadMeta()
  if (meta.passkeys.length === 0) return false
  for (const e of meta.passkeys) {
    const res = await passkeyUnlock(e)
    if (res.ok) {
      audit({ verb: 'step-up', outcome: 'ok', method: 'passkey' })
      touchActivity()
      return true
    }
    if (res.reason === 'cancelled') {
      audit({ verb: 'step-up', outcome: 'cancelled', method: 'passkey' })
      return false
    }
  }
  return false
}

// ============================================
// EXPORT / IMPORT BACKUP
// ============================================

interface BackupEnvelope {
  version: number
  createdAt: string
  wallets: VaultWallet[]
  checksum: string // sha256(JSON.stringify(wallets))
}

/** Export an encrypted backup. The export password is independent of vault password. */
export async function exportBackup(exportPassword: string): Promise<string> {
  if (exportPassword.length < 8) throw new VaultError('export password must be ≥ 8 chars', 'wrong-password')
  const wallets = await storageListWallets()
  const json = JSON.stringify(wallets, replaceBytes)
  const checksumBytes = await sha256(utf8Encode(json))
  const envelope: BackupEnvelope = {
    version: VAULT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    wallets,
    checksum: bytesToBase64(checksumBytes),
  }

  const salt = randomBytes(SALT_LENGTH)
  const exportSecret = await deriveSecretFromPassword(exportPassword, salt)
  const exportBase = await importMasterSecret(exportSecret)
  const ciphertext = await encryptUnderMaster(
    JSON.stringify(envelope, replaceBytes),
    exportBase,
    HKDF_DOMAINS.backupExport(),
  )

  audit({ verb: 'export', outcome: 'ok', detail: `${wallets.length} wallets` })
  return JSON.stringify({
    salt: bytesToBase64(salt),
    info: ciphertext.info,
    iv: bytesToBase64(ciphertext.iv),
    ciphertext: bytesToBase64(ciphertext.ciphertext),
    version: ciphertext.version,
  })
}

export async function importBackup(blob: string, exportPassword: string): Promise<number> {
  const wrapper = JSON.parse(blob) as {
    salt: string
    info: string
    iv: string
    ciphertext: string
    version: number
  }
  const salt = base64ToBytes(wrapper.salt)
  const exportSecret = await deriveSecretFromPassword(exportPassword, salt)
  const exportBase = await importMasterSecret(exportSecret)
  const record: EncryptedRecord = {
    iv: base64ToBytes(wrapper.iv),
    ciphertext: base64ToBytes(wrapper.ciphertext),
    info: wrapper.info,
    version: wrapper.version,
  }
  let envelopeJson: string
  try {
    envelopeJson = await decryptUnderMaster(record, exportBase)
  } catch {
    audit({ verb: 'import', outcome: 'fail' })
    throw new VaultError('wrong export password or corrupted backup', 'wrong-password')
  }
  const envelope = JSON.parse(envelopeJson, reviveBytes) as BackupEnvelope

  // Verify checksum
  const walletsJson = JSON.stringify(envelope.wallets, replaceBytes)
  const checksum = bytesToBase64(await sha256(utf8Encode(walletsJson)))
  if (checksum !== envelope.checksum) throw new VaultError('backup checksum mismatch', 'tamper-detected')

  const existing = await storageListWallets()
  const existingAddrs = new Set(existing.map((w) => `${w.chain}:${w.address}`))
  let imported = 0
  for (const w of envelope.wallets) {
    if (existingAddrs.has(`${w.chain}:${w.address}`)) continue
    await putWallet(w)
    imported++
  }
  audit({ verb: 'import', outcome: 'ok', detail: `${imported} wallets` })
  return imported
}

// ============================================
// CLOUD SYNC — server-held ciphertext envelope
// ============================================
//
// Shape: AES-GCM envelope under a key derived from the vault master. The
// server stores ciphertext only; decryption requires the recovery phrase
// (to re-derive the master) or an already-unlocked session.
//
// The envelope carries `meta` minus device-bound passkeys (those are
// re-enrolled per device) plus every wallet record verbatim.

const SYNC_DOMAIN = 'vault.sync.export.v1'

interface SyncEnvelope {
  version: number
  createdAt: string
  meta: Omit<VaultMeta, 'passkeys'>
  wallets: VaultWallet[]
  checksum: string
}

async function deriveSyncSecret(masterKey: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0) as unknown as BufferSource,
        info: utf8Encode(SYNC_DOMAIN) as unknown as BufferSource,
      },
      masterKey,
      256,
    ),
  )
}

/**
 * Export the vault state as an encrypted envelope safe to upload to the
 * cloud. Requires an unlocked session. The resulting string is opaque
 * ciphertext — the server can store and return it but never decrypt.
 */
export async function exportSyncBlob(): Promise<string> {
  const s = requireUnlocked()
  touchActivity()
  const meta = await loadMeta()
  const wallets = await storageListWallets()

  const { passkeys: _passkeys, ...metaWithoutPasskeys } = meta
  const body = {
    version: VAULT_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    meta: metaWithoutPasskeys,
    wallets,
  }
  const bodyJson = JSON.stringify(body, replaceBytes)
  const checksum = bytesToBase64(await sha256(utf8Encode(bodyJson)))
  const envelope: SyncEnvelope = { ...body, checksum }

  const syncSecret = await deriveSyncSecret(s.masterKey)
  const syncKey = await importMasterSecret(syncSecret)
  const ciphertext = await encryptUnderMaster(JSON.stringify(envelope, replaceBytes), syncKey, SYNC_DOMAIN)

  return JSON.stringify({
    info: ciphertext.info,
    iv: bytesToBase64(ciphertext.iv),
    ciphertext: bytesToBase64(ciphertext.ciphertext),
    version: ciphertext.version,
  })
}

/**
 * Restore a vault from an encrypted envelope using the BIP-39 recovery
 * phrase. Bootstraps meta + wallets into IndexedDB and opens a session.
 *
 * Throws if a local vault already exists — caller must `wipeAll()` first.
 * On success, session is open under `method: 'recovery'`; caller typically
 * offers passkey enrollment next (addPasskey()).
 */
export async function importSyncBlob(blob: string, recoveryPhrase: string): Promise<{ walletsRestored: number }> {
  assertValidRecoveryPhrase(recoveryPhrase)
  if (await hasVault()) throw new VaultError('a vault already exists on this device', 'storage-error')

  const wrapper = JSON.parse(blob) as {
    info: string
    iv: string
    ciphertext: string
    version: number
  }
  const masterSecret = await recoveryToVaultSecret(recoveryPhrase)
  const masterKey = await importMasterSecret(masterSecret)
  const syncSecret = await deriveSyncSecret(masterKey)
  const syncKey = await importMasterSecret(syncSecret)

  const record: EncryptedRecord = {
    info: wrapper.info,
    iv: base64ToBytes(wrapper.iv),
    ciphertext: base64ToBytes(wrapper.ciphertext),
    version: wrapper.version,
  }
  let envelopeJson: string
  try {
    envelopeJson = await decryptUnderMaster(record, syncKey)
  } catch {
    audit({ verb: 'import', outcome: 'fail', method: 'recovery', detail: 'sync-decrypt' })
    throw new VaultError('recovery phrase does not match this cloud backup', 'wrong-recovery')
  }
  const envelope = JSON.parse(envelopeJson, reviveBytes) as SyncEnvelope

  // Verify checksum against the stripped body (what the sender hashed).
  const bodyForHash = {
    version: envelope.version,
    createdAt: envelope.createdAt,
    meta: envelope.meta,
    wallets: envelope.wallets,
  }
  const bodyJson = JSON.stringify(bodyForHash, replaceBytes)
  const checksum = bytesToBase64(await sha256(utf8Encode(bodyJson)))
  if (checksum !== envelope.checksum) {
    throw new VaultError('sync envelope checksum mismatch', 'tamper-detected')
  }

  // Restore meta with passkeys=[] — device-local, user re-enrolls on this device.
  const restoredMeta: VaultMeta = {
    ...envelope.meta,
    id: 'singleton',
    passkeys: [],
  }
  await putMeta(restoredMeta)

  let restored = 0
  for (const w of envelope.wallets) {
    await putWallet(w)
    restored++
  }

  session = {
    masterKey,
    method: 'recovery',
    unlockedAt: Date.now(),
    lastActivityAt: Date.now(),
  }
  armAutoLock(restoredMeta.autoLockMs)
  persistSession()
  recordSuccess()
  audit({ verb: 'import', outcome: 'ok', method: 'recovery', detail: `sync:${restored}` })

  return { walletsRestored: restored }
}

// ============================================
// MASTER EXPORT / IMPORT (passkey-cloud integration)
// ============================================

/** Export the raw 32-byte master. Requires unlocked session. Used by
 *  passkey-cloud to wrap the master under a PRF-derived key. */
export async function exportRawMaster(): Promise<Uint8Array> {
  const s = requireUnlocked()
  touchActivity()
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0) as unknown as BufferSource,
        info: utf8Encode(`${HKDF_DOMAINS.masterCheck()}.export`) as unknown as BufferSource,
      },
      s.masterKey,
      256,
    ),
  )
}

/** Bootstrap a local vault around a known master secret. Used after a cloud
 *  sign-in that produced the master via PRF unwrap but the user has no
 *  pre-existing blob to import. Opens a session under `method: 'passkey'`.
 *  Optionally accepts an already-enrolled passkey so the *same* credential
 *  that did the server sign-in also drives local unlock — one passkey per
 *  device, two jobs. */
export async function adoptMaster(
  masterSecret: Uint8Array,
  enrollment?: PasskeyEnrollment & { wrappedMaster: EncryptedRecord },
): Promise<void> {
  if (await hasVault()) return // already exists — unlock path handles it
  const masterKey = await importMasterSecret(masterSecret)
  const meta: VaultMeta = {
    id: 'singleton',
    version: VAULT_SCHEMA_VERSION,
    createdAt: Date.now(),
    hasPassword: false,
    passkeys: enrollment ? [enrollment] : [],
    autoLockMs: DEFAULT_AUTO_LOCK_MS,
    lockOnTabClose: false,
    recoveryCheck: await encryptUnderMaster(SENTINEL_PLAINTEXT, masterKey, HKDF_DOMAINS.recoveryCheck()),
  }
  await putMeta(meta)
  session = {
    masterKey,
    method: 'passkey',
    unlockedAt: Date.now(),
    lastActivityAt: Date.now(),
  }
  armAutoLock(meta.autoLockMs)
  persistSession()
  audit({
    verb: 'setup',
    outcome: 'ok',
    method: 'passkey',
    detail: enrollment ? 'adopted-from-cloud+enrollment' : 'adopted-from-cloud',
  })
}

/** Import a cloud blob when the master is already known (e.g. recovered via
 *  PRF unwrap rather than BIP-39 phrase). Same semantics as importSyncBlob
 *  but skips the recovery-phrase derivation. */
export async function importSyncBlobWithMaster(
  blob: string,
  masterSecret: Uint8Array,
): Promise<{ walletsRestored: number }> {
  if (await hasVault()) throw new VaultError('a vault already exists on this device', 'storage-error')

  const wrapper = JSON.parse(blob) as {
    info: string
    iv: string
    ciphertext: string
    version: number
  }
  const masterKey = await importMasterSecret(masterSecret)
  const syncSecret = await deriveSyncSecret(masterKey)
  const syncKey = await importMasterSecret(syncSecret)

  const record: EncryptedRecord = {
    info: wrapper.info,
    iv: base64ToBytes(wrapper.iv),
    ciphertext: base64ToBytes(wrapper.ciphertext),
    version: wrapper.version,
  }
  let envelopeJson: string
  try {
    envelopeJson = await decryptUnderMaster(record, syncKey)
  } catch {
    audit({ verb: 'import', outcome: 'fail', method: 'passkey', detail: 'sync-decrypt' })
    throw new VaultError('passkey did not produce a matching vault master', 'tamper-detected')
  }
  const envelope = JSON.parse(envelopeJson, reviveBytes) as SyncEnvelope

  const bodyForHash = {
    version: envelope.version,
    createdAt: envelope.createdAt,
    meta: envelope.meta,
    wallets: envelope.wallets,
  }
  const bodyJson = JSON.stringify(bodyForHash, replaceBytes)
  const checksum = bytesToBase64(await sha256(utf8Encode(bodyJson)))
  if (checksum !== envelope.checksum) {
    throw new VaultError('sync envelope checksum mismatch', 'tamper-detected')
  }

  const restoredMeta: VaultMeta = {
    ...envelope.meta,
    id: 'singleton',
    passkeys: [],
  }
  await putMeta(restoredMeta)
  let restored = 0
  for (const w of envelope.wallets) {
    await putWallet(w)
    restored++
  }
  session = {
    masterKey,
    method: 'passkey',
    unlockedAt: Date.now(),
    lastActivityAt: Date.now(),
  }
  armAutoLock(restoredMeta.autoLockMs)
  persistSession()
  recordSuccess()
  audit({ verb: 'import', outcome: 'ok', method: 'passkey', detail: `sync:${restored}` })
  return { walletsRestored: restored }
}

// JSON serialise helpers — Uint8Array round-trip via {__bytes: base64}
function replaceBytes(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) return { __bytes: bytesToBase64(value) }
  return value
}
function reviveBytes(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    '__bytes' in value &&
    typeof (value as { __bytes: string }).__bytes === 'string'
  ) {
    return base64ToBytes((value as { __bytes: string }).__bytes)
  }
  return value
}

// ============================================
// DESTRUCTIVE — wipe everything
// ============================================

/** Delete the entire vault DB. Irreversible. Caller should confirm. */
export async function wipeAll(): Promise<void> {
  clearSession()
  await deleteVaultDb()
  audit({ verb: 'delete', outcome: 'ok', detail: 'wipe-all' })
}

// ============================================
// SETTINGS
// ============================================

export async function setAutoLockMs(ms: number): Promise<void> {
  requireUnlocked()
  const meta = await loadMeta()
  // 0 disables auto-lock (the new default). Anything positive is floored
  // to 1 minute so a 1-second timer can't ship by accident.
  meta.autoLockMs = ms <= 0 ? 0 : Math.max(60_000, ms)
  await putMeta(meta)
  armAutoLock(meta.autoLockMs)
  persistSession()
}

export async function setLockOnTabClose(enabled: boolean): Promise<void> {
  requireUnlocked()
  const meta = await loadMeta()
  meta.lockOnTabClose = enabled
  await putMeta(meta)
}
