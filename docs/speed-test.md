# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-15T18:19:27.919Z |
| Test run at | 2026-04-15T18:19:20.621Z |
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
| `routing:select:100` | 0.005ms | 0.007 | 0.007 | 0.007 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.084 | 0.084 | 0.084 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.006 | 0.006 | 0.006 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 6.47e-4 | 6.47e-4 | 6.47e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 1.42e-4 | 1.42e-4 | 1.42e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.53e-5 | 4.53e-5 | 4.53e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.143 | 0.143 | 0.143 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 8.31e-4 | 8.31e-4 | 8.31e-4 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.26e-4 | 1.26e-4 | 1.26e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 8.56e-4 | 8.56e-4 | 8.56e-4 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.020 | 0.020 | 0.020 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 3.05 | 3.05 | 3.05 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.78e-4 | 2.78e-4 | 2.78e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 3.03 | 3.03 | 3.03 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 3.94e-4 | 3.94e-4 | 3.94e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.043 | 0.043 | 0.043 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.603 | 0.603 | 0.603 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 5.65 | 5.65 | 5.65 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 2.88e-4 | 2.88e-4 | 2.88e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 2.10e-4 | 2.10e-4 | 2.10e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.97 | 2.97 | 2.97 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 4.60e-4 | 4.60e-4 | 4.60e-4 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 2.57e-4 | 2.57e-4 | 2.57e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 2.09e-4 | 2.09e-4 | 2.09e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 7.70e-5 | 7.70e-5 | 7.70e-5 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.405 | 0.405 | 0.405 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.019 | 0.019 | 0.019 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.011 | 0.011 | 0.011 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 4.84e-5 | 4.84e-5 | 4.84e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.123 | 0.123 | 0.123 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.168 | 0.168 | 0.168 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.80 | 2.80 | 2.80 |
| `agents:parse:analyst.md` | 2 | 0.204 | 0.204 | 0.204 |
| `agents:parse:asi-builder.md` | 1 | 0.519 | 0.519 | 0.519 |
| `agents:parse:coder.md` | 1 | 1.31 | 1.31 | 1.31 |
| `agents:parse:community.md` | 1 | 0.354 | 0.354 | 0.354 |
| `agents:parse:concierge.md` | 1 | 0.278 | 0.278 | 0.278 |
| `agents:parse:classify.md` | 1 | 0.275 | 0.275 | 0.275 |
| `agents:parse:valence.md` | 1 | 0.278 | 0.278 | 0.278 |
| `agents:parse:ai-ranking.md` | 2 | 0.790 | 0.790 | 0.790 |
| `agents:parse:citation.md` | 2 | 0.305 | 0.305 | 0.305 |
| `naming:scan-src` | 1 | 56.02 | 56.02 | 56.02 |
| `agents:parse:cmo.md` | 2 | 0.522 | 0.522 | 0.522 |
| `agents:parse:forum.md` | 2 | 0.274 | 0.274 | 0.274 |
| `agents:parse:full.md` | 2 | 0.226 | 0.226 | 0.226 |
| `agents:parse:monthly.md` | 2 | 0.280 | 0.280 | 0.280 |
| `agents:parse:niche-dir.md` | 2 | 0.208 | 0.208 | 0.208 |
| `agents:parse:outreach.md` | 2 | 0.162 | 0.162 | 0.162 |
| `agents:parse:quick.md` | 2 | 0.691 | 0.691 | 0.691 |
| `agents:parse:schema.md` | 2 | 0.529 | 0.529 | 0.529 |
| `agents:parse:social.md` | 3 | 0.150 | 0.185 | 0.185 |
| `agents:parse:designer.md` | 1 | 0.740 | 0.740 | 0.740 |
| `agents:parse:ehc-officer.md` | 1 | 1.18 | 1.18 | 1.18 |
| `agents:parse:eth-dev.md` | 1 | 0.377 | 0.377 | 0.377 |
| `agents:parse:founder.md` | 1 | 0.304 | 0.304 | 0.304 |
| `agents:parse:guard.md` | 1 | 0.219 | 0.219 | 0.219 |
| `agents:parse:harvester.md` | 1 | 0.133 | 0.133 | 0.133 |
| `agents:parse:ads.md` | 1 | 0.201 | 0.201 | 0.201 |
| `agents:parse:content.md` | 1 | 0.507 | 0.507 | 0.507 |
| `agents:parse:creative.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:director.md` | 1 | 0.155 | 0.155 | 0.155 |
| `agents:parse:media-buyer.md` | 1 | 0.509 | 0.509 | 0.509 |
| `agents:parse:seo.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:nanoclaw.md` | 1 | 0.231 | 0.231 | 0.231 |
| `agents:parse:ops.md` | 1 | 0.212 | 0.212 | 0.212 |
| `agents:parse:researcher.md` | 1 | 0.171 | 0.171 | 0.171 |
| `agents:parse:router.md` | 1 | 0.221 | 0.221 | 0.221 |
| `agents:parse:scout.md` | 1 | 0.125 | 0.125 | 0.125 |
| `agents:parse:teacher.md` | 1 | 0.326 | 0.326 | 0.326 |
| `agents:parse:trader.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:tutor.md` | 1 | 0.412 | 0.412 | 0.412 |
| `agents:parse:writer.md` | 1 | 0.152 | 0.152 | 0.152 |
| `signalSender:mark` | 1 | 0.036 | 0.036 | 0.036 |
| `edge:cache:hit:sync-path` | 1 | 4.28e-5 | 4.28e-5 | 4.28e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✓ 860/869 tests · 18212ms across 73 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `llm.test.ts` | 14 | 6079ms |
| `llm-router.test.ts` | 12 | 4039ms |
| `system-speed.test.ts` | 15 | 1264ms |
| `adl-evolution.test.ts` | 7 | 1257ms |
| `sui-speed.test.ts` | 7 | 812ms |
| `sui.test.ts` | 6 | 708ms |
| `adl-llm.test.ts` | 5 | 647ms |
| `adl-cache.test.ts` | 38 | 361ms |
| `api-key.test.ts` | 13 | 280ms |
| `adl-api.test.ts` | 5 | 272ms |

---

_Report generated 2026-04-15T18:19:27.935Z._
