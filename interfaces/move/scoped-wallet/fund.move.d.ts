// Arguments for scoped_wallet::fund entry function (anyone can top up)
export interface FundArgs {
  walletId: string
  amountMist: bigint
}

// Arguments for scoped_wallet::spawn_child entry function
export interface SpawnChildArgs {
  parentWalletId: string
  childAgent: string   // child's Sui address
  dailyCap: bigint
  allowlist: string[]
}
