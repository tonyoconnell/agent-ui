# State-1 Wallet Balance Cap

State-1 wallets are ephemeral — the seed exists only in browser memory and has
no passkey wrapping. The $25 USD cumulative balance cap limits exposure if the
session is lost before the user saves the wallet.

---

## The cap

```typescript
// src/pages/api/sponsor/build.ts
export const STATE1_CAP_USD = 25  // $25 USD cumulative balance cap
```

The cap applies only when the client sends `walletState: 1` in the build
request. States 2–5 have at least one passkey wrapping; no server cap is
applied to them.

---

## Enforcement at build time

`POST /api/sponsor/build` enforces the cap before building the sponsored
transaction:

```
1. Client sends { sender, txKind, params, walletState: 1 }
2. Server fetches on-chain balance: suiClient.getBalance({ owner: sender })
3. Server fetches SUI/USD price: getConsensusSuiPrice()
4. currentUsd = mistToUsd(balance.totalBalance, price)
5. txUsd     = mistToUsd(params.amount || params.amountMist, price)
6. if (currentUsd + txUsd > STATE1_CAP_USD) → 400 state1-cap-exceeded
```

The check is `current balance + this transaction > $25`. Receiving does not
trigger the cap — only the build path enforces it (at the point where the
platform would sponsor gas for a spend).

---

## Oracle — `src/lib/oracle.ts`

`getConsensusSuiPrice()` queries two oracles in parallel:

| Oracle | Endpoint |
|--------|---------|
| Pyth Network (primary) | Hermes REST (`/v2/updates/price/latest`) |
| CoinGecko (secondary) | Public free endpoint |

**Rejection conditions:**

- Any feed older than 60 seconds → throws `oracle: feed <source> stale`.
- Both feeds deviate more than 2% from each other → throws `oracle: feeds deviate`.
- Both feeds unavailable → throws `oracle: no price feeds available`.

Single-feed fallback: if one oracle is unavailable the other is used alone (provided it passes the staleness check).

---

## Oracle unavailable — fail-open

```typescript
try {
  const [balanceInfo, price] = await Promise.all([
    suiClient.getBalance({ owner: sender }),
    getConsensusSuiPrice(),
  ])
  // ... cap check
} catch {
  // Oracle or RPC unavailable — fall through and allow the tx
}
```

If the oracle or the Sui RPC throws, the cap check is skipped and the
transaction is allowed to proceed. This prevents oracle outages from blocking
legitimate sends. The trade-off is accepted: a network outage temporarily
disables the cap, but the cap itself is a UX guardrail, not a security boundary.
The user's funds are their own regardless of state.

---

## Security rationale

The cap defends against accidental large deposits into an unsaved wallet — not
against a malicious user. A malicious user can set `walletState: 2` and bypass
the cap entirely; the server cannot verify the true wallet state. The cap is
therefore honest labelling: it defaults to a safe posture for new users who may
not yet understand the ephemeral nature of State-1.

The passkeys architecture (`passkeys.md`) is the actual security mechanism.
State-1 is transitional; the cap is a friction-based nudge to save the wallet.

---

## Source files

| File | Purpose |
|------|---------|
| `src/pages/api/sponsor/build.ts` | Build handler — cap enforcement at lines 237-263 |
| `src/lib/oracle.ts` | Two-oracle consensus price, staleness + deviation checks |
