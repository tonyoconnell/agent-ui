# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T09:58:21.622Z |
| Test run at | 2026-04-15T09:58:13.479Z |
| Benchmarks measured | 88 named ops, 101 samples |
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
| `routing:select:100` | 0.005ms | 0.011 | 0.011 | 0.011 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.131 | 0.131 | 0.131 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.010 | 0.010 | 0.010 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.40e-4 | 3.40e-4 | 3.40e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.64e-4 | 1.64e-4 | 1.64e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.24e-5 | 5.24e-5 | 5.24e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.202 | 0.202 | 0.202 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.37e-4 | 1.37e-4 | 1.37e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 5.82 | 5.82 | 5.82 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 4.28e-4 | 4.28e-4 | 4.28e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 5.68 | 5.68 | 5.68 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.73e-4 | 1.73e-4 | 1.73e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.010 | 0.010 | 0.010 | 1 | ◐ pass (within 3× scale) |  |
| `sui:tx:build:movecall` | 0.100ms | 0.042 | 0.042 | 0.042 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.663 | 0.663 | 0.663 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 7.47 | 7.47 | 7.47 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.23e-4 | 3.23e-4 | 3.23e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 5.19e-4 | 5.19e-4 | 5.19e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.90 | 3.90 | 3.90 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.59e-4 | 4.59e-4 | 4.59e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 8.65e-4 | 8.65e-4 | 8.65e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 4.16e-4 | 4.16e-4 | 4.16e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 6.80e-4 | 6.80e-4 | 6.80e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.19e-4 | 1.19e-4 | 1.19e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.473 | 0.473 | 0.473 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.025 | 0.025 | 0.025 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.93e-5 | 4.93e-5 | 4.93e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.158 | 0.158 | 0.158 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.119 | 0.119 | 0.119 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 4.68 | 4.68 | 4.68 |
| `agents:parse:analyst.md` | 2 | 1.25 | 1.25 | 1.25 |
| `agents:parse:asi-builder.md` | 1 | 0.298 | 0.298 | 0.298 |
| `agents:parse:coder.md` | 1 | 0.212 | 0.212 | 0.212 |
| `agents:parse:community.md` | 1 | 0.711 | 0.711 | 0.711 |
| `agents:parse:concierge.md` | 1 | 0.323 | 0.323 | 0.323 |
| `agents:parse:classify.md` | 1 | 0.095 | 0.095 | 0.095 |
| `agents:parse:valence.md` | 1 | 0.510 | 0.510 | 0.510 |
| `agents:parse:ai-ranking.md` | 2 | 0.775 | 0.775 | 0.775 |
| `agents:parse:citation.md` | 2 | 0.284 | 0.284 | 0.284 |
| `agents:parse:cmo.md` | 2 | 0.453 | 0.453 | 0.453 |
| `agents:parse:forum.md` | 2 | 0.391 | 0.391 | 0.391 |
| `agents:parse:full.md` | 2 | 0.648 | 0.648 | 0.648 |
| `agents:parse:monthly.md` | 2 | 0.269 | 0.269 | 0.269 |
| `agents:parse:niche-dir.md` | 2 | 0.630 | 0.630 | 0.630 |
| `agents:parse:outreach.md` | 2 | 0.435 | 0.435 | 0.435 |
| `agents:parse:quick.md` | 2 | 0.335 | 0.335 | 0.335 |
| `agents:parse:schema.md` | 2 | 0.370 | 0.370 | 0.370 |
| `agents:parse:social.md` | 3 | 0.210 | 1.72 | 1.72 |
| `agents:parse:designer.md` | 1 | 0.586 | 0.586 | 0.586 |
| `agents:parse:ehc-officer.md` | 1 | 0.848 | 0.848 | 0.848 |
| `agents:parse:eth-dev.md` | 1 | 0.418 | 0.418 | 0.418 |
| `agents:parse:founder.md` | 1 | 0.877 | 0.877 | 0.877 |
| `agents:parse:guard.md` | 1 | 1.17 | 1.17 | 1.17 |
| `agents:parse:harvester.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:ads.md` | 1 | 0.200 | 0.200 | 0.200 |
| `agents:parse:content.md` | 1 | 1.01 | 1.01 | 1.01 |
| `agents:parse:creative.md` | 1 | 0.251 | 0.251 | 0.251 |
| `agents:parse:director.md` | 1 | 0.374 | 0.374 | 0.374 |
| `agents:parse:media-buyer.md` | 1 | 0.651 | 0.651 | 0.651 |
| `agents:parse:seo.md` | 1 | 0.325 | 0.325 | 0.325 |
| `agents:parse:nanoclaw.md` | 1 | 0.884 | 0.884 | 0.884 |
| `agents:parse:ops.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:researcher.md` | 1 | 0.148 | 0.148 | 0.148 |
| `agents:parse:router.md` | 1 | 0.480 | 0.480 | 0.480 |
| `agents:parse:scout.md` | 1 | 0.421 | 0.421 | 0.421 |
| `agents:parse:teacher.md` | 1 | 0.599 | 0.599 | 0.599 |
| `agents:parse:trader.md` | 1 | 0.274 | 0.274 | 0.274 |
| `agents:parse:tutor.md` | 1 | 0.179 | 0.179 | 0.179 |
| `agents:parse:writer.md` | 1 | 0.320 | 0.320 | 0.320 |
| `naming:scan-src` | 1 | 119 | 119 | 119 |
| `signalSender:mark` | 1 | 0.030 | 0.030 | 0.030 |
| `edge:cache:hit:sync-path` | 1 | 4.66e-5 | 4.66e-5 | 4.66e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 681/681 tests · 17741ms across 51 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6176ms |
| `llm-router.test.ts` | 12 | 4128ms |
| `system-speed.test.ts` | 15 | 2178ms |
| `sui-speed.test.ts` | 7 | 1270ms |
| `sui.test.ts` | 6 | 1177ms |
| `api-key.test.ts` | 13 | 355ms |
| `lifecycle-speed.test.ts` | 7 | 284ms |
| `agents.test.ts` | 5 | 283ms |
| `routing.test.ts` | 54 | 263ms |
| `context.test.ts` | 29 | 232ms |

---

_Report generated 2026-04-15T09:58:21.634Z._
