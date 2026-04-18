# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T11:52:08.223Z |
| Test run at | 2026-04-18T11:51:58.250Z |
| Benchmarks measured | 104 named ops, 125 samples |
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
| `routing:select:1000` | 1.00ms | 0.074 | 0.074 | 0.074 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 3.53e-4 | 3.53e-4 | 3.53e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.06e-4 | 2.06e-4 | 2.06e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 3.82e-5 | 3.82e-5 | 3.82e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.126 | 0.126 | 0.126 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 8.42e-4 | 8.42e-4 | 8.42e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 6.66e-4 | 6.66e-4 | 6.66e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.21e-4 | 1.21e-4 | 1.21e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.01 | 2.01 | 2.01 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.04e-4 | 3.04e-4 | 3.04e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.35 | 2.35 | 2.35 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.35e-4 | 1.35e-4 | 1.35e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 8.13e-4 | 8.13e-4 | 8.13e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.338 | 0.338 | 0.338 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.046 | 0.046 | 0.046 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 3.82 | 3.82 | 3.82 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.61e-4 | 2.61e-4 | 2.61e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 1.67e-4 | 1.67e-4 | 1.67e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.37 | 2.37 | 2.37 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 4.06e-4 | 4.06e-4 | 4.06e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.18e-4 | 2.18e-4 | 2.18e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 9.78e-5 | 9.78e-5 | 9.78e-5 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 6.17e-5 | 6.17e-5 | 6.17e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.160 | 0.160 | 0.160 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 3.92e-5 | 3.92e-5 | 3.92e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.083 | 0.083 | 0.083 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.078 | 0.078 | 0.078 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.04 | 2.04 | 2.04 |
| `naming:scan-src` | 1 | 57.71 | 57.71 | 57.71 |
| `agents:parse:analyst.md` | 2 | 0.183 | 0.183 | 0.183 |
| `agents:parse:asi-builder.md` | 1 | 0.328 | 0.328 | 0.328 |
| `agents:parse:coder.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:community.md` | 2 | 0.204 | 0.204 | 0.204 |
| `agents:parse:concierge.md` | 3 | 0.157 | 0.166 | 0.166 |
| `agents:parse:classify.md` | 1 | 0.077 | 0.077 | 0.077 |
| `agents:parse:valence.md` | 1 | 0.075 | 0.075 | 0.075 |
| `agents:parse:bob.md` | 1 | 0.155 | 0.155 | 0.155 |
| `agents:parse:lexi.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:ai-ranking.md` | 2 | 0.188 | 0.188 | 0.188 |
| `agents:parse:amara.md` | 1 | 0.260 | 0.260 | 0.260 |
| `agents:parse:assessment.md` | 1 | 0.362 | 0.362 | 0.362 |
| `agents:parse:ceo.md` | 2 | 0.295 | 0.295 | 0.295 |
| `agents:parse:citation.md` | 2 | 0.144 | 0.144 | 0.144 |
| `agents:parse:cmo.md` | 3 | 0.213 | 0.216 | 0.216 |
| `agents:parse:content.md` | 2 | 0.175 | 0.175 | 0.175 |
| `agents:parse:edu.md` | 1 | 0.185 | 0.185 | 0.185 |
| `agents:parse:enrollment.md` | 1 | 0.227 | 0.227 | 0.227 |
| `agents:parse:forum.md` | 2 | 0.138 | 0.138 | 0.138 |
| `agents:parse:full.md` | 2 | 0.147 | 0.147 | 0.147 |
| `agents:parse:mktg.md` | 1 | 0.213 | 0.213 | 0.213 |
| `agents:parse:monthly.md` | 2 | 0.192 | 0.192 | 0.192 |
| `agents:parse:niche-dir.md` | 2 | 0.138 | 0.138 | 0.138 |
| `agents:parse:outreach.md` | 2 | 0.139 | 0.139 | 0.139 |
| `agents:parse:quick.md` | 2 | 0.137 | 0.137 | 0.137 |
| `agents:parse:sales.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:schema.md` | 2 | 0.138 | 0.138 | 0.138 |
| `agents:parse:social.md` | 3 | 0.178 | 0.214 | 0.214 |
| `agents:parse:support.md` | 1 | 0.167 | 0.167 | 0.167 |
| `agents:parse:upsell.md` | 1 | 0.164 | 0.164 | 0.164 |
| `agents:parse:welcome.md` | 1 | 0.117 | 0.117 | 0.117 |
| `agents:parse:designer.md` | 1 | 0.191 | 0.191 | 0.191 |
| `agents:parse:ehc-officer.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:eth-dev.md` | 1 | 0.225 | 0.225 | 0.225 |
| `agents:parse:founder.md` | 1 | 0.204 | 0.204 | 0.204 |
| `agents:parse:guard.md` | 1 | 0.114 | 0.114 | 0.114 |
| `agents:parse:harvester.md` | 1 | 0.185 | 0.185 | 0.185 |
| `agents:parse:ads.md` | 1 | 0.185 | 0.185 | 0.185 |
| `agents:parse:creative.md` | 1 | 0.175 | 0.175 | 0.175 |
| `agents:parse:director.md` | 1 | 0.149 | 0.149 | 0.149 |
| `agents:parse:media-buyer.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:seo.md` | 1 | 0.176 | 0.176 | 0.176 |
| `agents:parse:nanoclaw.md` | 1 | 0.248 | 0.248 | 0.248 |
| `agents:parse:ops.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:researcher.md` | 2 | 0.137 | 0.137 | 0.137 |
| `agents:parse:tutor.md` | 2 | 0.141 | 0.141 | 0.141 |
| `agents:parse:world.md` | 1 | 0.040 | 0.040 | 0.040 |
| `agents:parse:cfo.md` | 1 | 0.185 | 0.185 | 0.185 |
| `agents:parse:cto.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:router.md` | 1 | 0.200 | 0.200 | 0.200 |
| `agents:parse:scout.md` | 1 | 0.118 | 0.118 | 0.118 |
| `agents:parse:teacher.md` | 1 | 0.310 | 0.310 | 0.310 |
| `agents:parse:testnet-buyer.md` | 1 | 0.149 | 0.149 | 0.149 |
| `agents:parse:trader.md` | 1 | 0.174 | 0.174 | 0.174 |
| `agents:parse:writer.md` | 1 | 0.135 | 0.135 | 0.135 |
| `signalSender:mark` | 1 | 0.021 | 0.021 | 0.021 |
| `edge:cache:hit:sync-path` | 1 | 3.01e-5 | 3.01e-5 | 3.01e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1539/1561 tests · 31197ms across 116 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 9262ms |
| `llm.test.ts` | 14 | 6063ms |
| `tick.test.ts` | 9 | 4504ms |
| `llm-router.test.ts` | 12 | 3727ms |
| `system-speed.test.ts` | 15 | 988ms |
| `adl-evolution.test.ts` | 7 | 875ms |
| `sui-speed.test.ts` | 7 | 430ms |
| `adl-llm.test.ts` | 5 | 420ms |
| `sui.test.ts` | 6 | 386ms |
| `learning-acceleration.test.ts` | 20 | 317ms |

---

_Report generated 2026-04-18T11:52:08.236Z._
