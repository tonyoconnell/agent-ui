// vault/index.ts — public API surface. Import everything via this file.
// Internal modules (crypto/storage/passkey/recovery) are not part of the API.

export {
  hasLegacyData,
  inspectLegacy,
  type LegacyInventory,
  type MigrationResult,
  migrateLegacy,
  requiresOldPassword,
} from './migration'
export { detectCapabilities, guessAuthenticatorLabel } from './passkey'
export {
  assertValidRecoveryPhrase,
  generateRecoveryPhrase,
  isValidRecoveryPhrase,
  normaliseRecoveryPhrase,
  RECOVERY_WORD_COUNT,
  splitRecoveryPhrase,
  suggestWords,
} from './recovery'
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
