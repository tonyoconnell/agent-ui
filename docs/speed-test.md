# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T13:27:18.875Z |
| Test run at | 2026-04-15T13:27:12.059Z |
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
| `routing:select:1000` | 1.00ms | 0.092 | 0.092 | 0.092 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.36e-4 | 6.36e-4 | 6.36e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.70e-4 | 1.70e-4 | 1.70e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 9.42e-5 | 9.42e-5 | 9.42e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.183 | 0.183 | 0.183 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 2.51e-4 | 2.51e-4 | 2.51e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.09 | 3.09 | 3.09 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.02e-4 | 3.02e-4 | 3.02e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.22 | 3.22 | 3.22 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.63e-4 | 1.63e-4 | 1.63e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.029 | 0.029 | 0.029 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.489 | 0.489 | 0.489 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 6.54 | 6.54 | 6.54 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.06e-4 | 3.06e-4 | 3.06e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 3.17e-4 | 3.17e-4 | 3.17e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.11 | 3.11 | 3.11 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.51e-4 | 4.51e-4 | 4.51e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 7.39e-4 | 7.39e-4 | 7.39e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.08e-4 | 1.08e-4 | 1.08e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.59e-4 | 1.59e-4 | 1.59e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.197 | 0.197 | 0.197 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 1.23e-4 | 1.23e-4 | 1.23e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.111 | 0.111 | 0.111 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.145 | 0.145 | 0.145 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.35 | 2.35 | 2.35 |
| `naming:scan-src` | 1 | 96.74 | 96.74 | 96.74 |
| `agents:parse:analyst.md` | 2 | 0.368 | 0.368 | 0.368 |
| `agents:parse:asi-builder.md` | 1 | 0.307 | 0.307 | 0.307 |
| `agents:parse:coder.md` | 1 | 0.241 | 0.241 | 0.241 |
| `agents:parse:community.md` | 1 | 0.902 | 0.902 | 0.902 |
| `agents:parse:concierge.md` | 1 | 0.435 | 0.435 | 0.435 |
| `agents:parse:classify.md` | 1 | 0.109 | 0.109 | 0.109 |
| `agents:parse:valence.md` | 1 | 0.093 | 0.093 | 0.093 |
| `agents:parse:ai-ranking.md` | 2 | 0.880 | 0.880 | 0.880 |
| `agents:parse:citation.md` | 2 | 1.05 | 1.05 | 1.05 |
| `agents:parse:cmo.md` | 2 | 0.875 | 0.875 | 0.875 |
| `agents:parse:forum.md` | 2 | 0.428 | 0.428 | 0.428 |
| `agents:parse:full.md` | 2 | 0.688 | 0.688 | 0.688 |
| `agents:parse:monthly.md` | 2 | 0.390 | 0.390 | 0.390 |
| `agents:parse:niche-dir.md` | 2 | 0.170 | 0.170 | 0.170 |
| `agents:parse:outreach.md` | 2 | 0.166 | 0.166 | 0.166 |
| `agents:parse:quick.md` | 2 | 0.193 | 0.193 | 0.193 |
| `agents:parse:schema.md` | 2 | 0.278 | 0.278 | 0.278 |
| `agents:parse:social.md` | 3 | 0.179 | 0.358 | 0.358 |
| `agents:parse:designer.md` | 1 | 0.418 | 0.418 | 0.418 |
| `agents:parse:ehc-officer.md` | 1 | 0.416 | 0.416 | 0.416 |
| `agents:parse:eth-dev.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:founder.md` | 1 | 0.526 | 0.526 | 0.526 |
| `agents:parse:guard.md` | 1 | 0.128 | 0.128 | 0.128 |
| `agents:parse:harvester.md` | 1 | 0.135 | 0.135 | 0.135 |
| `agents:parse:ads.md` | 1 | 0.203 | 0.203 | 0.203 |
| `agents:parse:content.md` | 1 | 0.721 | 0.721 | 0.721 |
| `agents:parse:creative.md` | 1 | 0.220 | 0.220 | 0.220 |
| `agents:parse:director.md` | 1 | 0.166 | 0.166 | 0.166 |
| `agents:parse:media-buyer.md` | 1 | 0.928 | 0.928 | 0.928 |
| `agents:parse:seo.md` | 1 | 0.213 | 0.213 | 0.213 |
| `agents:parse:nanoclaw.md` | 1 | 0.206 | 0.206 | 0.206 |
| `agents:parse:ops.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:researcher.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:router.md` | 1 | 0.313 | 0.313 | 0.313 |
| `agents:parse:scout.md` | 1 | 0.977 | 0.977 | 0.977 |
| `agents:parse:teacher.md` | 1 | 0.636 | 0.636 | 0.636 |
| `agents:parse:trader.md` | 1 | 0.231 | 0.231 | 0.231 |
| `agents:parse:tutor.md` | 1 | 0.290 | 0.290 | 0.290 |
| `agents:parse:writer.md` | 1 | 0.169 | 0.169 | 0.169 |
| `signalSender:mark` | 1 | 0.029 | 0.029 | 0.029 |
| `edge:cache:hit:sync-path` | 1 | 4.55e-5 | 4.55e-5 | 4.55e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 762/769 tests · 16625ms across 69 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6067ms |
| `llm-router.test.ts` | 12 | 3715ms |
| `system-speed.test.ts` | 15 | 1371ms |
| `sui-speed.test.ts` | 7 | 725ms |
| `adl-llm.test.ts` | 5 | 652ms |
| `sui.test.ts` | 6 | 632ms |
| `adl-evolution.test.ts` | 3 | 598ms |
| `api-key.test.ts` | 13 | 278ms |
| `adl-api.test.ts` | 5 | 270ms |
| `adl-federation.test.ts` | 5 | 263ms |

---

_Report generated 2026-04-15T13:27:18.877Z._
