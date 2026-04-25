/**
 * SUI chain address derivation + payment URI
 *
 * Platform SUI_SEED removed in sys-201. Derivation now comes from user vault.
 * This module is a stub until vault-based derivation is wired.
 */

export async function deriveAddressSui(uid: string): Promise<string> {
  return Promise.reject(new Error('Platform key removed (sys-201)'))
}

export function buildPaymentUriSui(addr: string, amountMist: bigint): string {
  return `sui:${addr}?amount=${amountMist}`
}
