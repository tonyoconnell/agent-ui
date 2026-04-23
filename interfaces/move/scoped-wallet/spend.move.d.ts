import type { SuiAddress, TxBytes } from "../../types-sui"

// Arguments for scoped_wallet::spend entry function
export interface SpendArgs {
  walletId: string
  to: SuiAddress
  amountMist: bigint
  targetPackage?: string        // for allowlist check
}

// Expected error codes from Move
export type SpendError = "cap-exceeded" | "not-allowed" | "paused" | "allowlist-violation"
