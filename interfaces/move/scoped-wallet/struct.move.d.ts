import type { SuiAddress, ObjectId } from "../../types-sui"

// TS shape of the ScopedWallet Move struct
export interface ScopedWalletStruct {
  id: ObjectId
  owner: SuiAddress             // controls pause/revoke/rotate
  agent: SuiAddress             // can call spend()
  dailyCap: bigint              // in MIST
  spentToday: bigint            // resets on epoch boundary
  paused: boolean
  allowlist: string[]           // allowed target addresses/packages
  createdAt: number             // epoch number
}
