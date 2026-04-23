import type { SuiAddress } from '../types-sui'

export interface AgentBootConfig {
  uid: string // substrate uid (e.g. "marketing:creative")
  walletAddress: SuiAddress // derived via addressFor(uid)
  scopedWalletId?: string // Move object ID if scoped
}

// Boot an agent: read uid, query TypeDB, self-verify against on-chain scope
export declare function bootAgent(uid: string): Promise<AgentBootConfig>

// Verify agent's scope matches on-chain ScopedWallet object
// Returns false (agent refuses to run) on mismatch
export declare function verifyScopeMatch(config: AgentBootConfig): Promise<boolean>
