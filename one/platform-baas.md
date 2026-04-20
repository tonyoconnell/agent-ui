---
title: Platform BaaS — ONE as a Free Release + Optional Connected World
type: strategy
version: 2.0.0
updated: 2026-04-20
status: WIRE
---

# ONE: Free to Release, Optional to Connect, Priced on Commerce

> **The claim:** `/release` (via `npx oneie`) ships a **free Astro +
> claw** scaffold. It runs **standalone** — no ONE account, no gateway,
> no API key required. Developers can also **opt in** to connect: to
> our world (routing, memory, learning), to the blockchain (Sui wallet,
> x402, escrow), and to other agents (federation, marketplace, invites).
> Every connection unlocks commerce: **sell, buy, invite.** Revenue
> comes from transactions that flow across those connections, not from
> the subscription gate.
>
> **Why now:** the release primitive is already built. `packages/cli`
> scaffolds Astro + NanoClaw. `@oneie/sdk` is the connection library.
> `@oneie/mcp` exposes the verbs to Claude Desktop. Sui testnet wallets
> are deterministic (Phase 2 shipped 2026-04-18). The `/api/marketplace/*`
> endpoints, `buy-and-sell.md` mechanics, and 50 bps escrow fee are all
> locked. What's left is to package the free release, wire the four
> connection modes, and let sell/buy/invite ride on real value flow.
>
> **The moat:** the economic graph. Standalone agents get a template.
> Connected agents get routing, memory, and a marketplace where every
> `sell` and `buy` earns provenance and every `invite` grows the
> federation. Compute is commodity. Intelligence compounds. Commerce
> compounds twice — in the graph AND on chain.

---

## The core insight

Every new layer — the scaffold, the SDK, the wallet, the federation —
is **additive, not required**. `npx oneie` gives a developer a working
Astro + claw website they can run on their own Cloudflare account. From
there, they can stay standalone, or connect in any order: world first,
chain first, or agents first. The gateway is still the boundary to our
intelligence, but reaching it is a **choice**, not a prerequisite.

```
STANDALONE (day 0, $0)              CONNECTED (when it's worth it)
────────────────────────            ──────────────────────────────

  Astro + Claw → Telegram             + world   → routing, memory, learning
  Local LLM calls                     + chain   → wallet, x402, settle on Sui
  Own Cloudflare account              + agents  → federation, marketplace
  No ONE API key                      + invite  → grow the network
  No shared graph                     + sell    → list a capability
  No fees to ONE                      + buy     → consume someone else's
```

No lock-in at any layer. A standalone agent can join the world later.
A connected agent can pull their graph data (`memory/reveal`) and eject
at any time. A federated agent keeps their wallet across worlds. **The
moat is the value flowing through the connections, not the connections
themselves.**

---

## Four connection modes

Each mode is independent. A developer can enable any subset, in any
order. Every mode strengthens the standalone release — it never replaces it.

| Mode | What it adds | Cost to developer | Cost to ONE |
|------|-------------|-------------------|-------------|
| **Standalone** | Astro + Claw scaffold, own CF account, local LLM | $0 (CF free) | $0 |
| **+ World** | SDK → `api.one.ie` routing, memory, learning, highways | $0 on free tier; metered | ~$0 marginal |
| **+ Chain** | Deterministic Sui wallet, x402 toll on paid routes, 50 bps escrow | Chain fees + 50 bps on settled value | Collects protocol fee |
| **+ Agents** | Federation, marketplace discovery, invite bridges between worlds | Revenue share on cross-world `mark()` | Collects routing fee on bridge |

**Standalone — `npx oneie` alone.** The scaffold ships a working Astro
site plus NanoClaw persona definitions. The claw handles Telegram/Discord
webhooks on the developer's own CF account. LLM calls go straight to
OpenRouter (or any provider) with the developer's key. No `api.one.ie`
traffic. No shared graph. This is the guaranteed path — even if ONE
goes away tomorrow, the developer's agents keep working.

**+ World — set `ONE_API_KEY`.** The scaffold flips on calls to
`api.one.ie`. Signals route through shared highways. `mark()` and
`warn()` deposit pheromone on the shared graph. `know()` promotes
highways to hypotheses. The developer's personal group (`group:{uid}`,
locked 2026-04-18) is their sovereign namespace inside our world.

**+ Chain — mint a wallet.** One POST to `/api/auth/agent` derives a
deterministic Sui wallet from `SUI_SEED || uid`. Now the agent can
settle x402 payments on-chain, escrow value across deals (50 bps
protocol fee), and expose its address for inbound payments. Wallet
lives forever on Sui — we just hold the derivation seed.

**+ Agents — invite and federate.** Two modes: (1) `oneie invite
<agent-id>` into your group (their signals + yours, shared pheromone);
(2) federation — two World-tier groups bridge via `path` with
`bridge-kind = "federation"`, signals cross the boundary, revenue-shared
on cross-world routes. See [groups.md § Bridge paths](groups.md).

---

## Sell, Buy, Invite — commerce as a first-class verb set

Free release + optional connection creates a blank canvas. Commerce is
what fills it. Three primitive verbs, three revenue hooks:

```
sell <capability> --price <amount>     # agent lists a capability on paths
buy <capability> --from <agent>        # agent executes someone else's
invite <agent|world> --into <group>    # agent joins a sovereign namespace
```

**Sell** — a capability is a skill + price. When another agent executes
it, the payment flows through the Sui escrow. Fee: 50 bps to ONE's
protocol wallet, 99.5% to the seller. The pheromone `mark()` on the
path compounds the seller's reputation. See
[buy-and-sell.md](buy-and-sell.md) § LIST / EXECUTE / SETTLE.

**Buy** — an agent queries `/api/marketplace/discover?skill=x&tag=y`,
picks a provider by price × pheromone strength, issues an `ask`. The
gateway charges an x402 toll (per [revenue.md § Layer 1](revenue.md))
on the routing itself; the provider gets paid on delivery. Failed
delivery → `warn()`, toxic path, automatic refund.

**Invite** — two kinds. (1) **Agent invite** into your personal group:
adds a membership edge with a role; their pheromone now feeds your
graph. (2) **World invite** (federation): a bridge path opens between
two World-tier tenants; cross-world signals carry revenue share back
to both treasuries. Invites compound the network; every accepted invite
is a mini viral event that strengthens specific paths.

**Why this is different from BaaS metering alone:**

- Metering counts API calls. Commerce counts **value delivered**. The
  former caps scale; the latter aligns our revenue with developer
  revenue.
- A standalone agent that never hits `api.one.ie` can still `sell` on
  chain once connected — the seller doesn't need us to run their
  handler, only to clear the settlement.
- `invite` has no analogue in subscription SaaS. It's a growth loop
  unique to the connection model: every invite is simultaneously a
  route to more commerce and a vote of trust in the recipient.

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

### Free-release adopters (standalone)
"I want a working Astro + Telegram bot in ten minutes and I don't want
to talk to anyone." `npx oneie` scaffolds the whole thing. Free forever.
No API key. No `api.one.ie` calls. They own the repo, their CF account,
their LLM bill, and their users. ONE earns nothing — and that's fine,
because this is the top of the funnel.

### World-connecters (opt-in routing)
"My agents work but they don't learn. I want pheromone routing without
rebuilding my stack." Set `ONE_API_KEY`; the existing scaffold starts
calling `api.one.ie`. Free tier (L1-L3 loops). Usage metered. Graduates
to Builder ($29/mo) when L4-L5 evolution + revenue-on-paths matter.

### Chain-connecters (commerce)
"I want my agents to sell services and settle on-chain." One POST to
`/api/auth/agent` mints their wallet. `/api/marketplace/list` puts a
capability on sale. `sell` events flow through the escrow (50 bps
protocol fee). Revenue is theirs, settlement is ours, provenance is
the graph's.

### Agent-connecters (federation + invites)
"I want my 11-agent marketing pod to discover and hire from a 25-agent
school pod across tenant boundaries." World tier ($499/mo) or
Enterprise (custom) opens federation. `oneie invite` or
`POST /api/federation/connect` drops a bridge path. Cross-world signals
earn revenue for both sides.

### Mobile + Python + Next.js builders
"I'm not on Cloudflare and don't want to be." Skip the scaffold, use
the SDK directly. `npm install @oneie/sdk` on any platform; call the
same 136 endpoints. Start standalone (SDK offline mode, mock client),
connect when the commerce value is real.

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

## Five tiers, one curve (subscription side)

The tier curve is **one of two revenue streams**, and it only applies
when a developer connects to our world (Layer 1+). Standalone (Layer 0)
developers never touch it. For those who do connect, tiers gate the
depth of the loop integration:

```
            FREE        BUILDER      SCALE        WORLD        ENTERPRISE
            ────        ───────      ─────        ─────        ──────────

Agents      5           25           200          1,000        Unlimited
API calls   10K/mo      100K/mo      1M/mo        10M/mo       Unlimited
Loops       L1-L3       + L4, L5     + L6, L7     + private    + federation
Commerce    buy only    sell + buy   sell + buy   sell + buy   sell + buy
Invites     —           —            invite       invite       federation
Price       $0          $29/mo       $99/mo       $499/mo      Custom
```

**The free tier is the demo for the world-connected path.** L1-L3 runs
the substrate: signals route, paths strengthen/weaken, decay forgets 2×
faster than it remembers. A developer can build a production-quality
agent and prove it works without paying a cent.

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

Developers choose how agents run. The pricing curve above only applies
when a path is **world-connected**. Standalone developers pay $0.

```
Option 0 — Standalone (/release)   Option 1 — SDK-only (BaaS)    Option 2 — Managed (WfP)
────────────────────────────────   ──────────────────────        ───────────────────────

npx oneie                          npm i @oneie/sdk              oneie deploy --hosted
wrangler deploy                    const one = new Client(key)   ONE hosts everything
Own CF, own LLM key                Call from anywhere            $25/mo WfP base
Optional ONE_API_KEY later         Developer owns hosting        ONE owns the lot
ONE cost/dev: $0                   ONE cost/dev: ~$0             ONE cost/dev: $0–29
```

Option 0 works **without** `api.one.ie`. Options 1 and 2 both talk to
it. When Option 0 flips on `ONE_API_KEY` it becomes indistinguishable
from Option 1 at runtime. Deployment choice is about where the agent's
compute lives; the connection choice is about which of the four modes
(standalone/world/chain/agents) the agent participates in.

See [infra-models.md](infra-models.md) for the full architecture.

---

## The four-cycle rollout

Each cycle delivers a complete developer experience. Cycle 1 ships the
**free release** plus the metering substrate; subsequent cycles layer
on connection depth and commerce verbs.

### Cycle 1 — WIRE: Ship the free release + meter the gateway

**Thesis:** the release is the acquisition vector; metering is the
commerce substrate. Both must ship together so a Layer 0 → Layer 1
handoff is trivial: add `ONE_API_KEY`, the scaffold starts reporting
usage, nothing else changes.

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

### Cycle 4 — SCALE: Commerce verbs + custom domains + federation

**Thesis:** `sell`, `buy`, and `invite` become first-class CLI and SDK
verbs. World and Enterprise tiers unlock private paths, branded domains,
and cross-world routing. The existing tenant system bridges to the new
pricing curve; the commerce verbs ride on the already-shipped Sui escrow
(50 bps fee) and marketplace endpoints.

- `oneie sell <skill> --price <amount>` — list capability on marketplace
  (wraps `/api/marketplace/list`); pheromone + Sui escrow do the rest
- `oneie buy <tag> [--from <agent>]` — discover + execute + settle; 50
  bps protocol fee on successful delivery
- `oneie invite <agent|world> --into <group>` — add membership or open
  bridge path (`bridge-kind = "federation"`)
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

Four layers. Each works alone. Each is optional.

```bash
# Layer 0 — Standalone release (day 0, $0, works forever offline)
npx oneie                               # scaffold Astro + Claw + persona
cd my-agent && bun install
wrangler deploy                         # live Telegram bot on own CF account

# Layer 1 — Connect to our world (opt-in routing + memory)
curl -X POST https://api.one.ie/api/auth/agent -d '{}'
# → { uid, wallet, apiKey, personalGid: "group:<uid>", role: "chairman" }
echo "ONE_API_KEY=api_xxx" >> .env
# scaffold auto-detects key: SDK calls start flowing to api.one.ie

# Layer 2 — Connect to chain (commerce verbs go live)
oneie sell tutor:lesson --price 0.02    # list capability on the marketplace
oneie buy math:tutor --tag algebra      # discover + execute + settle
# x402 toll collected on routing; 50 bps on escrow settlement

# Layer 3 — Connect to agents (federation + invites)
oneie invite math:tutor --into group:my-school
oneie federate --with group:their-world  # opens a bridge path
# cross-world mark() earns revenue share for both tenants

# Alternative — SDK only, skip the scaffold (any stack)
npm install @oneie/sdk
import { SubstrateClient } from '@oneie/sdk'
const one = new SubstrateClient({ apiKey: 'api_xxx' })
await one.ask({ receiver: 'tutor:lesson', data: { content: 'hello' } })
await one.mark('entry→tutor', 2)
const routes = await one.highways({ limit: 10 })
```

**Zero pressure to connect.** The standalone release is the acquisition
vector. A developer who only ever runs Layer 0 is still doing ONE a
favor — they're advertising the template. A developer who reaches
Layer 3 is doing commerce on our graph, and paying us per transaction
rather than per seat. Two paid revenue streams (tiered subscription +
transaction fees) coexist; neither gates the release.

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
| Marketplace LIST / DISCOVER / EXECUTE / SETTLE | ✅ shipped | `/api/marketplace/*`, `buy-and-sell.md` |
| `/release` script → `/releases` staging | ✅ shipped | `scripts/release.ts`, `release.md` |
| `npx oneie` scaffold (Astro + Claw, standalone) | ⏳ Cycle 1 | `packages/cli/` init path |
| Tier-aware auth context | ⏳ Cycle 1 | `src/lib/api-auth.ts` extension |
| Meter table | ⏳ Cycle 1 | `migrations/0015_metering.sql` |
| Dashboard + Stripe | ⏳ Cycle 2 | `src/pages/dashboard.astro` |
| Workers template scaffold (for connected path) | ⏳ Cycle 3 | `packages/templates/` |
| `oneie sell` / `buy` / `invite` CLI verbs | ⏳ Cycle 4 | `packages/cli/src/commands/` |
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

- [release.md](release.md) — `/release` → `/releases/` bundle (agents + docs + sdk + mcp + .claude + web)
- [buy-and-sell.md](buy-and-sell.md) — LIST / DISCOVER / EXECUTE / SETTLE mechanics for commerce verbs
- [platform-baas-todo.md](platform-baas-todo.md) — 4 cycles, 32 tasks, waves + rubric
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

*ONE is free to release, optional to connect, priced on commerce.
The scaffold is the acquisition vector. The graph is the moat. The
136 endpoints are the surface. Transactions — sell, buy, invite —
are the revenue signal.*
