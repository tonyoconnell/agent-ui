# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T21:33:33.654Z |
| Test run at | 2026-04-15T21:33:26.769Z |
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
| `routing:select:100` | 0.005ms | 0.010 | 0.010 | 0.010 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.145 | 0.145 | 0.145 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 7.61e-4 | 7.61e-4 | 7.61e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.74e-4 | 2.74e-4 | 2.74e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 1.09e-4 | 1.09e-4 | 1.09e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.347 | 0.347 | 0.347 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.55e-4 | 9.55e-4 | 9.55e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.34e-4 | 1.34e-4 | 1.34e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.045 | 0.045 | 0.045 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.92 | 2.92 | 2.92 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.97e-4 | 3.97e-4 | 3.97e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.77 | 2.77 | 2.77 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 2.82e-4 | 2.82e-4 | 2.82e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.490 | 0.490 | 0.490 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 4.98 | 4.98 | 4.98 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.85e-4 | 2.85e-4 | 2.85e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.11e-4 | 2.11e-4 | 2.11e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.10 | 3.10 | 3.10 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.57e-4 | 4.57e-4 | 4.57e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 3.82e-4 | 3.82e-4 | 3.82e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.27e-4 | 2.27e-4 | 2.27e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 8.04e-5 | 8.04e-5 | 8.04e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.355 | 0.355 | 0.355 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.66e-5 | 4.66e-5 | 4.66e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.095 | 0.095 | 0.095 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.124 | 0.124 | 0.124 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.36 | 2.36 | 2.36 |
| `naming:scan-src` | 1 | 59.07 | 59.07 | 59.07 |
| `agents:parse:analyst.md` | 2 | 0.509 | 0.509 | 0.509 |
| `agents:parse:asi-builder.md` | 1 | 0.607 | 0.607 | 0.607 |
| `agents:parse:coder.md` | 1 | 0.310 | 0.310 | 0.310 |
| `agents:parse:community.md` | 1 | 0.471 | 0.471 | 0.471 |
| `agents:parse:concierge.md` | 1 | 0.729 | 0.729 | 0.729 |
| `agents:parse:classify.md` | 1 | 0.251 | 0.251 | 0.251 |
| `agents:parse:valence.md` | 1 | 0.089 | 0.089 | 0.089 |
| `agents:parse:ai-ranking.md` | 2 | 0.529 | 0.529 | 0.529 |
| `agents:parse:citation.md` | 2 | 0.199 | 0.199 | 0.199 |
| `agents:parse:cmo.md` | 2 | 0.335 | 0.335 | 0.335 |
| `agents:parse:forum.md` | 2 | 0.199 | 0.199 | 0.199 |
| `agents:parse:full.md` | 2 | 0.218 | 0.218 | 0.218 |
| `agents:parse:monthly.md` | 2 | 0.484 | 0.484 | 0.484 |
| `agents:parse:niche-dir.md` | 2 | 0.415 | 0.415 | 0.415 |
| `agents:parse:outreach.md` | 2 | 0.523 | 0.523 | 0.523 |
| `agents:parse:quick.md` | 2 | 0.256 | 0.256 | 0.256 |
| `agents:parse:schema.md` | 2 | 0.553 | 0.553 | 0.553 |
| `agents:parse:social.md` | 3 | 0.621 | 1.13 | 1.13 |
| `agents:parse:designer.md` | 1 | 0.412 | 0.412 | 0.412 |
| `agents:parse:ehc-officer.md` | 1 | 0.264 | 0.264 | 0.264 |
| `agents:parse:eth-dev.md` | 1 | 0.256 | 0.256 | 0.256 |
| `agents:parse:founder.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:guard.md` | 1 | 0.522 | 0.522 | 0.522 |
| `agents:parse:harvester.md` | 1 | 0.148 | 0.148 | 0.148 |
| `agents:parse:ads.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:content.md` | 1 | 0.478 | 0.478 | 0.478 |
| `agents:parse:creative.md` | 1 | 0.215 | 0.215 | 0.215 |
| `agents:parse:director.md` | 1 | 0.448 | 0.448 | 0.448 |
| `agents:parse:media-buyer.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:seo.md` | 1 | 0.448 | 0.448 | 0.448 |
| `agents:parse:nanoclaw.md` | 1 | 0.583 | 0.583 | 0.583 |
| `agents:parse:ops.md` | 1 | 1.01 | 1.01 | 1.01 |
| `agents:parse:researcher.md` | 1 | 0.327 | 0.327 | 0.327 |
| `agents:parse:router.md` | 1 | 0.344 | 0.344 | 0.344 |
| `agents:parse:scout.md` | 1 | 0.378 | 0.378 | 0.378 |
| `agents:parse:teacher.md` | 1 | 0.532 | 0.532 | 0.532 |
| `agents:parse:trader.md` | 1 | 0.348 | 0.348 | 0.348 |
| `agents:parse:tutor.md` | 1 | 0.157 | 0.157 | 0.157 |
| `agents:parse:writer.md` | 1 | 0.301 | 0.301 | 0.301 |
| `signalSender:mark` | 1 | 0.075 | 0.075 | 0.075 |
| `edge:cache:hit:sync-path` | 1 | 1.17e-4 | 1.17e-4 | 1.17e-4 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1232/1241 tests · 20314ms across 94 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6087ms |
| `llm-router.test.ts` | 12 | 3944ms |
| `system-speed.test.ts` | 15 | 1630ms |
| `adl-evolution.test.ts` | 7 | 1421ms |
| `sui-speed.test.ts` | 7 | 675ms |
| `sui.test.ts` | 6 | 623ms |
| `adl-llm.test.ts` | 5 | 621ms |
| `api-endpoints.test.ts` | 21 | 559ms |
| `adl-cache.test.ts` | 38 | 544ms |
| `learning-acceleration.test.ts` | 20 | 512ms |

---

_Report generated 2026-04-15T21:33:33.662Z._
