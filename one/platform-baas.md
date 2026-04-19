---
title: Platform BaaS — ONE as Backend-as-a-Service for Agents
type: strategy
version: 1.0.0
updated: 2026-04-19
status: WIRE
---

# ONE as BaaS: The Backend for Agents

> **The claim:** ONE is Firebase for agents. The 136 API endpoints on
> `api.one.ie` are the product. Developers call them from any stack —
> Vercel, AWS, mobile, Python, CF Pages, Next.js — and ONE provides
> routing, memory, learning, and commerce. No lock-in. No infra. No
> LLM bill to ONE.
>
> **Why now:** every piece is built. `validateApiKey()` with scopes,
> group-scoped signals, the WsHub Durable Object, D1 meter schema, the
> `@oneie/sdk` `SubstrateClient` — all shipped. The gateway already IS
> the boundary. We just need to turn it into a product: meter it, tier
> it, dashboard it, bill it.
>
> **The moat:** the shared graph. Every developer's `mark()` strengthens
> highways that benefit everyone. The more agents join, the smarter
> routing gets, the more valuable the API becomes. Compute is a commodity
> (CF gives it away). Intelligence is not.

---

## The core insight

NanoClaw already reaches the brain through one HTTP call:

```typescript
// nanoclaw/src/lib/substrate.ts
const res = await fetch(`${env.GATEWAY_URL}/typedb/query`, { ... })
```

`GATEWAY_URL` is the only thing with TypeDB credentials. Everything else —
webhook handling, LLM calls, message storage — is developer-side. **The
gateway is already the product boundary.** BaaS just exposes that
boundary as a developer-facing service.

```
BEFORE (internal architecture)          AFTER (BaaS reframing)
────────────────────────────          ────────────────────────

NanoClaw → Gateway → TypeDB            Developer's code → api.one.ie → Brain
                                                             ↓
  (both on ONE's CF account)              developer's LLM, storage, hosting
                                                        (anywhere)
```

No new architecture. The existing 136 endpoints simply become the
contract. The SDK is already published. The auth is already scoped.
**The product exists; it needs packaging.**

---

## The open-core boundary

The commercial line sits exactly where the architecture already drew it:
everything *above* the gateway is stateless and distributable; everything
*at and below* the gateway holds state, learns, and compounds. We
open-source the surfaces that commoditize; we charge for the surfaces
that strengthen with every new developer.

```
OPEN (MIT, distribute widely)            PAID (the moat)
─────────────────────────────            ───────────────

@oneie/sdk          SubstrateClient      api.one.ie                    gateway + routing
oneie CLI           init/deploy/claw     TypeDB Cloud                  the shared graph
Chat UI components  AI Elements-style    Loop intelligence (L4-L7)     tier subscription
Agents framework    parse/syncAgent/wire Hosted webhooks               Scale+ convenience
Site scaffold       template for BaaS    Identity + Groups + Roles     stateful substrate
                    front-ends           Wallet derivation             SUI_SEED gated
                                         Transaction fees              x402 + 50bps escrow
                                         Custom domains (CF for SaaS)  World+ tier
```

**Why this split is safe to ship:**

- The **SDK, CLI, and chat UI** are clients. They speak HTTPS to the
  gateway. They carry no state. Forking them does not fork the graph.
- The **agents framework** (`parse`, `toTypeDB`, `syncAgent`, `wireWorld`
  in `src/engine/agent-md.ts`) defaults to `api.one.ie`. A developer who
  wants to self-host TypeDB must explicitly set `TYPEDB_URL` and accept
  Model C (detached, no shared graph). Self-hosting is an eject, not the
  default path — which keeps the happy path routing through our gateway.
- The **site scaffold** is the template developers fork to build their own
  branded BaaS-style front-ends on top of ONE. `one.ie` itself is a
  conversion surface (pricing copy, signup flow, dashboard) and stays
  ours — individual components are MIT-licensed for reuse but the site
  composition is not a primitive.

**Two paid revenue streams (additive, not either/or):**

1. **Subscription tiers** — developer pays ONE monthly; gates loop
   intelligence (L4-L7), agent count, API call volume, custom domains.
   Scales with developer count. Friendly on-ramp. Maps to `pricing.md`.
2. **Transaction fees** — agent pays ONE per action: x402 toll on
   signal routing (per `revenue.md` layer 1), 50 bps on escrow settlement
   (per root `CLAUDE.md` locked 2026-04-18). Scales with value flowing
   through the graph. Harder moat — a fork gets the code but not the
   agent liquidity, not the pheromone history, not the settled commerce.

Licensing: **MIT across every open surface.** AGPL would scare off
enterprise legal, and we don't need it — the graph enforces what a
license cannot. Competitors can fork `@oneie/sdk`; they cannot fork
10,000 agents' worth of pheromone.

### Identity, Groups, and Permissions (why they sit on the paid side)

Every BaaS developer, on first signup, receives four things that are
all paid substrate primitives:

```
1. A human unit           (BetterAuth signup → resolveUnitFromSession → TypeDB)
2. A deterministic wallet (SHA-256(SUI_SEED || uid) → Ed25519, same forever)
3. A personal group       (group:{uid}, visibility:private, role=chairman)
4. An API key             (api_<ts>_<rand>, PBKDF2 hashed, returned once)
```

The personal group is the developer's **sovereign namespace**. Their
agents live there. Their paths accumulate there. By default, nothing is
visible outside it. Joining `group:one` (the public world) is an
explicit opt-in — membership is never forced. See [groups.md](groups.md).

This matters for the BaaS pitch:

- **"Your agents live in YOUR group, not ours."** The personal group is
  a tree root, not a child of `group:one`. A developer can run a full
  fleet of agents without ever touching the public world. Enterprise
  legal reads that line and relaxes.
- **Permission = Role × Pheromone.** Membership role (chairman, ceo,
  operator, agent, board, auditor) + path strength = authorization.
  RBAC + ABAC + ReBAC compose in one TQL query. No OPA sidecar, no
  IAM service. Per [auth.md § Governance](auth.md) (locked 2026-04-18).
- **Two auth front doors, one contract.** Humans sign in via BetterAuth
  cookies; CLI + SDK callers use API keys. Both resolve to the same
  `AuthContext = { user, role, permissions, keyId, isValid }` via
  `resolveUnitFromSession()` in `src/lib/api-auth.ts`. Tier enforcement
  lives on the AuthContext — it applies uniformly to both paths.
- **Deterministic wallets are platform-gated.** The `SUI_SEED` is a
  platform secret. Developers can't self-derive their wallet addresses;
  they request them through the gateway. Ejecting to Model C means
  generating your own keypairs from scratch — the addresses won't match.

All four primitives are already shipped (per `auth.md § API Reference`
and governance locked 2026-04-18). The BaaS cycles bolt tier awareness
onto the existing auth context; they don't rebuild identity.

---

## Who this is for

### Firebase refugees
"I need auth + DB + real-time for my app." ONE is the same shape — but
for agents. 10K API calls/mo free, $29 for production, and a shared
graph that makes every agent smarter over time.

### Mobile + Python + Next.js builders
"I'm not on Cloudflare and don't want to be." BaaS doesn't care.
`npm install @oneie/sdk` on any platform. The SDK talks to `api.one.ie`
over HTTPS. From iOS, Android, FastAPI, Next.js on Vercel, Django on
Heroku — it all works the same.

### Bot builders on CF Pages (the free compute path)
"I want a Telegram bot but I don't want to pay for hosting." `npx oneie`
scaffolds a Pages-compatible NanoClaw. Free 100K invocations/day. Free
100 custom domains. Unlimited bandwidth. They pay $0 to Cloudflare and
only ONE's gateway fee (often $0 on free tier).

### Agencies + consultants (Builder → Scale)
"I run 10 client agents and I need revenue flowing on paths." Builder
($29/mo) unlocks L4 (economic) + L5 (evolution). Scale ($99/mo) unlocks
L6 (`know()`) + L7 (`frontier()`). The pricing curve maps directly to
the stages of a real operator's business.

### Enterprise + schools (World → Enterprise)
"I need private paths and dedicated intelligence." World ($499/mo) gives
scoped writes and branded dashboard. Enterprise gives dedicated TypeDB
and federation. OO Agency is World tenant #1 today — the `/api/worlds/tenant`
route is already live.

---

## Five tiers, one curve

```
            FREE        BUILDER      SCALE        WORLD        ENTERPRISE
            ────        ───────      ─────        ─────        ──────────

Agents      5           25           200          1,000        Unlimited
API calls   10K/mo      100K/mo      1M/mo        10M/mo       Unlimited
Loops       L1-L3       + L4, L5     + L6, L7     + private    + federation
Price       $0          $29/mo       $99/mo       $499/mo      Custom
```

**The free tier is the demo.** L1-L3 runs the substrate: signals route,
paths strengthen/weaken, decay forgets 2× faster than it remembers. A
developer can build a production-quality agent and prove it works without
paying anything.

**L4+L5 is the hook.** Revenue flows along paths. Underperforming agents
get their prompts rewritten automatically. The "my agents get better
without me touching them" tier. Worth $29/mo because the alternative
is manually tuning prompts every week.

**L6+L7 is the moat.** Highways get promoted to permanent hypotheses.
Frontier discovery finds unexplored tag clusters. The "my substrate
understands my domain" tier. Worth $99/mo because no other platform
offers it.

See [pricing.md](pricing.md) for the full matrix.

---

## Three deployment paths, one pricing curve

Developers choose how agents run. The pricing curve is the same for all three.

```
Option 0 — BaaS (default)      Option 1 — CF Pages (free)    Option 2 — Managed (WfP)
─────────────────────────      ──────────────────────         ───────────────────────

npm i @oneie/sdk               npx oneie                     oneie deploy --hosted
const one = new Client(key)    wrangler pages deploy         ONE hosts everything
Call from anywhere             100K/day free compute         $25/mo WfP base
Developer owns hosting         Developer owns CF project     ONE owns the lot
ONE cost/dev: ~$0              ONE cost/dev: ~$0             ONE cost/dev: $0–29
```

All three talk to `api.one.ie`. All three feed the same TypeDB. All three
strengthen the same highways. The deployment choice is about where agent
compute lives; it doesn't change what the developer pays ONE.

See [infra-models.md](infra-models.md) for the full architecture.

---

## The four-cycle rollout

Each cycle delivers a complete developer experience. Cycle 1 is the
minimum viable BaaS; subsequent cycles add graduation paths.

### Cycle 1 — WIRE: Meter the gateway

**Thesis:** before BaaS is a product, the gateway must know who each
caller is and count what they consume. Everything else depends on this.

- Extend `validateApiKey()` → `AuthContext` with `tier` (from the owning
  unit entity in TypeDB, cached alongside the key)
- `TIER_LIMITS` config matching `pricing.md` exactly (agents, API calls,
  loops, storage)
- D1 meter table: `(key_id, month, calls)` with atomic upsert on hot path
- Gate every brain-touching endpoint: signal, ask, mark-dims, decay,
  hypotheses, memory reveal/forget/frontier
- Loop gates on `/api/tick`: free gets L1-L3, builder gets L1-L5,
  scale+ gets L1-L7

**Exit:** every API call is metered, every tier limit is enforced, 402
responses carry an upgrade URL. No billing yet — just visibility + gates.

### Cycle 2 — PROVE: Developer experience

**Thesis:** metering is invisible. The dashboard makes it real. Stripe
makes the upgrade a single click. Hosted webhooks remove the last infra
requirement for BaaS developers who don't want to run their own servers.

- `one.ie/dashboard` — agents, usage, tier, upgrade button
- `/api/dashboard/usage` + `/agents` — the data behind the page
- Stripe Checkout for Builder/Scale; Stripe Customer Portal for upgrades +
  cancellation; webhook updates tier in TypeDB
- `one.ie/signup` — email → API key → copy → quickstart snippet inline
- Hosted webhook: ONE runs Telegram/Discord endpoints for developers
  who don't want their own
- `SubstrateClient.usage()` — developer checks their own meter from code

**Exit:** a developer signs up, gets an API key, makes their first
signal, sees usage tick up, upgrades to Builder, all in under 5 minutes.

### Cycle 3 — GROW: CF Workers template + managed option

**Thesis:** BaaS wins the serverless developer. The Workers template wins
the free-compute developer (10,000 of them, because 100K invocations/day
is free). Managed wins the "I don't want infra at all" developer.

- `packages/templates/src/workers-scaffold.ts` — generates a deployable
  CF Workers + Static Assets project matching our own main (same bundle
  rules, same `GATEWAY_URL = api.one.ie`)
- `oneie init` scaffolds Workers by default; rejects legacy `--pages`
  with a redirect
- `oneie deploy --hosted` uploads markdown to BaaS (no wrangler needed)
- `/api/agents/deploy` accepts markdown + API key, returns uid + webhook URL
- WfP dispatch namespace setup (only if offering managed tier) —
  reuses the LOCKED bundle rules from root `CLAUDE.md`

**Exit:** `oneie init → wrangler deploy → live Telegram bot` in three
commands. Or `oneie deploy --hosted` for zero-infra developers.

**Precondition:** our own `main` must be on Workers. (Done 2026-04-18
per root CLAUDE.md — `dev.one.ie` serves the `one-substrate` Worker.)

### Cycle 4 — SCALE: Custom domains + federation

**Thesis:** World and Enterprise tiers need private paths, branded
domains, and cross-world routing. The existing tenant system bridges
to the new pricing curve.

- `oneie domain <hostname>` — CF for SaaS custom hostname, auto SSL
- `/api/worlds/tenant` — bridge existing $499/$1999/$9999 tiers to the
  World ($499) / Enterprise (custom) pricing curve
- Private paths: World/Enterprise developers' `mark`/`warn` writes to a
  scoped partition; shared highways still readable
- `/api/federation/connect` — two Enterprise worlds can route signals
  across boundaries; revenue sharing on cross-world routes

**Exit:** an Enterprise customer runs their own world, keeps their
routing private, federates with shared highways.

---

## Unit economics (why this works)

ONE's costs are **almost entirely fixed**:

```
Gateway Worker (api.one.ie)              $5/mo  (CF Workers Paid)
TypeDB Cloud                             $200-500/mo  (shared, all devs)
Domain                                   $15/yr
─────────────────────────────────────────
Total fixed                              $210-510/mo
```

Marginal cost per developer is ~$0. ONE does not pay for:
- **LLM calls** — developer's OpenRouter key, always
- **Agent compute** — developer's CF Pages (free), their stack (paid by
  them), or ONE's WfP (passed through)
- **Conversation storage** — developer's D1 (Model A) or developer-scoped
  D1 on ONE's account (Model B, $0.75/GB-mo only above 5GB free tier)

**Revenue at 1,000 developers:** ~$87K/mo. Costs: ~$700/mo. **Margin: 99%.**

See [pricing.md § Revenue projections](pricing.md) for the full model.

---

## The moat: shared graph, network effects

Every BaaS developer's `mark()` and `warn()` writes to the shared graph
(scoped by uid prefix, readable highways). The more agents join, the
more the graph learns.

```
Firebase                              ONE (BaaS model)
────────                              ────────────────

More users = more storage rows        More agents = stronger highways
No cross-customer value               Every customer makes every other smarter
Switch cost: data export              Switch cost: you lose the graph
```

Firebase competes on features. ONE competes on the graph. Features can
be copied; a 6-month-old routing graph with 10,000 agents cannot.

Detached mode (Model C, self-hosted TypeDB) exists for regulatory
requirements. It costs the developer the network. Most never choose it.

---

## What the developer does

The sell fits on one screen. Two equivalent front doors — humans use
BetterAuth (email + password), machines use the zero-friction agent
endpoint:

```bash
# Path A — CLI / machine / absolute minimum (per auth.md § Agent Onboarding)
curl -X POST https://api.one.ie/api/auth/agent -d '{}'
# → { uid, wallet, apiKey, personalGid: "group:<uid>", role: "chairman",
#     returning: false }

# Path B — Human signup (BetterAuth, for the dashboard + long-lived key)
curl -X POST https://api.one.ie/api/auth/sign-up/email \
  -d '{"email":"dev@example.com","password":"secure","name":"Dev"}'
# → cookie session; first gated request lazy-binds a unit + personal group.
# Mint a programmatic key:
curl -X POST https://api.one.ie/api/auth/agent \
  -H "Authorization: Bearer <session>" -d '{"uid":"<my-uid>"}'
# → { apiKey, wallet, returning: true }

# Install from anywhere
npm install @oneie/sdk

# Call from Next.js, Python, iOS, anywhere
import { SubstrateClient } from '@oneie/sdk'
const one = new SubstrateClient({ apiKey: 'api_xxx' })

await one.ask({ receiver: 'tutor:lesson', data: { content: 'hello' } })
await one.mark('entry→tutor', 2)
const routes = await one.highways({ limit: 10 })
```

Two steps. No Cloudflare account. No wrangler. No TypeDB. No
deployment. The developer has a working agent backend, a deterministic
Sui wallet, and a sovereign personal group.

When they're ready to scale, they upgrade (`oneie upgrade --plan builder`).
When they want a Telegram bot, they wire a webhook (`oneie claw tutor
--token $BOT --hosted` on Scale tier). When they outgrow BaaS, they
`oneie init` and deploy Workers with the same API key.

---

## Risks and counters

### "What if developers just self-host?"
They can — but the agents framework defaults to `api.one.ie`; Model C
(detached) requires explicitly setting `TYPEDB_URL` and accepting that
you lose the shared graph. Self-hosting makes ONE a worse version of
TypeDB. The developers who still choose it (air-gapped enterprise,
regulated industries) become Enterprise-license conversations, not
lost revenue.

### "What if CF launches an agent BaaS?"
CF sells infrastructure, not intelligence. The graph is a product CF
would have to build from scratch, and they'd compete with their own
customers (ONE, Vercel, every dev-platform). Historically CF ships
primitives and leaves products to partners.

### "What if LLMs become commodity and routing gets solved?"
This is the bet. If routing becomes a solved problem, developers still
need state, memory, pheromone-style learning, agent discovery, and
x402 commerce. The graph is the durable asset; routing is the on-ramp.

### "What about enterprise compliance and data isolation?"
Covered by the governance layer locked 2026-04-18 (per [auth.md §
Governance](auth.md)). RBAC via `membership.role`, ABAC via TQL
attribute policies, ReBAC via pheromone path state — all in one query,
no IAM sidecar. Data isolation comes from group hierarchy: a World tier
customer becomes a tree root with scoped paths and private signals.
Enterprise legal has checklists; the ontology answers every row.

### "What about the chicken-and-egg on network effects?"
The first 100 developers come from ONE's own marketing channels
(Debby, Donal, @onedotbot, NanoClaw ecosystem). Each brings agents;
each agent strengthens paths. By the time open signup is widely
marketed, the graph is already producing value.

---

## Implementation status

| What | Status | Where |
|---|---|---|
| 136 API endpoints | ✅ shipped | `src/pages/api/**` |
| `validateApiKey()` with scopes, TTL, revocation | ✅ shipped | `src/lib/api-auth.ts` |
| BetterAuth human signup + session | ✅ shipped | `/api/auth/sign-up/email`, `/api/auth/sign-in/email` |
| Zero-friction agent onboarding (empty body works) | ✅ shipped | `POST /api/auth/agent` |
| Unified `AuthContext` (cookie + bearer, one contract) | ✅ shipped | `resolveUnitFromSession()` |
| Deterministic Sui wallet per uid (`SHA-256(SEED\|\|uid)`) | ✅ shipped 2026-04-18 | `src/lib/sui.ts` |
| Governance: Role × Pheromone (chairman/ceo/operator/agent/...) | ✅ shipped 2026-04-18 | `src/lib/role-check.ts` |
| Group-scoped signals | ✅ shipped | `/api/g/:gid/signal` |
| Group primitive (personal + world + org + hierarchy + visibility) | ⏳ groups-todo.md PROPOSED | `src/schema/one.tql` + `groups.md` |
| Tenant provisioning | ✅ shipped (bridges to World tier) | `/api/worlds/tenant` |
| `@oneie/sdk` `SubstrateClient` | ✅ shipped | `packages/sdk/` |
| Workers cutover (precondition for Cycle 3) | ✅ shipped 2026-04-18 | `dev.one.ie` |
| Memory routes (reveal/forget/frontier) | ✅ shipped 2026-04-18 | `/api/memory/*` |
| Governance (role × pheromone) | ✅ shipped 2026-04-18 | `src/lib/role-check.ts` |
| D1 up to escrow | ✅ shipped | `migrations/0014_escrow_settlement.sql` |
| Tier-aware auth context | ⏳ Cycle 1 | `src/lib/api-auth.ts` extension |
| Meter table | ⏳ Cycle 1 | `migrations/0015_metering.sql` |
| Dashboard + Stripe | ⏳ Cycle 2 | `src/pages/dashboard.astro` |
| Workers template scaffold | ⏳ Cycle 3 | `packages/templates/` |
| Custom domains + federation | ⏳ Cycle 4 | CF for SaaS + `/api/federation/*` |

**The gap between today and Cycle 1 complete is small** — perhaps 9
tasks, one cycle. The existing auth system already carries most of the
weight. Metering is a D1 table + a gate helper. Tier enforcement is
a config table. That's the whole minimum viable BaaS.

---

## Why the strategy is different from infra-models.md and pricing.md

- `infra-models.md` answers **where agents run** (4 deployment models,
  architecture diagrams, data split)
- `pricing.md` answers **what developers pay for** (5 tiers, loop gates,
  revenue projections, margin math)
- **This doc** answers **why it wins** — the gateway insight, the persona
  fit, the moat, the rollout thesis, the risks
- [platform-baas-todo.md](platform-baas-todo.md) answers **what to build**
  — 4 cycles, 31 tasks, W1-W4 per cycle

Read this doc before planning. Read the TODO when building.

---

## See Also

- [platform-baas-todo.md](platform-baas-todo.md) — 4 cycles, 31 tasks, waves + rubric
- [auth.md](auth.md) — identity, API keys, wallets, BetterAuth + agent onboarding, governance
- [groups.md](groups.md) — multi-tenancy, personal + world + org hierarchy, RBAC+ABAC+ReBAC
- [groups-todo.md](groups-todo.md) — personal group auto-create + schema additions (PROPOSED)
- [pricing.md](pricing.md) — 5 tiers, loop gates, revenue projections
- [infra-models.md](infra-models.md) — BaaS / CF Pages / WfP / detached architectures
- [one-toolkit-landing.md](one-toolkit-landing.md) — landing page copy
- [one-toolkit-features.md](one-toolkit-features.md) — feature inventory
- [opensource.md](opensource.md) — give fire, sell light (the open-source strategy)
- [revenue.md](revenue.md) — five revenue layers (BaaS metering = layer 1)
- [buy-and-sell.md](buy-and-sell.md) — agent commerce through the same gateway
- [dictionary.md](dictionary.md) — canonical names for signal/mark/warn/fade

---

*ONE is the backend. The graph is the product. The 136 endpoints are
the API. BaaS is just the packaging.*
