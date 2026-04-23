/**
 * Wallet Link Plugin — links a Sui wallet address to a Better Auth user.
 *
 * Writes to TypeDB auth-user entity (not to Better Auth's own DB).
 * The wallet link is substrate-native: wallet-address + passkey-cred-ids
 * attributes on auth-user, added in world.tql by G.3.
 *
 * No seed material ever crosses to server. The address is derived
 * deterministically client-side from the passkey PRF, then linked here
 * as a capability assertion.
 *
 * Contract: interfaces/wallet/wallet-link-plugin.d.ts
 */

import { readParsed, write, writeTracked } from '@/lib/typedb'
import type { SuiAddress } from '../../../interfaces/types-sui'
import type { WalletLinkResult } from '../../../interfaces/wallet/wallet-link-plugin'

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Encode a credId (ArrayBuffer) as a lowercase hex string — stable,
 * URL-safe, and storable in the passkey-cred-ids JSON array.
 */
function credIdToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Link a wallet address to the Better Auth user in TypeDB.
 *
 * Steps:
 *   1. Upsert wallet-address on the auth-user entity keyed by auth-id = userId.
 *   2. If credId is provided, read existing passkey-cred-ids JSON array,
 *      append the new credId (hex), and write back (dedup, max 20 hints).
 *   3. Return WalletLinkResult with userId, walletAddress, and linkedAt.
 */
export async function linkWallet(
  userId: string,
  address: SuiAddress,
  credId?: ArrayBuffer,
): Promise<WalletLinkResult> {
  const escapedUserId = esc(userId)
  const escapedAddress = esc(address)
  const linkedAt = new Date().toISOString()

  // 1. Upsert wallet-address on auth-user.
  //    Delete any existing wallet-address first (owns without @key allows re-insert).
  await write(`
    match $u isa auth-user, has auth-id "${escapedUserId}";
    delete $u has wallet-address $wa;
  `).catch(() => {
    /* no existing wallet-address — safe to ignore */
  })

  const ok = await writeTracked(`
    match $u isa auth-user, has auth-id "${escapedUserId}";
    insert $u has wallet-address "${escapedAddress}";
  `)
  if (!ok) {
    throw new Error(`[wallet-link] Failed to link wallet for user ${userId}`)
  }

  // 2. Append credId to passkey-cred-ids JSON array (if provided).
  if (credId !== undefined) {
    const hexId = credIdToHex(credId)

    // Read existing cred-ids
    const existing = await readParsed(`
      match $u isa auth-user, has auth-id "${escapedUserId}",
            has passkey-cred-ids $cids;
      select $cids;
    `).catch(() => [])

    let credIds: string[] = []
    if (existing.length > 0) {
      const raw = (existing[0] as Record<string, unknown>)?.cids
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) credIds = parsed
        } catch {
          /* malformed JSON — start fresh */
        }
      }
    }

    // Append new credId (dedup, cap at 20 multi-device hints)
    if (!credIds.includes(hexId)) {
      credIds.push(hexId)
      if (credIds.length > 20) credIds = credIds.slice(-20)
    }

    const escapedCreds = esc(JSON.stringify(credIds))

    // Delete old value then insert new
    await write(`
      match $u isa auth-user, has auth-id "${escapedUserId}";
      delete $u has passkey-cred-ids $cids;
    `).catch(() => {
      /* no existing creds — safe to ignore */
    })

    await writeTracked(`
      match $u isa auth-user, has auth-id "${escapedUserId}";
      insert $u has passkey-cred-ids "${escapedCreds}";
    `)
  }

  return { userId, walletAddress: address, linkedAt }
}

/**
 * Retrieve the linked wallet for a Better Auth user, if one exists.
 *
 * Returns null when:
 *   - No auth-user entity found for userId
 *   - auth-user exists but has no wallet-address yet (State < 3)
 */
export async function getLinkedWallet(userId: string): Promise<WalletLinkResult | null> {
  const escapedUserId = esc(userId)

  const rows = await readParsed(`
    match $u isa auth-user, has auth-id "${escapedUserId}",
          has wallet-address $wa;
    select $wa;
  `).catch(() => [])

  if (rows.length === 0) return null

  const raw = (rows[0] as Record<string, unknown>)?.wa
  if (typeof raw !== 'string' || !raw) return null

  // linkedAt is not stored separately — return current time as a sentinel.
  // Callers needing the exact link timestamp should query auth-updated-at.
  return {
    userId,
    walletAddress: raw as SuiAddress,
    linkedAt: new Date().toISOString(),
  }
}
