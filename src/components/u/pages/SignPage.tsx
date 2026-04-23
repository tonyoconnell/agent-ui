/**
 * SignPage — Universal Wallet Home
 *
 * The landing screen for /u/sign.
 *
 * Lifecycle:
 *   - Mount: getWallet() from IndexedDB
 *   - If null: generateSeed() → initWalletRecord() → putWallet()
 *   - Show: address, balance in USD, Receive / Send buttons
 *   - State 1 (no wrappings): subtle "Save wallet" banner → /u/save
 *   - State 2+ (has wrappings): no save prompt
 *
 * No zkLogin. No dapp-kit. IndexedDB-backed seed via seed.ts + idb.ts.
 */

import { useEffect, useState } from 'react'
import { emitClick } from '@/lib/ui-signal'
import { generateSeed, initWalletRecord } from '../lib/seed'
import { getWallet, putWallet } from '../lib/idb'
import { formatUsd, resolveAddress } from '../lib/money'
import { getBalance, getTokenPrice } from '../lib/BlockchainService'
import type { WalletRecord } from '../../../../interfaces/types-wallet'

// ── Local helpers ──────────────────────────────────────────────────────────

/** Shorten a Sui address to "0x1234...abcd". */
function shortAddr(addr: string): string {
  const hex = addr.startsWith('0x') ? addr.slice(2) : addr
  if (hex.length < 10) return addr
  return `0x${hex.slice(0, 6)}...${hex.slice(-4)}`
}

// ── Component ──────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'ready' | 'error'

export function SignPage() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [record, setRecord] = useState<WalletRecord | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [balanceMist, setBalanceMist] = useState<bigint>(0n)
  const [suiPrice, setSuiPrice] = useState<number>(0)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string>('')

  // ── Wallet init ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        let w = await getWallet()

        if (!w) {
          // State 0 → State 1: generate fresh seed and persist record
          const seed = generateSeed()
          w = initWalletRecord(seed)
          // Store the seed bytes alongside the record for State 1 signing
          // (seed is not stored in WalletRecord — the caller holds it in memory
          //  until wrapping is complete; here we just need the address)
          await putWallet(w)
        }

        if (cancelled) return
        setRecord(w)
        setLoadState('ready')

        // Resolve display name (best-effort; falls back to short addr)
        const name = await resolveAddress(w.address as Parameters<typeof resolveAddress>[0])
        if (!cancelled) setDisplayName(name)
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : String(e))
          setLoadState('error')
        }
      }
    }

    void init()
    return () => { cancelled = true }
  }, [])

  // ── Balance fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!record) return
    let cancelled = false

    async function fetchBalance() {
      setLoadingBalance(true)
      try {
        const [balResult, price] = await Promise.all([
          getBalance(record!.address, 'sui'),
          getTokenPrice('sui'),
        ])
        if (cancelled) return
        // balResult.balance is SUI float string; convert to MIST bigint
        const mistValue = BigInt(Math.round(parseFloat(balResult.balance) * 1e9))
        setBalanceMist(mistValue)
        setSuiPrice(price)
      } catch {
        // Non-fatal — show $0.00
      } finally {
        if (!cancelled) setLoadingBalance(false)
      }
    }

    void fetchBalance()
    return () => { cancelled = true }
  }, [record])

  // ── State derivation ─────────────────────────────────────────────────────
  const isState1 = record !== null && record.wrappings.length === 0

  // ── Render helpers ───────────────────────────────────────────────────────
  const addrShort = record ? shortAddr(record.address) : ''
  const usdDisplay = loadingBalance ? '—' : formatUsd(balanceMist, suiPrice)

  // ── Loading / error screens ──────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Setting up wallet…</p>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-destructive text-sm">Wallet initialisation failed</p>
          <p className="text-slate-500 text-xs font-mono">{errorMsg}</p>
          <button
            className="mt-4 text-xs text-slate-400 underline"
            onClick={() => { emitClick('ui:sign:retry'); window.location.reload() }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Wallet home ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* Save banner — State 1 only */}
      {isState1 && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-amber-300">
            Your wallet is unprotected — save it with Touch ID
          </p>
          <button
            className="text-xs font-medium text-amber-400 hover:text-amber-200 transition-colors ml-4 whitespace-nowrap"
            onClick={() => {
              emitClick('ui:sign:save-wallet')
              window.location.href = '/u/save'
            }}
            aria-label="Save wallet with passkey"
          >
            Save wallet →
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">

        {/* Balance */}
        <div className="text-center space-y-1">
          <p
            className="text-4xl font-bold tabular-nums"
            aria-label="Wallet balance in US dollars"
          >
            {usdDisplay}
          </p>
          <button
            className="text-sm text-slate-400 font-mono hover:text-slate-200 transition-colors"
            onClick={() => {
              emitClick('ui:sign:copy-address')
              void navigator.clipboard.writeText(record?.address ?? '')
            }}
            title={record?.address}
            aria-label="Copy wallet address"
          >
            {displayName || addrShort}
          </button>
        </div>

        {/* Action row */}
        <div className="flex gap-4">
          <button
            className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-[#161622] border border-[#252538] hover:bg-[#1e1e30] transition-colors min-w-[80px]"
            onClick={() => {
              emitClick('ui:sign:receive')
              window.location.href = '/u/receive'
            }}
            aria-label="Receive funds"
          >
            <span className="text-xl" aria-hidden="true">↓</span>
            <span className="text-xs text-slate-400">Receive</span>
          </button>

          <button
            className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-[#161622] border border-[#252538] hover:bg-[#1e1e30] transition-colors min-w-[80px]"
            onClick={() => {
              emitClick('ui:sign:send')
              window.location.href = '/u/send'
            }}
            aria-label="Send funds"
          >
            <span className="text-xl" aria-hidden="true">↑</span>
            <span className="text-xs text-slate-400">Send</span>
          </button>
        </div>

        {/* Address card */}
        <div className="w-full max-w-sm rounded-2xl bg-[#161622] border border-[#252538] p-4 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Sui address</p>
          <button
            className="w-full text-left text-xs font-mono text-slate-300 break-all hover:text-white transition-colors"
            onClick={() => {
              emitClick('ui:sign:copy-address-full')
              void navigator.clipboard.writeText(record?.address ?? '')
            }}
            aria-label="Copy full Sui address"
          >
            {record?.address}
          </button>
        </div>

      </div>
    </div>
  )
}
