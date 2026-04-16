# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-16T01:35:03.858Z |
| Test run at | 2026-04-16T01:34:56.980Z |
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
| `routing:select:100` | 0.005ms | 0.008 | 0.008 | 0.008 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.086 | 0.086 | 0.086 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.73e-4 | 3.73e-4 | 3.73e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.56e-4 | 1.56e-4 | 1.56e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.73e-5 | 4.73e-5 | 4.73e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.176 | 0.176 | 0.176 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 8.38e-4 | 8.38e-4 | 8.38e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.39e-4 | 1.39e-4 | 1.39e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 8.55e-4 | 8.55e-4 | 8.55e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.25 | 2.25 | 2.25 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.78e-4 | 2.78e-4 | 2.78e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.76 | 2.76 | 2.76 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.59e-4 | 1.59e-4 | 1.59e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.029 | 0.029 | 0.029 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.456 | 0.456 | 0.456 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.67 | 5.67 | 5.67 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 5.78e-4 | 5.78e-4 | 5.78e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.10e-4 | 2.10e-4 | 2.10e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.74 | 2.74 | 2.74 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.18e-4 | 4.18e-4 | 4.18e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 8.33e-4 | 8.33e-4 | 8.33e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.62e-4 | 2.62e-4 | 2.62e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.03e-4 | 1.03e-4 | 1.03e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 8.28e-5 | 8.28e-5 | 8.28e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.210 | 0.210 | 0.210 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.37e-5 | 4.37e-5 | 4.37e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.106 | 0.106 | 0.106 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.111 | 0.111 | 0.111 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.26 | 2.26 | 2.26 |
| `naming:scan-src` | 1 | 62.88 | 62.88 | 62.88 |
| `agents:parse:analyst.md` | 2 | 0.509 | 0.509 | 0.509 |
| `agents:parse:asi-builder.md` | 1 | 0.310 | 0.310 | 0.310 |
| `agents:parse:coder.md` | 1 | 0.246 | 0.246 | 0.246 |
| `agents:parse:community.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:concierge.md` | 1 | 0.168 | 0.168 | 0.168 |
| `agents:parse:classify.md` | 1 | 0.088 | 0.088 | 0.088 |
| `agents:parse:valence.md` | 1 | 0.084 | 0.084 | 0.084 |
| `agents:parse:ai-ranking.md` | 2 | 0.343 | 0.343 | 0.343 |
| `agents:parse:citation.md` | 2 | 0.226 | 0.226 | 0.226 |
| `agents:parse:cmo.md` | 2 | 0.371 | 0.371 | 0.371 |
| `agents:parse:forum.md` | 2 | 0.283 | 0.283 | 0.283 |
| `agents:parse:full.md` | 2 | 0.201 | 0.201 | 0.201 |
| `agents:parse:monthly.md` | 2 | 0.475 | 0.475 | 0.475 |
| `agents:parse:niche-dir.md` | 2 | 0.198 | 0.198 | 0.198 |
| `agents:parse:outreach.md` | 2 | 0.162 | 0.162 | 0.162 |
| `agents:parse:quick.md` | 2 | 0.457 | 0.457 | 0.457 |
| `agents:parse:schema.md` | 2 | 0.160 | 0.160 | 0.160 |
| `agents:parse:social.md` | 3 | 0.157 | 0.201 | 0.201 |
| `agents:parse:designer.md` | 1 | 0.213 | 0.213 | 0.213 |
| `agents:parse:ehc-officer.md` | 1 | 0.247 | 0.247 | 0.247 |
| `agents:parse:eth-dev.md` | 1 | 0.477 | 0.477 | 0.477 |
| `agents:parse:founder.md` | 1 | 0.316 | 0.316 | 0.316 |
| `agents:parse:guard.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:harvester.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:ads.md` | 1 | 0.431 | 0.431 | 0.431 |
| `agents:parse:content.md` | 1 | 0.274 | 0.274 | 0.274 |
| `agents:parse:creative.md` | 1 | 0.670 | 0.670 | 0.670 |
| `agents:parse:director.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:media-buyer.md` | 1 | 0.510 | 0.510 | 0.510 |
| `agents:parse:seo.md` | 1 | 0.324 | 0.324 | 0.324 |
| `agents:parse:nanoclaw.md` | 1 | 0.210 | 0.210 | 0.210 |
| `agents:parse:ops.md` | 1 | 0.295 | 0.295 | 0.295 |
| `agents:parse:researcher.md` | 1 | 0.153 | 0.153 | 0.153 |
| `agents:parse:router.md` | 1 | 0.156 | 0.156 | 0.156 |
| `agents:parse:scout.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:teacher.md` | 1 | 0.554 | 0.554 | 0.554 |
| `agents:parse:trader.md` | 1 | 0.222 | 0.222 | 0.222 |
| `agents:parse:tutor.md` | 1 | 0.149 | 0.149 | 0.149 |
| `agents:parse:writer.md` | 1 | 0.417 | 0.417 | 0.417 |
| `signalSender:mark` | 1 | 0.038 | 0.038 | 0.038 |
| `edge:cache:hit:sync-path` | 1 | 4.60e-5 | 4.60e-5 | 4.60e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1232/1241 tests · 19062ms across 94 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6074ms |
| `llm-router.test.ts` | 12 | 3736ms |
| `adl-evolution.test.ts` | 7 | 1440ms |
| `system-speed.test.ts` | 15 | 1134ms |
| `sui-speed.test.ts` | 7 | 680ms |
| `sui.test.ts` | 6 | 592ms |
| `adl-llm.test.ts` | 5 | 587ms |
| `learning-acceleration.test.ts` | 20 | 406ms |
| `adl-cache.test.ts` | 38 | 384ms |
| `api-endpoints.test.ts` | 21 | 294ms |

---

_Report generated 2026-04-16T01:35:03.866Z._
