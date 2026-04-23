/**
 * GET /api/u/fleet?address=<sui-address>
 *
 * Returns a tree of ScopedWallets where the given Sui address is the root owner
 * or an ancestor in a delegated chain (max 3 levels deep).
 *
 * Strategy:
 *   1. Query TypeDB for all units that have `scoped-wallet-id` set
 *   2. Enrich each with on-chain ScopedWallet data via Sui RPC
 *   3. Filter to only wallets where `owner === address` (depth 0)
 *      or where the owner is itself an agent whose ScopedWallet owner is `address` (depth 1-2)
 *   4. Build and return the tree
 *
 * Response shape: { nodes: FleetNode[] }   (top-level nodes; children nested)
 *
 * 200: { nodes: FleetNode[] }
 * 400: { error: "address required" }
 * 500: { error: string }
 */

import type { APIRoute } from 'astro'
import { readParsed } from '@/lib/typedb'
import { getClient } from '@/lib/sui'

export const prerender = false

// ─── types ────────────────────────────────────────────────────────────────────

interface FleetNode {
  walletId: string
  ownerLabel: string      // "You" (owner === address) or agent name
  agentLabel: string      // agent uid or "unknown"
  dailyCapMist: string    // bigint serialised as string for JSON
  spentTodayMist: string  // bigint serialised as string for JSON
  paused: boolean
  depth: number           // 0 = root (owned by user), 1 = child, etc.
  children: FleetNode[]
}

// ─── TypeDB helpers ────────────────────────────────────────────────────────────

interface UnitRow {
  uid: string
  name: string
  walletId: string        // scoped-wallet-id attribute value
}

/** Query all units that have a scoped-wallet-id and return their uid + name. */
async function queryUnitsWithScope(): Promise<UnitRow[]> {
  const rows = await readParsed(`
    match
      $u isa unit, has uid $uid, has scoped-wallet-id $sid;
      optional { $u has name $n; }
    select $uid, $sid, $n;
  `).catch(() => [])

  return rows.flatMap((row) => {
    const uid = typeof row.uid === 'string' ? row.uid : undefined
    const walletId = typeof row.sid === 'string' ? row.sid : undefined
    const name = typeof row.n === 'string' ? row.n : undefined
    if (!uid || !walletId) return []
    return [{ uid, name: name ?? uid, walletId }]
  })
}

// ─── Sui RPC helpers ───────────────────────────────────────────────────────────

interface ScopedWalletChainData {
  owner: string
  agent: string
  dailyCapMist: bigint
  spentTodayMist: bigint
  paused: boolean
}

async function fetchScopedWallet(walletId: string): Promise<ScopedWalletChainData | null> {
  try {
    const client = getClient()
    const res = await client.getObject({
      id: walletId,
      options: { showContent: true, showOwner: true },
    })
    const content = res?.data?.content
    if (!content || content.dataType !== 'moveObject') return null
    const fields = (content as { fields?: Record<string, unknown> }).fields
    if (!fields) return null

    return {
      owner: typeof fields.owner === 'string' ? fields.owner : '',
      agent: typeof fields.agent === 'string' ? fields.agent : '',
      dailyCapMist: BigInt(String(fields.daily_cap ?? 0)),
      spentTodayMist: BigInt(String(fields.spent_today ?? 0)),
      paused: Boolean(fields.paused ?? false),
    }
  } catch {
    return null
  }
}

// ─── Tree builder ──────────────────────────────────────────────────────────────

/** Normalise Sui address for comparison. */
function norm(addr: string): string {
  return addr.toLowerCase()
}

/**
 * Build the fleet tree rooted at `userAddress` (max 3 levels).
 *
 * Approach:
 *   - Depth 0: wallets where on-chain `owner === userAddress`
 *   - Depth 1: wallets where on-chain `owner === agentAddress` for any
 *              agent whose wallet address appears as a depth-0 agent
 *   - Depth 2: same recursion one level deeper
 *
 * We cap at depth = 2 (3 levels: 0, 1, 2) per the spec (max 3 levels).
 */
function buildTree(
  userAddress: string,
  enriched: Array<{ unit: UnitRow; chain: ScopedWalletChainData }>,
  maxDepth = 2,
): FleetNode[] {
  const normUser = norm(userAddress)

  function buildLevel(
    ownerAddresses: Set<string>,
    depth: number,
    visited: Set<string>,
  ): FleetNode[] {
    if (depth > maxDepth) return []

    const nodes: FleetNode[] = []
    for (const { unit, chain } of enriched) {
      if (visited.has(unit.walletId)) continue
      if (!ownerAddresses.has(norm(chain.owner))) continue

      visited.add(unit.walletId)

      const isRootOwner = norm(chain.owner) === normUser
      const ownerLabel = isRootOwner ? 'You' : `Cap set by ${chain.owner.slice(0, 8)}…`

      // Gather child agents: units whose ScopedWallet owner === this agent's address
      const agentOwnedAddresses = new Set<string>([norm(chain.agent)])
      const children =
        depth < maxDepth ? buildLevel(agentOwnedAddresses, depth + 1, visited) : []

      nodes.push({
        walletId: unit.walletId,
        ownerLabel,
        agentLabel: unit.uid,
        dailyCapMist: chain.dailyCapMist.toString(),
        spentTodayMist: chain.spentTodayMist.toString(),
        paused: chain.paused,
        depth,
        children,
      })
    }
    return nodes
  }

  const rootOwners = new Set<string>([normUser])
  return buildLevel(rootOwners, 0, new Set())
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const address = url.searchParams.get('address')?.trim() ?? ''
  if (!address) {
    return new Response(JSON.stringify({ error: 'address required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. All units with a scoped wallet in TypeDB
    const units = await queryUnitsWithScope()

    // 2. Enrich with on-chain data in parallel
    const settled = await Promise.allSettled(
      units.map(async (unit) => {
        const chain = await fetchScopedWallet(unit.walletId)
        return chain ? { unit, chain } : null
      }),
    )

    const enriched = settled
      .filter(
        (r): r is PromiseFulfilledResult<{ unit: UnitRow; chain: ScopedWalletChainData }> =>
          r.status === 'fulfilled' && r.value !== null,
      )
      .map((r) => r.value)

    // 3. Build tree rooted at userAddress
    const nodes = buildTree(address, enriched)

    return new Response(JSON.stringify({ nodes }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=10',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'fleet query failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
