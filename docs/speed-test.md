# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-18T10:24:43.082Z |
| Test run at | 2026-04-18T10:24:34.273Z |
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
| `routing:select:1000` | 1.00ms | 0.083 | 0.083 | 0.083 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 0.001 | 0.001 | 0.001 | 1 | ◐ pass (within 3× scale) | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.71e-4 | 2.71e-4 | 2.71e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 8.96e-5 | 8.96e-5 | 8.96e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.254 | 0.254 | 0.254 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.61e-4 | 1.61e-4 | 1.61e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.026 | 0.026 | 0.026 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 5.22 | 5.22 | 5.22 | 1 | ◐ pass (within 3× scale) |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.97e-4 | 2.97e-4 | 2.97e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.18 | 3.18 | 3.18 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.52e-4 | 1.52e-4 | 1.52e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 8.30e-4 | 8.30e-4 | 8.30e-4 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.016 | 0.016 | 0.016 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.372 | 0.372 | 0.372 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.186 | 0.186 | 0.186 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.88 | 5.88 | 5.88 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.05e-4 | 3.05e-4 | 3.05e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.02e-4 | 2.02e-4 | 2.02e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 3.84 | 3.84 | 3.84 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 7.67e-4 | 7.67e-4 | 7.67e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 4.77e-4 | 4.77e-4 | 4.77e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.71e-4 | 2.71e-4 | 2.71e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.004 | 0.004 | 0.004 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.12e-4 | 1.12e-4 | 1.12e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.50e-5 | 7.50e-5 | 7.50e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.237 | 0.237 | 0.237 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.024 | 0.024 | 0.024 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.012 | 0.012 | 0.012 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 3.65e-5 | 3.65e-5 | 3.65e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.109 | 0.109 | 0.109 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.118 | 0.118 | 0.118 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 5.73 | 5.73 | 5.73 |
| `naming:scan-src` | 1 | 56.94 | 56.94 | 56.94 |
| `agents:parse:analyst.md` | 2 | 0.192 | 0.192 | 0.192 |
| `agents:parse:asi-builder.md` | 1 | 0.328 | 0.328 | 0.328 |
| `agents:parse:coder.md` | 1 | 0.192 | 0.192 | 0.192 |
| `agents:parse:community.md` | 2 | 0.200 | 0.200 | 0.200 |
| `agents:parse:concierge.md` | 3 | 0.156 | 0.163 | 0.163 |
| `agents:parse:classify.md` | 1 | 0.079 | 0.079 | 0.079 |
| `agents:parse:valence.md` | 1 | 0.104 | 0.104 | 0.104 |
| `agents:parse:bob.md` | 1 | 0.161 | 0.161 | 0.161 |
| `agents:parse:lexi.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:ai-ranking.md` | 2 | 0.195 | 0.195 | 0.195 |
| `agents:parse:amara.md` | 1 | 0.244 | 0.244 | 0.244 |
| `agents:parse:assessment.md` | 1 | 0.366 | 0.366 | 0.366 |
| `agents:parse:ceo.md` | 2 | 0.197 | 0.197 | 0.197 |
| `agents:parse:citation.md` | 2 | 0.138 | 0.138 | 0.138 |
| `agents:parse:cmo.md` | 3 | 0.211 | 0.222 | 0.222 |
| `agents:parse:content.md` | 2 | 0.224 | 0.224 | 0.224 |
| `agents:parse:edu.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:enrollment.md` | 1 | 0.209 | 0.209 | 0.209 |
| `agents:parse:forum.md` | 2 | 0.147 | 0.147 | 0.147 |
| `agents:parse:full.md` | 2 | 0.146 | 0.146 | 0.146 |
| `agents:parse:mktg.md` | 1 | 0.214 | 0.214 | 0.214 |
| `agents:parse:monthly.md` | 2 | 0.193 | 0.193 | 0.193 |
| `agents:parse:niche-dir.md` | 2 | 0.137 | 0.137 | 0.137 |
| `agents:parse:outreach.md` | 2 | 0.135 | 0.135 | 0.135 |
| `agents:parse:quick.md` | 2 | 0.138 | 0.138 | 0.138 |
| `agents:parse:sales.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:schema.md` | 2 | 0.139 | 0.139 | 0.139 |
| `agents:parse:social.md` | 3 | 0.178 | 0.200 | 0.200 |
| `agents:parse:support.md` | 1 | 0.165 | 0.165 | 0.165 |
| `agents:parse:upsell.md` | 1 | 0.167 | 0.167 | 0.167 |
| `agents:parse:welcome.md` | 1 | 0.115 | 0.115 | 0.115 |
| `agents:parse:designer.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:ehc-officer.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:eth-dev.md` | 1 | 0.218 | 0.218 | 0.218 |
| `agents:parse:founder.md` | 1 | 0.183 | 0.183 | 0.183 |
| `agents:parse:guard.md` | 1 | 0.113 | 0.113 | 0.113 |
| `agents:parse:harvester.md` | 1 | 0.199 | 0.199 | 0.199 |
| `agents:parse:ads.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:creative.md` | 1 | 0.172 | 0.172 | 0.172 |
| `agents:parse:director.md` | 1 | 0.148 | 0.148 | 0.148 |
| `agents:parse:media-buyer.md` | 1 | 0.178 | 0.178 | 0.178 |
| `agents:parse:seo.md` | 1 | 0.176 | 0.176 | 0.176 |
| `agents:parse:nanoclaw.md` | 1 | 0.273 | 0.273 | 0.273 |
| `agents:parse:ops.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:researcher.md` | 2 | 0.143 | 0.143 | 0.143 |
| `agents:parse:tutor.md` | 2 | 0.141 | 0.141 | 0.141 |
| `agents:parse:world.md` | 1 | 0.044 | 0.044 | 0.044 |
| `agents:parse:cfo.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:cto.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:router.md` | 1 | 0.207 | 0.207 | 0.207 |
| `agents:parse:scout.md` | 1 | 0.123 | 0.123 | 0.123 |
| `agents:parse:teacher.md` | 1 | 0.318 | 0.318 | 0.318 |
| `agents:parse:testnet-buyer.md` | 1 | 0.165 | 0.165 | 0.165 |
| `agents:parse:trader.md` | 1 | 0.186 | 0.186 | 0.186 |
| `agents:parse:writer.md` | 1 | 0.138 | 0.138 | 0.138 |
| `signalSender:mark` | 1 | 0.023 | 0.023 | 0.023 |
| `edge:cache:hit:sync-path` | 1 | 3.45e-5 | 3.45e-5 | 3.45e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 1539/1561 tests · 31261ms across 116 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `phase2-keypair-derivation.test.ts` | 14 | 7601ms |
| `llm.test.ts` | 14 | 6079ms |
| `tick.test.ts` | 9 | 3971ms |
| `llm-router.test.ts` | 12 | 3723ms |
| `system-speed.test.ts` | 15 | 1739ms |
| `adl-evolution.test.ts` | 7 | 1116ms |
| `sui.test.ts` | 6 | 914ms |
| `sui-speed.test.ts` | 7 | 607ms |
| `adl-llm.test.ts` | 5 | 449ms |
| `adl-cache.test.ts` | 38 | 337ms |

---

_Report generated 2026-04-18T10:24:43.100Z._
