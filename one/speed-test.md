# System Speed Report

> **Auto-generated** by `scripts/speed-report.ts` after every `bun run test`.
> Measures the **production substrate's speed**, not the test suite itself.
> Budgets are sourced from [speed.md](./speed.md); verdicts use `PERF_SCALE=3`.

|  |  |
|---|---|
| Generated at | 2026-04-20T05:55:58.558Z |
| Test run at | 2026-04-20T05:55:28.745Z |
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
| `routing:select:100` | 0.005ms | 0.008 | 0.008 | 0.008 | 1 | ◐ pass (within 3× scale) | LLM routing (~300ms) |
| `routing:select:1000` | 1.00ms | 0.094 | 0.094 | 0.094 | 1 | ✓ pass | search API + rank |
| `routing:follow` | 0.050ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass | keyword search |
| `routing:follow:batch-10k` | 0.005ms | 0.005 | 0.005 | 0.005 | 1 | ◐ pass (within 3× scale) |  |

### Pheromone Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `pheromone:mark` | 0.001ms | 4.30e-4 | 4.30e-4 | 4.30e-4 | 1 | ✓ pass | DB write (~10ms) |
| `pheromone:warn` | 0.001ms | 2.14e-4 | 2.14e-4 | 2.14e-4 | 1 | ✓ pass |  |
| `pheromone:sense` | 0.001ms | 4.24e-5 | 4.24e-5 | 4.24e-5 | 1 | ✓ pass |  |
| `pheromone:fade:1000` | 5.00ms | 0.185 | 0.185 | 0.185 | 1 | ✓ pass |  |
| `pheromone:highways:top10` | 5.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass |  |

### Signal Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `signal:dispatch` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | HTTP call (~50ms) |
| `signal:dispatch:dissolved` | 1.00ms | 1.25e-4 | 1.25e-4 | 1.25e-4 | 1 | ✓ pass |  |
| `signal:queue:roundtrip` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `signal:ask:chain-3` | 100ms | 0.015 | 0.015 | 0.015 | 1 | ✓ pass | 3 sequential LLM (~6s) |

### Identity Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `identity:sui:address` | 5.00ms | 2.39 | 2.39 | 2.39 | 1 | ✓ pass |  |

### Edge Cache Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `edge:cache:hit` | 0.010ms | 2.71e-4 | 2.71e-4 | 2.71e-4 | 1 | ✓ pass | TypeDB round-trip (~100ms) |

### Sui Layer

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `sui:keypair:derive` | 5.00ms | 4.05 | 4.05 | 4.05 | 1 | ✓ pass | HSM round-trip |
| `sui:keypair:platform` | 0.001ms | 1.39e-4 | 1.39e-4 | 1.39e-4 | 1 | ✓ pass |  |
| `sui:tx:build` | 0.010ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `sui:tx:build:movecall` | 0.100ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `sui:sign` | 5.00ms | 0.493 | 0.493 | 0.493 | 1 | ✓ pass |  |

### Bridge (TypeDB ↔ Sui)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `bridge:mirror:unit` | 10.00ms | 0.097 | 0.097 | 0.097 | 1 | ✓ pass | manual on-chain deploy |
| `bridge:mirror:mark` | 5.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |

### Lifecycle Stages

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `lifecycle:register` | 10.00ms | 3.80 | 3.80 | 3.80 | 1 | ✓ pass | agent onboarding flow |
| `lifecycle:capable:build` | 0.100ms | 3.68e-4 | 3.68e-4 | 3.68e-4 | 1 | ✓ pass |  |
| `lifecycle:discover` | 1.00ms | 0.002 | 0.002 | 0.002 | 1 | ✓ pass | search + rank API |
| `lifecycle:signal+mark` | 5.00ms | 0.009 | 0.009 | 0.009 | 1 | ✓ pass |  |
| `lifecycle:highway:select` | 0.010ms | 0.003 | 0.003 | 0.003 | 1 | ✓ pass | LLM decision |
| `lifecycle:federate:hop` | 1.00ms | 1.69e-4 | 1.69e-4 | 1.69e-4 | 1 | ✓ pass |  |
| `lifecycle:e2e` | 50.00ms | 2.65 | 2.65 | 2.65 | 1 | ✓ pass |  |

### Intent Cache

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `intent:resolve:label` | 0.050ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass | LLM classify (~500ms) |
| `intent:resolve:keyword` | 0.100ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass |  |
| `intent:resolve:miss` | 0.050ms | 8.36e-4 | 8.36e-4 | 8.36e-4 | 1 | ✓ pass |  |

### WebSocket Broadcast

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ws:broadcast:roundtrip` | 1.00ms | 4.83e-4 | 4.83e-4 | 4.83e-4 | 1 | ✓ pass | polling loop (~5s) |

### Durable Ask

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `ask:durable:overhead` | 30.00ms | 0.006 | 0.006 | 0.006 | 1 | ✓ pass |  |

### Channels

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `channels:telegram:normalize` | 0.050ms | 1.59e-4 | 1.59e-4 | 1.59e-4 | 1 | ✓ pass |  |
| `channels:web:message` | 0.010ms | 3.31e-4 | 3.31e-4 | 3.31e-4 | 1 | ✓ pass |  |

### Slow Loops (L3–L7)

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `loop:L3:fade:1000` | 5.00ms | 0.167 | 0.167 | 0.167 | 1 | ✓ pass |  |
| `loop:L4:economic` | 10.00ms | 0.014 | 0.014 | 0.014 | 1 | ✓ pass |  |
| `loop:L5:evolution:detect` | 5.00ms | 0.010 | 0.010 | 0.010 | 1 | ✓ pass |  |
| `loop:L6:know:scan` | 1.00ms | 0.001 | 0.001 | 0.001 | 1 | ✓ pass |  |
| `loop:L7:frontier:scan` | 5.00ms | 0.005 | 0.005 | 0.005 | 1 | ✓ pass |  |

### Page SSR

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `page:ssr:world` | 1.00ms | 0.007 | 0.007 | 0.007 | 1 | ✓ pass | client fetch waterfall (~500ms) |
| `page:ssr:chat:config` | 0.010ms | 3.57e-5 | 3.57e-5 | 3.57e-5 | 1 | ✓ pass |  |

### TypeDB Read Path

| Operation | Budget | p50 | p95 | max | n | Verdict | Replaces |
|-----------|-------:|----:|----:|----:|--:|:--------|----------|
| `typedb:read:parse` | 1.00ms | 0.088 | 0.088 | 0.088 | 1 | ✓ pass |  |
| `typedb:read:boot` | 10.00ms | 0.075 | 0.075 | 0.075 | 1 | ✓ pass |  |

### Ad-hoc samples (no budget)

| Name | n | p50 | p95 | max |
|------|--:|----:|----:|----:|
| `sui:address:derive` | 1 | 2.72 | 2.72 | 2.72 |
| `naming:scan-src` | 1 | 104 | 104 | 104 |
| `agents:parse:analyst.md` | 2 | 0.190 | 0.190 | 0.190 |
| `agents:parse:asi-builder.md` | 1 | 0.245 | 0.245 | 0.245 |
| `agents:parse:ceo.md` | 4 | 0.241 | 0.298 | 0.298 |
| `agents:parse:coder.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:community-director.md` | 1 | 0.364 | 0.364 | 0.364 |
| `agents:parse:community.md` | 2 | 0.243 | 0.243 | 0.243 |
| `agents:parse:concierge.md` | 3 | 0.157 | 0.168 | 0.168 |
| `agents:parse:classify.md` | 1 | 0.079 | 0.079 | 0.079 |
| `agents:parse:valence.md` | 1 | 0.078 | 0.078 | 0.078 |
| `agents:parse:bob.md` | 1 | 0.161 | 0.161 | 0.161 |
| `agents:parse:lexi.md` | 1 | 0.127 | 0.127 | 0.127 |
| `agents:parse:david.md` | 1 | 0.118 | 0.118 | 0.118 |
| `agents:parse:ai-ranking.md` | 2 | 0.216 | 0.216 | 0.216 |
| `agents:parse:amara.md` | 1 | 0.261 | 0.261 | 0.261 |
| `agents:parse:assessment.md` | 1 | 0.363 | 0.363 | 0.363 |
| `agents:parse:citation.md` | 2 | 0.150 | 0.150 | 0.150 |
| `agents:parse:cmo.md` | 3 | 0.228 | 0.251 | 0.251 |
| `agents:parse:content.md` | 2 | 0.181 | 0.181 | 0.181 |
| `agents:parse:edu.md` | 1 | 0.207 | 0.207 | 0.207 |
| `agents:parse:enrollment.md` | 1 | 0.265 | 0.265 | 0.265 |
| `agents:parse:forum.md` | 2 | 0.160 | 0.160 | 0.160 |
| `agents:parse:full.md` | 2 | 0.145 | 0.145 | 0.145 |
| `agents:parse:mktg.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:monthly.md` | 2 | 0.144 | 0.144 | 0.144 |
| `agents:parse:niche-dir.md` | 2 | 0.215 | 0.215 | 0.215 |
| `agents:parse:outreach.md` | 2 | 0.145 | 0.145 | 0.145 |
| `agents:parse:quick.md` | 2 | 0.143 | 0.143 | 0.143 |
| `agents:parse:sales.md` | 1 | 0.165 | 0.165 | 0.165 |
| `agents:parse:schema.md` | 2 | 0.144 | 0.144 | 0.144 |
| `agents:parse:social.md` | 4 | 0.189 | 0.250 | 0.250 |
| `agents:parse:support.md` | 2 | 0.244 | 0.244 | 0.244 |
| `agents:parse:upsell.md` | 1 | 0.174 | 0.174 | 0.174 |
| `agents:parse:welcome.md` | 1 | 0.119 | 0.119 | 0.119 |
| `agents:parse:designer.md` | 1 | 0.196 | 0.196 | 0.196 |
| `agents:parse:ehc-officer.md` | 1 | 0.205 | 0.205 | 0.205 |
| `agents:parse:engineering-director.md` | 1 | 0.312 | 0.312 | 0.312 |
| `agents:parse:eth-dev.md` | 1 | 0.236 | 0.236 | 0.236 |
| `agents:parse:founder.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:guard.md` | 1 | 0.177 | 0.177 | 0.177 |
| `agents:parse:harvester.md` | 1 | 0.121 | 0.121 | 0.121 |
| `agents:parse:ads.md` | 2 | 0.194 | 0.194 | 0.194 |
| `agents:parse:creative.md` | 1 | 0.182 | 0.182 | 0.182 |
| `agents:parse:director.md` | 3 | 0.192 | 0.194 | 0.194 |
| `agents:parse:media-buyer.md` | 1 | 0.229 | 0.229 | 0.229 |
| `agents:parse:seo.md` | 2 | 0.301 | 0.301 | 0.301 |
| `agents:parse:marketing-director.md` | 1 | 0.296 | 0.296 | 0.296 |
| `agents:parse:nanoclaw.md` | 1 | 0.241 | 0.241 | 0.241 |
| `agents:parse:ops.md` | 1 | 0.197 | 0.197 | 0.197 |
| `agents:parse:researcher.md` | 2 | 0.148 | 0.148 | 0.148 |
| `agents:parse:tutor.md` | 2 | 0.143 | 0.143 | 0.143 |
| `agents:parse:world.md` | 1 | 0.040 | 0.040 | 0.040 |
| `agents:parse:cfo.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:cto.md` | 1 | 0.195 | 0.195 | 0.195 |
| `agents:parse:router.md` | 1 | 0.163 | 0.163 | 0.163 |
| `agents:parse:sales-director.md` | 1 | 0.326 | 0.326 | 0.326 |
| `agents:parse:scout.md` | 1 | 0.158 | 0.158 | 0.158 |
| `agents:parse:service-director.md` | 1 | 0.277 | 0.277 | 0.277 |
| `agents:parse:teacher.md` | 1 | 0.332 | 0.332 | 0.332 |
| `agents:parse:moderator.md` | 1 | 0.194 | 0.194 | 0.194 |
| `agents:parse:writer.md` | 2 | 0.280 | 0.280 | 0.280 |
| `agents:parse:testnet-buyer.md` | 1 | 0.156 | 0.156 | 0.156 |
| `agents:parse:trader.md` | 1 | 0.190 | 0.190 | 0.190 |
| `agents:parse:you.md` | 1 | 0.228 | 0.228 | 0.228 |
| `signalSender:mark` | 1 | 0.022 | 0.022 | 0.022 |
| `edge:cache:hit:sync-path` | 1 | 2.97e-5 | 2.97e-5 | 2.97e-5 |


---

## Appendix — Test Gate Timing (not system speed)

This is the **test harness** duration, not the production system. Kept here
so we notice if the gate itself grows too slow to run inside the AI edit loop.

**Totals:** ✗ 1613/1642 tests · 61261ms across 127 files

Top 10 slowest test files:

| File | Tests | Duration |
|------|------:|---------:|
| `chairman-chain.test.ts` | 27 | 24853ms |
| `phase2-keypair-derivation.test.ts` | 14 | 14876ms |
| `llm.test.ts` | 14 | 6071ms |
| `llm-router.test.ts` | 12 | 3738ms |
| `chat-chairman-integration.test.ts` | 6 | 1233ms |
| `system-speed.test.ts` | 15 | 1201ms |
| `tick.test.ts` | 9 | 938ms |
| `api-endpoints.test.ts` | 21 | 825ms |
| `sui-speed.test.ts` | 7 | 717ms |
| `sui.test.ts` | 6 | 489ms |

---

_Report generated 2026-04-20T05:55:58.571Z._
