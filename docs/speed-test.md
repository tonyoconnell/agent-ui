# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-16T05:18:32.160Z |
| Test run at | 2026-04-16T05:18:25.150Z |
| Benchmarks measured | 89 named ops, 102 samples |
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
| `routing:select:1000` | 1.00ms | 0.110 | 0.110 | 0.110 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.59e-4 | 3.59e-4 | 3.59e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.55e-4 | 1.55e-4 | 1.55e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.94e-5 | 4.94e-5 | 4.94e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.161 | 0.161 | 0.161 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.17e-4 | 9.17e-4 | 9.17e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 9.22e-4 | 9.22e-4 | 9.22e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.42e-4 | 1.42e-4 | 1.42e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.020 | 0.020 | 0.020 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.31 | 2.31 | 2.31 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.74e-4 | 2.74e-4 | 2.74e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.61 | 3.61 | 3.61 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.43e-4 | 1.43e-4 | 1.43e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.029 | 0.029 | 0.029 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.510 | 0.510 | 0.510 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.059 | 0.059 | 0.059 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 4.95 | 4.95 | 4.95 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.61e-4 | 3.61e-4 | 3.61e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.44e-4 | 2.44e-4 | 2.44e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 4.02 | 4.02 | 4.02 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 5.04e-4 | 5.04e-4 | 5.04e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.79e-4 | 2.79e-4 | 2.79e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.72e-4 | 1.72e-4 | 1.72e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 9.78e-5 | 9.78e-5 | 9.78e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.562 | 0.562 | 0.562 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 2.45e-4 | 2.45e-4 | 2.45e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.114 | 0.114 | 0.114 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.122 | 0.122 | 0.122 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.86 | 2.86 | 2.86 |
| `naming:scan-src` | 1 | 45.15 | 45.15 | 45.15 |
| `agents:parse:analyst.md` | 2 | 0.237 | 0.237 | 0.237 |
| `agents:parse:asi-builder.md` | 1 | 0.737 | 0.737 | 0.737 |
| `agents:parse:coder.md` | 1 | 0.237 | 0.237 | 0.237 |
| `agents:parse:community.md` | 1 | 0.235 | 0.235 | 0.235 |
| `agents:parse:concierge.md` | 1 | 0.175 | 0.175 | 0.175 |
| `agents:parse:classify.md` | 1 | 0.092 | 0.092 | 0.092 |
| `agents:parse:valence.md` | 1 | 0.257 | 0.257 | 0.257 |
| `agents:parse:ai-ranking.md` | 2 | 0.585 | 0.585 | 0.585 |
| `agents:parse:citation.md` | 2 | 0.294 | 0.294 | 0.294 |
| `agents:parse:cmo.md` | 2 | 0.363 | 0.363 | 0.363 |
| `agents:parse:forum.md` | 2 | 0.168 | 0.168 | 0.168 |
| `agents:parse:full.md` | 2 | 0.505 | 0.505 | 0.505 |
| `agents:parse:monthly.md` | 2 | 0.404 | 0.404 | 0.404 |
| `agents:parse:niche-dir.md` | 2 | 0.570 | 0.570 | 0.570 |
| `agents:parse:outreach.md` | 2 | 0.323 | 0.323 | 0.323 |
| `agents:parse:quick.md` | 2 | 0.240 | 0.240 | 0.240 |
| `agents:parse:schema.md` | 2 | 0.500 | 0.500 | 0.500 |
| `agents:parse:social.md` | 3 | 0.217 | 0.599 | 0.599 |
| `agents:parse:designer.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:ehc-officer.md` | 1 | 0.385 | 0.385 | 0.385 |
| `agents:parse:eth-dev.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:founder.md` | 1 | 0.218 | 0.218 | 0.218 |
| `agents:parse:guard.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:harvester.md` | 1 | 0.136 | 0.136 | 0.136 |
| `agents:parse:ads.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:content.md` | 1 | 0.207 | 0.207 | 0.207 |
| `agents:parse:creative.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:director.md` | 1 | 0.264 | 0.264 | 0.264 |
| `agents:parse:media-buyer.md` | 1 | 0.204 | 0.204 | 0.204 |
| `agents:parse:seo.md` | 1 | 0.198 | 0.198 | 0.198 |
| `agents:parse:nanoclaw.md` | 1 | 0.223 | 0.223 | 0.223 |
| `agents:parse:ops.md` | 1 | 0.209 | 0.209 | 0.209 |
| `agents:parse:researcher.md` | 1 | 0.155 | 0.155 | 0.155 |
| `agents:parse:router.md` | 1 | 0.167 | 0.167 | 0.167 |
| `agents:parse:scout.md` | 1 | 0.138 | 0.138 | 0.138 |
| `agents:parse:teacher.md` | 1 | 0.477 | 0.477 | 0.477 |
| `agents:parse:testnet-buyer.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:trader.md` | 1 | 0.191 | 0.191 | 0.191 |
| `agents:parse:tutor.md` | 1 | 0.144 | 0.144 | 0.144 |
| `agents:parse:writer.md` | 1 | 0.140 | 0.140 | 0.140 |
| `signalSender:mark` | 1 | 0.040 | 0.040 | 0.040 |
| `edge:cache:hit:sync-path` | 1 | 4.66e-5 | 4.66e-5 | 4.66e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1255/1264 tests · 19807ms across 96 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6086ms |
| `llm-router.test.ts` | 12 | 3842ms |
| `adl-evolution.test.ts` | 7 | 1505ms |
| `system-speed.test.ts` | 15 | 1286ms |
| `sui-speed.test.ts` | 7 | 781ms |
| `sui.test.ts` | 6 | 700ms |
| `learning-acceleration.test.ts` | 20 | 532ms |
| `adl-llm.test.ts` | 5 | 490ms |
| `adl-cache.test.ts` | 38 | 410ms |
| `api-key.test.ts` | 13 | 296ms |

---

_Report generated 2026-04-16T05:18:32.163Z._
