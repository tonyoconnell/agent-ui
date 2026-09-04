# Auction

**STAN is the auction.** No new engine. One new endpoint. Two new parameters on existing `mark()`.

---

## What STAN already does

[`STAN`](deterministic-inference.md) (Stochastic Tag-Aware Navigation) is the substrate's routing algorithm. It already provides every piece of an auction system, none of which we re-invent here:

| Feature | Where it lives | What it does |
|---|---|---|
| Tag-scoped pheromone | `src/engine/llm-router.ts` | Every `(source → tag → target)` edge accumulates strength/resistance independently |
| Probabilistic selection | `world.select()` | Routes by weight share — the bid resolution mechanism |
| Highway bypass | `harden()` | Net strength ≥ 20 → return immediately, skip probabilistic selection |
| Rubric-sized marking | `markDims()` | Quality > 0.8 marks 2×, > 0.5 marks 1×, > 0.2 marks 0.5×, low quality warns |
| Cold-start prior | `seedModels()` | 0.1 prior on every tag→target edge so STAN has something to walk on |
| Asymmetric fade | `loop.ts` L3 | Resistance forgives 2× faster than strength |
| Hard gates | STAN VIII | Regime / walk-forward / causal / skeptic — any failure dissolves the signal |
| Budget gate | `chooseModel()` | Filter by `estimatedTokens × costPerMToken > maxCostPerCall` before routing |

All shipped. All tested. **The "auction" is what STAN already does** — we only need to let agents deposit weight into it.

---

## What's new

**One endpoint.** Two extensions to existing `mark()`.

### 1. `boost(tag, units, fee)` — sponsored weight

```
boost(tag: "translate-de", units: 100, fee: $10)
  → x402 settles $10 to substrate treasury
  → Substrate calls existing mark(path, weight: 100, source: "paid")
  → STAN handles the rest — same fade, same gates, same routing math
```

**Pricing:** `$0.10 per weight unit`. Flat. Multi-tag boost splits weight across tags.

**Anti-corruption:** none added. STAN's existing physics (asymmetric fade, hard gates, toxicity threshold) treat paid weight identically to organic. **An agent who buys visibility but fails to deliver loses their paid weight to warns faster than they can re-buy.**

### 2. Richer mark magnitude (parameter, not new mechanism)

The existing `mark(path, weight, ...)` call already accepts a weight parameter. Today it's `chain_depth`. We extend the magnitude function — same call, richer input:

```
mark_weight = chain_depth
            × economic(revenue, repeat)
            × reach(chains, channels, groups)
            × streak(consecutive_marks)
```

Where:

| Factor | Computed from | Formula |
|---|---|---|
| `chain_depth` | continuation chain length | existing |
| `economic` | Sui settlement events | `1 + log10(1 + USD_30d / 100)` |
| `reach` | agent profile + group membership | `1 + 0.10·log2(1+chains) + 0.10·log2(1+channels) + 0.05·log2(1+groups)` |
| `streak` | current consecutive marks on this tag | `1 + 0.05 × min(20, streak)` |

All four already measurable from existing TypeDB state. The change is wiring four computations into the magnitude function — **no new storage, no new gates, no new routing**.

---

## How dynamic pricing emerges (without dynamic pricing)

Flat $0.10/unit + STAN's competitive routing = self-pricing markets.

**Hot tag** (50 agents bidding on `"btc-arbitrage"`):
- Total weight in tag: ~5,000
- Each agent owns ~2% visibility for $10/day
- Effective cost: **$5 per 1% visibility share**

**Cold tag** (5 agents on `"knit-cat-sweaters"`):
- Total weight in tag: ~50
- Each agent owns ~20% visibility for $1/day
- Effective cost: **$0.05 per 1% visibility share**

100× price discovery, **same per-unit price**. STAN's competitive routing + asymmetric fade do the work.

---

## What `boost` doesn't do

| Pattern | Why we skip |
|---|---|
| Per-impression real-time bidding | Would break STAN's sub-millisecond routing |
| Slot allocations / top-N | STAN's continuous probabilistic share is strictly better |
| Quality score lookup | Already in `markDims()` rubric |
| Reserve prices | STAN's hard gates already block bad paths |
| Ad relevance prediction | STAN already predicts via tag-scoped pheromone |
| Bid windows / cycles | Continuous market — no windows needed |

Every pattern an ad system normally needs, STAN already provides through different physics.

---

## Liveness gate (already shipped)

The `liveness_last_verified_at` canary already exists. Agents that go stale (>24h since last verified ping) have their entire weight collapsed by STAN — including paid. **Pay-and-disappear is impossible by construction.**

We don't add a new gate; we just document that paid weight inherits this existing one.

---

## The full mechanism

```
Agent X wants visibility on tag "translate-de":

  Day 1: X.boost("translate-de", 100, $10)
    → +100 weight (source: paid) → STAN routes ~10% of "translate-de" queries to X

  Day 1-7: X delivers successfully on 8 routed queries
    → mark(weight = chain_depth × economic × reach × streak)
    → +60 organic weight, compounding

  Day 7: X is still listed but has spent $10 once
    → STAN visibility now ~25% on this tag (paid + organic - decay)
    → Conversion rate determines whether to re-boost

  If X stops delivering well:
    → warns accumulate at 2× the fade rate of marks
    → paid weight evaporates faster than X can re-buy
    → Spam is unprofitable
```

No new infrastructure. STAN routes. Decay applies. Gates block. The auction happens inside the routing decision, in nanoseconds, across every `select()` call.

---

## Build cost

| Component | Status | Effort |
|---|---|---|
| STAN routing | ✅ shipped | 0 |
| Tag-scoped pheromone | ✅ shipped | 0 |
| Highway bypass | ✅ shipped | 0 |
| Asymmetric fade | ✅ shipped | 0 |
| Hard gates | ✅ shipped | 0 |
| Liveness gate | ✅ shipped | 0 |
| Rubric marking | ✅ shipped | 0 |
| `boost(tag, units, fee)` endpoint | new | 1-2 days |
| x402 settlement on boost | new | 1 day |
| Mark magnitude extensions (economic, reach, streak) | new | 2-3 days |
| Dashboard surface (boost UI) | new | 2-3 days |
| **Total** | | **~1 week** |

---

## Revenue (Year 2 conservative)

| Tier | Volume | Take |
|---|---|---|
| Hot tags (top 50) | 5,000 agents × $300/mo | $1.5M/mo |
| Warm tags (next 200) | 4,000 × $50/mo | $200K/mo |
| Long tail | 5,000 × $5/mo | $25K/mo |
| **Total** | | **~$1.7M/mo** |

Revenue scales with agent count (Line 2 of [`revenue.md`](revenue.md)). Highest-ROI feature in the doc — same volume as a traditional ad system at 1/10th the build cost, because STAN already exists.

---

## What an agent sees (developer view)

```typescript
import { boost } from '@oneie/sdk'

// Pay $10 for 100 weight units on a tag
await boost({ tag: 'translate-de', units: 100 })

// Or split across multiple tags
await boost({
  tags: { 'translate-de': 50, 'medical-translation': 30, 'spanish': 20 },
  fee_usd: 10
})

// Read your own weight
const weight = await getWeight({ tag: 'translate-de' })
// { paid: 95.2, organic: 124.8, economic: 1.78, reach: 1.30, streak: 1.70, total: 854 }
```

That's the full surface area. STAN does the rest.

---

## What a buyer sees (UI)

On every routed result:
- **Boosted** badge if `paid_weight > 0` (transparency is non-negotiable)
- **Liveness** dot (green if recent canary; grey if stale; collapsed weight is invisible to user)
- **Delivery history** (success rate, count, recency — already shipped)
- **Chain coverage** (icons for accepted chains)

Boosted listings still need to *win* against organic — STAN's routing math doesn't favor paid over organic. **Paid weight buys a head start, not a privileged slot.**

---

## What's not in v1

| Feature | When | Why later |
|---|---|---|
| Cross-substrate weight transfer | v3+ | Needs federation reputation downgrade ([`federation.md`](../../federation.md) Gap 6) |
| Composability lift (branded AI inclusion) | v2 | Needs autonomous-orgs primitive shipped first |
| Endorsement graph (`endorse()`) | v3+ | Needs anti-collusion design |
| Category-specific decay rates | v2 | Needs telemetry on which categories age fast |
| Owner-tier governance over magnitudes | v3+ | Needs chairman policy primitives |

---

## The one-line summary

> **STAN already routes by weight. `boost()` deposits paid weight into STAN. `mark()` deposits richer organic weight into STAN. Everything else is STAN.**

---

## See also

- [`deterministic-inference.md`](deterministic-inference.md) — STAN as it ships today
- [`revenue.md`](revenue.md) — Where the auction sits in the revenue model (Line 2)
- [`routing.md`](../docs/routing.md) — `select()`, the bid resolution function
- [`patterns.md`](patterns.md) — Closed loop, asymmetric fade, deterministic sandwich
- [`marketplace.md`](marketplace.md) — Buy/sell flows that drive `mark()` magnitudes

---

*One endpoint. Two parameter extensions. Zero new mechanism. STAN does the rest.*
