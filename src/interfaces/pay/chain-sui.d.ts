import type { SuiAddress } from '../types-sui'

export declare function deriveAddressSui(uid: string): SuiAddress
export declare function buildPaymentUriSui(addr: SuiAddress, amountMist: bigint): string
