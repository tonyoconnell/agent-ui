# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T10:10:43.035Z |
| Test run at | 2026-04-15T10:10:23.407Z |
| Benchmarks measured | 88 named ops, 101 samples |
| Budget coverage | 45 / 45 operations |
| Verdict | **41 pass** · **4 over** · 0 missing |
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
| `routing:select:100` | 0.005ms | 0.080 | 0.080 | 0.080 | 1 | ✗ over | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.638 | 0.638 | 0.638 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.055 | 0.055 | 0.055 | 1 | ◐ pass (within 3× scale) | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.026 | 0.026 | 0.026 | 1 | ✗ over |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.001 | 0.001 | 0.001 | 1 | ◐ pass (within 3× scale) | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.25e-4 | 2.25e-4 | 2.25e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 1.04e-4 | 1.04e-4 | 1.04e-4 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.250 | 0.250 | 0.250 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.067 | 0.067 | 0.067 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 3.87e-4 | 3.87e-4 | 3.87e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.020 | 0.020 | 0.020 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.047 | 0.047 | 0.047 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 27.34 | 27.34 | 27.34 | 1 | ✗ over |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 21.67 | 21.67 | 21.67 | 1 | ✗ over | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 5.76e-4 | 5.76e-4 | 5.76e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.292 | 0.292 | 0.292 | 1 | ◐ pass (within 3× scale) |  |
| `sui:sign` | 5.00ms | 4.22 | 4.22 | 4.22 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.034 | 0.034 | 0.034 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 25.98 | 25.98 | 25.98 | 1 | ◐ pass (within 3× scale) | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 6.92e-4 | 6.92e-4 | 6.92e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.028 | 0.028 | 0.028 | 1 | ◐ pass (within 3× scale) | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 20.26 | 20.26 | 20.26 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 7.57e-4 | 7.57e-4 | 7.57e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.96e-4 | 1.96e-4 | 1.96e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 2.06e-4 | 2.06e-4 | 2.06e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 6.62 | 6.62 | 6.62 | 1 | ◐ pass (within 3× scale) |  |
| `loop:L4:economic` | 10.00ms | 0.040 | 0.040 | 0.040 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.885 | 0.885 | 0.885 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.346 | 0.346 | 0.346 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 18.60 | 18.60 | 18.60 |
| `naming:scan-src` | 1 | 459 | 459 | 459 |
| `agents:parse:analyst.md` | 2 | 29.09 | 29.09 | 29.09 |
| `agents:parse:asi-builder.md` | 1 | 0.655 | 0.655 | 0.655 |
| `agents:parse:coder.md` | 1 | 0.644 | 0.644 | 0.644 |
| `agents:parse:community.md` | 1 | 0.791 | 0.791 | 0.791 |
| `agents:parse:concierge.md` | 1 | 0.474 | 0.474 | 0.474 |
| `agents:parse:classify.md` | 1 | 0.306 | 0.306 | 0.306 |
| `agents:parse:valence.md` | 1 | 0.297 | 0.297 | 0.297 |
| `agents:parse:ai-ranking.md` | 2 | 1.78 | 1.78 | 1.78 |
| `agents:parse:citation.md` | 2 | 1.41 | 1.41 | 1.41 |
| `agents:parse:cmo.md` | 2 | 1.74 | 1.74 | 1.74 |
| `agents:parse:forum.md` | 2 | 1.49 | 1.49 | 1.49 |
| `agents:parse:full.md` | 2 | 12.97 | 12.97 | 12.97 |
| `agents:parse:monthly.md` | 2 | 1.17 | 1.17 | 1.17 |
| `agents:parse:niche-dir.md` | 2 | 1.78 | 1.78 | 1.78 |
| `agents:parse:outreach.md` | 2 | 1.42 | 1.42 | 1.42 |
| `agents:parse:quick.md` | 2 | 1.75 | 1.75 | 1.75 |
| `agents:parse:schema.md` | 2 | 1.83 | 1.83 | 1.83 |
| `agents:parse:social.md` | 3 | 0.688 | 1.46 | 1.46 |
| `agents:parse:designer.md` | 1 | 1.26 | 1.26 | 1.26 |
| `agents:parse:ehc-officer.md` | 1 | 0.486 | 0.486 | 0.486 |
| `agents:parse:eth-dev.md` | 1 | 19.53 | 19.53 | 19.53 |
| `agents:parse:founder.md` | 1 | 5.07 | 5.07 | 5.07 |
| `agents:parse:guard.md` | 1 | 0.328 | 0.328 | 0.328 |
| `agents:parse:harvester.md` | 1 | 0.265 | 0.265 | 0.265 |
| `agents:parse:ads.md` | 1 | 1.06 | 1.06 | 1.06 |
| `agents:parse:content.md` | 1 | 2.54 | 2.54 | 2.54 |
| `agents:parse:creative.md` | 1 | 0.779 | 0.779 | 0.779 |
| `agents:parse:director.md` | 1 | 1.18 | 1.18 | 1.18 |
| `agents:parse:media-buyer.md` | 1 | 2.10 | 2.10 | 2.10 |
| `agents:parse:seo.md` | 1 | 0.257 | 0.257 | 0.257 |
| `agents:parse:nanoclaw.md` | 1 | 0.785 | 0.785 | 0.785 |
| `agents:parse:ops.md` | 1 | 0.271 | 0.271 | 0.271 |
| `agents:parse:researcher.md` | 1 | 0.545 | 0.545 | 0.545 |
| `agents:parse:router.md` | 1 | 0.322 | 0.322 | 0.322 |
| `agents:parse:scout.md` | 1 | 0.553 | 0.553 | 0.553 |
| `agents:parse:teacher.md` | 1 | 0.926 | 0.926 | 0.926 |
| `agents:parse:trader.md` | 1 | 0.869 | 0.869 | 0.869 |
| `agents:parse:tutor.md` | 1 | 0.435 | 0.435 | 0.435 |
| `agents:parse:writer.md` | 1 | 3.10 | 3.10 | 3.10 |
| `signalSender:mark` | 1 | 0.224 | 0.224 | 0.224 |
| `edge:cache:hit:sync-path` | 1 | 6.59e-5 | 6.59e-5 | 6.59e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 687/690 tests · 42780ms across 52 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `system-speed.test.ts` | 15 | 11041ms |
| `llm.test.ts` | 14 | 6801ms |
| `sui-speed.test.ts` | 7 | 5035ms |
| `llm-router.test.ts` | 12 | 4331ms |
| `sui.test.ts` | 6 | 4256ms |
| `api-key.test.ts` | 13 | 1653ms |
| `agents.test.ts` | 5 | 1574ms |
| `page-speed.test.ts` | 4 | 1114ms |
| `lifecycle-speed.test.ts` | 7 | 1054ms |
| `naming.test.ts` | 2 | 863ms |

---

_Report generated 2026-04-15T10:10:43.044Z._
