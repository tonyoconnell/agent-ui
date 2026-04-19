# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](one/speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T19:20:03.938Z |
| Test run at | 2026-04-18T19:19:53.032Z |
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
| `routing:select:100` | 0.005ms | 0.008 | 0.008 | 0.008 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.075 | 0.075 | 0.075 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 4.35e-4 | 4.35e-4 | 4.35e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.13e-4 | 2.13e-4 | 2.13e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.00e-5 | 4.00e-5 | 4.00e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.129 | 0.129 | 0.129 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 8.27e-4 | 8.27e-4 | 8.27e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.21e-4 | 1.21e-4 | 1.21e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 9.20e-4 | 9.20e-4 | 9.20e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 1.99 | 1.99 | 1.99 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.96e-4 | 2.96e-4 | 2.96e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.17 | 2.17 | 2.17 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.30e-4 | 1.30e-4 | 1.30e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 7.21e-4 | 7.21e-4 | 7.21e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.320 | 0.320 | 0.320 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.047 | 0.047 | 0.047 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.05 | 5.05 | 5.05 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.68e-4 | 2.68e-4 | 2.68e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 1.85e-4 | 1.85e-4 | 1.85e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.51 | 2.51 | 2.51 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 9.52e-4 | 9.52e-4 | 9.52e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 9.44e-4 | 9.44e-4 | 9.44e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.33e-4 | 2.33e-4 | 2.33e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 9.85e-5 | 9.85e-5 | 9.85e-5 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 6.66e-5 | 6.66e-5 | 6.66e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.215 | 0.215 | 0.215 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 3.68e-5 | 3.68e-5 | 3.68e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.082 | 0.082 | 0.082 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.077 | 0.077 | 0.077 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 1.88 | 1.88 | 1.88 |
| `agents:parse:analyst.md` | 2 | 0.605 | 0.605 | 0.605 |
| `agents:parse:asi-builder.md` | 1 | 0.366 | 0.366 | 0.366 |
| `agents:parse:coder.md` | 1 | 0.246 | 0.246 | 0.246 |
| `agents:parse:community.md` | 2 | 0.289 | 0.289 | 0.289 |
| `agents:parse:concierge.md` | 3 | 0.160 | 0.174 | 0.174 |
| `agents:parse:classify.md` | 1 | 0.086 | 0.086 | 0.086 |
| `agents:parse:valence.md` | 1 | 0.077 | 0.077 | 0.077 |
| `agents:parse:bob.md` | 1 | 0.166 | 0.166 | 0.166 |
| `agents:parse:lexi.md` | 1 | 0.501 | 0.501 | 0.501 |
| `agents:parse:ai-ranking.md` | 2 | 0.222 | 0.222 | 0.222 |
| `agents:parse:amara.md` | 1 | 0.298 | 0.298 | 0.298 |
| `agents:parse:assessment.md` | 1 | 0.450 | 0.450 | 0.450 |
| `agents:parse:ceo.md` | 2 | 0.204 | 0.204 | 0.204 |
| `agents:parse:citation.md` | 2 | 0.270 | 0.270 | 0.270 |
| `agents:parse:cmo.md` | 3 | 0.267 | 0.579 | 0.579 |
| `agents:parse:content.md` | 2 | 0.175 | 0.175 | 0.175 |
| `agents:parse:edu.md` | 1 | 0.237 | 0.237 | 0.237 |
| `agents:parse:enrollment.md` | 1 | 0.280 | 0.280 | 0.280 |
| `agents:parse:forum.md` | 2 | 0.142 | 0.142 | 0.142 |
| `agents:parse:full.md` | 2 | 0.148 | 0.148 | 0.148 |
| `agents:parse:mktg.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:monthly.md` | 2 | 0.224 | 0.224 | 0.224 |
| `agents:parse:niche-dir.md` | 2 | 0.438 | 0.438 | 0.438 |
| `agents:parse:outreach.md` | 2 | 0.149 | 0.149 | 0.149 |
| `agents:parse:quick.md` | 2 | 0.162 | 0.162 | 0.162 |
| `agents:parse:sales.md` | 1 | 0.168 | 0.168 | 0.168 |
| `agents:parse:schema.md` | 2 | 0.140 | 0.140 | 0.140 |
| `agents:parse:social.md` | 3 | 0.174 | 0.210 | 0.210 |
| `agents:parse:support.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:upsell.md` | 1 | 0.162 | 0.162 | 0.162 |
| `agents:parse:welcome.md` | 1 | 0.115 | 0.115 | 0.115 |
| `agents:parse:designer.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:ehc-officer.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:eth-dev.md` | 1 | 0.225 | 0.225 | 0.225 |
| `agents:parse:founder.md` | 1 | 0.187 | 0.187 | 0.187 |
| `agents:parse:guard.md` | 1 | 0.114 | 0.114 | 0.114 |
| `agents:parse:harvester.md` | 1 | 0.507 | 0.507 | 0.507 |
| `agents:parse:ads.md` | 1 | 0.180 | 0.180 | 0.180 |
| `agents:parse:creative.md` | 1 | 0.173 | 0.173 | 0.173 |
| `agents:parse:director.md` | 1 | 0.147 | 0.147 | 0.147 |
| `agents:parse:media-buyer.md` | 1 | 0.179 | 0.179 | 0.179 |
| `agents:parse:seo.md` | 1 | 0.172 | 0.172 | 0.172 |
| `agents:parse:nanoclaw.md` | 1 | 0.288 | 0.288 | 0.288 |
| `agents:parse:ops.md` | 1 | 0.189 | 0.189 | 0.189 |
| `agents:parse:researcher.md` | 2 | 0.146 | 0.146 | 0.146 |
| `agents:parse:tutor.md` | 2 | 0.140 | 0.140 | 0.140 |
| `agents:parse:world.md` | 1 | 0.040 | 0.040 | 0.040 |
| `agents:parse:cfo.md` | 1 | 0.183 | 0.183 | 0.183 |
| `agents:parse:cto.md` | 1 | 0.182 | 0.182 | 0.182 |
| `agents:parse:router.md` | 1 | 0.313 | 0.313 | 0.313 |
| `agents:parse:scout.md` | 1 | 0.121 | 0.121 | 0.121 |
| `agents:parse:teacher.md` | 1 | 0.313 | 0.313 | 0.313 |
| `agents:parse:testnet-buyer.md` | 1 | 0.151 | 0.151 | 0.151 |
| `agents:parse:trader.md` | 1 | 0.177 | 0.177 | 0.177 |
| `agents:parse:writer.md` | 1 | 0.168 | 0.168 | 0.168 |
| `naming:scan-src` | 1 | 72.53 | 72.53 | 72.53 |
| `signalSender:mark` | 1 | 0.022 | 0.022 | 0.022 |
| `edge:cache:hit:sync-path` | 1 | 5.73e-5 | 5.73e-5 | 5.73e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1574/1596 tests · 33388ms across 119 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 10313ms |
| `llm.test.ts` | 14 | 6069ms |
| `tick.test.ts` | 9 | 5339ms |
| `llm-router.test.ts` | 12 | 3641ms |
| `system-speed.test.ts` | 15 | 1005ms |
| `adl-evolution.test.ts` | 7 | 842ms |
| `adl-llm.test.ts` | 5 | 425ms |
| `sui-speed.test.ts` | 7 | 400ms |
| `sui.test.ts` | 6 | 361ms |
| `learning-acceleration.test.ts` | 20 | 303ms |

---

_Report generated 2026-04-18T19:20:03.953Z._
