// Heartbeat ping — agent proves liveness
export interface HeartbeatPayload {
  agentUid: string
  walletId?: string
  timestamp: string // ISO
}

// Emit a heartbeat (writes liveness_last_verified_at to TypeDB unit)
export declare function sendHeartbeat(uid: string): Promise<void>

// Constants
export declare const HEARTBEAT_INTERVAL_DAYS: 14
export declare const DEADMAN_THRESHOLD_DAYS: 30
