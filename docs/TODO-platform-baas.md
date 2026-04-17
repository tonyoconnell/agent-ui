---
title: TODO — BaaS platform infrastructure
type: roadmap
version: 1.0.0
priority: Wire → Prove → Grow
total_tasks: 30
completed: 0
status: READY
---

# TODO: ONE as Backend-as-a-Service

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Goal:** Turn ONE's existing 136 API endpoints into a developer-facing
> BaaS product. Developers call `api.one.ie` from anywhere (Vercel, AWS,
> mobile, Python, CF Pages). ONE provides routing, memory, learning,
> commerce. Five tiers: Free → Builder → Scale → World → Enterprise.
>
> **Source of truth:**
> - [pricing.md](pricing.md) — 5 tiers, 3 deploy options, loop gates, revenue projections
> - [infra-models.md](infra-models.md) — BaaS / CF Pages / Managed / Detached models
> - [one-toolkit-features.md](one-toolkit-features.md) — feature inventory + gap analysis
> - [one-toolkit-landing.md](one-toolkit-landing.md) — landing page content spec
> - [DSL.md](DSL.md) — signal language
> - [dictionary.md](dictionary.md) — canonical names
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark
>
> **Depends on:** [TODO-publish-toolkit.md](TODO-publish-toolkit.md) — SDK
> (`SubstrateClient`) must be published first. Developers need the client
> library before BaaS is useful.
>
> **Shape:** 4 cycles. Cycle 1 wires the BaaS foundation (metering, tiers,
> dev scoping). Cycle 2 builds the developer experience (dashboard, billing,
> onboarding). Cycle 3 adds CF Pages template + WfP managed option.
> Cycle 4 adds CF for SaaS + World/Enterprise tiers.
>
> **What's already built:**
> - 136 API endpoints (`src/pages/api/`)
> - `validateApiKey()` with scope-group + scope-skill + TTL + revocation
> - Group-scoped signals (`/api/g/:gid/signal`)
> - Tenant provisioning (`/api/worlds/tenant`) with tiers ($499/$1999/$9999)
> - D1 (messages, signals, tasks, tenants tables)
> - KV (cached TypeDB snapshots)
> - WsHub Durable Object (real-time)
> - TypeDB (paths, units, skills, hypotheses)

---

## Routing

```
    signal DOWN                              result UP
    ──────────                               ─────────
    /do TODO-platform-baas.md                mark(fit/form/truth/taste)
         │                                        │
         ▼                                        │
    ┌─ CYCLE 1: WIRE ───────────────────────┐     │
    │ Metering, tier enforcement, dev       │─────┤ L1 signal
    │ scoping, loop gates                   │     │ L2 trail
    └──────────┬────────────────────────────┘     │
               ▼                                  │
    ┌─ CYCLE 2: PROVE ──────────────────────┐     │
    │ Dashboard, Stripe billing, developer  │─────┤ L3 fade
    │ onboarding, webhook hosting           │     │ L4 economic
    └──────────┬────────────────────────────┘     │
               ▼                                  │
    ┌─ CYCLE 3: GROW ──────────────────────┐      │
    │ CF Pages template, WfP managed tier, │──────┤ L5 evolution
    │ oneie init --pages, oneie deploy      │     │ L6 know
    └──────────┬────────────────────────────┘     │
               ▼                                  │
    ┌─ CYCLE 4: SCALE ─────────────────────┐      │
    │ CF for SaaS custom domains, World    │──────┤ L7 frontier
    │ tier, Enterprise federation          │      │
    └───────────────────────────────────────┘      │
```

---

## Cycle 1: WIRE — Metering + tier enforcement

**Scope:** Add usage metering per API key, enforce tier limits on the
gateway, implement loop gates (L1-L3 free, L4-L5 builder, L6-L7 scale),
per-developer D1 scoping for conversation isolation.

**What's already built:** `validateApiKey()` with permissions, scoped groups/skills,
TTL, revocation, pheromone warn on bad auth. This cycle extends it with
tier-based quotas and metering.

### Wave 3 — Edits

| Task id | File / artifact | Cat | Tags |
|---|---|---|---|
| T-B1-01 | `src/lib/api-auth.ts` — extend `AuthContext` with `tier: 'free' \| 'builder' \| 'scale' \| 'world' \| 'enterprise'`, read tier from TypeDB on key validation | edit | auth, tier |
| T-B1-02 | `src/lib/tier-limits.ts` — new: `TIER_LIMITS` config (agents, apiCalls/mo, loops[], storage), `checkTierLimit(auth, resource)` → `{ok}` or `{error, status: 402}` | new | tier, limits |
| T-B1-03 | `src/lib/metering.ts` — new: count API calls per key per month in D1 (`INSERT INTO meter (key_id, month, calls) ... ON CONFLICT UPDATE SET calls = calls + 1`), `getUsage(keyId, month)` | new | meter |
| T-B1-04 | `src/pages/api/signal.ts` — add `checkTierLimit(auth, 'apiCall')` before routing; return 402 with tier info on limit | edit | signal, meter |
| T-B1-05 | `src/pages/api/ask.ts` — same metering gate as signal | edit | ask, meter |
| T-B1-06 | `src/pages/api/loop/mark-dims.ts`, `decay-cycle.ts`, `hypotheses.ts`, `memory/*.ts` — add metering gate to all brain-touching endpoints | edit | api, meter |
| T-B1-07 | `src/pages/api/tick.ts` — add loop gate: check tier before running L4-L7. Free: L1-L3 only. Builder: L1-L5. Scale/World/Ent: L1-L7. | edit | loops, gate |
| T-B1-08 | `migrations/XXXX_metering.sql` — `CREATE TABLE meter (key_id TEXT, month TEXT, calls INTEGER, PRIMARY KEY(key_id, month))` + `CREATE TABLE developer_agents (key_id TEXT, uid TEXT, created_at INTEGER)` | new | d1, schema |
| T-B1-09 | `src/pages/api/agents/register.ts` — check agent count against tier limit before TypeDB insert | edit | agents, limit |

### Cycle 1 Gate

```
[ ] Every brain-touching API endpoint checks tier + meters the call
[ ] Free tier: L1-L3 loops only; L4-L7 return 402 with upgrade prompt
[ ] Builder: L1-L5 active; L6-L7 gated
[ ] Scale/World/Enterprise: all loops active
[ ] Agent registration checks count against tier limit
[ ] D1 meter table records calls per key per month
[ ] 737+ tests pass, 0 new failures
```

---

## Cycle 2: PROVE — Dashboard + billing + onboarding

**Scope:** Build developer dashboard at `one.ie/dashboard` (see your agents,
messages, highways, usage, tier). Integrate Stripe for Builder/Scale/World
subscriptions. Developer onboarding flow: signup → API key → first signal.
Hosted webhook option for BaaS developers who don't have their own hosting.

**Depends on:** Cycle 1 — metering and tiers enforced.

### Wave 3 — Edits

| Task id | File / artifact | Cat | Tags |
|---|---|---|---|
| T-B2-01 | `src/pages/dashboard.astro` — developer dashboard page: agents, usage chart (calls/mo), current tier, upgrade button, API key management | new | page, dashboard |
| T-B2-02 | `src/pages/api/dashboard/usage.ts` — GET: return { tier, calls_this_month, agents_count, limit, highways_count } for authenticated developer | new | api, dashboard |
| T-B2-03 | `src/pages/api/dashboard/agents.ts` — GET: list developer's agents (uid, name, status, signal_count, last_active) | new | api, dashboard |
| T-B2-04 | `src/pages/api/billing/subscribe.ts` — POST: create Stripe Checkout session for tier upgrade. Webhook: update tier in TypeDB on payment success. | new | billing, stripe |
| T-B2-05 | `src/pages/api/billing/portal.ts` — GET: redirect to Stripe Customer Portal (manage subscription, cancel, change plan) | new | billing, stripe |
| T-B2-06 | `src/pages/api/auth/signup.ts` — POST: create developer account, generate API key (tier=free), return key + quickstart instructions | edit | auth, onboard |
| T-B2-07 | `src/pages/api/webhooks/hosted.ts` — POST: register a hosted webhook for a developer's agent (ONE runs the Telegram/Discord endpoint on behalf of the developer) | new | webhook, hosted |
| T-B2-08 | `src/pages/signup.astro` — developer signup page: email → API key → copy → quickstart code snippet shown inline | new | page, onboard |
| T-B2-09 | Update `@oneie/sdk` SubstrateClient: add `client.usage()` method that calls `/api/dashboard/usage` — developer can check their usage from code | edit | sdk |

### Cycle 2 Gate

```
[ ] one.ie/dashboard shows: agents, usage, tier, upgrade button
[ ] one.ie/signup creates developer account + API key in one step
[ ] Stripe Checkout flow: click upgrade → pay → tier updates in TypeDB
[ ] Hosted webhook: developer registers Telegram bot, ONE handles the webhook
[ ] SubstrateClient.usage() returns { tier, calls_this_month, limit }
[ ] 750+ tests pass
```

---

## Cycle 3: GROW — CF Pages template + WfP managed option

**Scope:** Scaffold a CF Pages-compatible NanoClaw template so developers
can deploy free compute. Optionally set up WfP dispatch namespace for
developers who want ONE to manage everything. `oneie init --pages`
generates a deployable Pages project.

**Depends on:** Cycle 2 — dashboard and billing live.

### Wave 3 — Edits

| Task id | File / artifact | Cat | Tags |
|---|---|---|---|
| T-B3-01 | `packages/templates/src/pages-scaffold.ts` — generates a minimal CF Pages project: `wrangler.toml` (pages config), NanoClaw router, `GATEWAY_URL = api.one.ie`, D1 migration SQL | new | templates, pages |
| T-B3-02 | `cli/src/commands/init.ts` — add `--pages` flag: if set, run pages scaffold instead of default init. Output: "Now run: wrangler pages project create && wrangler pages deploy dist/" | edit | cli, pages |
| T-B3-03 | `docs/quickstart-pages.md` — 1-page guide: create free CF account → `oneie init --pages` → deploy → wire Telegram bot → first conversation. Under 500 words. | new | docs |
| T-B3-04 | `docs/quickstart-baas.md` — 1-page guide: signup at one.ie → get API key → `npm install @oneie/sdk` → `new SubstrateClient(key)` → first signal. Under 500 words. | new | docs |
| T-B3-05 | WfP dispatch namespace setup (only if offering managed): create namespace, build dispatch worker with pheromone routing + tier enforcement + outbound worker | new | wfp, managed |
| T-B3-06 | `cli/src/commands/deploy.ts` — add `--hosted` flag: POST markdown to `/api/agents/deploy` (BaaS), else run local deploy pipeline | edit | cli, deploy |
| T-B3-07 | `src/pages/api/agents/deploy.ts` — POST: receive markdown + API key, parse → syncAgent → return { uid, webhookUrl, suiAddress }. For managed tier: also upload to WfP namespace. | new | api, deploy |

### Cycle 3 Gate

```
[ ] oneie init --pages generates a deployable CF Pages project
[ ] Developer can: wrangler pages deploy → live agent bot on free tier
[ ] quickstart-baas.md: API key → first signal in 5 lines of code
[ ] quickstart-pages.md: scaffold → deploy → Telegram bot in 3 commands
[ ] oneie deploy --hosted uploads agent to BaaS (no wrangler needed)
[ ] /api/agents/deploy accepts markdown + API key, returns uid + webhook URL
[ ] 760+ tests pass
```

---

## Cycle 4: SCALE — Custom domains + World/Enterprise tiers

**Scope:** CF for SaaS integration for developer custom domains. Bridge
the existing tenant system (`/api/worlds/tenant`) to the World pricing tier.
Enterprise federation (dedicated TypeDB, private paths + shared highways).

**Depends on:** Cycle 3 — deploy options working.

### Wave 3 — Edits

| Task id | File / artifact | Cat | Tags |
|---|---|---|---|
| T-B4-01 | `cli/src/commands/domain.ts` — new: `oneie domain <hostname>`: calls CF for SaaS API to create custom hostname, updates webhook URL | new | cli, domain |
| T-B4-02 | `src/pages/api/domains/create.ts` — POST: create custom hostname via CF API, store mapping in D1. Requires Scale+ tier. | new | api, domain |
| T-B4-03 | `src/pages/api/worlds/tenant.ts` — update: bridge existing $499/$1999/$9999 tiers to new World ($499) / Enterprise (custom) pricing curve. Add `tier` field from pricing.md. | edit | tenant, tier |
| T-B4-04 | `src/pages/api/dashboard/domains.ts` — GET: list developer's custom domains + SSL status | new | api, dashboard |
| T-B4-05 | `src/engine/loop.ts` — private paths mode: when developer has World/Enterprise tier, their mark/warn writes to a scoped partition. Shared highways still readable. | edit | engine, isolation |
| T-B4-06 | `src/pages/api/federation/connect.ts` — POST: connect two worlds. Signals can cross world boundaries. Revenue sharing on cross-world routes. Enterprise only. | new | api, federation |

### Cycle 4 Gate

```
[ ] oneie domain tutor.dev.com creates custom hostname with auto SSL
[ ] World tier ($499/mo) bridges to existing tenant system
[ ] Private paths: World/Enterprise developers' mark/warn isolated
[ ] Shared highways: still readable by all tiers
[ ] Federation: two Enterprise worlds can route signals between them
[ ] 770+ tests pass
```

---

## Cost Discipline

| Cycle | Wave | Agents | Model | Rough share |
|---|---|---|---|---|
| 1 | W1 | 5 | Haiku | 3% |
| 1 | W2 | 1 | Opus | 8% |
| 1 | W3 | 9 | Sonnet | 18% |
| 1 | W4 | 3 | Sonnet | 6% |
| 2 | W1 | 4 | Haiku | 2% |
| 2 | W2 | 1 | Opus | 8% |
| 2 | W3 | 9 | Sonnet | 18% |
| 2 | W4 | 3 | Sonnet | 6% |
| 3 | W1 | 4 | Haiku | 2% |
| 3 | W2 | 1 | Opus | 5% |
| 3 | W3 | 7 | Sonnet | 12% |
| 3 | W4 | 3 | Sonnet | 5% |
| 4 | W1 | 3 | Haiku | 1% |
| 4 | W2 | 1 | Opus | 3% |
| 4 | W3 | 6 | Sonnet | 8% |
| 4 | W4 | 3 | Sonnet | 5% |

**Hard stop:** any W4 that loops > 3 times → halt, escalate.

---

## Status

- [ ] **Cycle 1: WIRE** — metering, tier enforcement, loop gates, dev scoping
  - [ ] W1 — Recon
  - [ ] W2 — Decide
  - [ ] W3 — Edits (9 tasks)
  - [ ] W4 — Verify
- [ ] **Cycle 2: PROVE** — dashboard, billing, onboarding, hosted webhooks
  - [ ] W1 — Recon
  - [ ] W2 — Decide
  - [ ] W3 — Edits (9 tasks)
  - [ ] W4 — Verify
- [ ] **Cycle 3: GROW** — CF Pages template, WfP managed, deploy options
  - [ ] W1 — Recon
  - [ ] W2 — Decide
  - [ ] W3 — Edits (7 tasks)
  - [ ] W4 — Verify
- [ ] **Cycle 4: SCALE** — custom domains, World/Enterprise tiers, federation
  - [ ] W1 — Recon
  - [ ] W2 — Decide
  - [ ] W3 — Edits (6 tasks)
  - [ ] W4 — Verify

---

## Execution

```bash
/do TODO-platform-baas.md          # advance current wave
/do TODO-platform-baas.md --auto   # run W1→W4 continuously
/see tasks --tag baas              # open platform tasks
/see tasks --tag billing           # billing tasks
/see highways                      # proven paths
```

---

## See Also

- [TODO-publish-toolkit.md](TODO-publish-toolkit.md) — publish SDK/CLI/MCP/templates (prerequisite)
- [TODO-copy-toolkit.md](TODO-copy-toolkit.md) — what was built (done)
- [pricing.md](pricing.md) — 5 tiers, loop gates, revenue projections
- [infra-models.md](infra-models.md) — BaaS / CF Pages / Managed / Detached
- [one-toolkit-features.md](one-toolkit-features.md) — feature inventory
- [one-toolkit-landing.md](one-toolkit-landing.md) — landing page content
- [revenue.md](revenue.md) — 5 revenue layers
- [opensource.md](opensource.md) — give fire, sell light

---

*4 cycles. 16 waves. 31 tasks. Wire metering first, prove with dashboard
+ billing, grow with deploy options, scale with domains + federation.
ONE IS the backend. The 136 endpoints are the product.*
