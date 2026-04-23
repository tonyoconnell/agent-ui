import type { TxBytes, TxDigest, NetworkId } from "../types-sui"

export interface SendOptions {
  network?: NetworkId
  maxRetries?: number      // default 3
  retryDelayMs?: number    // default 200
}

export interface SendResult {
  digest: TxDigest
  confirmedAt: number      // epoch ms
}

// Submit a signed transaction through the sponsor Worker
// Retries up to 3× with 200ms backoff on epoch-expiry errors
// Throws WalletError with kind "epoch-expired" | "sponsor-unreachable" | "network-timeout"
export declare function sendTx(
  txBytes: TxBytes,
  signature: Uint8Array,
  opts?: SendOptions
): Promise<SendResult>

// Check if a sponsor Worker response indicates epoch expiry
export declare function isEpochExpiry(err: unknown): boolean
