# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-17T02:54:01.837Z |
| Test run at | 2026-04-17T02:53:51.960Z |
| Benchmarks measured | 99 named ops, 115 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **44 pass** · **1 over** · 0 missing |
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
| `routing:select:100` | 0.005ms | 0.018 | 0.018 | 0.018 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.120 | 0.120 | 0.120 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.001 | 0.001 | 0.001 | 1 | ◐ pass (within 3× scale) | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.61e-4 | 1.61e-4 | 1.61e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.66e-5 | 4.66e-5 | 4.66e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.315 | 0.315 | 0.315 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 7.60e-4 | 7.60e-4 | 7.60e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.041 | 0.041 | 0.041 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.50 | 3.50 | 3.50 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 6.94e-4 | 6.94e-4 | 6.94e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 5.43 | 5.43 | 5.43 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.43e-4 | 1.43e-4 | 1.43e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.041 | 0.041 | 0.041 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.615 | 0.615 | 0.615 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.459 | 0.459 | 0.459 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.78 | 5.78 | 5.78 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 8.06e-4 | 8.06e-4 | 8.06e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 6.27e-4 | 6.27e-4 | 6.27e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.33 | 3.33 | 3.33 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 7.98e-4 | 7.98e-4 | 7.98e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.76e-4 | 2.76e-4 | 2.76e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.67e-4 | 1.67e-4 | 1.67e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 8.36e-5 | 8.36e-5 | 8.36e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.492 | 0.492 | 0.492 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.031 | 0.031 | 0.031 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.57e-5 | 4.57e-5 | 4.57e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.096 | 0.096 | 0.096 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.173 | 0.173 | 0.173 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `naming:scan-src` | 1 | 155 | 155 | 155 |
| `sui:address:derive` | 1 | 4.22 | 4.22 | 4.22 |
| `agents:parse:analyst.md` | 2 | 0.418 | 0.418 | 0.418 |
| `agents:parse:asi-builder.md` | 1 | 0.264 | 0.264 | 0.264 |
| `agents:parse:coder.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:community.md` | 2 | 0.212 | 0.212 | 0.212 |
| `agents:parse:concierge.md` | 2 | 0.170 | 0.170 | 0.170 |
| `agents:parse:classify.md` | 1 | 0.087 | 0.087 | 0.087 |
| `agents:parse:valence.md` | 1 | 0.085 | 0.085 | 0.085 |
| `agents:parse:ai-ranking.md` | 2 | 0.637 | 0.637 | 0.637 |
| `agents:parse:amara.md` | 1 | 0.286 | 0.286 | 0.286 |
| `agents:parse:assessment.md` | 1 | 0.328 | 0.328 | 0.328 |
| `agents:parse:ceo.md` | 1 | 0.220 | 0.220 | 0.220 |
| `agents:parse:citation.md` | 2 | 0.157 | 0.157 | 0.157 |
| `agents:parse:cmo.md` | 2 | 0.395 | 0.395 | 0.395 |
| `agents:parse:content.md` | 2 | 0.548 | 0.548 | 0.548 |
| `agents:parse:edu.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:enrollment.md` | 1 | 0.174 | 0.174 | 0.174 |
| `agents:parse:forum.md` | 2 | 0.224 | 0.224 | 0.224 |
| `agents:parse:full.md` | 2 | 0.147 | 0.147 | 0.147 |
| `agents:parse:mktg.md` | 1 | 0.211 | 0.211 | 0.211 |
| `agents:parse:monthly.md` | 2 | 0.485 | 0.485 | 0.485 |
| `agents:parse:niche-dir.md` | 2 | 0.154 | 0.154 | 0.154 |
| `agents:parse:outreach.md` | 2 | 0.528 | 0.528 | 0.528 |
| `agents:parse:quick.md` | 2 | 0.518 | 0.518 | 0.518 |
| `agents:parse:sales.md` | 1 | 0.536 | 0.536 | 0.536 |
| `agents:parse:schema.md` | 2 | 0.431 | 0.431 | 0.431 |
| `agents:parse:social.md` | 3 | 0.531 | 0.779 | 0.779 |
| `agents:parse:support.md` | 1 | 0.309 | 0.309 | 0.309 |
| `agents:parse:upsell.md` | 1 | 0.169 | 0.169 | 0.169 |
| `agents:parse:welcome.md` | 1 | 0.119 | 0.119 | 0.119 |
| `agents:parse:designer.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:ehc-officer.md` | 1 | 0.202 | 0.202 | 0.202 |
| `agents:parse:eth-dev.md` | 1 | 0.847 | 0.847 | 0.847 |
| `agents:parse:founder.md` | 1 | 1.03 | 1.03 | 1.03 |
| `agents:parse:guard.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:harvester.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:ads.md` | 1 | 0.327 | 0.327 | 0.327 |
| `agents:parse:creative.md` | 1 | 0.620 | 0.620 | 0.620 |
| `agents:parse:director.md` | 1 | 0.159 | 0.159 | 0.159 |
| `agents:parse:media-buyer.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:seo.md` | 1 | 0.193 | 0.193 | 0.193 |
| `agents:parse:nanoclaw.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:ops.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:researcher.md` | 1 | 0.146 | 0.146 | 0.146 |
| `agents:parse:router.md` | 1 | 0.148 | 0.148 | 0.148 |
| `agents:parse:scout.md` | 1 | 0.120 | 0.120 | 0.120 |
| `agents:parse:teacher.md` | 1 | 0.334 | 0.334 | 0.334 |
| `agents:parse:testnet-buyer.md` | 1 | 0.157 | 0.157 | 0.157 |
| `agents:parse:trader.md` | 1 | 0.325 | 0.325 | 0.325 |
| `agents:parse:tutor.md` | 1 | 0.377 | 0.377 | 0.377 |
| `agents:parse:writer.md` | 1 | 0.140 | 0.140 | 0.140 |
| `signalSender:mark` | 1 | 0.052 | 0.052 | 0.052 |
| `edge:cache:hit:sync-path` | 1 | 8.86e-5 | 8.86e-5 | 8.86e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1255/1264 tests · 23048ms across 96 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6118ms |
| `llm-router.test.ts` | 12 | 3728ms |
| `system-speed.test.ts` | 15 | 1755ms |
| `adl-evolution.test.ts` | 7 | 1740ms |
| `sui-speed.test.ts` | 7 | 1127ms |
| `sui.test.ts` | 6 | 1062ms |
| `adl-llm.test.ts` | 5 | 676ms |
| `learning-acceleration.test.ts` | 20 | 673ms |
| `adl-cache.test.ts` | 38 | 536ms |
| `api-endpoints.test.ts` | 21 | 410ms |

---

_Report generated 2026-04-17T02:54:01.883Z._
