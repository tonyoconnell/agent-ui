# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-17T23:29:49.635Z |
| Test run at | 2026-04-17T23:29:34.209Z |
| Benchmarks measured | 13 named ops, 13 samples |
| Budget coverage | 12 / 45 operations |
| Verdict | **12 pass** · **0 over** · 33 missing |
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
| `routing:select:100` | 0.005ms | — | — | — | 0 | _no data_ | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | — | — | — | 0 | _no data_ | search API + rank |
| `routing:follow` | 0.050ms | — | — | — | 0 | _no data_ | keyword search |
| `routing:follow:batch-10k` | 0.005ms | — | — | — | 0 | _no data_ |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | — | — | — | 0 | _no data_ | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | — | — | — | 0 | _no data_ |  |
| `pheromone:sense` | 0.001ms | — | — | — | 0 | _no data_ |  |
| `pheromone:fade:1000` | 5.00ms | — | — | — | 0 | _no data_ |  |
| `pheromone:highways:top10` | 5.00ms | — | — | — | 0 | _no data_ |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | — | — | — | 0 | _no data_ | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `signal:queue:roundtrip` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `signal:ask:chain-3` | 100ms | — | — | — | 0 | _no data_ | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | — | — | — | 0 | _no data_ |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | — | — | — | 0 | _no data_ | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | — | — | — | 0 | _no data_ | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | — | — | — | 0 | _no data_ |  |
| `sui:tx:build` | 0.010ms | — | — | — | 0 | _no data_ |  |
| `sui:tx:build:movecall` | 0.100ms | — | — | — | 0 | _no data_ |  |
| `sui:sign` | 5.00ms | — | — | — | 0 | _no data_ |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | — | — | — | 0 | _no data_ | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | — | — | — | 0 | _no data_ |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | — | — | — | 0 | _no data_ | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | — | — | — | 0 | _no data_ |  |
| `lifecycle:discover` | 1.00ms | — | — | — | 0 | _no data_ | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | — | — | — | 0 | _no data_ |  |
| `lifecycle:highway:select` | 0.010ms | — | — | — | 0 | _no data_ | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `lifecycle:e2e` | 50.00ms | — | — | — | 0 | _no data_ |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.078 | 0.078 | 0.078 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 6.82e-4 | 6.82e-4 | 6.82e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 3.17e-4 | 3.17e-4 | 3.17e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 1.77 | 1.77 | 1.77 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.050 | 0.050 | 0.050 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.103 | 0.103 | 0.103 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.044 | 0.044 | 0.044 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | — | — | — | 0 | _no data_ | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | — | — | — | 0 | _no data_ |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `typedb:read:boot` | 10.00ms | — | — | — | 0 | _no data_ |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `edge:cache:hit:sync-path` | 1 | 1.01e-4 | 1.01e-4 | 1.01e-4 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1393/1406 tests · 46295ms across 102 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6489ms |
| `adl-evolution.test.ts` | 7 | 5914ms |
| `system-speed.test.ts` | 15 | 5222ms |
| `llm-router.test.ts` | 12 | 4053ms |
| `sui-speed.test.ts` | 7 | 3887ms |
| `sui.test.ts` | 6 | 3288ms |
| `learning-acceleration.test.ts` | 20 | 2721ms |
| `api-endpoints.test.ts` | 21 | 1430ms |
| `adl-cache.test.ts` | 38 | 1419ms |
| `adl-llm.test.ts` | 5 | 1326ms |

---

_Report generated 2026-04-17T23:29:49.641Z._
