import type { SuiAddress } from "../../types-sui"

// Arguments for scoped_wallet::revoke entry function (owner only)
// Destroys the object; funds return to owner
export interface RevokeArgs {
  walletId: string
  returnTo?: SuiAddress   // defaults to owner
}
