# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T01:23:48.922Z |
| Test run at | 2026-04-18T01:22:27.662Z |
| Benchmarks measured | 103 named ops, 121 samples |
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
| `routing:select:100` | 0.005ms | 0.007 | 0.007 | 0.007 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.200 | 0.200 | 0.200 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.02e-4 | 6.02e-4 | 6.02e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 3.44e-4 | 3.44e-4 | 3.44e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.73e-5 | 4.73e-5 | 4.73e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.132 | 0.132 | 0.132 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.25e-4 | 9.25e-4 | 9.25e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 9.77e-4 | 9.77e-4 | 9.77e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.29e-4 | 1.29e-4 | 1.29e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 8.24e-4 | 8.24e-4 | 8.24e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.020 | 0.020 | 0.020 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.96 | 2.96 | 2.96 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.76e-4 | 2.76e-4 | 2.76e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 6.95 | 6.95 | 6.95 | 1 | ◐ pass (within 3× scale) | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.50e-4 | 1.50e-4 | 1.50e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.029 | 0.029 | 0.029 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.410 | 0.410 | 0.410 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.041 | 0.041 | 0.041 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.01 | 5.01 | 5.01 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.42e-4 | 3.42e-4 | 3.42e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.53e-4 | 2.53e-4 | 2.53e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.41 | 3.41 | 3.41 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.97e-4 | 4.97e-4 | 4.97e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 4.74e-4 | 4.74e-4 | 4.74e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.85e-4 | 1.85e-4 | 1.85e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.11e-4 | 1.11e-4 | 1.11e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.193 | 0.193 | 0.193 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 5.01e-5 | 5.01e-5 | 5.01e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.108 | 0.108 | 0.108 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.109 | 0.109 | 0.109 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 1.83 | 1.83 | 1.83 |
| `agents:parse:analyst.md` | 2 | 0.323 | 0.323 | 0.323 |
| `agents:parse:asi-builder.md` | 1 | 0.434 | 0.434 | 0.434 |
| `agents:parse:coder.md` | 1 | 0.366 | 0.366 | 0.366 |
| `agents:parse:community.md` | 2 | 0.496 | 0.496 | 0.496 |
| `agents:parse:concierge.md` | 2 | 0.631 | 0.631 | 0.631 |
| `agents:parse:classify.md` | 1 | 0.109 | 0.109 | 0.109 |
| `agents:parse:valence.md` | 1 | 0.097 | 0.097 | 0.097 |
| `agents:parse:bob.md` | 1 | 0.230 | 0.230 | 0.230 |
| `agents:parse:lexi.md` | 1 | 0.193 | 0.193 | 0.193 |
| `agents:parse:ai-ranking.md` | 2 | 0.361 | 0.361 | 0.361 |
| `agents:parse:amara.md` | 1 | 0.389 | 0.389 | 0.389 |
| `agents:parse:assessment.md` | 1 | 0.904 | 0.904 | 0.904 |
| `agents:parse:ceo.md` | 2 | 0.601 | 0.601 | 0.601 |
| `agents:parse:citation.md` | 2 | 0.216 | 0.216 | 0.216 |
| `agents:parse:cmo.md` | 3 | 0.455 | 0.837 | 0.837 |
| `agents:parse:content.md` | 2 | 0.554 | 0.554 | 0.554 |
| `agents:parse:edu.md` | 1 | 0.478 | 0.478 | 0.478 |
| `agents:parse:enrollment.md` | 1 | 0.223 | 0.223 | 0.223 |
| `agents:parse:forum.md` | 2 | 0.268 | 0.268 | 0.268 |
| `agents:parse:full.md` | 2 | 0.196 | 0.196 | 0.196 |
| `agents:parse:mktg.md` | 1 | 0.235 | 0.235 | 0.235 |
| `agents:parse:monthly.md` | 2 | 0.173 | 0.173 | 0.173 |
| `agents:parse:niche-dir.md` | 2 | 0.196 | 0.196 | 0.196 |
| `agents:parse:outreach.md` | 2 | 0.268 | 0.268 | 0.268 |
| `agents:parse:quick.md` | 2 | 0.194 | 0.194 | 0.194 |
| `agents:parse:sales.md` | 1 | 1.84 | 1.84 | 1.84 |
| `agents:parse:schema.md` | 2 | 0.186 | 0.186 | 0.186 |
| `agents:parse:social.md` | 3 | 0.241 | 1.80 | 1.80 |
| `agents:parse:support.md` | 1 | 0.548 | 0.548 | 0.548 |
| `agents:parse:upsell.md` | 1 | 1.27 | 1.27 | 1.27 |
| `agents:parse:welcome.md` | 1 | 0.696 | 0.696 | 0.696 |
| `agents:parse:designer.md` | 1 | 0.250 | 0.250 | 0.250 |
| `agents:parse:ehc-officer.md` | 1 | 0.285 | 0.285 | 0.285 |
| `agents:parse:eth-dev.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:founder.md` | 1 | 0.218 | 0.218 | 0.218 |
| `agents:parse:guard.md` | 1 | 0.442 | 0.442 | 0.442 |
| `agents:parse:harvester.md` | 1 | 0.251 | 0.251 | 0.251 |
| `agents:parse:ads.md` | 1 | 0.274 | 0.274 | 0.274 |
| `agents:parse:creative.md` | 1 | 0.198 | 0.198 | 0.198 |
| `agents:parse:director.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:media-buyer.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:seo.md` | 1 | 0.212 | 0.212 | 0.212 |
| `agents:parse:nanoclaw.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:ops.md` | 1 | 0.255 | 0.255 | 0.255 |
| `agents:parse:researcher.md` | 1 | 0.509 | 0.509 | 0.509 |
| `agents:parse:cfo.md` | 1 | 0.379 | 0.379 | 0.379 |
| `agents:parse:cto.md` | 1 | 0.260 | 0.260 | 0.260 |
| `agents:parse:router.md` | 1 | 0.176 | 0.176 | 0.176 |
| `agents:parse:scout.md` | 1 | 0.146 | 0.146 | 0.146 |
| `agents:parse:teacher.md` | 1 | 0.498 | 0.498 | 0.498 |
| `agents:parse:testnet-buyer.md` | 1 | 0.248 | 0.248 | 0.248 |
| `agents:parse:trader.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:tutor.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:writer.md` | 1 | 0.152 | 0.152 | 0.152 |
| `naming:scan-src` | 1 | 242 | 242 | 242 |
| `signalSender:mark` | 1 | 0.094 | 0.094 | 0.094 |
| `edge:cache:hit:sync-path` | 1 | 4.66e-5 | 4.66e-5 | 4.66e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1531/1552 tests · 114651ms across 115 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `human.test.ts` | 27 | 80073ms |
| `phase2-keypair-derivation.test.ts` | 14 | 7934ms |
| `llm.test.ts` | 14 | 6255ms |
| `tick.test.ts` | 9 | 4923ms |
| `llm-router.test.ts` | 12 | 4074ms |
| `system-speed.test.ts` | 15 | 1826ms |
| `sui-speed.test.ts` | 7 | 1103ms |
| `adl-evolution.test.ts` | 7 | 938ms |
| `learning-acceleration.test.ts` | 20 | 515ms |
| `adl-llm.test.ts` | 5 | 489ms |

---

_Report generated 2026-04-18T01:23:48.934Z._
