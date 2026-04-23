// vault/index.ts — public API surface. Import everything via this file.
// Internal modules (crypto/storage/passkey/recovery) are not part of the API.

export { detectCapabilities, guessAuthenticatorLabel } from './passkey'
export { registerPasskeyForSignin, signInWithPasskey } from './passkey-cloud'
export {
  assertValidRecoveryPhrase,
  generateRecoveryPhrase,
  isValidRecoveryPhrase,
  normaliseRecoveryPhrase,
  RECOVERY_WORD_COUNT,
  splitRecoveryPhrase,
  suggestWords,
} from './recovery'
export type { CloudBlob } from './sync'
export { fetchCloudBlob, hasCloudBlob, restoreFromCloud, syncToCloud } from './sync'
export {
  type AuditEvent,
  type PasskeyCapabilities,
  type PasskeyEnrollment,
  VAULT_SCHEMA_VERSION,
  VaultError,
  type VaultErrorCode,
  type VaultMeta,
  type VaultStatus,
  type VaultWallet,
} from './types'
export * as Vault from './vault'
