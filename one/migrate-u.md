# Migrate `/u` — Strategic Impact Analysis

> **Source:** `../ONE/web/src/components/u/` (50 files) + `../ONE/web/src/pages/u/` (16 pages)
> **Target:** `src/components/u/` + `src/pages/u/`
>
> This document was rewritten after realizing the first draft treated this as a
> file-move exercise. It's not. `/u` introduces a fundamentally different wallet
> model, identity layer, commerce flow, and state system into the substrate.
> The file inventory is at the bottom. The strategic questions come first.

---

## The Conflict

The substrate has one wallet model. ONE's `/u` has another. They are philosophically opposed.

| | Substrate (envelopes) | `/u` (ONE) |
|---|---|---|
| **Identity** | `deriveKeypair(uid)` — deterministic, platform seed + UID | `Ed25519Keypair.generate()` — random, user-generated |
| **Key storage** | No keys stored. Pure function from seed. Lose seed = lose all. | localStorage. Encrypted with user password via `crypto.subtle`. |
| **Who controls** | Platform holds `SUI_SEED`. Agent/user holds nothing. | User holds everything. Platform holds nothing. |
| **Chains** | Sui-native + bridge units per chain ([chains.md](chains.md)) | Multi-chain: ETH, BTC, SOL, SUI, Base, Arbitrum, Polygon. |
| **State** | TypeDB (server-side, persistent, shared) | localStorage (client-side, per-device, private) |
| **Commerce** | `signal → mark → path learns → $ONE settlement` | Peer-to-peer crypto. No signal. No path. No learning. |
| **Revenue** | $0.0001/signal, $0.001/discovery, 2% in $ONE | $0 — direct transfers bypass the substrate entirely |

**If we just copy the files, we get a shadow economy.** Users send crypto through `/u` — peer-to-peer, no signals, no marks, no path learning, no routing fees. The substrate is blind to it. It's like building a highway system and then letting everyone fly helicopters.

---

## The Five Hard Questions

### 1. Two wallet models or one?

`lifecycle-one.md` Stage 0 says: "Identity derived — Ed25519 from seed + uid. No key stored."
ONE's `/u` says: "Generate keypair locally, store in localStorage, encrypt with password."

These can't both be "the wallet." Options:

**A. Substrate wallet is primary, /u wallet is secondary (bridge model)**
- User creates substrate identity at signup → `addressFor(uid)` → Sui address
- `/u` lets them *also* manage external wallets (ETH, BTC, SOL) for interop
- Substrate actions (signal, discover, buy, sell) use the derived wallet
- External sends (peer-to-peer crypto) use the localStorage wallets
- Bridge: external wallets *link* to the substrate actor — the substrate knows they exist but doesn't hold keys

**B. /u wallet replaces substrate wallet (self-custody model)**
- Users bring their own Sui wallet (generated in `/u`)
- `deriveKeypair(uid)` becomes optional — for agents only
- Humans authenticate by signing a challenge with their `/u` wallet
- All substrate actions settle to the user's self-custodial address
- Problem: breaks the "no key stored" guarantee. Increases attack surface.

**C. Dual identity (coexistence model)**
- Substrate actors have a derived address (for system operations, routing fees)
- Users have self-custodial addresses (for personal crypto)
- A "link" relation in TypeDB connects them: `(substrate: $s, external: $e) isa wallet-link`
- Revenue: substrate operations charge the derived wallet; personal sends go through `/u`
- Problem: two addresses per user. Confusing. Who pays for what?

### 2. Does /u bypass the substrate's commerce loop?

`buy-and-sell.md` defines four steps: LIST → DISCOVER → EXECUTE → SETTLE.
- LIST = skill with price in TypeDB
- DISCOVER = `select()` by pheromone
- EXECUTE = `signal → ask → result`
- SETTLE = `mark(edge, weight)` + Sui `pay()`

ONE's `/u` products skip all of this. A user creates a product, generates a `pay.one.ie` payment link, shares it. The buyer clicks the link, pays directly. No signal enters the substrate. No path is marked. No pheromone accumulates. The substrate doesn't learn which products sell or which sellers are reliable.

**The fix:** Products in `/u` must become capabilities in TypeDB. Creating a product = `LIST`. Sharing a payment link = `DISCOVER` (the link IS the discovery). Payment = `EXECUTE + SETTLE`. Every sale marks the buyer→seller path. The substrate learns which products work.

### 3. Does /u break the deterministic sandwich?

The substrate's sandwich: `isToxic? → capable? → LLM → outcome`

For crypto sends:
- **PRE (toxic check):** Can the substrate check if a send destination is toxic before the user sends? Only if paths exist. New addresses have no history.
- **EXECUTE:** A blockchain transaction is irreversible after confirmation. The substrate's `dissolved` outcome (signal goes nowhere) doesn't apply — you can't un-send crypto.
- **POST (outcome):** `{ result }` = transaction confirmed. `{ timeout }` = pending (mempool). `{ dissolved }` = insufficient balance (caught pre-send). `{ failure }` = transaction reverted.

**The issue:** The sandwich assumes cheap dissolution. Crypto sends are expensive to fail. The PRE check matters more, and the POST outcome has real financial consequences. The substrate's learning from `warn()` on a failed crypto send is: *this path costs money when it fails*. That's a different kind of toxicity than a failed LLM call.

### 4. What does multi-chain mean for routing?

**Resolved: see [chains.md](chains.md).** Every chain is a unit (`bridge:evm`, `bridge:sol`, `bridge:btc`). Payments route through bridge units as signals. Pheromone accumulates on each hop of the payment path. The substrate learns which bridges are fastest and cheapest — that's the protocol's private intelligence ([one-protocol.md](one-protocol.md)).

### 5. What happens to revenue?

If `/u` sends bypass the substrate:
- Layer 1 (Routing): $0 — no signal, no toll
- Layer 2 (Discovery): $0 — payment link shared manually
- Layer 4 (Marketplace): $0 — no capability listing, no settlement
- Layer 5 (Intelligence): $0 — no data, no learning

If `/u` sends go through the substrate:
- Layer 1: $0.0001 per send signal
- Layer 2: $0.001 per product discovery
- Layer 4: 2% on marketplace settlement
- Layer 5: Wallet behavior feeds learning (which paths carry value)

**The difference at scale:**
```
1,000 users × 10 sends/day × $0.0001     = $1/day    (Layer 1 only)
1,000 users × 2 product sales/day × 2%   = varies    (Layer 4)
But: 1,000 users sending crypto freely    = $0/day    (shadow economy)
```

The revenue argument is clear: sends MUST be signals. But the UX argument pushes back: adding a substrate signal to every crypto send adds latency, complexity, and a dependency on TypeDB availability. Users expect wallets to work offline.

---

## The Strategic Answer

After reading `lifecycle-one.md`, `buy-and-sell.md`, `routing.md`, and `revenue.md`:

### `/u` is the Stage 0-2 surface that doesn't exist yet

`lifecycle-one.md` defines 10 stages. The first three (wallet → save key → sign in) have API endpoints but **no UI**. ONE's `/u` IS that UI. But it needs to connect:

```
ONE's /u                              lifecycle-one.md
─────────                             ────────────────
/u (dashboard)                    ──► Stage 0: wallet identity
/u/keys (key storage)             ──► Stage 1: save key
(no equivalent yet)               ──► Stage 2: sign in
/u/people (contacts)              ──► Stage 3: join board (contacts = paths to actors)
(no equivalent)                   ──► Stage 4-5: create/deploy team
/u/products (sell)                ──► Stage 9: sell (LIST capability)
/u/send (buy)                     ──► Stage 10: buy (EXECUTE + SETTLE)
```

### Products ARE capabilities

A `/u` product with a price is exactly `(provider: $unit, offered: $skill) isa capability, has price $p`. Creating a product in `/u` should:
1. Write a capability to TypeDB
2. The product becomes discoverable via `/api/agents/discover?tag=product`
3. The payment link is a pre-routed signal: `{ receiver: "seller:product", data: { weight: price } }`
4. Payment settles via `mark(buyer→seller, weight)` + optional Sui `pay()`

### Sends ARE signals (opt-in)

Not every crypto send should be a substrate signal. Personal transfers (send ETH to your own address) are private. But commerce sends (pay for a product, tip a creator) should enter the substrate:

```
PRIVATE SEND (no substrate):
  user → blockchain → done
  No signal. No mark. No learning. $0 revenue.
  
COMMERCE SEND (through substrate):
  user → signal({ receiver: seller, data: { weight: amount } })
       → PRE: toxic check on buyer→seller path
       → EXECUTE: blockchain transaction
       → POST: mark(buyer→seller, amount) on success
              warn(buyer→seller, 1) on failure
       → LEARN: path accumulates, highways form between frequent trading partners
```

The UI: a toggle on the send page. "Send through ONE" (substrate-routed, path learns) vs "Send direct" (peer-to-peer, private). Default to substrate for product purchases. Default to direct for personal transfers.

### Contacts ARE paths

Adding a contact in `/u` should create a path in TypeDB: `alice → bob` with initial strength 1. Every interaction (send, message, product purchase) marks the path. Over time, frequent contacts become highways. The substrate can recommend contacts based on pheromone — "people you might want to trade with" is just `select()`.

### The dashboard IS a substrate view

Not just "my portfolio" but "my position in the graph":
- **Portfolio value** (from blockchain RPCs — stays as-is)
- **Reputation score** (from `persist.reveal(uid)` — substrate data)
- **Highways** (who you trade with most — from `highways()`)
- **Frontier** (who you haven't traded with but could — from `frontier()`)

This is the "brain dashboard" — the substrate made visible to the user.

---

## Identity Resolution

The recommended model (Option A from Question 1):

```
SUBSTRATE IDENTITY (derived, platform-controlled)
  addressFor(uid) → Sui address
  Used for: routing fees, capability payments, discovery charges
  Funded by: platform faucet (small amounts) or user top-up
  Key: never stored — deriveKeypair(uid) is a pure function

EXTERNAL WALLETS (self-custodial, user-controlled)
  Ed25519Keypair.generate() → per-chain addresses
  Used for: personal crypto, multi-chain interop, large payments
  Funded by: user's own funds
  Keys: encrypted in localStorage via SecureKeyStorage.ts

LINK (TypeDB relation)
  (substrate: $s, external: $e) isa wallet-link, has chain "sui";
  The substrate knows which external wallets belong to this actor
  but never holds their keys. Privacy-preserving: link is opt-in.
```

This means:
- `deriveKeypair(uid)` stays for agents and system operations
- `/u` wallets stay for user-controlled funds
- The two are linked but independent
- The substrate can route signals to either identity
- Revenue flows through the substrate identity (routing fees are tiny)
- Large payments flow through the user's own wallet (self-custodial)

---

## Impact on Engine Code

### `world.ts` — No changes needed
Signals are `{ receiver, data }`. Wallet signals use the same shape. No type narrowing needed.

### `persist.ts` — New: wallet-link relation
```tql
define
wallet-link sub relation,
  relates substrate,
  relates external;
unit plays wallet-link:substrate;
# external wallet is just an attribute, not a full entity
```

### `loop.ts` — L4 (economic loop) gains wallet awareness
The economic loop already handles `data.weight > 0` as payment. Wallet sends with `weight > 0` enter L4 naturally. No code change — just more signals flowing through the existing loop.

### `bridge.ts` — Extends to multi-chain via bridge units
Sui bridge exists. Other chains integrate as units per [chains.md](chains.md):
`bridge:evm`, `bridge:sol`, `bridge:btc` — each wraps `BlockchainService.ts`
methods as substrate handlers. Pheromone learns which chains/bridges are reliable.

### `agent-md.ts` — Products as capabilities
A `/u` product could be expressed as agent markdown:
```yaml
skills:
  - name: cat-photo
    price: 100
    tags: [product, digital, photo]
```
This is existing syntax. No parser changes needed.

---

## Impact on Revenue

| Revenue Layer | Before /u | After /u (if wired correctly) |
|---|---|---|
| L1 Routing | Agent signals only | + human wallet signals (commerce sends) |
| L2 Discovery | Agent discovery only | + product discovery (users find sellers) |
| L3 Infrastructure | Agent hosting | + wallet link storage (TypeDB relation) |
| L4 Marketplace | Agent-to-agent trades | + human-to-human product sales (2% take) |
| L5 Intelligence | Agent behavior patterns | + human commerce patterns (who buys what) |

**The upside:** `/u` brings humans into the signal graph. Humans generate more diverse signals than agents. The substrate learns faster. Revenue compounds across all five layers.

**The risk:** If `/u` is copy-pasted without substrate wiring, humans transact in a shadow economy. The substrate learns nothing. Revenue stays at $0 for human activity. The graph has a blind spot.

---

## Impact on Security

### New attack surface: localStorage keys
The substrate's "no keys stored" model has zero key-theft risk. Adding localStorage keys introduces:
- XSS → key extraction (mitigated by `SecureKeyStorage.ts` encryption)
- Device theft → key access (mitigated by password lock)
- Backup file theft → key extraction (mitigated by AES encryption)

**Mitigation:** These are `/u` wallet keys, not substrate keys. The substrate identity (`deriveKeypair`) remains keyless. If a `/u` key is compromised, the user's external wallet is at risk, but the substrate actor is not.

### New attack surface: toxic path on financial sends
If the substrate learns that `alice → bob` is toxic (many failed sends), it could block future sends. This is censorship if applied to direct crypto transfers. 

**Resolution:** Toxic path check only applies to substrate-routed commerce sends (products, marketplace). Direct sends (peer-to-peer) bypass the sandwich — they're the user's sovereign right.

---

## File Inventory (unchanged from recon)

**66 files total.** Copy all, update only what breaks:

| Category | Files | What Changes |
|----------|-------|-------------|
| **Copy as-is** | 46 | Nothing — same shadcn, same hooks, same aliases |
| **Update imports** | 10 | Layout swap, remove ModeToggle/ShareButtons/ZkLogin stubs |
| **Deep integrate** | 3 | WalletsPage (identity link), SendPage (commerce signal toggle), UDashboard (substrate view) |

### Dependencies

| Need | Action |
|------|--------|
| `framer-motion` | `bun add framer-motion` |
| `src/lib/security.ts` | Create stub (localStorage wrapper) |
| `src/components/ShareButtons.tsx` | Create stub (navigator.share) |
| `src/components/ModeToggle.tsx` | Wrap existing theme-toggle |

### Route conflict
Existing `src/pages/u/[name].astro` (unit profile) → move to `src/pages/unit/[name].astro`.

### Layout swap
All 16 `.astro` pages: `ULayout` → envelopes `Layout.astro`.

---

## The Three Deep Integrations (revised)

### 1. `WalletsPage.tsx` — Identity Link

Not just "remove ZkLogin." Wire the substrate identity:

```typescript
// When user creates a Sui wallet in /u:
const suiWallet = generateLocalWallet('sui')

// ALSO create the substrate link:
await fetch('/api/agents/register', {
  method: 'POST',
  body: JSON.stringify({
    uid: `user:${userId}`,
    kind: 'human',
    wallet: suiWallet.address  // link external wallet to substrate actor
  })
})

// Now the substrate knows: user:alice owns 0x1234 (Sui)
// Signals can route to user:alice. Payments settle to 0x1234.
```

### 2. `SendPage.tsx` — Commerce Signal Toggle

Not just "add emitClick." Add the commerce/private toggle:

```typescript
const [throughSubstrate, setThroughSubstrate] = useState(isProductPayment)

// Commerce send (product purchase, marketplace):
if (throughSubstrate) {
  await fetch('/api/signal', {
    method: 'POST',
    body: JSON.stringify({
      receiver: `${sellerId}:${productSkill}`,
      data: { weight: amount, tags: ['payment', chain], content: { txHash } }
    })
  })
  // → substrate marks buyer→seller path, L4 economic loop triggers
}

// Private send (personal transfer):
// → direct blockchain send, no substrate signal
// → emitClick('ui:wallet:send') for analytics only (private scope)
```

### 3. `UDashboard.tsx` — Graph Position

Not just "fetch reveal." Show the user's position in the substrate:

```typescript
// Portfolio (existing — from blockchain RPCs)
const portfolio = useWallets()

// Graph position (new — from substrate)
const [graphData, setGraphData] = useState(null)
useEffect(() => {
  Promise.all([
    fetch(`/api/memory/reveal/${userId}`).then(r => r.json()),
    fetch(`/api/loop/highways?actor=${userId}`).then(r => r.json()),
    fetch(`/api/memory/frontier/${userId}`).then(r => r.json()),
  ]).then(([reveal, highways, frontier]) => {
    setGraphData({ reveal, highways, frontier })
  })
}, [userId])

// Dashboard shows:
// - Total portfolio value (blockchain)
// - Reputation score (substrate)
// - Top trading partners (highways)
// - Suggested new connections (frontier)
```

---

## See Also

- [one-protocol.md](one-protocol.md) — private intelligence, public results
- [chains.md](chains.md) — every chain is a unit, $ONE settles
- [lifecycle-one.md](lifecycle-one.md) — the 10-stage funnel this surfaces
- [buy-and-sell.md](buy-and-sell.md) — LIST→DISCOVER→EXECUTE→SETTLE
- [revenue.md](one/revenue.md) — five revenue layers that /u feeds
- [routing.md](routing.md) — the deterministic sandwich + four outcomes
- [sdk.md](one/sdk.md) — `one.hire()` auto-settles across chains
- [PLAN-integrate-ONE.md](PLAN-integrate-ONE.md) — parent integration plan
- [TODO-migrate-u.md](TODO-migrate-u.md) — execution cycles
