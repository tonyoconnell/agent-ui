/**
 * POST /api/sponsor/build — Build a sponsored transaction
 *
 * Adds a gas payment object owned by the sponsor keypair so the sender
 * does not need SUI for gas. The caller signs with their own key, then
 * calls POST /api/sponsor/execute to submit.
 *
 * Request:
 *   { sender, txKind, params, network? }
 *
 * txKind shapes:
 *   "transfer"    — params: { to: SuiAddress, amount: number (MIST) }
 *   "move-call"   — params: { target: string, args: unknown[], typeArgs?: string[] }
 *   "scoped-spend"— params: { walletId: string, to: SuiAddress, amountMist: number }
 *
 * Response:
 *   { txBytes: number[], expiresAt: number }  — expiresAt is currentEpoch + 1
 *
 * Errors:
 *   503 — SUI_SPONSOR_KEY not configured
 *   400 — unknown txKind or missing required params
 *   500 — Sui RPC / build failure
 */

import type { APIRoute } from 'astro'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Transaction } from '@mysten/sui/transactions'
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type TxKind = 'transfer' | 'move-call' | 'scoped-spend'

/** Wallet lifecycle state sent by the client.
 *  State 1 = ephemeral (wrappings: []) — cap enforced server-side.
 *  State 2+ = at least one passkey wrapping — no server cap. */
export type WalletState = 1 | 2 | 3 | 4 | 5

/** 25 SUI in MIST. State-1 wallets may not receive more than this per tx. */
export const STATE1_CAP_MIST = 25_000_000_000n

interface BuildRequest {
  sender: string
  txKind: TxKind
  params: Record<string, unknown>
  network?: 'mainnet' | 'testnet' | 'devnet' | 'localnet'
  /** Client-reported wallet state. Used to enforce the State-1 balance cap. */
  walletState?: WalletState
}

// ═══════════════════════════════════════════════════════════════════════════
// SPONSOR KEYPAIR — reads SUI_SPONSOR_KEY at call-time
// ═══════════════════════════════════════════════════════════════════════════

function readSponsorKey(): string {
  // CF Workers: process.env comes from wrangler secrets (nodejs_compat)
  // Astro dev: import.meta.env comes from .env via Vite
  const fromRuntime = typeof process !== 'undefined' && process.env?.SUI_SPONSOR_KEY
  const fromBuild = import.meta.env.SUI_SPONSOR_KEY
  return (fromRuntime || fromBuild || '').toString()
}

function sponsorKeypair(): Ed25519Keypair {
  const raw = readSponsorKey()
  if (!raw) throw new Error('SUI_SPONSOR_KEY not configured')

  // Accept either raw base64-encoded 32-byte secret or Bech32 private key
  if (raw.startsWith('suiprivkey')) {
    return Ed25519Keypair.fromSecretKey(raw)
  }
  // Interpret as base64-encoded 32-byte seed
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
  return Ed25519Keypair.fromSecretKey(bytes)
}

// ═══════════════════════════════════════════════════════════════════════════
// SUI CLIENT
// ═══════════════════════════════════════════════════════════════════════════

function getClient(network: string): SuiJsonRpcClient {
  const net = (network || import.meta.env.SUI_NETWORK || 'testnet') as
    | 'testnet'
    | 'mainnet'
    | 'devnet'
    | 'localnet'
  return new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl(net), network: net })
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

function buildTransfer(tx: Transaction, params: Record<string, unknown>): void {
  const { to, amount } = params as { to: string; amount: number }
  if (!to) throw Object.assign(new Error("params.to is required for txKind 'transfer'"), { status: 400 })
  if (typeof amount !== 'number' || amount <= 0)
    throw Object.assign(new Error("params.amount must be a positive number (MIST) for txKind 'transfer'"), {
      status: 400,
    })

  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(Math.floor(amount)))])
  tx.transferObjects([coin], tx.pure.address(to))
}

function buildMoveCall(tx: Transaction, params: Record<string, unknown>): void {
  const { target, args = [], typeArgs = [] } = params as {
    target: string
    args: unknown[]
    typeArgs?: string[]
  }
  if (!target)
    throw Object.assign(new Error("params.target is required for txKind 'move-call'"), { status: 400 })

  // args are passed as-is; callers should supply TransactionArgument-compatible values.
  // For simple primitive values (strings, numbers, booleans) wrap in tx.pure.* at call site.
  tx.moveCall({
    target: target as `${string}::${string}::${string}`,
    arguments: (args as any[]).map((a) => (typeof a === 'object' && a !== null ? a : tx.pure(a))),
    typeArguments: typeArgs as string[],
  })
}

function buildScopedSpend(tx: Transaction, params: Record<string, unknown>, packageId: string): void {
  const { walletId, to, amountMist } = params as {
    walletId: string
    to: string
    amountMist: number
  }
  if (!walletId)
    throw Object.assign(new Error("params.walletId is required for txKind 'scoped-spend'"), { status: 400 })
  if (!to) throw Object.assign(new Error("params.to is required for txKind 'scoped-spend'"), { status: 400 })
  if (typeof amountMist !== 'number' || amountMist <= 0)
    throw Object.assign(new Error("params.amountMist must be a positive number for txKind 'scoped-spend'"), {
      status: 400,
    })

  const pkg = packageId || import.meta.env.SUI_PACKAGE_ID || ''
  if (!pkg) throw Object.assign(new Error('SUI_PACKAGE_ID not configured'), { status: 503 })

  tx.moveCall({
    target: `${pkg}::scoped_wallet::spend`,
    arguments: [
      tx.object(walletId),
      tx.pure.address(to),
      tx.pure.u64(BigInt(Math.floor(amountMist))),
    ],
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════

export const POST: APIRoute = async ({ request }) => {
  // 1. Parse request
  let body: BuildRequest
  try {
    body = (await request.json()) as BuildRequest
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { sender, txKind, params = {}, network = 'testnet', walletState } = body

  // 2. Validate required fields
  if (!sender) {
    return new Response(JSON.stringify({ error: 'sender is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (!txKind) {
    return new Response(JSON.stringify({ error: 'txKind is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2b. State-1 cap: unsaved wallets may not receive more than STATE1_CAP_MIST per tx.
  // The client self-reports walletState; server enforces the cap. Worst-case: client
  // lies and *raises* the cap on its own wallet — acceptable, it's their own funds.
  if (walletState === 1) {
    // Resolve the transfer amount from whichever param name the txKind uses
    const rawAmount =
      typeof params.amount === 'number'
        ? params.amount
        : typeof params.amountMist === 'number'
          ? params.amountMist
          : 0
    const amountMist = BigInt(Math.floor(rawAmount))
    if (amountMist > STATE1_CAP_MIST) {
      return new Response(
        JSON.stringify({
          error: 'state1-cap-exceeded',
          message: 'Save this wallet first to receive larger amounts.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // 3. Get sponsor keypair (503 if not configured)
  let sponsor: Ed25519Keypair
  try {
    sponsor = sponsorKeypair()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sponsor key unavailable'
    return new Response(JSON.stringify({ error: message, code: 'sponsor_unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const client = getClient(network)
    const packageId = import.meta.env.SUI_PACKAGE_ID || ''

    // 4. Build the transaction PTB
    const tx = new Transaction()
    tx.setSender(sender)

    switch (txKind) {
      case 'transfer':
        buildTransfer(tx, params)
        break
      case 'move-call':
        buildMoveCall(tx, params)
        break
      case 'scoped-spend':
        buildScopedSpend(tx, params, packageId)
        break
      default:
        return new Response(
          JSON.stringify({
            error: `Unknown txKind: ${txKind}. Must be one of: transfer, move-call, scoped-spend`,
            code: 'unknown_tx_kind',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
    }

    // 5. Fetch sponsor's gas coins
    const sponsorAddress = sponsor.getPublicKey().toSuiAddress()
    const { data: coins } = await client.getCoins({ owner: sponsorAddress })
    if (!coins || coins.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Sponsor has no gas coins', code: 'sponsor_no_gas' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Use the largest coin for gas to minimise fragmentation
    const gasCoin = coins.reduce((best, c) =>
      BigInt(c.balance) > BigInt(best.balance) ? c : best,
    )

    // 6. Wire up sponsor gas payment
    tx.setGasOwner(sponsorAddress)
    tx.setGasPayment([
      {
        objectId: gasCoin.coinObjectId,
        version: gasCoin.version,
        digest: gasCoin.digest,
      },
    ])
    // Conservative budget — caller can override by re-building before signing
    tx.setGasBudget(10_000_000)

    // 7. Fetch reference gas price for budget calculation
    const refGasPrice = await client.getReferenceGasPrice()
    if (refGasPrice) {
      // budget = price × 1000 units, minimum 1_000_000 MIST
      const budget = Math.max(Number(refGasPrice) * 1000, 1_000_000)
      tx.setGasBudget(budget)
    }

    // 8. Get current epoch for expiresAt
    let currentEpoch = 0
    try {
      const systemState = await client.getLatestSuiSystemState()
      currentEpoch = Number(systemState.epoch)
    } catch {
      // Non-fatal: expiresAt will be 0 + 1 = 1; callers should treat as best-effort
    }

    // 9. Serialize — build() returns Uint8Array of BCS-encoded TransactionData
    const txBytes = await tx.build({ client: client as any })

    // 10. Return
    return new Response(
      JSON.stringify({
        txBytes: Array.from(txBytes),
        expiresAt: currentEpoch + 1,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = (err as any)?.status

    if (typeof status === 'number' && status >= 400 && status < 500) {
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (
      message.includes('not configured') ||
      message.includes('SUI_PACKAGE_ID') ||
      message.includes('no gas')
    ) {
      return new Response(JSON.stringify({ error: message, code: 'sponsor_unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: message, code: 'build_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
