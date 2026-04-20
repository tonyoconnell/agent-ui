# Chains

**Every blockchain is a unit in the ONE Protocol. Every payment is a routed signal. Pheromone finds the cheapest path.**

> See [one-protocol.md](one-protocol.md) — private intelligence, public results.
> This doc extends the protocol to chains. The same formula that routes agents
> routes money. The same learning that picks the best translator picks the
> cheapest bridge. Others see fast, cheap cross-chain payments. They don't see why.

---

## The Protocol Learns Chains

From `one-protocol.md`:

```
Agentverse (public)          ONE Substrate (private)
─────────────────            ──────────────────────
Our agents + everyone's      Paths, highways, inference
Same platform                Learned routing (<10ms)
```

Now extend it:

```
Any chain (public)           ONE Substrate (private)
──────────────────           ──────────────────────
ETH, SOL, BTC, SUI          Paths between chains
Same tokens                  Learned routes (<30s cross-chain)
Same bridges                 Cheapest bridge auto-selected
                             Failed routes auto-avoided
```

Other operators configure bridges. We let the substrate learn them.

---

## Sui is Home

Sui is not one of the chains. Sui is where the protocol lives.

```
                         ┌──────────────────────────────────┐
                         │           SUI (home)             │
                         │                                  │
                         │   $ONE token    (Coin<ONE>)      │
                         │   Agent wallets (deriveKeypair)  │
                         │   Move contract (one.move)       │
                         │   Escrow        (shared objects) │
                         │   Settlement    (mark + pay)     │
                         │                                  │
                         └───────┬──────┬──────┬────────────┘
                                 │      │      │
                    ┌────────────┘      │      └────────────┐
                    │                   │                    │
              ┌─────▼─────┐     ┌──────▼──────┐     ┌──────▼──────┐
              │ bridge:evm │     │ bridge:sol  │     │ bridge:btc  │
              └────────────┘     └─────────────┘     └─────────────┘
                 ETH Base           Solana              Bitcoin
                 Arb Polygon
```

Other chains are ports. You dock, load cargo, sail home.

---

## Chain = Unit

Same `unit()` API as any agent. Same pheromone. Same four outcomes.

```typescript
net.add('bridge:evm')
  .on('balance', ({ address, chain }) => getEvmBalance(address, chain))
  .on('send',    ({ to, amount, chain }) => sendEvmTransaction(...))
  .on('swap',    ({ from, to, amount }) => routeViaUniswap(...))
  .on('price',   ({ token }) => getTokenPrice(token))

net.add('bridge:sol')
  .on('balance', ({ address }) => getSolBalance(address))
  .on('send',    ({ to, amount }) => sendSolTransaction(...))
  .on('swap',    ({ from, to }) => routeViaJupiter(...))

net.add('bridge:btc')
  .on('balance', ({ address }) => getBtcBalance(address))
  .on('send',    ({ to, amount }) => buildPsbt(...))
```

One handler per verb. The substrate wraps it in the deterministic sandwich:

```
PRE:   isToxic(buyer → bridge:eth)?        → dissolve ($0, no failed TX)
PRE:   capable(bridge:eth, 'send')?         → dissolve (chain not supported)
EXEC:  bridge:eth:send(to, amount)          → blockchain transaction
POST:  { result } → mark(buyer→bridge:eth)  → path strengthens
       { timeout } → neutral                → bridge is slow, not bad
       { dissolved } → warn(0.5)            → insufficient funds / bad address
       (failure) → warn(1)                  → TX reverted, route weakens
```

The four outcomes are the same. The stakes are higher — `warn()` on a financial path means real money failed. The substrate learns faster on financial paths because the signal is stronger.

---

## Token = Skill

```tql
/- Every token is a skill on its bridge unit
insert $s isa skill, has skill-id "sui:one", has name "$ONE",
  has price 1.0, has tag "token", has tag "sui", has tag "native";
insert $s isa skill, has skill-id "eth:eth", has name "ETH",
  has tag "token", has tag "eth";
insert $s isa skill, has skill-id "eth:usdc", has name "USDC",
  has tag "token", has tag "stablecoin", has tag "eth";
insert $s isa skill, has skill-id "sui:usdc", has name "USDC",
  has tag "token", has tag "stablecoin", has tag "sui";

/- Bridge unit has capability per token it handles
insert (provider: $bridge_evm, offered: $eth_skill) isa capability;
insert (provider: $bridge_sui, offered: $sui_one_skill) isa capability;
```

Discovering tokens = discovering skills:

```typescript
await one.discover('token', { tags: ['eth'] })
// → [ETH, USDC, USDT, ...] — everything bridge:evm can handle

await one.discover('token', { tags: ['stablecoin'] })
// → [USDC on eth, USDC on sui, USDC on sol] — all chains
```

---

## $ONE

`Coin<ONE>` on Sui. The blood of the protocol.

| Use | Fee | Revenue layer |
|-----|-----|---------------|
| Route a signal | 0.0001 $ONE | L1 Routing |
| Discover an agent | 0.001 $ONE | L2 Discovery |
| Host a group | $ONE/month | L3 Infrastructure |
| Settle a trade | 2% in $ONE | L4 Marketplace |
| Buy learned routes | $ONE | L5 Intelligence |

Sellers set prices in USD. Settlement converts to $ONE at signal-time price.
No oracle contract — CoinGecko for now, DEX pool price (Cetus/Turbos) at scale.

---

## Accept Any Token → Settle in $ONE

The protocol makes this invisible. Buyer pays with whatever. Seller receives $ONE. The substrate finds the path.

### Seller lists

```yaml
# agents/alice.md
skills:
  - name: cat-photo
    price: 100          # USD
    tags: [product, photo]
    accept: [any]       # buyer picks token
    settle: sui:one     # seller receives $ONE
```

### Buyer pays

```typescript
await one.hire('alice:cat-photo', {
  pay: { token: 'ETH', chain: 'eth' }
  // buyer doesn't think about routing
})
```

### Substrate routes

```
buyer:eth
  → bridge:evm:send (lock ETH)
  → dex:uniswap:swap (ETH → USDC)
  → bridge:cctp:transfer (USDC eth→sui, ~30s)
  → dex:cetus:swap (USDC → ONE)
  → seller receives $ONE
  → mark(every hop)
  → substrate takes 2% at settlement
```

### Pheromone picks the route

First time: tries known bridges. Tenth time: prefers the fast one.
Fiftieth time: highway. The route IS the protocol's private intelligence.

```
After 50 ETH→ONE payments:

bridge:cctp    strength=50  (fast, reliable, marks accumulate)
bridge:wormhole strength=12  (slow, some timeouts, fewer marks)

select('route:eth→sui') → CCTP every time
```

No one compared bridges. No one benchmarked. The ants found the food.

---

## Cross-Chain Bridge Units

Bridge protocols are competing units. Pheromone picks the winner.

```
bridge:cctp       Circle CCTP    (USDC native, fast, Sui+EVM+Sol)
bridge:wormhole   Wormhole       (general, slow, broad chains)
bridge:thorchain  THORChain      (BTC native swaps)
bridge:layerzero  LayerZero      (EVM fast, growing Sui support)
```

Each is a unit with `transfer` and `redeem` handlers. The substrate doesn't prefer any — it marks on success, warns on failure, fades over time. The best bridge wins by doing the work.

---

## Payment Signal

```typescript
{
  receiver: 'pay',
  data: {
    skill: 'alice:cat-photo',            // what to buy
    pay: { token: 'ETH', chain: 'eth' }, // buyer has this
    settle: { token: 'ONE', chain: 'sui' }, // seller wants this
    prefer: 'speed' | 'cost',            // optional
    tags: ['payment', 'eth', 'sui', 'product']
  }
}
```

Four outcomes:

| Outcome | What happened | Path effect |
|---------|--------------|-------------|
| `{ result }` | TX confirmed on-chain | `mark(each hop, amount × depth)` |
| `{ timeout }` | Bridge in transit | Neutral — bridges take time |
| `{ dissolved }` | No route / insufficient balance | `warn(0.5)` — path doesn't exist |
| `(failure)` | TX reverted / bridge failed | `warn(1)` — route broke |

---

## Per-Chain Status

### Sui — native (already integrated)

`deriveKeypair`, Move contract, bridge.ts, escrow — all live on testnet.
Deploy $ONE token + DEX LP to unlock commerce.

### EVM (ETH, Base, Arbitrum, Polygon) — one unit

All share the same RPC interface. `BlockchainService.ts` already has
`getEvmBalance()`, chain configs, explorer URLs. Need: TX signing (viem),
ERC-20 support, DEX routing (Uniswap SDK as `dex:uniswap` unit).

### Solana — one unit

`BlockchainService.ts` has `getSolBalance()`, JSON-RPC config. Need:
`@solana/web3.js` for signing, Jupiter API as `dex:jupiter` unit.

### Bitcoin — one unit, UTXO complexity

`BlockchainService.ts` has `getBtcBalance()` via Blockstream. Need:
PSBT construction (bitcoinjs-lib), UTXO selection, fee estimation.
No native DEX — cross-chain via THORChain for BTC→SUI/ETH.

---

## Implementation Phases

| Phase | What | Protocol unlocks |
|-------|------|-----------------|
| **1** | Bridge units (read-only: balance, history) | Multi-chain data in substrate |
| **2** | Send handlers (EVM → SOL → BTC) | Sends are signals. Paths learn. |
| **3** | $ONE token on Sui | Settlement. Revenue. The token IS the protocol. |
| **4** | DEX units (Uniswap, Jupiter, Cetus) | Swaps as signals. Route learning. |
| **5** | Cross-chain bridges (CCTP, Wormhole) | Any→any routing. Intelligence compounds. |
| **6** | `/pay/:skill-id` page | Public commerce. The protocol made visible. |

Each phase is a cycle. Each cycle deepens the protocol's private intelligence.
Phase 5 is when others start asking how.

---

## The Moat

Centralized payment processors have static routes. The protocol has routes that learn.

After 10,000 payments the substrate knows:
- Which bridge is fastest for USDC→Sui at 3am UTC
- Which DEX has deepest ETH→USDC liquidity on high-gas days
- Which routes fail when Ethereum mempool spikes
- Which token pairs have zero slippage under $1K

That knowledge is Layer 5 Intelligence — the same "private intelligence, public results" from the protocol doc. Others see cheap, fast cross-chain payments. They don't see the pheromone underneath.

When they ask how — that's when the protocol becomes available.

---

*Every chain is a unit. Every token is a skill. Every payment is a signal.
The protocol routes. Pheromone learns. $ONE settles.
Private intelligence. Public results.*

---

## See Also

- [one-protocol.md](one-protocol.md) — the protocol this extends
- [TODO-chains.md](TODO-chains.md) — execution cycles for this doc (WIRE/PROVE/GROW)
- [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE
- [revenue.md](one/revenue.md) — five revenue layers (all gain from chains)
- [routing.md](routing.md) — the formula that routes payments
- [sdk.md](one/sdk.md) — `one.hire()` auto-settles across chains
- [lifecycle-one.md](lifecycle-one.md) — Stage 0 wallet, Stage 9-10 sell/buy
- [migrate-u.md](migrate-u.md) — the wallet dashboard that surfaces all of this
- [TODO-migrate-u.md](TODO-migrate-u.md) — prerequisite: /u dashboard wired
- [TODO-SUI.md](TODO-SUI.md) — Sui phases (token, escrow, bridge)
