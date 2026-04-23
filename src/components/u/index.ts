/**
 * /u Components
 *
 * The Universal Wallet Experience
 * No login. No friction. Just blockchain.
 */

export { GenerateWalletDialog } from './GenerateWalletDialog'
// Legacy storage — kept for migration tooling only. New code should use useVault().
export {
  checkPasswordStrength,
  type EncryptedData,
  formatMnemonic,
  generateStrongPassword,
  SecureKeyStorage,
  type SecureWallet,
  type StorageStatus,
  validateMnemonic,
  type WalletBackup,
} from './lib/SecureKeyStorage'
export type { UseVaultResult } from './lib/useVault'
// Vault — new primary surface (passkey + recovery phrase + IndexedDB).
export { useVault } from './lib/useVault'
export {
  detectCapabilities,
  generateRecoveryPhrase,
  hasLegacyData,
  inspectLegacy,
  isValidRecoveryPhrase,
  type PasskeyEnrollment,
  VaultError,
  type VaultStatus,
  type VaultWallet,
} from './lib/vault'
export {
  BackupExportDialog,
  BackupImportDialog,
  SecurityStatus,
  SetupPasswordDialog,
  UnlockDialog,
  ViewMnemonicDialog,
} from './SecureStorageDialogs'
export { UDashboard } from './UDashboard'
export {
  VaultBackupDialog,
  VaultRecoveryRevealDialog,
  VaultSettingsDialog,
  VaultUnlockDialog,
} from './VaultDialogs'
export { VaultSetupWizard } from './VaultSetupWizard'
export { VaultUnlockChip } from './VaultUnlockChip'
export { WalletCard } from './WalletCard'
