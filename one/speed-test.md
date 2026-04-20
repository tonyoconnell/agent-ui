# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T11:01:40.858Z |
| Test run at | 2026-04-20T11:01:28.685Z |
| Benchmarks measured | 112 named ops, 142 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **45 pass** · **0 over** · 0 missing |
| PERF_SCALE | 3 (practical budget = budget × 3) |

**What's measured here:**

- `routing:*` — `select()`, `follow()` over 100–1,000 path worlds
- `pheromone:*` — `mark()`, `warn()`, `sense()`, `fade()`, `highways()`
- `signal:*` — in-memory dispatch, queue drain, 3-unit `ask()` round-trip
- `identity:*` — Sui keypair derivation (SHA-256 + Ed25519)
- `edge:*` — in-process KV cache hit

How to extend: call `measure('<layer>:<op>', fn, iters)` in any test; the
sample lands here automatically. Add a budget in `scripts/speed-report.ts`
to get a verdict column.

---

## System Benchmarks

### Routing Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `routing:select:100` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.096 | 0.096 | 0.096 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 4.62e-4 | 4.62e-4 | 4.62e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.78e-4 | 2.78e-4 | 2.78e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 1.70e-4 | 1.70e-4 | 1.70e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.185 | 0.185 | 0.185 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.51e-4 | 1.51e-4 | 1.51e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.42 | 3.42 | 3.42 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 5.49e-4 | 5.49e-4 | 5.49e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 6.46 | 6.46 | 6.46 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.74e-4 | 1.74e-4 | 1.74e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.514 | 0.514 | 0.514 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.092 | 0.092 | 0.092 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 6.11 | 6.11 | 6.11 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 8.11e-4 | 8.11e-4 | 8.11e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.24e-4 | 2.24e-4 | 2.24e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.55 | 3.55 | 3.55 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 5.48e-4 | 5.48e-4 | 5.48e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.34e-4 | 1.34e-4 | 1.34e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 8.37e-5 | 8.37e-5 | 8.37e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 1.69 | 1.69 | 1.69 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.035 | 0.035 | 0.035 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.57e-5 | 4.57e-5 | 4.57e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.116 | 0.116 | 0.116 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.098 | 0.098 | 0.098 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 3.87 | 3.87 | 3.87 |
| `agents:parse:analyst.md` | 2 | 0.223 | 0.223 | 0.223 |
| `agents:parse:asi-builder.md` | 1 | 0.288 | 0.288 | 0.288 |
| `agents:parse:ceo.md` | 4 | 0.297 | 0.378 | 0.378 |
| `agents:parse:coder.md` | 1 | 0.238 | 0.238 | 0.238 |
| `agents:parse:community-director.md` | 1 | 0.429 | 0.429 | 0.429 |
| `agents:parse:community.md` | 2 | 0.247 | 0.247 | 0.247 |
| `agents:parse:concierge.md` | 3 | 0.183 | 0.263 | 0.263 |
| `agents:parse:classify.md` | 1 | 0.093 | 0.093 | 0.093 |
| `agents:parse:valence.md` | 1 | 0.092 | 0.092 | 0.092 |
| `agents:parse:bob.md` | 1 | 0.249 | 0.249 | 0.249 |
| `agents:parse:lexi.md` | 1 | 0.161 | 0.161 | 0.161 |
| `agents:parse:david.md` | 1 | 0.145 | 0.145 | 0.145 |
| `agents:parse:ai-ranking.md` | 2 | 0.233 | 0.233 | 0.233 |
| `agents:parse:amara.md` | 1 | 0.314 | 0.314 | 0.314 |
| `agents:parse:assessment.md` | 1 | 0.477 | 0.477 | 0.477 |
| `agents:parse:citation.md` | 2 | 0.185 | 0.185 | 0.185 |
| `agents:parse:cmo.md` | 3 | 0.389 | 0.546 | 0.546 |
| `agents:parse:content.md` | 2 | 0.225 | 0.225 | 0.225 |
| `agents:parse:edu.md` | 1 | 0.261 | 0.261 | 0.261 |
| `agents:parse:enrollment.md` | 1 | 0.311 | 0.311 | 0.311 |
| `agents:parse:forum.md` | 2 | 0.174 | 0.174 | 0.174 |
| `agents:parse:full.md` | 2 | 0.168 | 0.168 | 0.168 |
| `agents:parse:mktg.md` | 1 | 0.214 | 0.214 | 0.214 |
| `agents:parse:monthly.md` | 2 | 0.169 | 0.169 | 0.169 |
| `agents:parse:niche-dir.md` | 2 | 0.234 | 0.234 | 0.234 |
| `agents:parse:outreach.md` | 2 | 0.168 | 0.168 | 0.168 |
| `agents:parse:quick.md` | 2 | 0.169 | 0.169 | 0.169 |
| `agents:parse:sales.md` | 1 | 0.238 | 0.238 | 0.238 |
| `agents:parse:schema.md` | 2 | 0.189 | 0.189 | 0.189 |
| `agents:parse:social.md` | 4 | 0.237 | 0.281 | 0.281 |
| `agents:parse:support.md` | 2 | 0.295 | 0.295 | 0.295 |
| `agents:parse:upsell.md` | 1 | 0.193 | 0.193 | 0.193 |
| `agents:parse:welcome.md` | 1 | 0.145 | 0.145 | 0.145 |
| `agents:parse:designer.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:ehc-officer.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:engineering-director.md` | 1 | 0.389 | 0.389 | 0.389 |
| `agents:parse:eth-dev.md` | 1 | 0.279 | 0.279 | 0.279 |
| `agents:parse:founder.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:guard.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:harvester.md` | 1 | 0.147 | 0.147 | 0.147 |
| `agents:parse:ads.md` | 2 | 0.224 | 0.224 | 0.224 |
| `agents:parse:creative.md` | 1 | 0.204 | 0.204 | 0.204 |
| `agents:parse:director.md` | 3 | 0.221 | 0.242 | 0.242 |
| `agents:parse:media-buyer.md` | 1 | 0.203 | 0.203 | 0.203 |
| `agents:parse:seo.md` | 2 | 0.441 | 0.441 | 0.441 |
| `agents:parse:marketing-director.md` | 1 | 0.323 | 0.323 | 0.323 |
| `agents:parse:nanoclaw.md` | 1 | 0.247 | 0.247 | 0.247 |
| `agents:parse:ops.md` | 1 | 0.265 | 0.265 | 0.265 |
| `agents:parse:researcher.md` | 2 | 0.190 | 0.190 | 0.190 |
| `agents:parse:tutor.md` | 2 | 0.512 | 0.512 | 0.512 |
| `agents:parse:world.md` | 1 | 0.048 | 0.048 | 0.048 |
| `agents:parse:cfo.md` | 1 | 0.241 | 0.241 | 0.241 |
| `agents:parse:cto.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:router.md` | 1 | 0.238 | 0.238 | 0.238 |
| `agents:parse:sales-director.md` | 1 | 0.554 | 0.554 | 0.554 |
| `agents:parse:scout.md` | 1 | 0.165 | 0.165 | 0.165 |
| `agents:parse:service-director.md` | 1 | 0.319 | 0.319 | 0.319 |
| `agents:parse:teacher.md` | 1 | 0.357 | 0.357 | 0.357 |
| `agents:parse:moderator.md` | 1 | 0.228 | 0.228 | 0.228 |
| `agents:parse:writer.md` | 2 | 0.387 | 0.387 | 0.387 |
| `agents:parse:testnet-buyer.md` | 1 | 0.221 | 0.221 | 0.221 |
| `agents:parse:trader.md` | 1 | 0.245 | 0.245 | 0.245 |
| `agents:parse:you.md` | 1 | 0.276 | 0.276 | 0.276 |
| `naming:scan-src` | 1 | 196 | 196 | 196 |
| `signalSender:mark` | 1 | 0.036 | 0.036 | 0.036 |
| `edge:cache:hit:sync-path` | 1 | 3.68e-5 | 3.68e-5 | 3.68e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1644/1667 tests · 38524ms across 128 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 11775ms |
| `llm.test.ts` | 14 | 6142ms |
| `llm-router.test.ts` | 12 | 3958ms |
| `tick.test.ts` | 9 | 2710ms |
| `system-speed.test.ts` | 15 | 1452ms |
| `sui-speed.test.ts` | 7 | 1022ms |
| `boot.test.ts` | 25 | 802ms |
| `learning-acceleration.test.ts` | 20 | 672ms |
| `sui.test.ts` | 6 | 663ms |
| `api-endpoints.test.ts` | 21 | 602ms |

---

_Report generated 2026-04-20T11:01:40.859Z._
