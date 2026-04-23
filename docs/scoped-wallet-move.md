# scoped_wallet.move — Reference

Module: `one::scoped_wallet`
Source: `src/move/one/sources/scoped_wallet.move`
Package env var: `SUI_PACKAGE_ID`

---

## Struct

```move
public struct ScopedWallet<phantom T> has key {
    id: UID,
    owner: address,          // Controls pause / revoke / rotate
    agent: address,          // May call spend() up to daily_cap per epoch
    daily_cap: u64,          // Max spend per epoch in smallest unit of T (MIST for SUI)
    spent_today: u64,        // Cumulative spend in current epoch; reset at epoch boundary
    epoch_of_last_reset: u64,// Epoch of last spent_today reset
    paused: bool,            // When true, spend() aborts
    allowlist: vector<address>, // Permitted recipients; empty = any recipient allowed
}
```

`T` is phantom — no `Balance<T>` is stored inside the object. Funds are separate `Coin<T>` objects owned at the wallet's object address. The wallet itself travels the owned-object fast path for all owner mutations.

---

## Error Codes

| Constant | Value | Abort condition |
|---|---|---|
| `EZeroDailyCap` | 0 | `daily_cap` must be > 0 |
| `E_NOT_AGENT` | 1 | Caller is not `wallet.agent` |
| `E_PAUSED` | 2 | Wallet is paused |
| `E_CAP_EXCEEDED` | 3 | `spent_today + amount > daily_cap` or `child_daily_cap > parent.daily_cap` |
| `E_NOT_ALLOWED` | 4 | Recipient not in non-empty allowlist |
| `E_NOT_OWNER` | 5 | Caller is not `wallet.owner` |

---

## Entry Functions

### `create<T>`

```move
public entry fun create<T>(
    agent: address,
    daily_cap: u64,
    allowlist: vector<address>,
    ctx: &mut TxContext
)
```

Owner mints a new `ScopedWallet<T>` and receives it. `daily_cap` must be > 0. Empty `allowlist` permits any recipient. Emits `WalletCreated`.

### `fund<T>`

```move
public entry fun fund<T>(
    wallet: &mut ScopedWallet<T>,
    coin: Coin<T>,
    ctx: &mut TxContext
)
```

Anyone may top up a wallet. The `Coin<T>` is transferred to the wallet object's address (not inside the struct). Emits `WalletFunded`.

### `spend<T>`

```move
public entry fun spend<T>(
    wallet: &mut ScopedWallet<T>,
    coin: &mut Coin<T>,
    to: address,
    amount: u64,
    ctx: &mut TxContext
)
```

Agent-only. Guards in order:
1. Caller == `wallet.agent` — aborts `E_NOT_AGENT`
2. `!wallet.paused` — aborts `E_PAUSED`
3. Epoch reset if needed, then `spent_today + amount <= daily_cap` — aborts `E_CAP_EXCEEDED`
4. Allowlist check (empty list passes) — aborts `E_NOT_ALLOWED`

Splits `amount` from `coin`, transfers to `to`, increments `spent_today`. Emits `SpendExecuted`.

### `pause<T>` / `unpause<T>`

```move
public entry fun pause<T>(wallet: &mut ScopedWallet<T>, ctx: &mut TxContext)
public entry fun unpause<T>(wallet: &mut ScopedWallet<T>, ctx: &mut TxContext)
```

Owner-only. Toggle `wallet.paused`. Emit `WalletPaused` / `WalletUnpaused`.

### `revoke<T>`

```move
public entry fun revoke<T>(wallet: ScopedWallet<T>, ctx: &mut TxContext)
```

Owner-only. Consumes (destroys) the wallet object permanently. `Coin<T>` objects held at the wallet's address are independent and must be reclaimed separately. Emits `WalletRevoked`.

### `spawn_child<T>`

```move
public entry fun spawn_child<T>(
    parent: &ScopedWallet<T>,
    child_agent: address,
    child_daily_cap: u64,
    child_allowlist: vector<address>,
    ctx: &mut TxContext
)
```

Parent owner only. Creates a child `ScopedWallet<T>` whose `owner` is the parent wallet's object address (not the human caller). `child_daily_cap` must be > 0 and ≤ `parent.daily_cap`. Forms a recursive ownership tree: human → parent wallet → child wallet. Emits `ChildSpawned`. The tree supports up to 3 levels in the TS fleet view (depth 0/1/2).

### `rotate_day<T>`

```move
public entry fun rotate_day<T>(wallet: &mut ScopedWallet<T>, ctx: &mut TxContext)
```

Permissionless. Resets `spent_today` to 0 if the current epoch has advanced. Idempotent within a single epoch. Useful for cron workers that want to force the reset without spending.

### `rotate_owner<T>`

```move
public entry fun rotate_owner<T>(
    wallet: &mut ScopedWallet<T>,
    new_owner: address,
    ctx: &mut TxContext
)
```

Owner-only. Changes `wallet.owner` to `new_owner`; funds stay in place. New owner immediately gains pause/revoke/rotate authority. Emits `OwnerRotated`. Corresponds to agents.md §Pattern D (peer wallet handoff).

---

## Events

| Event | Fields | When |
|---|---|---|
| `WalletCreated` | `wallet_id, owner, agent, daily_cap` | `create<T>` succeeds |
| `WalletFunded` | `wallet_id, by, amount, epoch` | `fund<T>` succeeds |
| `SpendExecuted` | `wallet_id, to, amount, epoch` | `spend<T>` succeeds |
| `WalletPaused` | `wallet_id, by, epoch` | `pause<T>` succeeds |
| `WalletUnpaused` | `wallet_id, by, epoch` | `unpause<T>` succeeds |
| `WalletRevoked` | `wallet_id, by, funds_returned_to, epoch` | `revoke<T>` succeeds |
| `ChildSpawned` | `parent_wallet_id, child_wallet_id, child_agent, daily_cap, epoch` | `spawn_child<T>` succeeds |
| `OwnerRotated` | `wallet_id, old_owner, new_owner, epoch` | `rotate_owner<T>` succeeds |

---

## Invariants

- `daily_cap > 0` always (enforced at create and spawn_child).
- `spent_today <= daily_cap` after every `spend<T>`.
- `child.daily_cap <= parent.daily_cap` at spawn time (not re-checked on subsequent parent rotations).
- The wallet object itself holds no `Balance<T>` — it only tracks accounting. Coin ownership is by object address, separate from the struct lifecycle.
- `revoke<T>` destroys accounting but does not drain coins; callers must reclaim coin objects independently.

---

## TypeScript Builder

`src/components/u/lib/scoped-wallet.ts` builds unsigned PTBs for every entry function and exports `getScopedWallet(walletId)` for read-only chain access. See `docs/scoped-autonomy.md` for the TS-side workflow.
