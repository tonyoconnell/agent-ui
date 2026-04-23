import type { TxBytes, TxDigest } from "../types-sui"

export interface SponsorExecuteRequest {
  txBytes: TxBytes
  senderSig: Uint8Array   // user's Ed25519 signature
}

export interface SponsorExecuteResponse {
  digest: TxDigest
  confirmedAt: number
}

// Execute a sponsored transaction (calls POST /api/sponsor/execute)
export declare function executeSponsored(
  req: SponsorExecuteRequest
): Promise<SponsorExecuteResponse>
