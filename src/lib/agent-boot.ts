/**
 * Agent boot procedure.
 *
 * When an agent boots:
 *   1. Derives its Sui wallet address from its uid via addressFor(uid)
 *   2. Queries TypeDB for its unit's scoped-wallet-id attribute (if set)
 *   3. Verifies on-chain ScopedWallet scope matches the derived address
 *      → mismatch: returns false (agent refuses to run)
 *      → no scope set: passes (unrestricted agent)
 *
 * TypeDB calls:
 *   readParsed(`match $u isa unit, has uid "…", has scoped-wallet-id $s; select $s;`)
 *   → one row with s = Move object ID string, or empty array when attribute absent
 *
 * Sui RPC calls:
 *   getObject(scopedWalletId, { showContent: true })
 *   → reads ScopedWallet Move struct, extracts fields.agent (Sui address)
 *   → compares to config.walletAddress
 */

import { getClient } from '@/lib/sui'
import { readParsed } from '@/lib/typedb'

// ── Types ──────────────────────────────────────────────────────────────────────

/**
 * Configuration returned by bootAgent().
 * Matches the contract in src/interfaces/peer/agent-boot.d.ts.
 * SuiAddress is a branded string alias; using plain string here avoids a
 * circular dependency on the vault money.ts type while remaining compatible.
 */
export interface AgentBootConfig {
  uid: string
  walletAddress: string // Sui address derived from the uid
  scopedWalletId?: string // Move object ID of the ScopedWallet, if set in TypeDB
}

// ── TypeDB helper ──────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Query TypeDB for the unit's scoped-wallet-id attribute.
 * Returns the Move object ID string, or undefined if the attribute is absent.
 *
 * TypeQL:
 *   match $u isa unit, has uid "…", has scoped-wallet-id $s; select $s;
 */
async function queryUnitScopedWallet(uid: string): Promise<string | undefined> {
  const rows = await readParsed(`
    match $u isa unit, has uid "${esc(uid)}", has scoped-wallet-id $s;
    select $s;
  `).catch(() => [])

  if (!rows.length) return undefined
  const val = rows[0]?.s
  return typeof val === 'string' && val.length > 0 ? val : undefined
}

// ── Sui RPC helper ─────────────────────────────────────────────────────────────

/**
 * Read the on-chain ScopedWallet object and return its `agent` field.
 * The ScopedWallet Move struct is expected to have a `agent: address` field
 * that holds the Sui address the wallet is scoped to.
 *
 * Returns null on any error (object missing, wrong type, network failure).
 *
 * Sui RPC:
 *   getObject(scopedWalletId, { showContent: true })
 *   → MoveObject.fields.agent → Sui address string
 */
async function readScopedWalletAgent(scopedWalletId: string): Promise<string | null> {
  try {
    const client = getClient()
    const res = await client.getObject({
      id: scopedWalletId,
      options: { showContent: true },
    })

    const content = res?.data?.content
    if (!content || content.dataType !== 'moveObject') return null

    const fields = (content as { fields?: Record<string, unknown> }).fields
    if (!fields) return null

    const agent = fields.agent
    return typeof agent === 'string' ? agent : null
  } catch {
    return null
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Boot an agent.
 *
 * 1. Derives the Sui wallet address for the uid.
 * 2. Queries TypeDB for the unit's scoped-wallet-id (optional attribute).
 * 3. Returns AgentBootConfig. Callers must call verifyScopeMatch() before
 *    letting the agent proceed.
 *
 * walletAddress is empty string (no platform key; user vault provides wallet).
 */
export async function bootAgent(uid: string): Promise<AgentBootConfig> {
  const [walletAddress, scopedWalletId] = await Promise.all([Promise.resolve(''), queryUnitScopedWallet(uid)])

  return { uid, walletAddress, scopedWalletId }
}

/**
 * Verify the agent's on-chain scope matches its derived wallet address.
 *
 * - No scopedWalletId set → unrestricted agent → returns true
 * - ScopedWallet.agent matches config.walletAddress → returns true
 * - Mismatch or any RPC error → returns false (agent refuses to run)
 *
 * Sui RPC call:
 *   getObject(config.scopedWalletId, { showContent: true })
 */
export async function verifyScopeMatch(config: AgentBootConfig): Promise<boolean> {
  if (!config.scopedWalletId) return true // unrestricted agent

  const onChainAgent = await readScopedWalletAgent(config.scopedWalletId)

  if (onChainAgent === null) {
    // Object missing or malformed — fail closed
    return false
  }

  // Normalise both addresses to lowercase for comparison (Sui addresses are
  // hex strings; casing can differ between derivation and on-chain storage).
  return onChainAgent.toLowerCase() === config.walletAddress.toLowerCase()
}
