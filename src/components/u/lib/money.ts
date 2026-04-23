/**
 * Money Formatting & Address Resolution (wallet-v2)
 *
 * Contract: money.d.ts
 * User sees dollars, not SUI. No raw addresses without a tap.
 *
 * Primary display: dollars via formatUsd()
 * Under-disclosure: SUI amount via formatSui()
 * Address handling: human-readable names via resolveAddress()
 * Validation: isValidAddress() for Sui hex addresses
 */

import { TransactionDataBuilder } from '@mysten/sui/transactions'

/**
 * Sui blockchain address brand — matches interfaces/types-sui.d.ts.
 * Defined locally because the interfaces/ directory is not in this worktree's
 * TypeScript resolution paths (it lives at repo root, outside tsconfig rootDir).
 */
export type SuiAddress = string & { readonly _brand: 'SuiAddress' }

import { fromBase64 } from '@mysten/bcs'

// ── Constants ──────────────────────────────────────────────────────────────

/** 1 SUI in MIST */
const MIST_PER_SUI = 1_000_000_000n

/**
 * STATE 1 CAP — Max balance for unprotected wallet.
 *
 * Upper limit in MIST for State 1 (unprotected, mobile device only).
 * ~20 SUI × ~$1 = ~$20 USD. Tune when price diverges significantly.
 * State 2+ (passkey protected) lifts the cap.
 */
export const STATE1_CAP_MIST: bigint = 20_000_000_000n

// ── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format SUI balance as dollars (primary display).
 *
 * Converts MIST → SUI → USD, returns "$X,XXX.XX" formatted string.
 *
 * @param suiAmount - Balance in MIST (1 SUI = 10^9 MIST)
 * @param suiPriceUsd - Current SUI price in USD
 * @returns Formatted USD string, e.g., "$1,234.56"
 */
export function formatUsd(suiAmount: bigint, suiPriceUsd: number): string {
  const suiFloat = Number(suiAmount) / 1e9
  const usd = suiFloat * suiPriceUsd
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd)
}

/**
 * Format SUI amount with units (under-disclosure display).
 *
 * Shows raw SUI with 3 decimal places, e.g., "1.500 SUI".
 *
 * @param suiAmount - Amount in MIST (1 SUI = 10^9 MIST)
 * @returns Formatted SUI string with units
 */
export function formatSui(suiAmount: bigint): string {
  const whole = suiAmount / MIST_PER_SUI
  const frac = suiAmount % MIST_PER_SUI
  // 3 decimal places: take top 3 digits of the fractional MIST amount
  const fracThree = Math.floor(Number(frac) / 1_000_000)
  const fracStr = fracThree.toString().padStart(3, '0')
  return `${whole}.${fracStr} SUI`
}

// ── Transaction summary ────────────────────────────────────────────────────

/**
 * Rebuild human-readable tx summary from raw bytes.
 *
 * Parses transaction bytes (BCS-encoded TransactionData or TransactionKind).
 * Excludes low-level details (epoch, signature type).
 * Returns structured summary suitable for user display.
 *
 * @param txBytes - Raw serialized transaction bytes
 * @returns Promise resolving to human-readable transaction summary
 */
export async function summarizeTx(txBytes: Uint8Array): Promise<string> {
  try {
    // Try to parse as full TransactionData first, then as TransactionKind
    let builder: ReturnType<typeof TransactionDataBuilder.fromBytes>
    try {
      builder = TransactionDataBuilder.fromBytes(txBytes)
    } catch {
      builder = TransactionDataBuilder.fromKindBytes(txBytes)
    }

    const snap = builder.snapshot()
    const commands = snap.commands

    if (!commands || commands.length === 0) {
      return 'Empty transaction'
    }

    const parts: string[] = []

    for (const cmd of commands) {
      const kind = cmd.$kind

      if (kind === 'TransferObjects') {
        const tc = cmd as {
          $kind: 'TransferObjects'
          TransferObjects: { objects: unknown[]; address: unknown }
        }
        const count = tc.TransferObjects.objects.length
        const addrArg = tc.TransferObjects.address as { Input?: number }
        let addrLabel = 'unknown'
        if (typeof addrArg?.Input === 'number') {
          const inp = snap.inputs[addrArg.Input]
          if (inp && inp.$kind === 'Pure') {
            addrLabel = _decodePureAddress(inp.Pure as { bytes: string })
          }
        }
        const objLabel = count === 1 ? '1 object' : `${count} objects`
        parts.push(`Transfer ${objLabel} to ${addrLabel}`)
      } else if (kind === 'SplitCoins') {
        const sc = cmd as {
          $kind: 'SplitCoins'
          SplitCoins: { coin: unknown; amounts: unknown[] }
        }
        const count = sc.SplitCoins.amounts.length
        parts.push(`Split ${count} coin${count !== 1 ? 's' : ''} from gas`)
      } else if (kind === 'MergeCoins') {
        parts.push('Merge coins')
      } else if (kind === 'MoveCall') {
        const mc = cmd as {
          $kind: 'MoveCall'
          MoveCall: { package: string; module: string; function: string }
        }
        const { module, function: fn } = mc.MoveCall
        parts.push(`Call ${module}::${fn}`)
      } else if (kind === 'Publish') {
        parts.push('Publish package')
      } else if (kind === 'Upgrade') {
        parts.push('Upgrade package')
      } else if (kind === 'MakeMoveVec') {
        parts.push('Make Move vector')
      } else {
        parts.push(String(kind ?? 'Unknown command'))
      }
    }

    return parts.join('; ')
  } catch {
    return 'Unable to parse transaction'
  }
}

/** Attempt to decode a BCS Pure input as a Sui address (32 bytes). */
function _decodePureAddress(pure: { bytes: string }): string {
  try {
    const raw = fromBase64(pure.bytes)
    if (raw.length === 32) {
      return `0x${Array.from(raw)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`
    }
  } catch {
    // ignore
  }
  return 'unknown'
}

// ── Transaction response summary ─────────────────────────────────────────────

export interface TxSummary {
  digest: string
  description: string
  kind: "send" | "receive" | "interact"
  amountMist?: bigint
  counterparty?: string
  timestampMs?: number
  status: "success" | "failure"
}

/**
 * Summarize a full Sui RPC transaction response into user-readable form.
 * Used by TransactionsPage to display history without raw addresses.
 */
export function summarizeTxResponse(
  tx: { digest: string; timestampMs?: string | null; effects?: { status?: { status: string } } | null; transaction?: { data?: { sender?: string } } | null },
  userAddress: string
): TxSummary {
  const sender = tx.transaction?.data?.sender ?? ""
  const isIncoming = sender !== userAddress
  const kind: TxSummary["kind"] = isIncoming ? "receive" : "send"
  const status = tx.effects?.status?.status === "success" ? "success" : "failure"
  const digest = tx.digest
  const shortDigest = `${digest.slice(0, 8)}...${digest.slice(-6)}`
  const description = isIncoming ? `Received — tx ${shortDigest}` : `Sent — tx ${shortDigest}`
  return {
    digest,
    description,
    kind,
    counterparty: sender,
    timestampMs: tx.timestampMs ? Number(tx.timestampMs) : undefined,
    status,
  }
}

// ── Address resolution ─────────────────────────────────────────────────────

/** In-process cache: addr → resolved name. Avoids repeat RPC calls. */
const _resolveCache = new Map<string, string>()

/**
 * Resolve address/SuiNS handle to display name.
 *
 * Strategy:
 * 1. Check in-process cache
 * 2. Query /u/people endpoint (internal; may resolve human-readable names)
 * 3. Fall back to short form: "0x1234...abcd" (first 6 + last 4 hex chars)
 *
 * @param addr - SUI address to resolve
 * @returns Promise resolving to display name or shortened address
 */
export async function resolveAddress(addr: SuiAddress): Promise<string> {
  if (_resolveCache.has(addr)) {
    return _resolveCache.get(addr)!
  }

  const short = _shortAddr(addr)

  // Try /u/people endpoint (best-effort; may not be available in all environments)
  try {
    if (typeof globalThis.fetch === 'function') {
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://one.ie'
      const res = await fetch(`${base}/u/people?addr=${encodeURIComponent(addr)}`, {
        signal: AbortSignal.timeout(2000),
      })
      if (res.ok) {
        const data = (await res.json()) as { name?: string }
        if (data?.name) {
          _resolveCache.set(addr, data.name)
          return data.name
        }
      }
    }
  } catch {
    // Network unavailable or timeout — fall through to short form
  }

  _resolveCache.set(addr, short)
  return short
}

/** Shorten a Sui address to "0x1234...abcd" (first 6 + last 4 hex chars). */
function _shortAddr(addr: string): string {
  // addr is "0x" + 64 hex chars
  const hex = addr.startsWith('0x') ? addr.slice(2) : addr
  if (hex.length < 10) return addr
  return `0x${hex.slice(0, 6)}...${hex.slice(-4)}`
}

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate a Sui address format.
 *
 * Valid: "0x" prefix + exactly 64 lowercase hex characters (32 bytes).
 * Type guard: narrows to SuiAddress on success.
 *
 * @param s - String to validate
 * @returns true if valid SUI address, false otherwise
 */
export function isValidAddress(s: string): s is SuiAddress {
  return /^0x[0-9a-fA-F]{64}$/.test(s)
}
