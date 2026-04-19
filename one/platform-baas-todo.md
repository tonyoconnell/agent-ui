---
title: TODO — BaaS platform infrastructure
type: roadmap
version: 1.1.0
priority: Wire → Prove → Grow → Scale
total_tasks: 32
completed: 0
status: READY
updated: 2026-04-19
---

# TODO: ONE as Backend-as-a-Service

> **Time units:** tasks → waves → cycles. No calendar time.
>
> **Thesis:** the 136 API endpoints on `api.one.ie` are already the
> product. The gateway already IS the boundary. This TODO turns that
> architectural fact into a developer-facing BaaS — metered, tiered,
> dashboarded, and billed. See [platform-baas.md](platform-baas.md) for
> the strategy (why this wins, who it's for, unit economics, the moat).
>
> **Goal:** ship five tiers (Free → Builder → Scale → World → Enterprise)
> against the existing substrate. Developers call `api.one.ie` from any
> stack (Vercel, AWS, mobile, Python, CF Pages) and get routing, memory,
> learning, commerce. Compute is their choice; intelligence is ours.
>
> **Source of truth:**
> - [platform-baas.md](platform-baas.md) — **strategy**: why BaaS wins, persona fit, moat, rollout thesis
> - [auth.md](auth.md) — identity, API keys, BetterAuth + `/api/auth/agent`, wallet derivation, `resolveUnitFromSession`, governance (Role × Pheromone locked 2026-04-18)
> - [groups.md](groups.md) — multi-tenancy, personal group auto-create (`group:{uid}`), hierarchy forest, visibility + signal scope, RBAC+ABAC+ReBAC
> - [groups-todo.md](groups-todo.md) — personal group schema additions + auto-create cycle (PROPOSED)
> - [pricing.md](pricing.md) — 5 tiers, 3 deploy options, loop gates, revenue projections
> - [infra-models.md](infra-models.md) — BaaS / CF Pages / WfP / detached architectures
> - [one-toolkit-features.md](one-toolkit-features.md) — feature inventory + gap analysis
> - [one-toolkit-landing.md](one-toolkit-landing.md) — landing page content spec
> - [DSL.md](DSL.md) — signal language
> - [dictionary.md](dictionary.md) — canonical names (signal/mark/warn/fade/follow/harden)
> - [rubrics.md](rubrics.md) — fit/form/truth/taste → mark in W4
>
> **Depends on:**
> - [TODO-publish-toolkit.md](publish-toolkit-todo.md) — SDK (`SubstrateClient`)
>   must be published first; developers need the client library before BaaS
>   is useful.
> - ~~[TODO-cf-workers-migration.md](cf-workers-migration-todo.md) Cycle 3~~ —
>   **resolved 2026-04-18**: Astro 6 + `@astrojs/cloudflare@13` + CF Workers
>   Static Assets shipped to `dev.one.ie`; Pages paused as rollback safety
>   net. Cycle 3 here no longer blocked — we can ship a Workers template
>   because our own `main` already runs on Workers.
>
> **Shape:** 4 cycles. Cycle 1 wires the BaaS foundation (metering, tiers,
> dev scoping). Cycle 2 builds the developer experience (dashboard, billing,
> onboarding). Cycle 3 adds a CF Workers + Static Assets template + WfP
> managed option. Cycle 4 adds CF for SaaS + World/Enterprise tiers.
>
> **What's already built:**
> - 136 API endpoints (`src/pages/api/`)
> - `validateApiKey()` (`src/lib/api-auth.ts`) with scope-group +
>   scope-skill + TTL + revocation + pheromone warn on bad auth
> - `getRoleForUser(uid)` — governance role lookup for the authenticated key
> - Group-scoped signals (`/api/g/:gid/signal`)
> - Tenant provisioning (`/api/worlds/tenant`) with tiers ($499/$1999/$9999)
> - D1 migrations up to `0014_escrow_settlement.sql` (messages, signals,
>   tasks, tenants, payments, pheromone WAL, escrow tables)
> - KV (cached TypeDB snapshots, 5-key hash-gated sync)
> - WsHub Durable Object (real-time, Gateway-mediated)
> - TypeDB (paths, units, skills, hypotheses, memberships with roles)
> - Astro 6 + CF Workers with Static Assets (Cycles 1-2 of the migration
>   shipped — Cycle 3 dashboard cutover pending)

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
    │ CF Workers + Static Assets template, │──────┤ L5 evolution
    │ WfP managed tier, oneie init         │      │ L6 know
    │ --workers, oneie deploy --hosted     │      │
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
| T-B1-01 | `src/lib/api-auth.ts` — extend `AuthContext` with `tier: 'free' \| 'builder' \| 'scale' \| 'world' \| 'enterprise'`. Read from `unit` entity owning the key (via `user-id`) and cache alongside existing key cache (5-min TTL); invalidate through existing `invalidateKeyCache(keyId)` path. **Both front doors must populate tier**: `validateApiKey()` for CLI/SDK callers AND `resolveUnitFromSession()` for BetterAuth cookie/bearer sessions (per [auth.md § Unified identity flow](auth.md)). One contract, one cache, two callers. | edit | auth, tier |
| T-B1-02 | `src/lib/tier-limits.ts` — new: `TIER_LIMITS` config (agents, apiCalls/mo, loops[], storage), `checkTierLimit(auth, resource)` → `{ok}` or `{error, status: 402}`. Match keys and phrasing to `docs/pricing.md` | new | tier, limits |
| T-B1-03 | `src/lib/metering.ts` — new: count API calls per key per month in D1 (`INSERT INTO meter (key_id, month, calls) ... ON CONFLICT UPDATE SET calls = calls + 1`), `getUsage(keyId, month)`. Fire-and-forget on the hot path, counted durably in D1 | new | meter |
| T-B1-04 | `src/pages/api/signal.ts` — add `checkTierLimit(auth, 'apiCall')` before routing; return 402 with tier info + upgrade URL on limit; mark `baas:rate-limit` warn on exceeded | edit | signal, meter |
| T-B1-05 | `src/pages/api/ask.ts` — same metering gate as signal | edit | ask, meter |
| T-B1-06 | `src/pages/api/loop/mark-dims.ts`, `decay-cycle.ts`, `hypotheses.ts`, `memory/reveal.ts`, `memory/forget.ts`, `memory/frontier.ts` — add metering gate to all brain-touching endpoints | edit | api, meter |
| T-B1-07 | `src/pages/api/tick.ts` — add loop gate: check tier before running L4-L7. Free: L1-L3 only. Builder: L1-L5. Scale/World/Ent: L1-L7. Route map defined in `docs/pricing.md` | edit | loops, gate |
| T-B1-08 | `migrations/0015_metering.sql` — `CREATE TABLE meter (key_id TEXT, month TEXT, calls INTEGER, PRIMARY KEY(key_id, month))` + `CREATE TABLE developer_agents (key_id TEXT, uid TEXT, created_at INTEGER, PRIMARY KEY(key_id, uid))` + index on `(key_id)` for per-developer agent count | new | d1, schema |
| T-B1-09 | `src/pages/api/agents/register.ts` — check agent count against tier limit before TypeDB insert; insert into `developer_agents` on success so count stays authoritative in D1 | edit | agents, limit |

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
| T-B2-03 | `src/pages/api/dashboard/agents.ts` — GET: list agents in the developer's **personal group** (`group:{uid}`) via `(group: $g, member: $a) isa membership` — NOT a flat table. Scope by uid from `AuthContext`. Returns (uid, name, status, signal_count, last_active, role). Per [groups.md § The three kinds of group an actor lives in](groups.md). | new | api, dashboard, groups |
| T-B2-04 | `src/pages/api/billing/subscribe.ts` — POST: create Stripe Checkout session for tier upgrade. Webhook: update tier in TypeDB on payment success. | new | billing, stripe |
| T-B2-05 | `src/pages/api/billing/portal.ts` — GET: redirect to Stripe Customer Portal (manage subscription, cancel, change plan) | new | billing, stripe |
| T-B2-06 | `src/pages/api/auth/agent.ts` — extend the existing zero-friction endpoint: on new unit creation, set `tier: 'free'` on the `unit` entity (default) and return `quickstart` snippet in response body. Humans who arrive via BetterAuth (`/api/auth/sign-up/email`) mint a programmatic key by calling `/api/auth/agent` with their bound uid (per [auth.md § Returning agents](auth.md)). **No new signup endpoint** — the existing two front doors handle it. | edit | auth, onboard |
| T-B2-07 | `src/pages/api/webhooks/hosted.ts` — POST: register a hosted webhook for a developer's agent (ONE runs the Telegram/Discord endpoint on behalf of the developer) | new | webhook, hosted |
| T-B2-08 | `src/pages/signup.astro` — developer signup page: BetterAuth email+password form → session cookie → auto-mint API key via `/api/auth/agent` → show key + personal group id (`group:{uid}`) + quickstart snippet inline. Use `resolveUnitFromSession()` for the session handoff. | new | page, onboard |
| T-B2-09 | Update `@oneie/sdk` SubstrateClient: add `client.usage()` method that calls `/api/dashboard/usage` — developer can check their usage from code | edit | sdk |
| T-B2-10 | `src/pages/api/auth/agent.ts` + `src/lib/api-auth.ts` — on unit creation (both `/api/auth/agent` and BetterAuth lazy-bind), auto-create the developer's **personal group** (`group:{uid}`, visibility `private`, group-type `personal`) with a `membership(group, member, role: "chairman")` relation. Idempotent on repeat call. Per [groups.md § Sign-Up and Onboarding](groups.md) and the frozen decisions on personal groups. Dashboard T-B2-03 then lists agents filtered to `(group: group:{uid}, member: $a) isa membership`. | new | groups, onboard |

### Cycle 2 Gate

```
[ ] one.ie/dashboard shows: agents (scoped to personal group), usage, tier, upgrade button
[ ] one.ie/signup: BetterAuth → session → auto-mint API key → personal group created with chairman role
[ ] Every new developer has group:{uid} with visibility=private and membership(role:chairman)
[ ] Dashboard agent list = TQL query against personal group membership (not a flat select *)
[ ] Stripe Checkout flow: click upgrade → pay → tier updates in TypeDB (on the unit entity)
[ ] Hosted webhook: developer registers Telegram bot, ONE handles the webhook
[ ] SubstrateClient.usage() returns { tier, calls_this_month, limit }
[ ] Tier enforced from BOTH AuthContext front doors (API key path + BetterAuth session path)
[ ] 750+ tests pass
```

---

## Cycle 3: GROW — CF Workers template + WfP managed option

**Scope:** Scaffold a **CF Workers + Static Assets** NanoClaw template so
developers can deploy free compute on Cloudflare's unified platform
(same free tier as Pages, but on the supported code path — Pages is frozen,
Workers gets every new CF feature). Optionally set up WfP dispatch
namespace for developers who want ONE to manage everything. `oneie init`
generates a deployable Workers project (Workers is the default; no flag
needed).

**Depends on:** Cycle 2 — dashboard and billing live. (The prior
`TODO-cf-workers-migration.md` blocker resolved 2026-04-18 — `dev.one.ie`
now serves the Workers runtime, so the template we ship matches the
platform we run.)

### Wave 3 — Edits

| Task id | File / artifact | Cat | Tags |
|---|---|---|---|
| T-B3-01 | `packages/templates/src/workers-scaffold.ts` — generates a minimal CF Workers + Static Assets project: `wrangler.toml` (Workers shape — `main = "src/index.ts"`, `[assets]` binding, no `pages_build_output_dir`), NanoClaw router, `GATEWAY_URL = api.one.ie`, D1 migration SQL. Mirrors the shape produced by our own Cycle 1 migration | new | templates, workers |
| T-B3-02 | `cli/src/commands/init.ts` — scaffold a Workers project by default (the existing `runInit()` flow). Output: "Now run: wrangler deploy". Reject a legacy `--pages` flag with a clear error pointing at the Workers migration memo | edit | cli, workers |
| T-B3-03 | `docs/quickstart-workers.md` — 1-page guide: create free CF account → `oneie init` → `wrangler deploy` → wire Telegram bot → first conversation. Under 500 words. Explicitly name "Workers with Static Assets" so SEO captures the new platform term | new | docs |
| T-B3-04 | `docs/quickstart-baas.md` — 1-page guide: signup at one.ie → get API key → `npm install @oneie/sdk` → `new SubstrateClient(key)` → first signal. Under 500 words | new | docs |
| T-B3-05 | WfP dispatch namespace setup (only if offering managed): create namespace, build dispatch worker with pheromone routing + tier enforcement + outbound worker. Reuse the bundle-size LOCKED rules from `CLAUDE.md` (markdown.syntaxHighlight=false, ssr.external allowlist, prerender where possible) | new | wfp, managed |
| T-B3-06 | `cli/src/commands/deploy.ts` — add `--hosted` flag: POST markdown to `/api/agents/deploy` (BaaS), else run local `wrangler deploy` pipeline | edit | cli, deploy |
| T-B3-07 | `src/pages/api/agents/deploy.ts` — POST: receive markdown + API key, parse → syncAgent → return { uid, webhookUrl, suiAddress }. For managed tier: also upload to WfP namespace. Returns 402 if tier doesn't cover `--hosted`. | new | api, deploy |

### Cycle 3 Gate

```
[ ] oneie init generates a deployable CF Workers + Static Assets project
[ ] Developer can: wrangler deploy → live agent bot on free tier
[ ] Scaffold passes the same bundle-size rules we enforce on main
[ ] quickstart-baas.md: API key → first signal in 5 lines of code
[ ] quickstart-workers.md: scaffold → deploy → Telegram bot in 3 commands
[ ] oneie deploy --hosted uploads agent to BaaS (no wrangler needed)
[ ] /api/agents/deploy accepts markdown + API key, returns uid + webhook URL
[ ] Legacy `--pages` flag rejected with a helpful redirect, not crash
[ ] 760+ tests pass
```

---

## Cycle 4: SCALE — Custom domains + World/Enterprise tiers

**Scope:** CF for SaaS integration for developer custom domains. Bridge
the existing tenant system (`/api/worlds/tenant`) to the World pricing tier.
Enterprise federation (dedicated TypeDB, private paths + shared highways).

**Groups mapping (per [groups.md](groups.md)):** World tier means the
developer's group becomes a **tenant root** in the forest — a
`world`-type group with its own hierarchy subtree. "Private paths"
means `path.scope = gid` (per the proposed schema addition in
groups.md § Proposed additions); writes are scoped to the customer's
tree; reads of public highways still work via shared membership.
Enterprise federation = `bridge-kind = "federation"` paths between
two world roots, revenue-sharing on cross-root `mark()`.

**Depends on:** Cycle 3 — deploy options working. Also depends on
[groups-todo.md](groups-todo.md) for the `visibility` + `scope` +
`bridge-kind` schema additions if not yet shipped.

### Wave 3 — Edits

| Task id | File / artifact | Cat | Tags |
|---|---|---|---|
| T-B4-01 | `cli/src/commands/domain.ts` — new: `oneie domain <hostname>`: calls CF for SaaS API to create custom hostname, updates webhook URL | new | cli, domain |
| T-B4-02 | `src/pages/api/domains/create.ts` — POST: create custom hostname via CF API, store mapping in D1. Requires Scale+ tier. | new | api, domain |
| T-B4-03 | `src/pages/api/worlds/tenant.ts` — update: bridge existing $499/$1999/$9999 tiers to new World ($499) / Enterprise (custom) pricing curve. Add `tier` field from pricing.md. | edit | tenant, tier |
| T-B4-04 | `src/pages/api/dashboard/domains.ts` — GET: list developer's custom domains + SSL status | new | api, dashboard |
| T-B4-05 | `src/engine/loop.ts` + `src/engine/persist.ts` — private paths mode: when developer has World/Enterprise tier, `mark`/`warn` writes include `path.scope = gid` (the customer's world root, per [groups.md § Proposed additions](groups.md)). Highway reads with `scope = "public"` still return cross-tenant; `scope = "group"` filters to the caller's ancestor worlds. | edit | engine, isolation, groups |
| T-B4-06 | `src/pages/api/federation/connect.ts` — POST: connect two worlds via a `path` with `bridge-kind = "federation"` (per [groups.md § Bridge paths](groups.md)). Signals can cross world boundaries through the bridge. Revenue sharing on cross-world `mark()` via the L4 economic loop. Enterprise only. | new | api, federation, groups |

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
  - [ ] W3 — Edits (10 tasks)
  - [ ] W4 — Verify
- [ ] **Cycle 3: GROW** — CF Workers + Static Assets template, WfP managed, deploy options *(prior blocker on Workers migration resolved 2026-04-18 — template scaffold can match shipped main)*
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

- [platform-baas.md](platform-baas.md) — **strategy**: why BaaS wins, persona fit, unit economics, moat
- [auth.md](auth.md) — identity, API keys, wallet derivation, BetterAuth + agent onboarding, governance (Role × Pheromone)
- [groups.md](groups.md) — multi-tenancy, personal + world + org hierarchy, RBAC+ABAC+ReBAC
- [groups-todo.md](groups-todo.md) — personal group + schema additions (PROPOSED — feeds Cycle 4 private paths)
- [TODO-publish-toolkit.md](publish-toolkit-todo.md) — publish SDK/CLI/MCP/templates (prerequisite)
- [TODO-cf-workers-migration.md](cf-workers-migration-todo.md) — shipped 2026-04-18 (no longer blocks Cycle 3)
- [TODO-copy-toolkit.md](copy-toolkit-todo.md) — what was built (done)
- [pricing.md](pricing.md) — 5 tiers, loop gates, revenue projections
- [infra-models.md](infra-models.md) — BaaS / CF Pages / WfP / detached architectures
- [one-toolkit-features.md](one-toolkit-features.md) — feature inventory
- [one-toolkit-landing.md](one-toolkit-landing.md) — landing page content
- [revenue.md](revenue.md) — 5 revenue layers (BaaS metering = layer 1)
- [opensource.md](opensource.md) — give fire, sell light

---

*4 cycles. 16 waves. 32 tasks. Wire metering first, prove with dashboard
+ billing, grow with CF Workers + Static Assets template + managed tier,
scale with domains + federation. ONE IS the backend. The 136 endpoints
are the product. The deploy target matches what we run ourselves —
Workers, not Pages. Strategy: [platform-baas.md](platform-baas.md).*
