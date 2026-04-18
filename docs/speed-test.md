# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T16:09:41.010Z |
| Test run at | 2026-04-18T16:09:30.613Z |
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
| `routing:select:1000` | 1.00ms | 0.099 | 0.099 | 0.099 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.011 | 0.011 | 0.011 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 7.33e-4 | 7.33e-4 | 7.33e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 5.53e-4 | 5.53e-4 | 5.53e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.01e-5 | 5.01e-5 | 5.01e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.187 | 0.187 | 0.187 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 9.87e-4 | 9.87e-4 | 9.87e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 8.87e-4 | 8.87e-4 | 8.87e-4 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.53e-4 | 1.53e-4 | 1.53e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.02 | 3.02 | 3.02 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 3.12e-4 | 3.12e-4 | 3.12e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.40 | 3.40 | 3.40 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 2.02e-4 | 2.02e-4 | 2.02e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 6.23e-4 | 6.23e-4 | 6.23e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.013 | 0.013 | 0.013 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.418 | 0.418 | 0.418 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.121 | 0.121 | 0.121 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 8.36 | 8.36 | 8.36 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.15e-4 | 2.15e-4 | 2.15e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.84 | 3.84 | 3.84 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 7.92e-4 | 7.92e-4 | 7.92e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.91e-4 | 2.91e-4 | 2.91e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.27e-4 | 1.27e-4 | 1.27e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.47e-4 | 1.47e-4 | 1.47e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.269 | 0.269 | 0.269 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.033 | 0.033 | 0.033 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 8.29e-5 | 8.29e-5 | 8.29e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.121 | 0.121 | 0.121 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.094 | 0.094 | 0.094 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.99 | 2.99 | 2.99 |
| `naming:scan-src` | 1 | 181 | 181 | 181 |
| `agents:parse:analyst.md` | 2 | 0.232 | 0.232 | 0.232 |
| `agents:parse:asi-builder.md` | 1 | 0.560 | 0.560 | 0.560 |
| `agents:parse:coder.md` | 1 | 0.246 | 0.246 | 0.246 |
| `agents:parse:community.md` | 2 | 0.300 | 0.300 | 0.300 |
| `agents:parse:concierge.md` | 3 | 0.256 | 0.539 | 0.539 |
| `agents:parse:classify.md` | 1 | 0.117 | 0.117 | 0.117 |
| `agents:parse:valence.md` | 1 | 0.099 | 0.099 | 0.099 |
| `agents:parse:bob.md` | 1 | 0.198 | 0.198 | 0.198 |
| `agents:parse:lexi.md` | 1 | 0.157 | 0.157 | 0.157 |
| `agents:parse:ai-ranking.md` | 2 | 0.237 | 0.237 | 0.237 |
| `agents:parse:amara.md` | 1 | 0.442 | 0.442 | 0.442 |
| `agents:parse:assessment.md` | 1 | 0.553 | 0.553 | 0.553 |
| `agents:parse:ceo.md` | 2 | 0.274 | 0.274 | 0.274 |
| `agents:parse:citation.md` | 2 | 0.188 | 0.188 | 0.188 |
| `agents:parse:cmo.md` | 3 | 0.274 | 0.342 | 0.342 |
| `agents:parse:content.md` | 2 | 0.220 | 0.220 | 0.220 |
| `agents:parse:edu.md` | 1 | 0.274 | 0.274 | 0.274 |
| `agents:parse:enrollment.md` | 1 | 0.291 | 0.291 | 0.291 |
| `agents:parse:forum.md` | 2 | 0.214 | 0.214 | 0.214 |
| `agents:parse:full.md` | 2 | 0.221 | 0.221 | 0.221 |
| `agents:parse:mktg.md` | 1 | 0.266 | 0.266 | 0.266 |
| `agents:parse:monthly.md` | 2 | 0.293 | 0.293 | 0.293 |
| `agents:parse:niche-dir.md` | 2 | 0.187 | 0.187 | 0.187 |
| `agents:parse:outreach.md` | 2 | 0.190 | 0.190 | 0.190 |
| `agents:parse:quick.md` | 2 | 0.175 | 0.175 | 0.175 |
| `agents:parse:sales.md` | 1 | 0.217 | 0.217 | 0.217 |
| `agents:parse:schema.md` | 2 | 0.171 | 0.171 | 0.171 |
| `agents:parse:social.md` | 3 | 0.288 | 0.352 | 0.352 |
| `agents:parse:support.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:upsell.md` | 1 | 0.193 | 0.193 | 0.193 |
| `agents:parse:welcome.md` | 1 | 0.490 | 0.490 | 0.490 |
| `agents:parse:designer.md` | 1 | 0.246 | 0.246 | 0.246 |
| `agents:parse:ehc-officer.md` | 1 | 0.244 | 0.244 | 0.244 |
| `agents:parse:eth-dev.md` | 1 | 0.284 | 0.284 | 0.284 |
| `agents:parse:founder.md` | 1 | 0.217 | 0.217 | 0.217 |
| `agents:parse:guard.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:harvester.md` | 1 | 0.318 | 0.318 | 0.318 |
| `agents:parse:ads.md` | 1 | 0.675 | 0.675 | 0.675 |
| `agents:parse:creative.md` | 1 | 0.221 | 0.221 | 0.221 |
| `agents:parse:director.md` | 1 | 0.189 | 0.189 | 0.189 |
| `agents:parse:media-buyer.md` | 1 | 0.232 | 0.232 | 0.232 |
| `agents:parse:seo.md` | 1 | 0.223 | 0.223 | 0.223 |
| `agents:parse:nanoclaw.md` | 1 | 0.486 | 0.486 | 0.486 |
| `agents:parse:ops.md` | 1 | 0.238 | 0.238 | 0.238 |
| `agents:parse:researcher.md` | 2 | 0.329 | 0.329 | 0.329 |
| `agents:parse:tutor.md` | 2 | 0.181 | 0.181 | 0.181 |
| `agents:parse:world.md` | 1 | 0.044 | 0.044 | 0.044 |
| `agents:parse:cfo.md` | 1 | 0.254 | 0.254 | 0.254 |
| `agents:parse:cto.md` | 1 | 0.258 | 0.258 | 0.258 |
| `agents:parse:router.md` | 1 | 0.308 | 0.308 | 0.308 |
| `agents:parse:scout.md` | 1 | 0.151 | 0.151 | 0.151 |
| `agents:parse:teacher.md` | 1 | 0.396 | 0.396 | 0.396 |
| `agents:parse:testnet-buyer.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:trader.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:writer.md` | 1 | 0.169 | 0.169 | 0.169 |
| `signalSender:mark` | 1 | 0.040 | 0.040 | 0.040 |
| `edge:cache:hit:sync-path` | 1 | 4.00e-5 | 4.00e-5 | 4.00e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1581/1603 tests · 30548ms across 119 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 9663ms |
| `llm.test.ts` | 14 | 6100ms |
| `llm-router.test.ts` | 12 | 3894ms |
| `system-speed.test.ts` | 15 | 1445ms |
| `adl-evolution.test.ts` | 7 | 1356ms |
| `sui-speed.test.ts` | 7 | 632ms |
| `sui.test.ts` | 6 | 568ms |
| `adl-llm.test.ts` | 5 | 492ms |
| `learning-acceleration.test.ts` | 20 | 403ms |
| `adl-cache.test.ts` | 38 | 375ms |

---

_Report generated 2026-04-18T16:09:41.025Z._
