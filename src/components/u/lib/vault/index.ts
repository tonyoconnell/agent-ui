// vault/index.ts — public API surface. Import everything via this file.
// Internal modules (crypto/storage/passkey/recovery) are not part of the API.

export * as Vault from './vault'

export {
  generateRecoveryPhrase,
  isValidRecoveryPhrase,
  assertValidRecoveryPhrase,
  normaliseRecoveryPhrase,
  splitRecoveryPhrase,
  suggestWords,
  RECOVERY_WORD_COUNT,
} from './recovery'

export { detectCapabilities, guessAuthenticatorLabel } from './passkey'

export {
  hasLegacyData,
  inspectLegacy,
  requiresOldPassword,
  migrateLegacy,
  type MigrationResult,
  type LegacyInventory,
} from './migration'

export {
  VaultError,
  VAULT_SCHEMA_VERSION,
  type VaultStatus,
  type VaultWallet,
  type VaultMeta,
  type PasskeyEnrollment,
  type PasskeyCapabilities,
  type AuditEvent,
  type VaultErrorCode,
} from './types'
