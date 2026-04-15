# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T19:46:36.078Z |
| Test run at | 2026-04-15T19:46:28.669Z |
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
| `routing:select:1000` | 1.00ms | 0.096 | 0.096 | 0.096 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 4.88e-4 | 4.88e-4 | 4.88e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.59e-4 | 1.59e-4 | 1.59e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.61e-5 | 4.61e-5 | 4.61e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.157 | 0.157 | 0.157 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.86e-4 | 9.86e-4 | 9.86e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.38e-4 | 1.38e-4 | 1.38e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 8.22e-4 | 8.22e-4 | 8.22e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.026 | 0.026 | 0.026 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.85 | 2.85 | 2.85 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 7.20e-4 | 7.20e-4 | 7.20e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.90 | 2.90 | 2.90 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.60e-4 | 1.60e-4 | 1.60e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.027 | 0.027 | 0.027 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.520 | 0.520 | 0.520 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.46 | 5.46 | 5.46 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 6.77e-4 | 6.77e-4 | 6.77e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.11e-4 | 2.11e-4 | 2.11e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.81 | 3.81 | 3.81 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.14e-4 | 4.14e-4 | 4.14e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.77e-4 | 2.77e-4 | 2.77e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 3.29e-4 | 3.29e-4 | 3.29e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 2.12e-4 | 2.12e-4 | 2.12e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.210 | 0.210 | 0.210 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.035 | 0.035 | 0.035 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.34e-5 | 4.34e-5 | 4.34e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.097 | 0.097 | 0.097 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.113 | 0.113 | 0.113 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.51 | 2.51 | 2.51 |
| `agents:parse:analyst.md` | 2 | 0.633 | 0.633 | 0.633 |
| `agents:parse:asi-builder.md` | 1 | 0.316 | 0.316 | 0.316 |
| `agents:parse:coder.md` | 1 | 0.202 | 0.202 | 0.202 |
| `agents:parse:community.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:concierge.md` | 1 | 0.287 | 0.287 | 0.287 |
| `agents:parse:classify.md` | 1 | 0.097 | 0.097 | 0.097 |
| `agents:parse:valence.md` | 1 | 0.087 | 0.087 | 0.087 |
| `agents:parse:ai-ranking.md` | 2 | 0.747 | 0.747 | 0.747 |
| `agents:parse:citation.md` | 2 | 0.218 | 0.218 | 0.218 |
| `agents:parse:cmo.md` | 2 | 0.424 | 0.424 | 0.424 |
| `agents:parse:forum.md` | 2 | 0.193 | 0.193 | 0.193 |
| `agents:parse:full.md` | 2 | 0.684 | 0.684 | 0.684 |
| `agents:parse:monthly.md` | 2 | 0.562 | 0.562 | 0.562 |
| `agents:parse:niche-dir.md` | 2 | 0.284 | 0.284 | 0.284 |
| `agents:parse:outreach.md` | 2 | 0.376 | 0.376 | 0.376 |
| `agents:parse:quick.md` | 2 | 0.254 | 0.254 | 0.254 |
| `agents:parse:schema.md` | 2 | 0.240 | 0.240 | 0.240 |
| `agents:parse:social.md` | 3 | 0.232 | 0.596 | 0.596 |
| `agents:parse:designer.md` | 1 | 0.368 | 0.368 | 0.368 |
| `agents:parse:ehc-officer.md` | 1 | 0.525 | 0.525 | 0.525 |
| `agents:parse:eth-dev.md` | 1 | 0.252 | 0.252 | 0.252 |
| `agents:parse:founder.md` | 1 | 0.503 | 0.503 | 0.503 |
| `agents:parse:guard.md` | 1 | 0.132 | 0.132 | 0.132 |
| `agents:parse:harvester.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:ads.md` | 1 | 0.200 | 0.200 | 0.200 |
| `agents:parse:content.md` | 1 | 0.322 | 0.322 | 0.322 |
| `agents:parse:creative.md` | 1 | 0.243 | 0.243 | 0.243 |
| `agents:parse:director.md` | 1 | 0.234 | 0.234 | 0.234 |
| `agents:parse:media-buyer.md` | 1 | 0.182 | 0.182 | 0.182 |
| `agents:parse:seo.md` | 1 | 0.406 | 0.406 | 0.406 |
| `agents:parse:nanoclaw.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:ops.md` | 1 | 0.315 | 0.315 | 0.315 |
| `agents:parse:researcher.md` | 1 | 0.374 | 0.374 | 0.374 |
| `agents:parse:router.md` | 1 | 0.357 | 0.357 | 0.357 |
| `agents:parse:scout.md` | 1 | 0.125 | 0.125 | 0.125 |
| `agents:parse:teacher.md` | 1 | 0.682 | 0.682 | 0.682 |
| `agents:parse:trader.md` | 1 | 0.488 | 0.488 | 0.488 |
| `agents:parse:tutor.md` | 1 | 0.144 | 0.144 | 0.144 |
| `agents:parse:writer.md` | 1 | 0.138 | 0.138 | 0.138 |
| `naming:scan-src` | 1 | 126 | 126 | 126 |
| `signalSender:mark` | 1 | 0.039 | 0.039 | 0.039 |
| `edge:cache:hit:sync-path` | 1 | 4.12e-5 | 4.12e-5 | 4.12e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 962/971 tests · 18420ms across 81 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6095ms |
| `llm-router.test.ts` | 12 | 4032ms |
| `adl-evolution.test.ts` | 7 | 1395ms |
| `system-speed.test.ts` | 15 | 1301ms |
| `sui-speed.test.ts` | 7 | 754ms |
| `sui.test.ts` | 6 | 713ms |
| `adl-llm.test.ts` | 5 | 649ms |
| `adl-cache.test.ts` | 38 | 403ms |
| `api-key.test.ts` | 13 | 305ms |
| `adl-api.test.ts` | 5 | 270ms |

---

_Report generated 2026-04-15T19:46:36.089Z._
