// Peer agent substrate events (signals emitted to TypeDB)
export interface AgentAliveSignal {
  type: "agent:alive"
  uid: string
  walletId?: string
  epoch: number
}

export interface AgentPausedSignal {
  type: "agent:paused"
  uid: string
  reason: "deadman" | "owner" | "scope-violation"
}

export interface AgentRevokedSignal {
  type: "agent:revoked"
  uid: string
  by: string
}
