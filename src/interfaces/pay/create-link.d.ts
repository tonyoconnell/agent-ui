export interface CreateLinkRequest {
  uid: string            // seller/receiver uid
  chain: "sui" | "eth" | "sol" | "btc" | "base" | "arb" | "opt" | "card" | "weight"
  amount?: bigint        // optional; omit for open amount
  description?: string
}

export interface CreateLinkResponse {
  url: string            // deterministic pay.one.ie/<sid>
  sid: string
  expiresAt?: number     // epoch ms; undefined = no expiry
}

export declare function createPaymentLink(req: CreateLinkRequest): Promise<CreateLinkResponse>
