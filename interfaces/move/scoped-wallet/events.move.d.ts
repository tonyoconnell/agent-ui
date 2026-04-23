// Move event shapes emitted by scoped_wallet module
export interface ScopeChangedEvent {
  walletId: string
  field: "dailyCap" | "allowlist" | "agent"
  oldValue: string
  newValue: string
  changedBy: string
  epoch: number
}

export interface WalletPausedEvent {
  walletId: string
  by: string
  epoch: number
}

export interface WalletRevokedEvent {
  walletId: string
  fundsReturnedTo: string
  amountMist: bigint
  epoch: number
}

export interface AgentAliveEvent {
  agentUid: string
  walletId: string
  livenessLastVerifiedAt: string   // ISO — written to TypeDB unit
  epoch: number
}
