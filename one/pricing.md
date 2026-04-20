---
title: Pricing — ONE Toolkit + Platform
type: business
version: 1.0.0
updated: 2026-04-17
---

# Pricing

> **Principle:** the toolkit is free. The graph is the product. Three
> deployment models, one pricing curve. Developers choose how to run
> agents — ONE charges for the brain.
>
> **Three options:**
> - **BaaS** — just an API key, no infra, call `api.one.ie` from anywhere
> - **CF Pages** — deploy your own NanoClaw on free CF Pages, call `api.one.ie` for the brain
> - **Managed (WfP)** — ONE hosts everything on Workers for Platforms, zero-config

---

## ONE's actual costs (the math behind the tiers)

### Fixed costs (doesn't matter how many developers)

| Item | Monthly cost | Notes |
|---|---|---|
| CF Pages (ONE's own NanoClaw) | $5 | Workers Paid plan — Pages Functions. ONE's agents (@onedotbot, donal, debby) |
| Workers for Platforms | $25 | OPTIONAL — only if offering managed hosting (Model B). Most developers deploy their own Pages. |
| TypeDB Cloud | ~$200-500 | Shared instance, all developers |
| Domain (one.ie) | ~$15/yr | — |
| **Total fixed (without WfP)** | **~$210-510/mo** | |
| **Total fixed (with WfP)** | **~$235-535/mo** | Only if offering managed tier |

**All three models use the same backend (api.one.ie).** The only
difference is where the agent compute runs: ONE's infra (BaaS/WfP),
developer's CF Pages (free), or developer's own stack (BaaS from anywhere).

### Per-developer costs (what each option costs ONE)

**Option 1: BaaS — developer calls api.one.ie from anywhere**

Developer uses the SDK/API from any platform (Vercel, AWS, mobile, Python,
CF Pages, anything). ONE provides the full backend: routing, storage,
learning. ONE pays gateway + TypeDB load per developer.

```
ONE's cost per developer:

Small:       ~300 API calls/day      → negligible TypeDB load       $0
Medium:      ~3,000 API calls/day    → light TypeDB load            $0
Large:       ~30,000 API calls/day   → moderate TypeDB load         ~$0.10
Very large:  ~99,000 API calls/day   → TypeDB working               ~$0.50
```

Developer pays: their own LLM (OpenRouter), their own hosting (whatever
they choose). ONE pays: gateway + TypeDB.

If ONE also hosts conversations (D1 storage for the developer), add:
~$0.75/GB-mo beyond 5GB. Most small/medium devs fit in 5GB.

**Option 2: CF Pages — developer deploys own NanoClaw, free compute**

Developer deploys NanoClaw on their own CF Pages project ($0 on free plan).
Calls api.one.ie for the brain only. ONE's cost per developer: same as
BaaS (gateway + TypeDB load). Developer's compute cost: $0.

```
Developer's CF cost (their account, free plan):

  100 conversations/day:    ~300 invocations/day    within 100K free    $0
  1,000 conversations/day:  ~3,000 invocations/day  within 100K free    $0
  10,000 conversations/day: ~30,000 invocations/day within 100K free    $0
  33,000 conversations/day: ~99,000 invocations/day at the free limit!  $0
  (34K+/day needs Workers Paid: $5/mo for 10M/mo included)

  Custom domains: up to 100 on free plan.
  D1: 5GB free, 5M reads/day free.
  KV: 1GB free, 100K reads/day free.
  Bandwidth: unlimited.
```

**Option 3: Managed (WfP) — ONE hosts everything**

Developer uploads markdown. ONE deploys as sandboxed user worker.
ONE pays: $25/mo WfP base + per-developer D1/KV + compute.

```
ONE's cost per developer:

Small:       $0 (within WfP included amounts)
Medium:      $0 (within included)
Large:       ~$1.80 (CPU overages)
Very large:  ~$28.80 (CPU overages)
Plus: $25/mo WfP base amortised across all managed developers
```

### The takeaway

```
                ONE's cost/dev    Developer's cost    Who runs compute
                ──────────────    ────────────────    ────────────────
BaaS            ~$0               LLM + own hosting   Developer (anywhere)
CF Pages        ~$0               LLM only ($0 CF)    Developer (CF free)
Managed (WfP)   $0-29 + $25 base  LLM only            ONE
```

All three options feed the same graph. All three use the same 136 API
endpoints. The pricing tiers below apply regardless of deployment model —
they gate brain features (loops, storage, analytics), not compute.

---

## What developers actually pay for (not compute)

Developers don't care about requests, CPU ms, or D1 rows. They care about:

1. **How many agents can I run?**
2. **How many conversations can they handle?**
3. **Can I use my own domain?**
4. **Does the substrate make my agents smarter?**

The pricing should map to these questions, not to CF billing units.

---

## Pricing tiers

> **Code contract:** the 5-tier matrix below is mirrored verbatim in
> `src/lib/tier-limits.ts` (`TIER_LIMITS`). Every gated endpoint calls
> `checkApiCallLimit(tier, usage)` or `tierAllows(tier, feature)` from that
> module. Adding a tier or changing a cap is a two-file edit: this doc +
> `tier-limits.ts`. The D1 storage is `developer_tiers`
> (`migrations/0016_metering.sql`), set by `/api/billing/webhook.ts` on
> Stripe subscription events.

### The table

Same tiers apply to all three deployment options (BaaS, CF Pages, Managed).
ONE charges for brain access, not compute. Developer chooses where agents run.

```
                FREE        BUILDER      SCALE        WORLD        ENTERPRISE
                ────        ───────      ─────        ─────        ──────────

API calls/mo    10,000      100,000      1,000,000    10,000,000   Unlimited
Agents          5           25           200          1,000        Unlimited
Storage         100MB       1GB          10GB         100GB        Unlimited
Team members    1           5            20           Unlimited    Unlimited

Loops           L1-L3       L1-L5        L1-L7        L1-L7        L1-L7
                signal/mark + L4 econ    + L6 learn   + private    + federation
                /warn/fade  + L5 evolve  + L7 frontier  paths      + dedicated

Group scoping   No          No           Yes          Yes          Yes
Webhooks        BYO only    BYO only     BYO + hosted Hosted       Hosted
Dashboard       Basic       Basic        Full         Full+brand   Custom
Analytics       —           Per-agent    Per-skill    Per-skill    Custom

SDK + MCP       ✓           ✓            ✓            ✓            ✓
Templates       30 presets  30 presets   30 presets   30 + custom  Custom
Sui wallet      Testnet     Mainnet      Mainnet      Mainnet      Mainnet
Launch          Dry-run     ✓            ✓            ✓            ✓

Support         Community   Email        Priority     Dedicated    Dedicated

Price           $0          $29/mo       $99/mo       $499/mo      Custom
```

**What "API calls" means:** calls to `api.one.ie` that touch the brain.
- `signal()`, `ask()` — routing
- `mark()`, `warn()` — path operations
- `suggestRoute()`, `highways()` — routing queries
- `recall()`, `reveal()`, `frontier()` — memory queries
- `know()` — highway promotion
- `storage.*` — per-agent state

**What's NOT counted (runs on developer's infra):**
- Webhook processing (Telegram, Discord, web)
- LLM calls (developer's OpenRouter key)
- Local conversation storage
- Static assets
- Agent-to-agent signals that don't call the brain

**Deployment options (all tiers):**

| Option | Agent compute | Brain access | Custom domains |
|---|---|---|---|
| **BaaS** | Developer's choice (Vercel, AWS, mobile, anything) | api.one.ie | Developer manages |
| **CF Pages** | Developer's CF Pages (free: 33K conv/day, 100 domains) | api.one.ie | Pages free plan: 100 |
| **Managed** | ONE's WfP ($25/mo base, passed through) | Internal (same account) | CF for SaaS |

### What each tier unlocks

**FREE — build and prove**

5 agents, 10K API calls/mo. Enough to build a real product, prove it works,
show it to customers. L1-L3 loops run (signal routing, path marking, decay).
SDK + MCP included — the developer toolkit is never paywalled. Sui wallets
on testnet. `oneie launch --dry-run` to test the market handoff.

Works from any platform: CF Pages, Vercel, AWS, mobile, Python script.
Just get an API key and call `api.one.ie`.

**BUILDER ($29/mo) — go to production**

25 agents, 100K API calls/mo. L4 (economic) + L5 (evolution) loops activate.
L4 means revenue flows along paths — `data.weight` carries real value.
L5 means underperforming agents get their prompts rewritten automatically.
Mainnet Sui wallets. `oneie launch` without `--dry-run`.

This is the "I have users" tier.

**SCALE ($99/mo) — the full substrate**

200 agents, 1M API calls/mo. All 7 loops active. L6 (`know()`) promotes
highways to permanent hypotheses. L7 (`frontier()`) discovers unexplored
tag clusters. Group scoping. Per-agent + per-skill analytics. Hosted
webhooks (ONE runs your Telegram/Discord endpoints). Priority support.

This is the "I'm running a business on this" tier.

**WORLD ($499/mo) — your own world**

1,000 agents, 10M API calls/mo. Private paths (your routing data is isolated
from other developers). Branded dashboard. Hosted webhooks. Dedicated support.
This is the existing tenant system (`/api/worlds/tenant`) reframed as the
top of a continuous pricing curve.

OO Agency is World tenant #1.

**ENTERPRISE (custom) — dedicated intelligence**

Unlimited everything. Dedicated TypeDB instance (no noisy neighbours).
Federation (your world connects to the shared highway graph but your
paths are isolated). Revenue sharing on cross-world routing. SLA.
Custom presets. Custom dashboards.

---

## Why these numbers

### API calls

An "API call" = one call to `api.one.ie` that touches the brain.
A typical conversation turn generates 1-3 brain calls (route + mark + maybe
recall). Not all conversation turns call the brain — local-only processing
doesn't count.

```
Free:   10K/mo     ~330/day     enough for testing + small audience
Builder: 100K/mo   ~3,300/day   a real product with real users
Scale:  1M/mo      ~33K/day     a business
World:  10M/mo     ~330K/day    a platform
```

ONE's TypeDB cost at 1M API calls/mo: ~$0.50 (queries are fast, cached
in KV). Revenue: $99. **Margin: 99.5%.**

### Agents

```
Free:   5      concierge + 2 specialists + 2 experimental
Builder: 25    a full marketing pod or support team
Scale:  200    multiple teams, departments, products
World:  1,000  a company or school's entire agent workforce
```

Agents are registered in TypeDB (one `unit` entity each). TypeDB doesn't
charge per-entity. ONE's cost per agent: ~$0.

On CF Pages (developer's own), agents are unlimited — no script limits.
The agent limit gates brain registration, not compute.

### The loop gates (the real differentiation)

This is the most important pricing decision. The substrate's 7 loops are
the product:

```
L1 SIGNAL     per message      FREE     signals route
L2 TRAIL      per outcome      FREE     mark/warn accumulates
L3 FADE       every 5 min      FREE     paths decay (resistance 2x faster)
L4 ECONOMIC   per payment      BUILDER  revenue on paths
L5 EVOLUTION  every 10 min     BUILDER  rewrite struggling agent prompts
L6 KNOWLEDGE  every hour       SCALE    know() → promote highways to hypotheses
L7 FRONTIER   every hour       SCALE    detect unexplored tag clusters
```

**Free gets L1-L3:** signals route, paths strengthen/weaken, decay happens.
This is enough to build a working product. The routing learns in a basic
way — strength and resistance accumulate, decay keeps things fresh.

**Builder adds L4-L5:** money flows along paths. Agents that underperform
get evolved automatically. This is the "my agents get better without me
touching them" tier. That's worth $29/mo.

**Scale adds L6-L7:** highways get promoted to permanent learning. Frontier
discovery finds unexplored tag combinations. This is the "my substrate
understands my domain" tier. That's worth $99/mo.

**The free tier is the demo. L4+L5 is the hook. L6+L7 is the moat.**

---

## Revenue projections

ONE charges for brain access. Developer compute varies by option
(BaaS: developer's hosting, CF Pages: free, Managed: ONE pays WfP).
ONE's marginal cost per developer is near $0 in all cases.

```
Phase 1: 100 developers                Phase 2: 1,000 developers
────────────────────────                ─────────────────────────

80 Free    × $0    = $0                 600 Free    × $0    = $0
12 Builder × $29   = $348               200 Builder × $29   = $5,800
5 Scale    × $99   = $495               120 Scale   × $99   = $11,880
3 World    × $499  = $1,497             60 World    × $499  = $29,940
0 Ent                                   20 Ent      × $2K   = $40,000

Revenue:     $2,340/mo                  Revenue:     $87,620/mo
ONE costs:   ~$250/mo (Pages + TypeDB)  ONE costs:   ~$700/mo
Margin:      89%                        Margin:      99%

Phase 3: 10,000 developers
───────────────────────────

6,000 Free    × $0    = $0
2,000 Builder × $29   = $58,000
1,200 Scale   × $99   = $118,800
600 World     × $499  = $299,400
200 Ent       × $2K   = $400,000

Revenue:     $876,200/mo
ONE costs:   ~$3,000/mo
Margin:      99.7%
```

Why the margins:
- **ONE's cost per developer is ~$0** regardless of deployment option
- BaaS: developer runs compute elsewhere. ONE pays nothing for it.
- CF Pages: developer runs compute on free CF. ONE pays nothing.
- Managed (WfP): ONE pays $25/mo base + overages. Minority of developers.
- **LLM is the developer's cost** (their OpenRouter key, always)
- **ONE's costs are almost entirely fixed**: gateway ($5/mo) + TypeDB ($200-500/mo)
- The graph gets more valuable with more developers — network effect compounds

---

## Comparison to alternatives

| | ONE | Firebase | Supabase | Vercel | Replicate | OpenAI |
|---|---|---|---|---|---|---|
| What it is | Backend for agents | Backend for apps | Backend for apps | Frontend deploy | ML compute | LLM provider |
| Free tier | 5 agents, 10K API calls | Spark | 2 projects | Hobby | None | $5 credits |
| Paid from | $29/mo | $25/mo | $25/mo | $20/mo | Per-second | Per-token |
| What you pay for | Agent intelligence | Auth + DB + hosting | Auth + DB + storage | Deploys | Compute | LLM calls |
| What's included | Routing, learning, commerce, memory, MCP, SDK | Auth, DB, storage, hosting | Auth, DB, storage | Build, CDN | Nothing | Nothing |
| LLM cost | Developer's (BYOK) | N/A | N/A | N/A | Included | Included |
| Network effect | Yes (shared graph) | No | No | No | No | No |
| Works from | Anywhere (BaaS) | Anywhere | Anywhere | Vercel only | API | API |

ONE is closest to **Firebase** (backend as a service with auth + storage +
real-time) but for agents instead of apps. The moat is the shared routing
graph — every developer that joins makes every other developer's agents smarter.

Free compute option: CF Pages gives developers 33K conversations/day at $0.
No other agent platform has a free compute path this generous.

---

## The LLM cost question

**ONE does not pay for LLM calls.** The developer brings their own
`OPENROUTER_API_KEY`. This is critical for the economics:

```
Developer's LLM cost per conversation:

Llama 4 Maverick (default):    ~$0.0003 per message ($0.15/M tokens)
Claude Haiku:                  ~$0.001 per message
Claude Sonnet:                 ~$0.005 per message
GPT-4o:                        ~$0.003 per message
```

The developer chooses their model and pays OpenRouter directly. ONE routes
the signal, records the outcome, strengthens the path. ONE's value is the
routing intelligence, not the LLM compute.

This is why the margins are 97%+ at scale. ONE pays $0.02/M CPU ms for
CF compute. The developer pays $0.15-5.00/M tokens for LLM. ONE's cost
is 100-1000x cheaper than the LLM cost. The developer barely notices ONE's
fee because the LLM is the expensive part.

---

## What's never paywalled

These are the on-ramp. Locking them behind a paywall kills adoption:

- `npx oneie` — project scaffold
- `@oneie/sdk` — the npm package
- `@oneie/mcp` — MCP tools
- `@oneie/templates` — 30 presets
- `oneie deploy` — deploying agents (within tier limits)
- `oneie claw` — Telegram/Discord bot setup
- L1-L3 loops — basic routing + path learning + decay
- Sui wallet derivation — every agent gets an address
- `oneie launch --dry-run` — test the market handoff

---

## What's paywalled (and why)

| Feature | Gate | Why |
|---|---|---|
| L4 economic loop | Builder | Revenue on paths = production feature |
| L5 evolution | Builder | Auto-prompt rewriting = operational value |
| L6 know() | Scale | Highway → hypothesis promotion = intelligence product |
| L7 frontier | Scale | Unexplored cluster detection = R&D value |
| Custom domains | Builder (3), Scale (20) | Branding = business use signal |
| Launch (real, not dry-run) | Builder | Token minting = real money |
| Priority routing | Scale | Guaranteed latency = SLA |
| Dedicated TypeDB | Enterprise | Data isolation = enterprise requirement |
| Federation | Enterprise | Cross-world routing = platform play |

---

## Implementation

### How to enforce tier limits

```typescript
// In the dispatch worker
async function routeToAgent(env, name, req) {
  const devId = authenticate(req)
  const tier = await getTier(env, devId)  // free | builder | scale | enterprise

  // Agent limit
  const agentCount = await getAgentCount(env, devId)
  if (agentCount > TIER_LIMITS[tier].agents) {
    return Response.json({ error: 'agent_limit', tier, limit: TIER_LIMITS[tier].agents }, { status: 402 })
  }

  // Message limit
  const monthlyMessages = await getMessageCount(env, devId)
  if (monthlyMessages > TIER_LIMITS[tier].messages) {
    return Response.json({ error: 'message_limit', tier, limit: TIER_LIMITS[tier].messages }, { status: 402 })
  }

  // Loop gate
  if (signal.loop === 'L4' && tier === 'free') {
    return Response.json({ error: 'loop_gate', loop: 'L4', required: 'builder' }, { status: 402 })
  }

  // Route
  return dispatch(env, name, req)
}

const TIER_LIMITS = {
  free:       { agents: 3,   messages: 10_000,    domains: 0,  loops: [1,2,3] },
  builder:    { agents: 25,  messages: 100_000,   domains: 3,  loops: [1,2,3,4,5] },
  scale:      { agents: 200, messages: 1_000_000, domains: 20, loops: [1,2,3,4,5,6,7] },
  enterprise: { agents: Infinity, messages: Infinity, domains: Infinity, loops: [1,2,3,4,5,6,7] },
}
```

### How to meter messages

A "message" is counted when a signal reaches the dispatch worker with
an external origin (webhook, API call, SDK). Internal signals (agent-to-agent,
loop ticks) are not counted — they're system traffic.

```typescript
// In dispatch worker
if (isExternalOrigin(req)) {
  await env.KV.put(
    `meter:${devId}:${monthKey}`,
    String((parseInt(await env.KV.get(`meter:${devId}:${monthKey}`)) || 0) + 1)
  )
}
```

---

## Billing integration

### Phase 1: Stripe (for Builder + Scale)

```bash
oneie upgrade --plan builder
# → Opens Stripe Checkout
# → Creates subscription
# → Returns API key with tier=builder
# → Dispatch worker checks tier on every request
```

### Phase 2: Crypto (for Enterprise + agent-to-agent)

x402 on the gateway: agent pays per-signal with Sui. The dispatch worker
checks the payment header before routing. This is Layer 1 from revenue.md
— the toll road — but paid by agents, not developers.

---

## See Also

- [revenue.md](one/revenue.md) — five revenue layers (routing, discovery, infra, marketplace, intelligence)
- [infra-models.md](infra-models.md) — Workers for Platforms architecture + cost structure
- [buy-and-sell.md](buy-and-sell.md) — commerce mechanics on the substrate
- [one-toolkit-landing.md](one-toolkit-landing.md) — landing page (pricing section)
- [one-toolkit-features.md](one-toolkit-features.md) — what each tier enables
- [opensource.md](opensource.md) — give fire, sell light
