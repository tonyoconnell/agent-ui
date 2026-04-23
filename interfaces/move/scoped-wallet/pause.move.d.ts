// Arguments for scoped_wallet::pause / unpause entry functions (owner only)
export interface PauseArgs {
  walletId: string
  reason?: string     // human label, not on-chain enforcement
}

export interface UnpauseArgs {
  walletId: string
}
