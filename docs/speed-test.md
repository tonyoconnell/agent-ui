# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T14:44:59.196Z |
| Test run at | 2026-04-18T14:44:58.036Z |
| Benchmarks measured | 0 named ops, 0 samples |
| Budget coverage | 0 / 45 operations |
| Verdict | **0 pass** · **0 over** · 45 missing |
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
| `intent:resolve:label` | 0.050ms | — | — | — | 0 | _no data_ | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | — | — | — | 0 | _no data_ |  |
| `intent:resolve:miss` | 0.050ms | — | — | — | 0 | _no data_ |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | — | — | — | 0 | _no data_ | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | — | — | — | 0 | _no data_ |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | — | — | — | 0 | _no data_ |  |
| `channels:web:message` | 0.010ms | — | — | — | 0 | _no data_ |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | — | — | — | 0 | _no data_ |  |
| `loop:L4:economic` | 10.00ms | — | — | — | 0 | _no data_ |  |
| `loop:L5:evolution:detect` | 5.00ms | — | — | — | 0 | _no data_ |  |
| `loop:L6:know:scan` | 1.00ms | — | — | — | 0 | _no data_ |  |
| `loop:L7:frontier:scan` | 5.00ms | — | — | — | 0 | _no data_ |  |

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


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 24/33 tests · 293ms across 2 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `chat-chairman-integration.test.ts` | 6 | 220ms |
| `chairman-chain.test.ts` | 27 | 73.15ms |

---

_Report generated 2026-04-18T14:44:59.197Z._
