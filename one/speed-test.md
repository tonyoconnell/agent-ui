# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T02:40:49.399Z |
| Test run at | 2026-04-20T02:40:36.417Z |
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
| `routing:select:100` | 0.005ms | 0.013 | 0.013 | 0.013 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.140 | 0.140 | 0.140 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.008 | 0.008 | 0.008 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.73e-4 | 6.73e-4 | 6.73e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 3.11e-4 | 3.11e-4 | 3.11e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.62e-5 | 5.62e-5 | 5.62e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.202 | 0.202 | 0.202 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 2.40e-4 | 2.40e-4 | 2.40e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.032 | 0.032 | 0.032 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.21 | 3.21 | 3.21 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.61e-4 | 3.61e-4 | 3.61e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.89 | 3.89 | 3.89 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 2.21e-4 | 2.21e-4 | 2.21e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 7.16e-4 | 7.16e-4 | 7.16e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.026 | 0.026 | 0.026 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.565 | 0.565 | 0.565 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.083 | 0.083 | 0.083 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 7.11 | 7.11 | 7.11 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.56e-4 | 3.56e-4 | 3.56e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.29e-4 | 2.29e-4 | 2.29e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 4.32 | 4.32 | 4.32 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 9.18e-4 | 9.18e-4 | 9.18e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 5.68e-4 | 5.68e-4 | 5.68e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.42e-4 | 2.42e-4 | 2.42e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.38e-4 | 2.38e-4 | 2.38e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.03e-4 | 1.03e-4 | 1.03e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.376 | 0.376 | 0.376 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.55e-5 | 4.55e-5 | 4.55e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.126 | 0.126 | 0.126 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.121 | 0.121 | 0.121 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `agents:parse:analyst.md` | 2 | 1.62 | 1.62 | 1.62 |
| `agents:parse:asi-builder.md` | 1 | 4.57 | 4.57 | 4.57 |
| `agents:parse:ceo.md` | 4 | 0.373 | 0.948 | 0.948 |
| `agents:parse:coder.md` | 1 | 0.396 | 0.396 | 0.396 |
| `agents:parse:community-director.md` | 1 | 0.784 | 0.784 | 0.784 |
| `agents:parse:community.md` | 2 | 0.542 | 0.542 | 0.542 |
| `agents:parse:concierge.md` | 3 | 0.220 | 0.247 | 0.247 |
| `agents:parse:classify.md` | 1 | 0.107 | 0.107 | 0.107 |
| `agents:parse:valence.md` | 1 | 0.260 | 0.260 | 0.260 |
| `agents:parse:bob.md` | 1 | 0.212 | 0.212 | 0.212 |
| `agents:parse:lexi.md` | 1 | 0.171 | 0.171 | 0.171 |
| `agents:parse:david.md` | 1 | 0.173 | 0.173 | 0.173 |
| `agents:parse:ai-ranking.md` | 2 | 0.564 | 0.564 | 0.564 |
| `agents:parse:amara.md` | 1 | 0.524 | 0.524 | 0.524 |
| `agents:parse:assessment.md` | 1 | 0.546 | 0.546 | 0.546 |
| `agents:parse:citation.md` | 2 | 0.202 | 0.202 | 0.202 |
| `agents:parse:cmo.md` | 3 | 0.343 | 0.641 | 0.641 |
| `agents:parse:content.md` | 2 | 0.301 | 0.301 | 0.301 |
| `agents:parse:edu.md` | 1 | 0.289 | 0.289 | 0.289 |
| `agents:parse:enrollment.md` | 1 | 0.394 | 0.394 | 0.394 |
| `agents:parse:forum.md` | 2 | 0.341 | 0.341 | 0.341 |
| `agents:parse:full.md` | 2 | 0.267 | 0.267 | 0.267 |
| `agents:parse:mktg.md` | 1 | 0.268 | 0.268 | 0.268 |
| `agents:parse:monthly.md` | 2 | 0.246 | 0.246 | 0.246 |
| `agents:parse:niche-dir.md` | 2 | 0.337 | 0.337 | 0.337 |
| `agents:parse:outreach.md` | 2 | 0.358 | 0.358 | 0.358 |
| `agents:parse:quick.md` | 2 | 0.271 | 0.271 | 0.271 |
| `agents:parse:sales.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:schema.md` | 2 | 0.385 | 0.385 | 0.385 |
| `agents:parse:social.md` | 4 | 0.487 | 1.04 | 1.04 |
| `agents:parse:support.md` | 2 | 0.404 | 0.404 | 0.404 |
| `agents:parse:upsell.md` | 1 | 0.598 | 0.598 | 0.598 |
| `agents:parse:welcome.md` | 1 | 0.276 | 0.276 | 0.276 |
| `agents:parse:designer.md` | 1 | 0.377 | 0.377 | 0.377 |
| `agents:parse:ehc-officer.md` | 1 | 0.295 | 0.295 | 0.295 |
| `agents:parse:engineering-director.md` | 1 | 0.423 | 0.423 | 0.423 |
| `agents:parse:eth-dev.md` | 1 | 0.420 | 0.420 | 0.420 |
| `agents:parse:founder.md` | 1 | 0.271 | 0.271 | 0.271 |
| `agents:parse:guard.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:harvester.md` | 1 | 0.412 | 0.412 | 0.412 |
| `agents:parse:ads.md` | 2 | 0.304 | 0.304 | 0.304 |
| `agents:parse:creative.md` | 1 | 0.352 | 0.352 | 0.352 |
| `agents:parse:director.md` | 3 | 0.290 | 0.333 | 0.333 |
| `agents:parse:media-buyer.md` | 1 | 0.252 | 0.252 | 0.252 |
| `agents:parse:seo.md` | 2 | 0.296 | 0.296 | 0.296 |
| `agents:parse:marketing-director.md` | 1 | 0.732 | 0.732 | 0.732 |
| `agents:parse:nanoclaw.md` | 1 | 0.255 | 0.255 | 0.255 |
| `agents:parse:ops.md` | 1 | 0.582 | 0.582 | 0.582 |
| `agents:parse:researcher.md` | 2 | 0.200 | 0.200 | 0.200 |
| `agents:parse:tutor.md` | 2 | 0.371 | 0.371 | 0.371 |
| `agents:parse:world.md` | 1 | 0.117 | 0.117 | 0.117 |
| `agents:parse:cfo.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:cto.md` | 1 | 0.258 | 0.258 | 0.258 |
| `agents:parse:router.md` | 1 | 0.225 | 0.225 | 0.225 |
| `agents:parse:sales-director.md` | 1 | 0.651 | 0.651 | 0.651 |
| `agents:parse:scout.md` | 1 | 0.198 | 0.198 | 0.198 |
| `agents:parse:service-director.md` | 1 | 0.436 | 0.436 | 0.436 |
| `agents:parse:teacher.md` | 1 | 0.524 | 0.524 | 0.524 |
| `agents:parse:moderator.md` | 1 | 0.280 | 0.280 | 0.280 |
| `agents:parse:writer.md` | 2 | 0.445 | 0.445 | 0.445 |
| `agents:parse:testnet-buyer.md` | 1 | 0.275 | 0.275 | 0.275 |
| `agents:parse:trader.md` | 1 | 0.271 | 0.271 | 0.271 |
| `agents:parse:you.md` | 1 | 0.305 | 0.305 | 0.305 |
| `sui:address:derive` | 1 | 3.72 | 3.72 | 3.72 |
| `naming:scan-src` | 1 | 118 | 118 | 118 |
| `signalSender:mark` | 1 | 0.042 | 0.042 | 0.042 |
| `edge:cache:hit:sync-path` | 1 | 3.94e-5 | 3.94e-5 | 3.94e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1614/1637 tests · 37819ms across 126 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 11904ms |
| `llm.test.ts` | 14 | 6143ms |
| `llm-router.test.ts` | 12 | 4068ms |
| `tick.test.ts` | 9 | 1805ms |
| `system-speed.test.ts` | 15 | 1714ms |
| `api-endpoints.test.ts` | 21 | 1287ms |
| `adl-llm.test.ts` | 5 | 893ms |
| `sui-speed.test.ts` | 7 | 755ms |
| `sui.test.ts` | 6 | 680ms |
| `adl-cache.test.ts` | 38 | 529ms |

---

_Report generated 2026-04-20T02:40:49.412Z._
