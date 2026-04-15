# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T21:20:03.097Z |
| Test run at | 2026-04-15T21:19:56.108Z |
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
| `routing:select:1000` | 1.00ms | 0.112 | 0.112 | 0.112 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.18e-4 | 3.18e-4 | 3.18e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.59e-4 | 1.59e-4 | 1.59e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 1.04e-4 | 1.04e-4 | 1.04e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.186 | 0.186 | 0.186 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.41e-4 | 1.41e-4 | 1.41e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.19 | 2.19 | 2.19 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.81e-4 | 2.81e-4 | 2.81e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.11 | 3.11 | 3.11 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.61e-4 | 1.61e-4 | 1.61e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.026 | 0.026 | 0.026 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.510 | 0.510 | 0.510 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 6.13 | 6.13 | 6.13 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.90e-4 | 2.90e-4 | 2.90e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.13e-4 | 2.13e-4 | 2.13e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.66 | 2.66 | 2.66 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 5.99e-4 | 5.99e-4 | 5.99e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 8.10e-4 | 8.10e-4 | 8.10e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 3.73e-4 | 3.73e-4 | 3.73e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 6.14e-4 | 6.14e-4 | 6.14e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.12e-4 | 1.12e-4 | 1.12e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.141 | 0.141 | 0.141 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.023 | 0.023 | 0.023 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 1.03e-4 | 1.03e-4 | 1.03e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.092 | 0.092 | 0.092 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.101 | 0.101 | 0.101 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 3.45 | 3.45 | 3.45 |
| `naming:scan-src` | 1 | 114 | 114 | 114 |
| `agents:parse:analyst.md` | 2 | 0.187 | 0.187 | 0.187 |
| `agents:parse:asi-builder.md` | 1 | 0.278 | 0.278 | 0.278 |
| `agents:parse:coder.md` | 1 | 0.415 | 0.415 | 0.415 |
| `agents:parse:community.md` | 1 | 0.223 | 0.223 | 0.223 |
| `agents:parse:concierge.md` | 1 | 0.167 | 0.167 | 0.167 |
| `agents:parse:classify.md` | 1 | 0.282 | 0.282 | 0.282 |
| `agents:parse:valence.md` | 1 | 0.086 | 0.086 | 0.086 |
| `agents:parse:ai-ranking.md` | 2 | 0.213 | 0.213 | 0.213 |
| `agents:parse:citation.md` | 2 | 0.161 | 0.161 | 0.161 |
| `agents:parse:cmo.md` | 2 | 0.250 | 0.250 | 0.250 |
| `agents:parse:forum.md` | 2 | 0.161 | 0.161 | 0.161 |
| `agents:parse:full.md` | 2 | 0.375 | 0.375 | 0.375 |
| `agents:parse:monthly.md` | 2 | 0.833 | 0.833 | 0.833 |
| `agents:parse:niche-dir.md` | 2 | 0.310 | 0.310 | 0.310 |
| `agents:parse:outreach.md` | 2 | 0.166 | 0.166 | 0.166 |
| `agents:parse:quick.md` | 2 | 0.626 | 0.626 | 0.626 |
| `agents:parse:schema.md` | 2 | 0.151 | 0.151 | 0.151 |
| `agents:parse:social.md` | 3 | 0.183 | 0.326 | 0.326 |
| `agents:parse:designer.md` | 1 | 0.206 | 0.206 | 0.206 |
| `agents:parse:ehc-officer.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:eth-dev.md` | 1 | 0.583 | 0.583 | 0.583 |
| `agents:parse:founder.md` | 1 | 0.233 | 0.233 | 0.233 |
| `agents:parse:guard.md` | 1 | 0.399 | 0.399 | 0.399 |
| `agents:parse:harvester.md` | 1 | 0.433 | 0.433 | 0.433 |
| `agents:parse:ads.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:content.md` | 1 | 0.183 | 0.183 | 0.183 |
| `agents:parse:creative.md` | 1 | 0.187 | 0.187 | 0.187 |
| `agents:parse:director.md` | 1 | 0.160 | 0.160 | 0.160 |
| `agents:parse:media-buyer.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:seo.md` | 1 | 0.187 | 0.187 | 0.187 |
| `agents:parse:nanoclaw.md` | 1 | 0.628 | 0.628 | 0.628 |
| `agents:parse:ops.md` | 1 | 0.198 | 0.198 | 0.198 |
| `agents:parse:researcher.md` | 1 | 0.146 | 0.146 | 0.146 |
| `agents:parse:router.md` | 1 | 0.150 | 0.150 | 0.150 |
| `agents:parse:scout.md` | 1 | 0.127 | 0.127 | 0.127 |
| `agents:parse:teacher.md` | 1 | 0.323 | 0.323 | 0.323 |
| `agents:parse:trader.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:tutor.md` | 1 | 0.144 | 0.144 | 0.144 |
| `agents:parse:writer.md` | 1 | 0.140 | 0.140 | 0.140 |
| `signalSender:mark` | 1 | 0.047 | 0.047 | 0.047 |
| `edge:cache:hit:sync-path` | 1 | 4.31e-5 | 4.31e-5 | 4.31e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1232/1241 tests · 20163ms across 94 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6157ms |
| `llm-router.test.ts` | 12 | 4023ms |
| `adl-evolution.test.ts` | 7 | 1634ms |
| `system-speed.test.ts` | 15 | 1256ms |
| `sui-speed.test.ts` | 7 | 770ms |
| `adl-llm.test.ts` | 5 | 644ms |
| `sui.test.ts` | 6 | 607ms |
| `learning-acceleration.test.ts` | 20 | 604ms |
| `adl-cache.test.ts` | 38 | 453ms |
| `api-endpoints.test.ts` | 21 | 275ms |

---

_Report generated 2026-04-15T21:20:03.101Z._
