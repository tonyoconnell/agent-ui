/**
 * Identity resolution — stable actor uid across channels.
 *
 * Default uid: "${channel}:${rawSender}"
 * After /link claim: canonical_uid from D1 identity_links table.
 *
 * Claim ceremony:
 *   1. Web session calls POST /claim → receives nonce (stored in KV, 5min TTL)
 *   2. User pastes nonce into Telegram: /link <nonce>
 *   3. Bot calls linkIdentity() → writes D1 binding, cleans KV
 *   4. Future resolveActor() calls for web session → returns Telegram uid
 */

import type { Env } from '../types'

/**
 * Resolve a stable actor uid for this (channel, sender) pair.
 * Falls back to `${channel}:${rawSender}` if no cross-channel link exists.
 */
export async function resolveActor(channel: string, rawSender: string, env: Env): Promise<string> {
  try {
    const row = await env.DB.prepare('SELECT canonical_uid FROM identity_links WHERE channel = ? AND sender_id = ?')
      .bind(channel, rawSender)
      .first()
    return (row?.canonical_uid as string) || `${channel}:${rawSender}`
  } catch {
    return `${channel}:${rawSender}`
  }
}

/**
 * Issue a claim nonce for cross-channel linking.
 * Stores nonce → sessionId mapping in KV with 5-minute TTL.
 * Returns nonce for display to user (they paste it into Telegram as /link <nonce>).
 */
export async function issueClaim(sessionId: string, env: Env): Promise<string> {
  const nonce = crypto.randomUUID()
  await env.KV.put(`pending_claim:${nonce}`, JSON.stringify({ sessionId, createdAt: Date.now() }), {
    expirationTtl: 300,
  })
  return nonce
}

/**
 * Complete a cross-channel link.
 * Called when user sends /link <nonce> in Telegram.
 * Returns the linked web sessionId, or null if nonce is invalid/expired.
 */
export async function linkIdentity(
  nonce: string,
  telegramChannel: string,
  telegramSenderId: string,
  env: Env,
): Promise<string | null> {
  const raw = await env.KV.get(`pending_claim:${nonce}`)
  if (!raw) return null

  let parsed: { sessionId: string; createdAt: number }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const { sessionId } = parsed
  const canonicalUid = `${telegramChannel}:${telegramSenderId}`

  // Bind web session → Telegram canonical uid
  await env.DB.prepare(
    'INSERT OR REPLACE INTO identity_links (channel, sender_id, canonical_uid, linked_at) VALUES (?, ?, ?, ?)',
  )
    .bind('web', sessionId, canonicalUid, Date.now())
    .run()

  // Self-reference for Telegram channel (idempotent, enables symmetric lookup)
  await env.DB.prepare(
    'INSERT OR REPLACE INTO identity_links (channel, sender_id, canonical_uid, linked_at) VALUES (?, ?, ?, ?)',
  )
    .bind(telegramChannel, telegramSenderId, canonicalUid, Date.now())
    .run()

  await env.KV.delete(`pending_claim:${nonce}`)
  return sessionId
}
