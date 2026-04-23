// Outbound webhook for agent events
export interface WebhookPayload {
  event: string
  uid: string
  data: Record<string, unknown>
  timestamp: string
  signature: string    // HMAC-SHA256 hex
}

export declare function verifyWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean

export declare function sendWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string
): Promise<void>
