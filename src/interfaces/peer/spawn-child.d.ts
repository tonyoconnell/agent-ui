import type { SuiAddress } from '../types-sui'

export interface SpawnChildArgs {
  parentUid: string
  childUid: string
  childAddress: SuiAddress
  dailyCapMist: bigint
  allowlist: string[]
}

export interface SpawnChildResult {
  scopedWalletId: string // Move object ID
  txDigest: string
}

// Parent spawns a child agent under its ScopedWallet cap (no human involved)
export declare function spawnChild(args: SpawnChildArgs): Promise<SpawnChildResult>
