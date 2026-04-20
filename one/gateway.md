---
title: Gateway — harden, observe, accelerate the edge
slug: gateway
goal: Every browser→brain hop gated, measured, sub-10ms p50, with per-origin revenue and pheromone write-through.
group: ONE
cycles: 4
route_hints:
  primary: [gateway, edge, security]
  secondary: [typedb-proxy, websocket, speed, revenue]
rubric_weights:
  fit: 0.30
  form: 0.20
  truth: 0.35
  taste: 0.15
split_tests:
  - cycle: 3
    wave: W3
    variants: 2
    dimension: "singleflight JWT refresh — Promise-cached vs KV-locked"
escape:
  condition: "p50 latency > 15ms for 2 consecutive cycles OR any W4 reports signal-loss invariant failure"
  action: "emit signal → chairman { plan:gateway, trend, reason }; status → PAUSED; revert last cycle"
downstream:
  capability: gateway:edge-proxy
  price: 0.0001
  scope: public
source_of_truth:
  - one/dictionary.md
  - one/task.md
  - one/patterns.md
  - one/rubrics.md
  - one/speed.md
  - one/routing.md
  - one/broadcast.md
  - one/revenue.md
  - one/secure-deploy.md
status: PLAN
---

# Gateway

**One Worker. 19 KB. Every browser→brain hop. Every WebSocket. Every signal.**

Today the gateway relays. Tomorrow it **gates**: every query checked for
origin/role/budget before it touches the brain, every outcome marked on the
path that carried it, every latency histogram feeding STAN. The relay becomes
the **sensor nerve**: Layer 1 revenue accrues here, the deterministic sandwich
runs here, the speed budget is defended here.

This plan refines `gateway/src/{index,origin-allow,sse-proxy}.ts` (~570 LOC
total) into four cycles. No rewrites — only reinforcement.

---

## 1 — Vision

Browsers, bots, and external worlds talk to ONE through one Worker. That Worker
must be **fast enough** that TypeDB's round-trip dominates (<10ms p50), **safe
enough** that no signal reaches the brain without passing toxic/lifecycle/role
checks, and **observant enough** that every relayed signal deposits pheromone
on the path that carried it. When this compounds, the gateway itself becomes
a priced capability: `gateway:edge-proxy` at 0.0001 per signal — Layer 1
routing fees materialize here.

---

## 2 — Closed loop (ASCII diagram)

```
browser ─HTTP/WS─► gateway (≤10ms)
                    │
            ┌───────┴────────┐
            │                │
       PRE checks        POST checks
       toxic?            mark(origin→receiver, depth)
       role?             warn(edge) on 4xx/5xx
       budget?           revenue(+0.0001) on success
            │                │
            ▼                ▼
       typedb/query    /broadcast → WsHub DO
       /tasks GET      /ws upgrade
       /messages        /proxy/sse
            │
            ▼
       TypeDB Cloud (~100ms)
            │
            ▼
       result/timeout/dissolved/failure
            │
            └──► loop:feedback signal
                 { tags: [gateway, origin, route], strength, content }
                   → STAN learns which routes are fast
                   → pheromone strengthens healthy edges
                   → toxic origins degrade naturally via warn()
```

If the flow can't be drawn, it can't be routed.

---

## 3 — Fronts (axes of work)

Four parallel fronts. Each maps to one cycle but directors can pick them up
independently once cycle-1 lands.

| Front         | Tags                               | Rubric tilt (fit/form/truth/taste) | Director picks up |
|---------------|------------------------------------|-------------------------------------|-------------------|
| Hardening     | [gateway, security, auth]          | 0.30 / 0.15 / 0.45 / 0.10           | highest security pheromone |
| Observability | [gateway, metrics, pheromone]      | 0.35 / 0.15 / 0.40 / 0.10           | highest learning pheromone |
| Speed         | [gateway, speed, cache]            | 0.40 / 0.15 / 0.35 / 0.10           | highest speed pheromone |
| Economics     | [gateway, revenue, quota]          | 0.45 / 0.10 / 0.35 / 0.10           | highest commerce pheromone |

---

## 4 — TQL compile (how this plan writes to TypeDB)

```tql
# The plan
insert $p isa thing,
  has thing-id "gateway",
  has thing-type "plan",
  has name "Gateway — harden, observe, accelerate the edge",
  has goal "Every browser→brain hop gated, measured, sub-10ms p50, with per-origin revenue and pheromone write-through.",
  has cycles-planned 4,
  has status "PLAN",
  has tag "gateway", has tag "edge", has tag "security",
  has tag "typedb-proxy", has tag "websocket", has tag "speed", has tag "revenue";

# Cycles
insert $c1 isa thing, has thing-id "gateway:1", has thing-type "cycle",
  has name "Hardening",       has task-status "open";
insert $c2 isa thing, has thing-id "gateway:2", has thing-type "cycle",
  has name "Observability",   has task-status "open";
insert $c3 isa thing, has thing-id "gateway:3", has thing-type "cycle",
  has name "Speed",           has task-status "open";
insert $c4 isa thing, has thing-id "gateway:4", has thing-type "cycle",
  has name "Economics",       has task-status "open";

# Containment
match $p isa thing, has thing-id "gateway";
      $c1 isa thing, has thing-id "gateway:1";
      $c2 isa thing, has thing-id "gateway:2";
      $c3 isa thing, has thing-id "gateway:3";
      $c4 isa thing, has thing-id "gateway:4";
insert (container:$p, contained:$c1) isa containment;
insert (container:$p, contained:$c2) isa containment;
insert (container:$p, contained:$c3) isa containment;
insert (container:$p, contained:$c4) isa containment;

# Downstream capability — fires at plan close
insert $s isa thing,
  has thing-id "gateway:skill",
  has thing-type "skill",
  has name "gateway:edge-proxy",
  has price 0.0001,
  has scope "public";
```

Full per-task inserts emitted by `/plan sync` — shape follows
`one/task.md` ID convention `gateway:{cycle}:{role}{index}`.

---

## 5 — Wave mechanics

Every cycle is W1 recon → W2 decide → W3 edit → W4 verify. Defaults from
`one/template-plan.md § 5` apply. **Gateway-specific parallelism:**

- W1: min 4 Haiku (index.ts × 2 shards, origin-allow.ts, sse-proxy.ts, CLAUDE.md,
  plus matching tests in `scripts/test-ws-integration.ts`)
- W2: 1 Opus — decisions here are small and interlocking, don't shard
- W3: 1 Sonnet per touched file. Never batch (anchor races on this dense index.ts)
- W4: 2 Sonnet shards — (a) `bun run verify` + ws-integration test, (b) rubric+xref

Outcome→strength and self-learning per wave follow the template's 4-outcome
algebra at wave scope. No overrides.

---

## 6 — Deterministic sandwich

```
PRE (W0)                                POST (W4)
──────────────                          ──────────────
bun run verify                          bun run verify
scripts/test-ws-integration.ts          scripts/test-ws-integration.ts   (11/11)
curl -s api.one.ie/health | jq .status  curl -s api.one.ie/health | jq .status  (= "ok")
                                        p50 latency ≤ 10ms on 100-sample probe
```

Cycle gate adds two gateway-specific checks beyond the universal rubric≥0.65:
(i) no regression in bundle size (≤ 32 KiB), (ii) no regression in startup
time (≤ 20 ms) — both visible in `wrangler deploy` output.

---

## 7 — Cycles

### Cycle 1 — Hardening

**Deliverable:** A gateway that refuses malformed, unauthorized, or
over-quota traffic before it reaches TypeDB.
**Exit:** query allowlist active, SSE headers sanitized, rate limits
enforced per origin, `/tasks/:tid` PATCH cascade extracted as named helper.

#### W1 — Recon
- `gateway:1:r1` — read `gateway/src/index.ts` lines 167–190 (typedbQuery), report every path that calls it and what fails open
- `gateway:1:r2` — read `gateway/src/index.ts` lines 311–389 (cascade unblock), cite every D1 call + the implicit state machine
- `gateway:1:r3` — read `gateway/src/sse-proxy.ts`, report every header forwarded upstream + which ones could carry credentials
- `gateway:1:r4` — read `gateway/src/origin-allow.ts` + recall CORS usage in `index.ts`, report duplication surface area

#### W2 — Decide
- `gateway:1:d1` — spec out: (a) TypeQL write allowlist on `/typedb/query` (reject raw `delete` + attribute mutation from browser), (b) SSE header stripping (remove Cookie, Authorization before upstream forward), (c) naive in-DO token bucket for per-origin rate (60 req / 10 sec), (d) extract cascade-unblock into `src/cascade.ts`

#### W3 — Edit
- `gateway:1:e1` — `gateway/src/index.ts` — wire allowlist + rate limit, replace inline cascade with helper call
- `gateway:1:e2` — `gateway/src/cascade.ts` (**new**) — named `cascadeUnblock(db, completedTid, now) → string[]`
- `gateway:1:e3` — `gateway/src/sse-proxy.ts` — strip `Cookie`, `Authorization`, `X-Broadcast-Secret` from upstream headers
- `gateway:1:e4` — `gateway/CLAUDE.md` — document new gates, update Routes table

#### W4 — Verify
- `gateway:1:v1` — shard:consistency — run `bun run verify`, ws-integration 11/11, deploy-smoke: confirm allowlist rejects a constructed `delete $x isa actor` write
- `gateway:1:v2` — shard:rubric — score fit/form/truth/taste

#### Cycle 1 gate
```bash
bun run verify
bun run scripts/test-ws-integration.ts
curl -sS -X POST https://api.one.ie/typedb/query \
  -H 'Content-Type: application/json' \
  -d '{"query":"match $x isa actor; delete $x;","transactionType":"write","commit":true}' | \
  jq -e '.error | test("not allowed")'
```

```
[ ] Baseline tests still pass
[ ] New tests cover allowlist, cascade helper, SSE sanitization
[ ] biome check . clean on touched files
[ ] tsc --noEmit passes
[ ] W4 rubric ≥ 0.65 on all four dims
[ ] do:close signal emitted
```

---

### Cycle 2 — Observability

**Deliverable:** Every gateway request deposits pheromone and is countable.
**Exit:** `/metrics` endpoint live, every `/typedb/query` and `/broadcast`
fires a pheromone mark on `origin→receiver`, structured log per request.

#### W1 — Recon
- `gateway:2:r1` — grep `mark\\|warn\\|loop:feedback` in `gateway/src/` — report current pheromone write-through surface (expected: zero)
- `gateway:2:r2` — read `src/lib/edge.ts` + `workers/sync/index.ts`, report how the nervous system emits pheromone and which HTTP endpoints it hits
- `gateway:2:r3` — read `one/speed.md` + `one/broadcast.md`, report the exact latency budgets and message-type allowlist the gateway enforces
- `gateway:2:r4` — read `src/pages/api/signal.ts`, report the receiving end — what the gateway must POST to record a pheromone event

#### W2 — Decide
- `gateway:2:d1` — spec: (a) `GET /metrics` — counts per route + p50/p95/p99 histograms (in-memory per-isolate, reset on deploy), (b) `relayFeedback(env, {tags, strength})` helper that best-effort POSTs to `env.SYNC_WORKER_URL` (or a new `GATEWAY_FEEDBACK_URL`) with 500ms timeout — never blocks response, (c) structured log line per request: `{ts, route, origin, status, ms}` via `console.log(JSON.stringify(...))`

#### W3 — Edit
- `gateway:2:e1` — `gateway/src/index.ts` — add timing wrapper, /metrics handler, relayFeedback calls on success/error
- `gateway:2:e2` — `gateway/src/feedback.ts` (**new**) — the relay helper, fire-and-forget with AbortController
- `gateway:2:e3` — `gateway/wrangler.toml` — add `GATEWAY_FEEDBACK_URL` var entry (wired in `.env`, not committed)
- `gateway:2:e4` — `gateway/CLAUDE.md` + `one/gateway.md` — document `/metrics` surface, pheromone emissions

#### W4 — Verify
- `gateway:2:v1` — shard:consistency — `curl /metrics | jq '.p50_ms < 15'`, verify pheromone received on `/api/signal` dashboard
- `gateway:2:v2` — shard:rubric — score fit/form/truth/taste; confirm "no blocking wait on feedback" invariant

#### Cycle 2 gate
```bash
curl -sS https://api.one.ie/metrics | jq -e '.routes."/tasks".p95_ms < 20'
curl -sS https://api.one.ie/metrics | jq -e '.routes."/typedb/query".count >= 0'
```

---

### Cycle 3 — Speed

**Deliverable:** p50 ≤ 8ms on `/tasks` KV-hit, ≤ 12ms on `/typedb/query`,
≤ 3ms on `/health`. No cold-start regressions from new code.
**Exit:** JWT signin singleflight, DO warm-path for `/broadcast`, query
response streaming on large TypeDB results.

#### W1 — Recon
- `gateway:3:r1` — read `gateway/src/index.ts` lines 30–186 (token cache + typedbQuery), quantify: what happens when 10 concurrent requests hit an expired JWT
- `gateway:3:r2` — read `one/speed.md`, report current gateway claims vs measured — any drift?
- `gateway:3:r3` — grep for `MAX_WS_CONNECTIONS` + `idFromName('global')`, report single-DO hotspot risk at 100 concurrent WS
- `gateway:3:r4` — read CF Workers docs note in `one/astro-cloudflare-pattern.md`, report whether `Response.json({})` shortcut has startup cost we're paying

#### W2 — Decide (split-test)
- `gateway:3:d1` — spec two variants of JWT singleflight:
  - **variant a** — Promise-cached per isolate (simplest, but thundering herd if many isolates cold-start together)
  - **variant b** — KV-backed lock (slower normal path, strictly correct across isolates)
- Also spec: DO warm-path (precompute sockets iterator), early-return on `/health` before CORS

#### W3 — Edit (split-test × 2 variants for e1)
- `gateway:3:e1.a` — Promise-cached singleflight — `cachedTokenPromise: Promise<string> | null`
- `gateway:3:e1.b` — KV-lock singleflight — `kv.get('jwt-lock')` with 2s TTL
- `gateway:3:e2` — DO warm-path + early /health
- `gateway:3:e3` — update docs with winning variant's reasoning

#### W4 — Verify
- `gateway:3:v1` — shard:speed — run 100-sample p50/p95 probe against both preview URLs, pick winner by (rubric × 0.6) + (speed × 0.3) + (cost × 0.1)
- `gateway:3:v2` — shard:rubric — score + confirm no regression in ws-integration test

#### Cycle 3 gate
```bash
# Winner deployed. Losing variant marked.
for i in {1..100}; do curl -sSo /dev/null -w "%{time_total}\n" https://api.one.ie/health; done | \
  awk '{s+=$1; a[NR]=$1} END {asort(a); print "p50", a[int(NR*0.5)]*1000, "ms; p95", a[int(NR*0.95)]*1000, "ms"}'
# Assert p50 ≤ 8ms, p95 ≤ 25ms
```

---

### Cycle 4 — Economics

**Deliverable:** The gateway is a priced capability. Each successful signal
routed accrues 0.0001 in L1 fees to the requesting origin's group wallet.
**Exit:** per-origin quota (read from TypeDB `actor.budget`), over-quota
returns 429 + warn(0.5) on origin-path, L1 fee recorded per success.

#### W1 — Recon
- `gateway:4:r1` — read `one/revenue.md`, report L1 routing-fee formula + where in the stack it's currently credited
- `gateway:4:r2` — read `src/lib/api-auth.ts` + `src/lib/role-check.ts`, report how origin→actor resolution happens and whether we can do it in-Worker
- `gateway:4:r3` — grep `budget\\|quota` in `src/schema/*.tql`, report existing attribute shape
- `gateway:4:r4` — read `one/buy-and-sell.md` EXECUTE+SETTLE, report where a gateway fee fits in the trade lifecycle

#### W2 — Decide
- `gateway:4:d1` — spec: (a) resolve origin→actor via signed JWT from app (short-lived, issued by `/api/auth/session`), (b) cache actor budget in KV with 10s TTL, (c) per-route fee table (read routes = 0.00005, write = 0.0002, broadcast = 0.0001), (d) fee recorded by enqueuing to sync worker, not blocking response

#### W3 — Edit
- `gateway:4:e1` — `gateway/src/index.ts` — budget gate + fee emit
- `gateway:4:e2` — `gateway/src/budget.ts` (**new**) — actor resolution + quota check
- `gateway:4:e3` — `src/pages/api/auth/session.ts` — issue short-lived JWT on login (coordinated with auth plan — may need its own plan if scope creeps)
- `gateway:4:e4` — `gateway/CLAUDE.md` + `one/revenue.md` — document L1 fee surface

#### W4 — Verify
- `gateway:4:v1` — shard:consistency — simulate over-quota actor, assert 429, assert warn fires
- `gateway:4:v2` — shard:rubric — score + confirm revenue dashboard shows per-origin breakdown

#### Cycle 4 gate
```bash
# Over-quota origin gets 429
ACTOR=test-over-quota curl -sS -w "%{http_code}\n" -H "Authorization: Bearer $ACTOR_JWT" \
  https://api.one.ie/tasks | tail -1 | grep -q 429
# Revenue accrues
curl -sS https://one.ie/api/revenue?layer=1 | jq '.gateway.last_24h > 0'
```

---

## 8 — Split-tests

Only cycle 3 W3 splits. Cycles 1, 2, 4 have single-track implementations
because the right call is clear from recon. Per template, don't split where
variance in approach is already known.

| Cycle | Wave | Variants | Dimension | Winner metric |
|-------|------|----------|-----------|---------------|
| 3 | W3 | 2 | singleflight JWT refresh: Promise-cache vs KV-lock | (rubric × 0.6) + (p50 delta × 0.3) + (cost × 0.1) |

---

## 9 — Source of truth (auto-loaded by W2)

| Doc | Locks |
|-----|-------|
| `one/dictionary.md` | 6 verbs, 4 outcomes, canonical names |
| `one/task.md` | task entity, state machine, ID shape |
| `one/patterns.md` | closed loop, zero returns, deterministic sandwich |
| `one/rubrics.md` | fit/form/truth/taste, gate 0.65 |
| `one/speed.md` | gateway p50 ≤ 10ms, TTFB budget — drives cycle-3 exit |
| `one/routing.md` | PRE-checks (toxic, capable) that gateway must enforce |
| `one/broadcast.md` | message type allowlist, `/broadcast` auth shape |
| `one/revenue.md` | L1 routing fee formula — drives cycle-4 pricing |
| `one/secure-deploy.md` | CF creds + secret rotation — informs cycle-1 auth gates |

---

## 10 — Escape

```
IF   p50 latency > 15ms on /health for 2 consecutive cycles
THEN emit signal → chairman { plan:gateway, trend, reason:"speed regression" }
AND  status → PAUSED
AND  pending cycles withdrawn; last known-good deploy re-promoted

IF   any W4 verifier reports missing mark()/warn() on a closed task
THEN status → HALTED (Rule 1 violation)
AND  emit signal → chairman + board

IF   any cycle's bundle size > 40 KiB (2× current)
THEN escape — we're pulling in the wrong dependencies
```

---

## 11 — Downstream pitch (auto-fires on plan close)

When cycle 4 W4 passes:

```yaml
pitch:
  headline: "Sub-10ms edge with built-in Role × Pheromone enforcement."
  body: |
    Every request through api.one.ie is origin-checked, role-gated, budget-bounded,
    and pheromone-marked — without you writing a line of middleware. Route your
    substrate traffic through us and the path becomes a learning surface.
  demo_url: /chat/gateway/edge-proxy
  transaction_url: /marketplace/pay?skill=gateway:edge-proxy
```

```tql
insert (provider: $gw, offered: $sk) isa capability,
  has price 0.0001, has scope "public";
```

Layer 1 revenue compounds per successful signal. The gateway is no longer
infra — it's a priced edge.

---

## 12 — Status

- [ ] **Cycle 1: Hardening** — auth gates, allowlist, cascade helper, SSE sanitization
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 4)
  - [ ] W4 — Verify (Sonnet × 2)
- [ ] **Cycle 2: Observability** — `/metrics`, pheromone write-through, structured logs
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 4)
  - [ ] W4 — Verify (Sonnet × 2)
- [ ] **Cycle 3: Speed** — JWT singleflight (split-test), DO warm-path
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 3 + 1 variant)
  - [ ] W4 — Verify (Sonnet × 2)
- [ ] **Cycle 4: Economics** — budget gate, L1 fee per signal
  - [ ] W1 — Recon (Haiku × 4)
  - [ ] W2 — Decide (Opus × 1)
  - [ ] W3 — Edits (Sonnet × 4)
  - [ ] W4 — Verify (Sonnet × 2)

---

## 13 — How to run

```bash
/plan sync one/gateway.md                 # write plan + cycles + tasks to TypeDB
/do one/gateway.md                        # advance next wave
/do one/gateway.md --auto                 # run all 4 cycles continuously
/do one/gateway.md --wave 2               # run a specific wave of the active cycle
/close gateway:1:v1                       # close a single verify task
/close --plan gateway --cycle 1           # close an entire cycle (all tasks verified)
/see tasks --plan gateway                 # all gateway tasks + status
/plan status one/gateway.md               # rubric trend + escape risk
/plan pitch one/gateway.md                # publish gateway:edge-proxy (auto at close)
```

---

## 14 — Cost discipline

| Cycle | Wave | Agents | Model | Est. share |
|-------|------|--------|-------|------------|
| 1 | W1 | 4 | Haiku | 4% |
| 1 | W2 | 1 | Opus | 9% |
| 1 | W3 | 4 | Sonnet | 12% |
| 1 | W4 | 2 | Sonnet | 5% |
| 2 | W1 | 4 | Haiku | 4% |
| 2 | W2 | 1 | Opus | 9% |
| 2 | W3 | 4 | Sonnet | 12% |
| 2 | W4 | 2 | Sonnet | 5% |
| 3 | W1 | 4 | Haiku | 4% |
| 3 | W2 | 1 | Opus | 9% |
| 3 | W3 | 4 (3 + 1 split variant) | Sonnet | 14% |
| 3 | W4 | 2 | Sonnet | 5% |
| 4 | W1 | 4 | Haiku | 4% |
| 4 | W2 | 1 | Opus | — |
| 4 | W3 | 4 | Sonnet | — |
| 4 | W4 | 2 | Sonnet | 4% |

Parallelism wins — 4 Haiku reading 4 files costs one Haiku-read but deposits
four parallel marks. **Hard stop:** any W4 loops > 3 → halt + chairman escalation.

---

## See also

- `one/template-plan.md` — the template this plan instantiates
- `one/task.md` — task entity spec + state machine + ID shape
- `one/dictionary.md` — 6 verbs, 4 outcomes (auto-loaded by W2)
- `one/patterns.md` — closed loop, zero returns, deterministic sandwich
- `one/rubrics.md` — fit/form/truth/taste + gate 0.65
- `one/speed.md` — latency budgets the gateway defends
- `one/routing.md` — PRE-check ordering (toxic → capable → execute)
- `one/broadcast.md` — `/broadcast` shape + message type allowlist
- `one/revenue.md` — Layer 1 routing fee formula that cycle-4 activates
- `one/secure-deploy.md` — CF creds + secret rotation
- `gateway/CLAUDE.md` — deployed surface (routes table, bindings, integration test)
- `.claude/commands/plan.md` — slash command for this template
- `.claude/commands/do.md` — wave orchestration
- `.claude/commands/close.md` — atomic close protocol

---

*One Worker. One plan. Four cycles. Each cycle closes a learning edge on the
edge of the substrate. At close, the edge itself becomes a priced capability —
and every signal you route through it compounds pheromone for the next one.*
