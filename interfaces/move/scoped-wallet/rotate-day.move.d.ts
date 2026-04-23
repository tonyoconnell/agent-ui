// Arguments for scoped_wallet::rotate_day (anyone can call; advances epoch boundary)
// resets spentToday to 0 if current epoch > createdAt epoch
export interface RotateDayArgs {
  walletId: string
}

// Arguments for scoped_wallet::rotate_owner entry function (owner only)
export interface RotateOwnerArgs {
  walletId: string
  newOwner: string     // new Sui address
}
