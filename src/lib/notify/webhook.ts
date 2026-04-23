/**
 * HMAC-signed outbound webhooks.
 *
 * Signature scheme: HMAC-SHA256 of the raw JSON payload string,
 * delivered as the `X-ONE-Signature` request header.
 *
 * Consumers verify by recomputing HMAC-SHA256(body, secret) and
 * comparing timing-safely with the received signature.
 */

export interface WebhookPayload {
  event: string
  timestamp: number
  data: Record<string, unknown>
}

/**
 * Compute HMAC-SHA256 of `payload` string using `secret`.
 * Returns a lowercase hex digest.
 */
export async function buildWebhookSig(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify that `signature` matches HMAC-SHA256(`payload`, `secret`).
 *
 * Uses timing-safe comparison via `crypto.subtle.verify` to prevent
 * timing attacks.
 */
export async function verifyWebhook(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'verify',
  ])

  // Convert hex signature string → ArrayBuffer
  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)?.map((b) => Number.parseInt(b, 16)) ?? [])

  if (sigBytes.length !== 32) return false // SHA-256 is always 32 bytes

  return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payload))
}

/**
 * POST `payload` to `url` with an HMAC-SHA256 signature header.
 *
 * The JSON body is signed with `secret` and delivered as
 * `X-ONE-Signature: <hex-digest>`.
 *
 * Throws if the remote returns a non-2xx status.
 */
export async function sendWebhook(url: string, payload: WebhookPayload, secret: string): Promise<void> {
  const body = JSON.stringify(payload)
  const signature = await buildWebhookSig(body, secret)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ONE-Signature': signature,
    },
    body,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText} — ${text}`)
  }
}
