# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-17T02:19:23.673Z |
| Test run at | 2026-04-17T02:19:16.496Z |
| Benchmarks measured | 99 named ops, 115 samples |
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
| `routing:select:100` | 0.005ms | 0.012 | 0.012 | 0.012 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.109 | 0.109 | 0.109 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.11e-4 | 6.11e-4 | 6.11e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.89e-4 | 2.89e-4 | 2.89e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 5.48e-5 | 5.48e-5 | 5.48e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.352 | 0.352 | 0.352 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.42e-4 | 1.42e-4 | 1.42e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.93 | 2.93 | 2.93 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 5.55e-4 | 5.55e-4 | 5.55e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 2.80 | 2.80 | 2.80 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.62e-4 | 1.62e-4 | 1.62e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.784 | 0.784 | 0.784 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.059 | 0.059 | 0.059 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.63 | 5.63 | 5.63 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.30e-4 | 3.30e-4 | 3.30e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.022 | 0.022 | 0.022 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 6.05e-4 | 6.05e-4 | 6.05e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 5.11 | 5.11 | 5.11 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.30e-4 | 4.30e-4 | 4.30e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 5.09e-4 | 5.09e-4 | 5.09e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.96e-4 | 1.96e-4 | 1.96e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 1.15e-4 | 1.15e-4 | 1.15e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.161 | 0.161 | 0.161 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.031 | 0.031 | 0.031 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.021 | 0.021 | 0.021 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 1.08e-4 | 1.08e-4 | 1.08e-4 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.138 | 0.138 | 0.138 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.215 | 0.215 | 0.215 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.67 | 2.67 | 2.67 |
| `naming:scan-src` | 1 | 58.74 | 58.74 | 58.74 |
| `agents:parse:analyst.md` | 2 | 0.297 | 0.297 | 0.297 |
| `agents:parse:asi-builder.md` | 1 | 0.328 | 0.328 | 0.328 |
| `agents:parse:coder.md` | 1 | 0.382 | 0.382 | 0.382 |
| `agents:parse:community.md` | 2 | 0.243 | 0.243 | 0.243 |
| `agents:parse:concierge.md` | 2 | 0.205 | 0.205 | 0.205 |
| `agents:parse:classify.md` | 1 | 0.092 | 0.092 | 0.092 |
| `agents:parse:valence.md` | 1 | 0.085 | 0.085 | 0.085 |
| `agents:parse:ai-ranking.md` | 2 | 0.665 | 0.665 | 0.665 |
| `agents:parse:amara.md` | 1 | 0.435 | 0.435 | 0.435 |
| `agents:parse:assessment.md` | 1 | 0.450 | 0.450 | 0.450 |
| `agents:parse:ceo.md` | 1 | 0.326 | 0.326 | 0.326 |
| `agents:parse:citation.md` | 2 | 0.179 | 0.179 | 0.179 |
| `agents:parse:cmo.md` | 2 | 1.08 | 1.08 | 1.08 |
| `agents:parse:content.md` | 2 | 0.527 | 0.527 | 0.527 |
| `agents:parse:edu.md` | 1 | 0.229 | 0.229 | 0.229 |
| `agents:parse:enrollment.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:forum.md` | 2 | 0.353 | 0.353 | 0.353 |
| `agents:parse:full.md` | 2 | 0.340 | 0.340 | 0.340 |
| `agents:parse:mktg.md` | 1 | 0.233 | 0.233 | 0.233 |
| `agents:parse:monthly.md` | 2 | 0.169 | 0.169 | 0.169 |
| `agents:parse:niche-dir.md` | 2 | 0.160 | 0.160 | 0.160 |
| `agents:parse:outreach.md` | 2 | 0.567 | 0.567 | 0.567 |
| `agents:parse:quick.md` | 2 | 0.167 | 0.167 | 0.167 |
| `agents:parse:sales.md` | 1 | 0.697 | 0.697 | 0.697 |
| `agents:parse:schema.md` | 2 | 0.343 | 0.343 | 0.343 |
| `agents:parse:social.md` | 3 | 0.198 | 0.313 | 0.313 |
| `agents:parse:support.md` | 1 | 0.191 | 0.191 | 0.191 |
| `agents:parse:upsell.md` | 1 | 0.294 | 0.294 | 0.294 |
| `agents:parse:welcome.md` | 1 | 0.129 | 0.129 | 0.129 |
| `agents:parse:designer.md` | 1 | 0.215 | 0.215 | 0.215 |
| `agents:parse:ehc-officer.md` | 1 | 0.233 | 0.233 | 0.233 |
| `agents:parse:eth-dev.md` | 1 | 0.279 | 0.279 | 0.279 |
| `agents:parse:founder.md` | 1 | 0.340 | 0.340 | 0.340 |
| `agents:parse:guard.md` | 1 | 0.134 | 0.134 | 0.134 |
| `agents:parse:harvester.md` | 1 | 0.131 | 0.131 | 0.131 |
| `agents:parse:ads.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:creative.md` | 1 | 0.192 | 0.192 | 0.192 |
| `agents:parse:director.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:media-buyer.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:seo.md` | 1 | 0.386 | 0.386 | 0.386 |
| `agents:parse:nanoclaw.md` | 1 | 0.208 | 0.208 | 0.208 |
| `agents:parse:ops.md` | 1 | 0.215 | 0.215 | 0.215 |
| `agents:parse:researcher.md` | 1 | 0.156 | 0.156 | 0.156 |
| `agents:parse:router.md` | 1 | 0.159 | 0.159 | 0.159 |
| `agents:parse:scout.md` | 1 | 0.272 | 0.272 | 0.272 |
| `agents:parse:teacher.md` | 1 | 0.422 | 0.422 | 0.422 |
| `agents:parse:testnet-buyer.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:trader.md` | 1 | 0.922 | 0.922 | 0.922 |
| `agents:parse:tutor.md` | 1 | 0.765 | 0.765 | 0.765 |
| `agents:parse:writer.md` | 1 | 0.149 | 0.149 | 0.149 |
| `signalSender:mark` | 1 | 0.043 | 0.043 | 0.043 |
| `edge:cache:hit:sync-path` | 1 | 4.61e-5 | 4.61e-5 | 4.61e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1255/1264 tests · 20791ms across 96 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6132ms |
| `llm-router.test.ts` | 12 | 4058ms |
| `system-speed.test.ts` | 15 | 1470ms |
| `adl-evolution.test.ts` | 7 | 1363ms |
| `sui-speed.test.ts` | 7 | 768ms |
| `sui.test.ts` | 6 | 652ms |
| `adl-llm.test.ts` | 5 | 622ms |
| `adl-cache.test.ts` | 38 | 592ms |
| `learning-acceleration.test.ts` | 20 | 517ms |
| `api-endpoints.test.ts` | 21 | 378ms |

---

_Report generated 2026-04-17T02:19:23.679Z._
