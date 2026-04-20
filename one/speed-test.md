# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T03:19:04.950Z |
| Test run at | 2026-04-20T03:18:55.142Z |
| Benchmarks measured | 112 named ops, 142 samples |
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
| `routing:select:100` | 0.005ms | 0.009 | 0.009 | 0.009 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.085 | 0.085 | 0.085 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 7.09e-4 | 7.09e-4 | 7.09e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.42e-4 | 2.42e-4 | 2.42e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.68e-5 | 4.68e-5 | 4.68e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.220 | 0.220 | 0.220 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.60e-4 | 9.60e-4 | 9.60e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.33e-4 | 1.33e-4 | 1.33e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.018 | 0.018 | 0.018 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.21 | 3.21 | 3.21 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.22e-4 | 3.22e-4 | 3.22e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.47 | 3.47 | 3.47 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 2.31e-4 | 2.31e-4 | 2.31e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.426 | 0.426 | 0.426 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.062 | 0.062 | 0.062 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.10 | 5.10 | 5.10 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.03e-4 | 3.03e-4 | 3.03e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 3.37e-4 | 3.37e-4 | 3.37e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.61 | 3.61 | 3.61 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 9.36e-4 | 9.36e-4 | 9.36e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 5.66e-4 | 5.66e-4 | 5.66e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.55e-4 | 2.55e-4 | 2.55e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.22e-4 | 1.22e-4 | 1.22e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.87e-5 | 7.87e-5 | 7.87e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.263 | 0.263 | 0.263 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.017 | 0.017 | 0.017 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.008 | 0.008 | 0.008 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.19e-5 | 4.19e-5 | 4.19e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.111 | 0.111 | 0.111 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.104 | 0.104 | 0.104 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.36 | 2.36 | 2.36 |
| `agents:parse:analyst.md` | 2 | 0.182 | 0.182 | 0.182 |
| `agents:parse:asi-builder.md` | 1 | 0.258 | 0.258 | 0.258 |
| `agents:parse:ceo.md` | 4 | 0.350 | 0.405 | 0.405 |
| `agents:parse:coder.md` | 1 | 0.187 | 0.187 | 0.187 |
| `agents:parse:community-director.md` | 1 | 0.347 | 0.347 | 0.347 |
| `agents:parse:community.md` | 2 | 0.270 | 0.270 | 0.270 |
| `agents:parse:concierge.md` | 3 | 0.150 | 0.155 | 0.155 |
| `agents:parse:classify.md` | 1 | 0.074 | 0.074 | 0.074 |
| `agents:parse:valence.md` | 1 | 0.073 | 0.073 | 0.073 |
| `agents:parse:bob.md` | 1 | 0.151 | 0.151 | 0.151 |
| `agents:parse:lexi.md` | 1 | 0.122 | 0.122 | 0.122 |
| `agents:parse:david.md` | 1 | 0.113 | 0.113 | 0.113 |
| `agents:parse:ai-ranking.md` | 2 | 0.202 | 0.202 | 0.202 |
| `agents:parse:amara.md` | 1 | 0.256 | 0.256 | 0.256 |
| `agents:parse:assessment.md` | 1 | 0.429 | 0.429 | 0.429 |
| `agents:parse:citation.md` | 2 | 0.156 | 0.156 | 0.156 |
| `agents:parse:cmo.md` | 3 | 0.245 | 0.317 | 0.317 |
| `agents:parse:content.md` | 2 | 0.172 | 0.172 | 0.172 |
| `agents:parse:edu.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:enrollment.md` | 1 | 0.275 | 0.275 | 0.275 |
| `agents:parse:forum.md` | 2 | 0.148 | 0.148 | 0.148 |
| `agents:parse:full.md` | 2 | 0.145 | 0.145 | 0.145 |
| `agents:parse:mktg.md` | 1 | 0.181 | 0.181 | 0.181 |
| `agents:parse:monthly.md` | 2 | 0.147 | 0.147 | 0.147 |
| `agents:parse:niche-dir.md` | 2 | 0.209 | 0.209 | 0.209 |
| `agents:parse:outreach.md` | 2 | 0.144 | 0.144 | 0.144 |
| `agents:parse:quick.md` | 2 | 0.161 | 0.161 | 0.161 |
| `agents:parse:sales.md` | 1 | 0.214 | 0.214 | 0.214 |
| `agents:parse:schema.md` | 2 | 0.154 | 0.154 | 0.154 |
| `agents:parse:social.md` | 4 | 0.198 | 0.222 | 0.222 |
| `agents:parse:support.md` | 2 | 0.514 | 0.514 | 0.514 |
| `agents:parse:upsell.md` | 1 | 0.162 | 0.162 | 0.162 |
| `agents:parse:welcome.md` | 1 | 0.120 | 0.120 | 0.120 |
| `agents:parse:designer.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:ehc-officer.md` | 1 | 0.207 | 0.207 | 0.207 |
| `agents:parse:engineering-director.md` | 1 | 0.319 | 0.319 | 0.319 |
| `agents:parse:eth-dev.md` | 1 | 0.240 | 0.240 | 0.240 |
| `agents:parse:founder.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:guard.md` | 1 | 0.260 | 0.260 | 0.260 |
| `agents:parse:harvester.md` | 1 | 0.120 | 0.120 | 0.120 |
| `agents:parse:ads.md` | 2 | 0.212 | 0.212 | 0.212 |
| `agents:parse:creative.md` | 1 | 0.171 | 0.171 | 0.171 |
| `agents:parse:director.md` | 3 | 0.205 | 0.212 | 0.212 |
| `agents:parse:media-buyer.md` | 1 | 0.175 | 0.175 | 0.175 |
| `agents:parse:seo.md` | 2 | 0.317 | 0.317 | 0.317 |
| `agents:parse:marketing-director.md` | 1 | 0.523 | 0.523 | 0.523 |
| `agents:parse:nanoclaw.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:ops.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:researcher.md` | 2 | 0.173 | 0.173 | 0.173 |
| `agents:parse:tutor.md` | 2 | 0.158 | 0.158 | 0.158 |
| `agents:parse:world.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:cfo.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:cto.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:router.md` | 1 | 0.390 | 0.390 | 0.390 |
| `agents:parse:sales-director.md` | 1 | 0.841 | 0.841 | 0.841 |
| `agents:parse:scout.md` | 1 | 0.179 | 0.179 | 0.179 |
| `agents:parse:service-director.md` | 1 | 0.543 | 0.543 | 0.543 |
| `agents:parse:teacher.md` | 1 | 0.367 | 0.367 | 0.367 |
| `agents:parse:moderator.md` | 1 | 0.366 | 0.366 | 0.366 |
| `agents:parse:writer.md` | 2 | 0.701 | 0.701 | 0.701 |
| `agents:parse:testnet-buyer.md` | 1 | 0.179 | 0.179 | 0.179 |
| `agents:parse:trader.md` | 1 | 0.273 | 0.273 | 0.273 |
| `agents:parse:you.md` | 1 | 0.254 | 0.254 | 0.254 |
| `naming:scan-src` | 1 | 98.11 | 98.11 | 98.11 |
| `signalSender:mark` | 1 | 0.033 | 0.033 | 0.033 |
| `edge:cache:hit:sync-path` | 1 | 3.59e-5 | 3.59e-5 | 3.59e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1619/1642 tests · 30830ms across 127 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 9490ms |
| `llm.test.ts` | 14 | 6076ms |
| `llm-router.test.ts` | 12 | 3802ms |
| `system-speed.test.ts` | 15 | 1349ms |
| `tick.test.ts` | 9 | 859ms |
| `sui-speed.test.ts` | 7 | 640ms |
| `api-endpoints.test.ts` | 21 | 538ms |
| `learning-acceleration.test.ts` | 20 | 472ms |
| `sui.test.ts` | 6 | 460ms |
| `adl-llm.test.ts` | 5 | 458ms |

---

_Report generated 2026-04-20T03:19:04.954Z._
