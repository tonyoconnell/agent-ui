/**
 * _derive.ts — Multi-chain address derivation
 *
 * Platform SUI_SEED removed in sys-201. Derivation now comes from user vault.
 * This module is a stub until vault-based derivation is wired.
 */

export function readSeedBytes(): Uint8Array {
  throw new Error('Platform seed removed (sys-201) — use user vault for address derivation')
}

export function deriveSecret(chainTag: string, uid: string): Uint8Array {
  throw new Error('Platform seed removed (sys-201) — use user vault for address derivation')
}
