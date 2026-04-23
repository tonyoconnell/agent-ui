/**
 * /u Components
 *
 * The Universal Wallet Experience
 * No login. No friction. Just blockchain.
 */

export { GenerateWalletDialog } from './GenerateWalletDialog'
// Vault — primary surface (passkey + recovery phrase + IndexedDB).
export {
  detectCapabilities,
  generateRecoveryPhrase,
  isValidRecoveryPhrase,
  type PasskeyEnrollment,
  VaultError,
  type VaultStatus,
  type VaultWallet,
} from './lib/vault'
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
