# Ingestion

**Every event is pheromone. Every signal is training data. Every interaction makes routing smarter.**

> The marketplace is not a subsystem. Learning is not a subsystem.
> Ingestion is not a subsystem. They are the same mechanism —
> `mark()` and `warn()` on an edge — with different sources.
> Whoever owns the widest ingestion pipe owns the graph.

---

## The Claim

The substrate's routing formula is:

```
weight = 1 + max(0, strength - resistance) × sensitivity
```

`strength` and `resistance` are two numbers per path. Every data source in the
world reduces to **one question**: *did this edge close its loop?* Yes →
`mark(edge, w)`. No → `warn(edge, w)`. That's the entire ingestion contract.

Because the contract is trivial, the graph can absorb **every stream** a
normal product collects but fragments across ten tools: analytics, email
metrics, chat sentiment, payment outcomes, support tickets, LLM ratings,
page dwell, cart conversions, churn, refunds. In conventional stacks these
are SaaS silos. Here they all feed the same 670-line engine and accumulate
on the same 6-dimension graph.

The data network effect: **one unified ranker trained by every source at
once**. Competitors can copy the marketplace page. They cannot copy the
history of what worked.

---

## The Universal Reduction

Every ingested event is one of three shapes:

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│  positive outcome    │  negative outcome    │  neutral / timeout   │
├──────────────────────┼──────────────────────┼──────────────────────┤
│  mark(edge, w)       │  warn(edge, w)       │  (no-op)             │
│  strength += w       │  resistance += w     │                      │
│  path gets           │  path gets           │  time alone fades    │
│  attractive          │  repulsive           │  both sides          │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

`w` is a weight in the range `(0, ∞)`, chosen per source (see Taxonomy
below). The engine doesn't care what produced the event. A human clicking
a button, a Stripe webhook firing, a page-dwell timer expiring, a customer
marking an email as spam — all collapse to the same three calls.

The deterministic sandwich still applies:

```
PRE:   event → is edge toxic? → dissolve, don't even ingest
LLM:   (only if the source is an agent outcome — the probabilistic step)
POST:  success? mark(). failure? warn(). timeout? skip.
```

---

## Two Planes, One Semantic

The substrate runs ingestion on two planes simultaneously. Same verbs,
different permanence:

```
OFF-CHAIN (TypeDB)                     ON-CHAIN (Sui)
──────────────────                     ──────────────
~10ms per write                         ~400ms-2.5s per write
~$0 per write                           ~$0.0001 per write
optimistic, mutable                     enforced, immutable
full history in D1 / TypeDB             Path object with accumulated SUI
cheap signals live here                 valuable signals promote here
scraper can approximate                 scraper cannot forge
```

**The promotion rule is economic:**

```
if (cumulative_weight × dollar_value_per_weight > sui_gas_cost) promote
```

In practice:
- **Below threshold** (impressions, clicks, dwell, open-rates) → TypeDB
- **Above threshold** (paid trades, verified reviews, legal attestations,
  KYC confirmations) → Sui

The Sui plane is your **unforgeable reputation moat**. A competitor can
scrape your marketplace surface. They cannot scrape the Sui `Path` objects
in a way that lets them replicate the *history* of what worked, because
only the protocol (via `substrate::pay` and `substrate::mark`) can write
to them.

See [buy-and-sell.md § Two Ledgers, One Semantic](buy-and-sell.md#two-ledgers-one-semantic)
for the mirror/absorb loop that keeps both planes coherent.

---

## The Taxonomy

Every data stream ONE ingests, the edge it updates, the weight scale, and
the plane. This is the master table. **Add a row when you add a source.**

### Tier 1 — Agent-outcome signals (already wired)

These come from `.ask()` returning. The four outcomes map directly.

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| `result` returned | `caller → callee` | `chainDepth` (1-N) | TypeDB | mark |
| `timeout` | `caller → callee` | — | neither | neutral |
| `dissolved` (no unit) | `caller → callee` | 0.5 | TypeDB | warn |
| no result | `caller → callee` | 1.0 | TypeDB | warn |
| paid trade settled | `buyer → seller` | `price_sui × 1.0` | **Sui** | mark |
| paid trade refunded | `buyer → seller` | `price_sui × 2.0` | **Sui** | warn |

Weight-on-refund is **2× the original** because a refund is a stronger
negative signal than a neutral non-settlement. Asymmetric punishment for
cash-back events mirrors the asymmetric decay rule.

### Tier 2 — UI interaction signals

Every `emitClick(id, payload?)` from the UI is already an ingestion event.
See [`.claude/rules/ui.md`](../.claude/rules/ui.md) for the receiver naming
convention (`ui:<surface>:<action>`).

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| Button click | `user → surface:action` | 0.1 | TypeDB | mark |
| Button click + payload success | `user → feature` | 0.3 | TypeDB | mark |
| Button click + form error | `user → surface:action` | 0.2 | TypeDB | warn |
| Copy/share action | `content → user` | 0.5 | TypeDB | mark |
| Thumbs up on reply | `agent → skill` | 0.5 | TypeDB | mark |
| Thumbs down on reply | `agent → skill` | 0.5 | TypeDB | warn |
| "Retry" on agent reply | `agent → skill` | 0.3 | TypeDB | warn |

### Tier 3 — Analytics signals

Server-side page events. Wire through a small middleware that posts to
`/api/signal` with the derived edge.

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| Page view | `referrer → page` | 0.05 | TypeDB | mark |
| Dwell > 30s | `referrer → page` | 0.3 | TypeDB | mark |
| Dwell > 2min | `referrer → page` | 0.7 | TypeDB | mark |
| Scroll to foot | `page → cta` | 0.4 | TypeDB | mark |
| Bounce (< 5s) | `referrer → page` | 0.2 | TypeDB | warn |
| Rage-click / error | `page → user` | 0.5 | TypeDB | warn |

Do **not** send individual page views for high-traffic pages — batch per
session. High-frequency raw events eat TypeDB write budget without adding
signal.

### Tier 4 — Communication signals

Email, SMS, Telegram, Discord — every message is a signal loop.

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| Email sent | `sender → recipient` | 0.1 | TypeDB | (provisional) |
| Email opened | `sender → recipient` | 0.2 | TypeDB | mark |
| Email link click | `sender → recipient` | 0.5 | TypeDB | mark |
| Email reply | `sender → recipient` | 1.0 | TypeDB | mark |
| Marked as spam | `sender → recipient` | 2.0 | TypeDB | warn |
| Unsubscribe | `sender → recipient` | 3.0 | **Sui** | warn |
| Telegram msg → agent | `user → agent:skill` | 0.1 / turn | TypeDB | mark |
| Telegram conversion (paid) | `user → agent:skill` | `price × 1.0` | **Sui** | mark |

Unsubscribe goes on-chain because it's an irrevocable commercial signal
that carries regulatory weight (CAN-SPAM, GDPR) — immutable proof that
the user asked to stop.

### Tier 5 — Commerce signals

Stripe, x402, Sui-native payments.

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| Cart item added | `product → user` | 0.1 | TypeDB | mark |
| Checkout started | `product → user` | 0.3 | TypeDB | mark |
| Checkout abandoned | `product → user` | 0.4 | TypeDB | warn |
| Purchase completed | `seller → buyer` | `price × 1.0` | **Sui** | mark |
| Refund issued | `seller → buyer` | `price × 2.0` | **Sui** | warn |
| Dispute filed | `seller → buyer` | `price × 3.0` | **Sui** | warn |
| Chargeback won | `seller → buyer` | `price × 0.5` | **Sui** | mark (reversal) |

### Tier 6 — Support and quality signals

Support tickets, NPS, code reviews, content audits.

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| Ticket opened | `user → agent` | 0.3 | TypeDB | (provisional) |
| Ticket resolved < 1h | `agent → playbook` | 1.0 | TypeDB | mark |
| Ticket resolved, paid tier | `agent → playbook` | 2.0 | **Sui** | mark |
| Ticket escalated | `agent → playbook` | 1.5 | TypeDB | warn |
| NPS 9-10 | `brand → user` | 1.5 | **Sui** | mark |
| NPS 0-6 | `brand → user` | 1.5 | **Sui** | warn |
| Code review: merged | `author → reviewer` | 0.8 | TypeDB | mark |
| Code review: reverted in 24h | `author → reviewer` | 1.5 | TypeDB | warn |

### Tier 7 — Self-learning signals (agent introspection)

The substrate watching itself. These close the loop that makes the system
self-improving (loop L5 — Evolution — in `src/engine/loop.ts`).

| Source | Edge | Weight | Plane | Direction |
|---|---|---|---|---|
| Agent `success-rate` drops < 0.50 | `unit → generation` | — | TypeDB | trigger evolve |
| Evolved agent wins trade | `old-gen → new-gen` | 2.0 | **Sui** | mark |
| Highway hardens (know) | `unit → skill` | accumulated | **Sui** | promote |
| Frontier explored | `unit → tag-cluster` | 0.5 | TypeDB | mark |

---

## The Promotion Rule

A path lives off-chain in TypeDB by default. It **graduates** to Sui when
it crosses a value threshold. This is what `harden()` in `dictionary.md`
finally means in practice.

```
function shouldHarden(path) {
  const cumulativeValue = path.accumulated_weight × dollar_per_weight
  const suiGasCost = 0.0001  // ~$0.0001 in testnet gas

  return cumulativeValue > suiGasCost × 100  // 100× headroom
}

function harden(path) {
  // Mirror current TypeDB state to Sui Path object
  await sui.call('substrate::harden', {
    from: path.from,
    to: path.to,
    strength: path.strength,
    resistance: path.resistance
  })
  // TypeDB keeps writing fast updates; Sui holds the milestone
}
```

Promotion is one-way for the milestone: once on Sui, the `Path` object is
an immutable record of that moment. Subsequent updates continue in TypeDB;
the next promotion writes a new version. This gives you a **reputation
log** on-chain — every hardening is a verifiable checkpoint.

Harden runs:
- Automatically in `loop.ts` L6 (every hour) for paths crossing threshold
- On-demand via `POST /api/harden { edge }` for manual promotion
- At trade-settle time via `substrate::pay` (atomic — payment + harden
  in one transaction)

---

## Instrumentation Patterns

Wiring a new source takes three lines. The pattern:

```typescript
// 1. Identify the edge
const edge = { from: sourceId, to: targetId }

// 2. Derive the weight from the event
const weight = classifyEvent(event)  // 0.1 for click, 1.0 for reply, etc.

// 3. Fire the signal
await fetch('/api/signal', {
  method: 'POST',
  body: JSON.stringify({
    receiver: `ingest:${sourceType}`,
    data: { edge, weight, outcome: 'mark' | 'warn' }
  })
})
```

The receiver `ingest:<sourceType>` is handled by a unit that does the
`mark`/`warn` call and, if the threshold trips, calls `harden()`.

See [`src/engine/world.ts`](../src/engine/world.ts) for `mark()`/`warn()`
signatures. See [`src/pages/api/signal.ts`](../src/pages/api/signal.ts)
for the signal ingress handler.

### Wiring a webhook

Stripe → ingestion in one unit:

```typescript
// src/pages/api/webhook/stripe.ts
export async function POST({ request }) {
  const event = await request.json()
  const edge = { from: event.customer, to: event.product }

  switch (event.type) {
    case 'checkout.session.completed':
      await mark(edge, event.amount / 100)  // USD → weight
      await harden(edge)  // paid event → always on-chain
      break
    case 'charge.refunded':
      await warn(edge, (event.amount / 100) × 2)  // 2× penalty
      break
    case 'charge.dispute.created':
      await warn(edge, (event.amount / 100) × 3)
      break
  }
}
```

### Wiring a batch analytics pipe

For high-volume sources (PostHog, Plausible, Cloudflare Analytics), batch
at the boundary. A cron worker reads 5-min windows and posts aggregated
marks:

```typescript
// workers/analytics-ingest/index.ts — runs every 5 minutes
const events = await posthog.query({ since: -5 * 60 * 1000 })
const aggregated = groupByEdge(events)  // { edge: { marks: n, warns: m } }

for (const [edge, { marks, warns }] of aggregated) {
  if (marks) await mark(edge, marks × 0.05)  // damped per-event
  if (warns) await warn(edge, warns × 0.1)
}
```

Batching keeps TypeDB write volume below ~1000 writes/minute regardless
of traffic — the fade loop at 5-min cadence naturally absorbs batched
marks.

---

## Privacy and Scope

Not every event should be ingested. The graph is the moat — but a
poisoned graph is worse than no graph. Three rules:

1. **Never ingest PII as edge identifiers.** Use hashed user IDs.
   `mark({ from: userId, to: product })` — `userId` is an opaque UID,
   never an email address.

2. **Honor signal scope.** `private` signals (see
   [`src/schema/one.tql`](../src/schema/one.tql)) never feed group-level
   aggregation and never promote to Sui. `group` signals stay inside the
   group. Only `public` signals contribute to global highways.

3. **Asserted vs observed.** An ingested event defaults to
   `hypothesis-source = observed`. Only a verified human or multi-source
   corroboration can flip it to `verified`. This prevents a single noisy
   source from hardening a bad path. See
   [one-ontology.md § Hypothesis](one-ontology.md).

Ingested data that touches regulated domains (health, finance, children's
data) carries an **ADL sensitivity marker** and is excluded from the Sui
plane by default. See [ADL-integration.md § Sensitivity Gates](ADL-integration.md).

---

## Cold Start — Ingestion Before Traffic

A brand-new ONE deployment has no pheromone. Ingestion bootstraps the
graph faster than organic traffic would:

```
Day 0:  zero paths. select() picks uniformly among viable units.
Day 1:  import AgentVerse directory → ~2M proxy units at weight 1.
Day 2:  ingest last 30 days of Stripe history → ~1k hardened edges.
Day 3:  ingest email metrics (opens/clicks/replies) → ~10k TypeDB edges.
Day 7:  first highway forms. LLM calls drop. Arithmetic takes over.
```

The historical-backfill pattern: for every external system the user
already has (Stripe, HubSpot, Mailchimp, Zendesk, Segment), run a
one-time backfill into ingestion. Each historical event becomes a
mark/warn, timestamped to the original event. The graph learns the
user's entire history in the first hour of deployment.

See [one-strategy.md § Cold Start](one-strategy.md#6-cold-start) for the
exploration/exploitation tradeoff during the learning phase.

---

## Ingestion API

One endpoint. Every source posts here.

```
POST /api/signal
{
  "receiver": "ingest:<source-type>",
  "data": {
    "edge": { "from": "<uid>", "to": "<uid>" },
    "weight": <number>,
    "outcome": "mark" | "warn",
    "source": "<source-name>",       // for audit
    "at": "<ISO-8601>",              // default now
    "scope": "private" | "group" | "public"  // default public
  }
}
```

Aliases for common patterns:

```
POST /api/ingest/stripe       { event: <stripe-event-object> }
POST /api/ingest/analytics    { events: [...] }
POST /api/ingest/email        { event: <sendgrid-event>, ... }
POST /api/ingest/rating       { agent, skill, rating: 1..5 }
```

Each alias is a thin unit that knows the source schema and derives the
`mark`/`warn` shape.

---

## Measuring the Ingestion Flywheel

Five numbers to report per cycle. If a loop can't produce these, it
can't `mark()` — it's just noise (Rule 3 of `.claude/rules/engine.md`).

```
events/sec ingested     raw throughput
edges touched / hour    breadth of learning
highways formed / day   paths crossing weight threshold
paths hardened / day    promotions to Sui
coverage %              edges with weight > 1 / total reachable edges
```

Expose at `/api/ingest/stats`. Surface on `/dashboard` so the operator
can see the graph densifying in real time.

---

## What This Unlocks

Every data source that enters the substrate joins the same ranker. That
gives you four compounding leverages no conventional stack has:

1. **Cross-source ranking.** A seller's email-reply rate, Stripe-success
   rate, support-resolution rate, and NPS all feed the **same edge** out
   of the buyer's node. Routing picks the seller who wins across all
   dimensions, not the one who wins on one SaaS tool's metric.

2. **Unforgeable reputation.** Sui-hardened paths are public, queryable,
   and uncopyable. A new entrant can build a competitor marketplace; they
   cannot build the reputation history.

3. **Data network effect.** The more sources you pipe in, the harder it
   is for a seller to leave — their reputation is encoded in thousands
   of cross-linked pheromone edges, not in one review table.

4. **The self-improving graph.** Every trade retrains the router. Every
   piece of customer communication retrains the router. Every click,
   dwell, refund, thumbs-up — all of it, all the time. There is no
   training job. The graph is always training.

---

## See Also

- [dictionary.md](dictionary.md) — canonical names for `mark`, `warn`,
  `harden`, `fade`
- [DSL.md](DSL.md) — signal grammar
- [routing.md](routing.md) — how `weight` becomes routing decisions
- [rubrics.md](rubrics.md) — quality dimensions (fit/form/truth/taste)
  as tagged mark/warn calls
- [buy-and-sell.md](buy-and-sell.md) — LIST → DISCOVER → EXECUTE → SETTLE
  is a specialization of ingestion for paid trades
- [revenue.md](revenue.md) — the five revenue layers are all ingestion
  streams monetized
- [lifecycle.md](lifecycle.md) — the agent journey is the ingestion
  timeline: signal → highway → harden
- [one-strategy.md § Every Event Is Pheromone](one-strategy.md)
- [ADL-integration.md](ADL-integration.md) — sensitivity markers for
  regulated ingestion
- [`.claude/rules/ui.md`](../.claude/rules/ui.md) — UI signals are
  ingestion events
- [`src/engine/world.ts`](../src/engine/world.ts) — `mark`/`warn`
  implementation
- [`src/pages/api/signal.ts`](../src/pages/api/signal.ts) — ingress
  handler

---

*Every click. Every open. Every payment. Every rating. One graph.*
