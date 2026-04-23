import type { SuiAddress, TxBytes, NetworkId } from "../types-sui"

export interface SponsorBuildRequest {
  sender: SuiAddress
  txKind: "transfer" | "move-call" | "scoped-spend"
  params: Record<string, unknown>
  network?: NetworkId
}

export interface SponsorBuildResponse {
  txBytes: TxBytes      // sponsor has added gas payment
  expiresAt: number     // epoch number
}

// Build a sponsored transaction (calls POST /api/sponsor/build)
export declare function buildSponsored(
  req: SponsorBuildRequest
): Promise<SponsorBuildResponse>
