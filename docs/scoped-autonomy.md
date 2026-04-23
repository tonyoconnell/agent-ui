# Scoped Autonomy — ScopedWallet TS Reference

TypeScript wrapper and fleet view for `one::scoped_wallet`.

Sources:
- `src/components/u/lib/scoped-wallet.ts` — PTB builders + chain reader
- `src/components/u/FleetIsland.tsx` — fleet view island
- `src/pages/u/fleet.astro` — `/u/fleet` route

Move reference: `docs/scoped-wallet-move.md`

---

## Overview

A `ScopedWallet<SUI>` is a Move object that lets a designated agent address spend up to a daily cap on behalf of an owner. All builder functions return `Uint8Array` (serialised PTB bytes). The caller decides who signs: server-side via `signAndExecute()`, or passed to a browser wallet (dApp Kit).

---

## Creating a Scoped Wallet

```typescript
import { buildCreateScopedWallet } from '@/components/u/lib/scoped-wallet'

const txBytes = await buildCreateScopedWallet({
  agent: '0xagent....',         // address authorised to call spend()
  dailyCapMist: 500_000_000n,   // 0.5 SUI per epoch
  allowlist: [],                // empty = any recipient allowed
})
// sign + execute via dApp Kit or server keypair
```

The wallet object is transferred to the transaction sender (owner) on-chain. `dailyCapMist` must be > 0. Pass specific addresses in `allowlist` to restrict where the agent can send funds.

---

## Funding

```typescript
import { buildFund } from '@/components/u/lib/scoped-wallet'

const txBytes = await buildFund(walletId, coinId, 200_000_000n) // 0.2 SUI
```

Anyone may fund a wallet. The coin is split by `amountMist` and transferred to the wallet object's address. Emits `WalletFunded`.

---

## Spending Within Cap

```typescript
import { buildSpend } from '@/components/u/lib/scoped-wallet'

const txBytes = await buildSpend(
  walletId,       // ScopedWallet object ID
  coinId,         // Coin<SUI> object ID held by the agent
  recipientAddr,  // recipient (must be in allowlist if non-empty)
  100_000_000n,   // 0.1 SUI
)
```

The transaction sender must be `wallet.agent` — enforced on-chain (`E_NOT_AGENT`). Move checks guards in order: not-agent → paused → cap exceeded → not-allowed. `spent_today` resets automatically at epoch boundaries.

---

## Pause / Unpause

```typescript
import { buildPause, buildUnpause } from '@/components/u/lib/scoped-wallet'

const pauseTx  = await buildPause(walletId)   // owner only
const resumeTx = await buildUnpause(walletId) // owner only
```

While paused, any `spend()` call aborts with `E_PAUSED`. The owner can pause mid-epoch without losing the daily cap accounting.

---

## Revoke

```typescript
import { buildRevoke } from '@/components/u/lib/scoped-wallet'

const txBytes = await buildRevoke(walletId) // owner only — permanent
```

Destroys the wallet object. `Coin<SUI>` objects at the wallet's address are independent and must be reclaimed separately. Once revoked the object ID is gone — there is no undo.

---

## Rotate Owner

```typescript
import { buildRotateOwner } from '@/components/u/lib/scoped-wallet'

const txBytes = await buildRotateOwner(walletId, newOwnerAddr)
```

Transfers ownership without moving funds. New owner gains immediate pause/revoke/rotate authority. Corresponds to agents.md §Pattern D (peer wallet handoff).

---

## Reading Chain State

```typescript
import { getScopedWallet } from '@/components/u/lib/scoped-wallet'

const w = await getScopedWallet(walletId)
// Returns null if revoked or not a ScopedWallet

// ScopedWalletStruct fields:
// id, owner, agent: SuiAddress
// dailyCap, spentToday: bigint (MIST)
// paused: boolean
// allowlist: string[]
// createdAt: number (epoch number of last reset)
```

No signing required. Uses the public RPC via `getClient()` from `@/lib/sui`.

---

## Fleet View — `/u/fleet`

Route: `src/pages/u/fleet.astro` (prerendered shell, `FleetIsland` hydrates `client:load`)
Island: `src/components/u/FleetIsland.tsx`
API: `GET /api/u/fleet?address=<suiAddress>`

### Tree Structure

`FleetIsland` renders the transitive tree of `ScopedWallet` objects rooted in the user's Sui address. Each node is a `FleetNode`:

```typescript
interface FleetNode {
  walletId: string
  ownerLabel: string    // "You" (depth 0) or agent name
  agentLabel: string    // agent uid or "unknown"
  dailyCapMist: string  // bigint as string
  spentTodayMist: string
  paused: boolean
  depth: number         // 0 = owned by user, 1 = owned by a depth-0 wallet, 2 = deeper
  children: FleetNode[]
}
```

The view supports 3 levels of depth (depth 0/1/2, matching `spawn_child`). Indentation increases by `ml-6` per depth level.

### Balance Rollup

Total exposure = sum of `dailyCapMist` across all nodes in the tree. Displayed in USD (placeholder 1.5 USD/SUI) and SUI.

### Per-Node Display

Each `FleetNodeCard` shows: agent label, active/paused indicator, daily cap (USD + SUI), spent today, progress bar (cyan < 60%, amber 60–90%, red ≥ 90%), and truncated wallet ID.

Paused wallets render at reduced opacity with a `paused` badge.

### Address Derivation

Address is read from IndexedDB via `getWallet()` from `@/components/u/lib/idb` — no server session required. If no vault record exists, a prompt to set up the wallet on `/u/save` is shown.

### Signals

| Click | Receiver |
|---|---|
| Load on mount | `ui:fleet:load` |
| Refresh button | `ui:fleet:refresh` |

---

## Error Codes (quick reference)

| Code | Value | Meaning |
|---|---|---|
| `E_NOT_AGENT` | 1 | Transaction sender is not the wallet's agent |
| `E_PAUSED` | 2 | Wallet is paused by owner |
| `E_CAP_EXCEEDED` | 3 | Amount would exceed daily cap |
| `E_NOT_ALLOWED` | 4 | Recipient not in allowlist |
| `E_NOT_OWNER` | 5 | Operation requires wallet owner |

---

## See Also

- `docs/scoped-wallet-move.md` — Move module reference (struct layout, all entry fns, events)
- `agents.md` — 4 agent patterns; Pattern D = peer wallet handoff via `rotate_owner`
- `wallet.md` — Wallet lifecycle phases
- `src/move/one/sources/scoped_wallet.move` — canonical source
