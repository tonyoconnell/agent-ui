# Speed: Full-Stack Benchmarks

Measure everything. The ONE substrate runs at three scales: **nervous system** (ms), **growth** (min), **knowledge** (hour).

This doc tests all three and captures baseline performance across Cloudflare + Astro + TypeDB + routing.

---

## 🧬 Lifecycle Constraints (The Deadlines)

From [lifecycle.md](lifecycle.md), speed is not abstract—it's bound to the agent lifecycle. Every stage has a speed requirement:

| Lifecycle Stage | Constraint | Why | Speedtest |
|-----------------|-----------|-----|-----------|
| **SIGNAL** (L1) | Route signal in < signal latency | Each signal must complete before next one fires | `signal_routing` |
| **DROP** (L2) | Mark path in < 1ms | Success is recorded on every completion | `pheromone_mark` |
| **ALARM** (L2) | Warn path in < 1ms | Failure must be recorded instantly (asymmetric decay) | `pheromone_warn` |
| **FADE** (L3) | Decay all paths in < 5ms | "No signals for 30 days → strength 82 → 22 (no longer highway)" | `fade_decay` |
| **HIGHWAY** (L2–L3) | Query top paths in < 10ms | "<10ms instead of 2s LLM routing" — highways enable auto-routing | `highways_query` |
| **DISCOVER** (L1) | Find agent in < 100ms | discovery ← fresh routing ← current trails | `ask_latency` |
| **FEDERATE** (L2–L3) | Cross-group signal in < 50ms | Federation fee is per signal; must not dominate cost | measured in integration tests |
| **CRYSTALLIZE** (L4) | Freeze highway on Sui in < 1s | Once/highway (not per signal); TypeDB + Sui sync | measured in L4 tests |

**The core rule:** Nervous system (L1–L3) must be invisible compared to LLM latency (~100–500ms). If marking a path takes 50ms, it's not invisible. At 0.01ms, it is.

---

## What We're Testing

```
┌────────────────┬──────────────────┬─────────────────┐
│ Layer          │ Component        │ Metric          │
├────────────────┼──────────────────┼─────────────────┤
│ Signal (L1)    │ enqueue/drain    │ ms per signal   │
│ Trail (L2)     │ mark/warn        │ strength-write  │
│ Fade (L3)      │ decay all paths  │ ms per fade     │
│ Economic (L4)  │ revenue/payment  │ path-to-revenue │
│ Evolution (L5) │ prompt rewrite   │ trigger + time  │
│ Knowledge (L6) │ highway → fact   │ recall latency  │
│ Frontier (L7)  │ unknowns detect  │ cluster → tag   │
├────────────────┼──────────────────┼─────────────────┤
│ TypeDB         │ All queries      │ p50/p95/p99     │
│ Edge (CF)      │ Gateway + Sync   │ latency + ttfb  │
│ Page Load      │ Astro SSR        │ ttfb + fcp      │
│ Chain Depth    │ Continuations    │ signal depth    │
└────────────────┴──────────────────┴─────────────────┘
```

## Baseline Targets

### Nervous System (L1–L3, ms scale)

| Operation | Target | Notes |
|-----------|--------|-------|
| signal() | < 1ms | in-memory route |
| enqueue/drain | < 2ms | queue shift + handler fire |
| mark() | < 0.5ms | strength accumulate |
| warn() | < 0.5ms | resistance accumulate |
| fade() (all paths) | < 5ms | 1000 edges, asymmetric decay |
| ask() (with timeout) | < 100ms | signal + wait + mark |

### Brain (L4–L7, min/hour scale)

| Loop | Runs | Target | Notes |
|------|------|--------|-------|
| L4 Economic | per payment | < 50ms | lookup cost, apply revenue |
| L5 Evolution | every 10m | < 1s | rewrite 1 prompt, 24h cooldown |
| L6 Knowledge | every 1h | < 5s | top 50 paths → facts |
| L7 Frontier | every 1h | < 2s | unknown clusters → tag candidates |

### TypeDB Cloud (Port 1729)

| Query Type | Target p50 | Target p95 | Notes |
|------------|-----------|-----------|-------|
| Insert (agent) | 200ms | 500ms | sync agent spec |
| Insert (path) | 50ms | 150ms | single strength update |
| Query (unit) | 100ms | 300ms | lookup by uid |
| Query (top paths) | 300ms | 800ms | top 50 edges with depth |
| Query (knowledge) | 400ms | 1200ms | hypothesis recall, multi-match |

### Cloudflare Edge (Gateway + Sync Worker)

| Route | Target p50 | Target p95 | Notes |
|-------|-----------|-----------|-------|
| `/health` | < 10ms | < 20ms | sync worker heartbeat |
| `/api/agents/sync` | 500ms | 2s | parse → toTypeDB → insert |
| `/export/highways` | 300ms | 1s | TypeDB query → JSON |
| `/export/paths` | 400ms | 1.5s | full path snapshot |

### Astro Pages (SSR)

| Page | TTFB | FCP | Notes |
|-----|------|-----|-------|
| `/` (home) | < 200ms | < 500ms | Astro SSR + hydration |
| `/colony` (editor) | < 300ms | < 800ms | ColonyEditor client:load |
| `/highways` (graph) | < 250ms | < 700ms | HighwaysGraph client:visible |

---

## Why These Targets Matter

**Lifecycle drives speed.** From lifecycle.md:

- **<1ms nervous system** (L1–L3): Signals must complete before the next one fires. If marking takes 500ms, the substrate blocks. At 0.01ms, it's invisible.
- **<10ms highways** (L2–L3): "Highway routing <10ms instead of 2s LLM call." The economic flywheel requires fast reads; no one will use highways that take longer than a fresh LLM inference.
- **30-day fade window** (L3): Agents with no signals for 30 days fade from highway status (strength 82 → 22). Fade must be fast enough to run daily; slow fade = stale agents clogging the graph.
- **<1s crystallization** (L4): Freezing a highway on Sui is rare (once per proven highway) but must be fast. If crystallization takes 10s, the entire TypeDB sync stalls.
- **No signal = free dissolution** (L10): Agents that vanish leave trails behind; trails fade naturally. This is the cleanup mechanism. If fade is slow, the graph bloats.

**In summary:** Speed is not about benchmarks. It's about keeping the graph fresh, preventing monopolies, and making highways economically viable. Every microsecond saved is money saved.

---

## Test Suite

### 1. Signal Routing (Nervous System)

```typescript
// src/pages/api/speedtest/signal.ts
// Route: POST /api/speedtest/signal

const net = persist()
  .actor('alice', 'agent')
  .actor('bob', 'agent')

const times = []
for (let i = 0; i < 1000; i++) {
  const t0 = performance.now()
  net.signal({ receiver: 'bob', data: { count: i } }, 'alice')
  times.push(performance.now() - t0)
}

// Response: p50, p95, p99, min, max, mean
```

### 2. Ask + Timeout (Full Cycle)

```typescript
// src/pages/api/speedtest/ask.ts
const net = persist()
  .actor('charlie', 'agent')
  .on('ping', () => ({ pong: true }))

const times = []
for (let i = 0; i < 100; i++) {
  const t0 = performance.now()
  const { result } = await net.ask({ receiver: 'charlie:ping' })
  times.push(performance.now() - t0)
}

// Response: success rate, avg latency, p99
```

### 3. Mark + Warn (Pheromone)

```typescript
// src/pages/api/speedtest/pheromone.ts
const net = persist()

const times = []
for (let i = 0; i < 1000; i++) {
  const t0 = performance.now()
  net.mark(['alice:task', 'bob:task'], 1 + i) // depth scaling
  times.push(performance.now() - t0)
}

// Response: p50/p95/p99 mark time, strength distribution
```

### 4. Fade (Decay All Paths)

```typescript
// src/pages/api/speedtest/fade.ts
const net = persist()

// Seed 1000 paths
for (let i = 0; i < 1000; i++) {
  net.mark([`unit${i}:a`, `unit${i % 100}:b`], Math.random() * 100)
}

// Time the fade
const t0 = performance.now()
net.fade(0.05)
const fadeTime = performance.now() - t0

// Response: fadeTime, edges-faded, strength-after
```

### 5. TypeDB Inserts (Sync)

```typescript
// src/pages/api/speedtest/typedb-insert.ts
// Route: POST /api/speedtest/typedb-insert?count=100

const times = []
for (let i = 0; i < count; i++) {
  const t0 = performance.now()
  
  // Insert one path
  await typedb.query(`
    insert (from: (select $u isa unit, has uid "alice:task"),
             to: (select $v isa unit, has uid "bob:task${i}"))
      isa path,
      has strength ${Math.random() * 50}
  `)
  
  times.push(performance.now() - t0)
}

// Response: p50/p95/p99, inserts/sec
```

### 6. TypeDB Queries (Recall)

```typescript
// src/pages/api/speedtest/typedb-query.ts
const times = []

for (let i = 0; i < 100; i++) {
  const t0 = performance.now()
  
  const paths = await typedb.query(`
    match (from: $u, to: $v) isa path, has strength $s;
    sort $s desc; limit 50;
  `)
  
  times.push(performance.now() - t0)
}

// Response: query count, p50/p95/p99, paths-returned
```

### 7. Chain Depth (Continuations)

```typescript
// src/pages/api/speedtest/chain.ts
// Each task triggers the next. Measure signal depth + latency.

const net = persist()
  .actor('unit-0', 'agent')
  .actor('unit-1', 'agent')
  .actor('unit-2', 'agent')
  .actor('unit-3', 'agent')
  .actor('unit-4', 'agent')

// Chain: 0→1→2→3→4
net.add('unit-0').then('task', () => ({ receiver: 'unit-1:task' }))
net.add('unit-1').then('task', () => ({ receiver: 'unit-2:task' }))
// ... etc

const t0 = performance.now()
await net.ask({ receiver: 'unit-0:task', data: { depth: 5 } })
const chainTime = performance.now() - t0

// Response: chainTime, expected (depth * signal-latency)
```

### 8. Page Load (Astro SSR)

```typescript
// Run from edge: measure TTFB + FCP
// Use CloudFlare Analytics Engine

// POST /api/speedtest/lighthouse
// Returns: Lighthouse report for /, /colony, /highways
```

## How to Run

### Local (dev mode)
```bash
npm run dev
curl http://localhost:4321/api/speedtest/signal
curl http://localhost:4321/api/speedtest/pheromone
curl http://localhost:4321/api/speedtest/typedb-query
```

### Staging (CF Workers)
```bash
npm run build
npx wrangler pages deploy dist/ --project-name=one-substrate-test

curl https://one-substrate-test.pages.dev/api/speedtest/signal
curl https://one-substrate-test.pages.dev/api/speedtest/typedb-insert?count=100
```

### Production (api.one.ie)
```bash
# Gateway + Sync + Pages must be deployed
curl https://api.one.ie/speedtest/signal
curl https://nanoclaw.oneie.workers.dev/speedtest/health
```

## Dashboard

Single page: `/speedtest`

```astro
---
// src/pages/speedtest.astro
---

<Layout title="Speed">
  <SpeedTestUI client:load />
</Layout>
```

React component runs all tests, charts results:
- Signal p50/p95/p99 histogram
- TypeDB latency graph (over 100 queries)
- Chain depth vs time (linear?)
- Fade decay curve
- Edge latency heatmap (by region, if available)

## Recording Results

After each run, save to `docs/speed-results/YYYY-MM-DD-HH-MM.json`:

```json
{
  "timestamp": "2026-04-07T14:32:00Z",
  "environment": "production",
  "region": "us-west",
  "results": {
    "signal": {
      "runs": 1000,
      "p50_ms": 0.24,
      "p95_ms": 0.61,
      "p99_ms": 1.02,
      "min_ms": 0.11,
      "max_ms": 2.3
    },
    "typedb_query": {
      "runs": 100,
      "p50_ms": 145,
      "p95_ms": 380,
      "p99_ms": 890,
      "paths_returned": 50
    },
    "chain_depth": {
      "depth": 5,
      "time_ms": 8.4,
      "expected_ms": 5.0
    },
    "page_load": {
      "ttfb_ms": 140,
      "fcp_ms": 420
    }
  }
}
```

## CI Integration

GitHub Actions: run speedtest on every merge to main.

```yaml
# .github/workflows/speedtest.yml
on:
  push:
    branches: [main]

jobs:
  speedtest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npm run speedtest > results.json
      - uses: actions/upload-artifact@v3
        with:
          name: speedtest-results
          path: results.json
```

## Regression Thresholds

If any metric exceeds baseline by > 20%, fail CI.

```typescript
// src/lib/speedtest.ts
const THRESHOLDS = {
  signal_p95: 0.72,      // baseline 0.61 + 20%
  typedb_query_p95: 456,
  chain_depth_p95: 12,
  page_ttfb_p95: 280,
}

function checkRegression(results) {
  Object.entries(THRESHOLDS).forEach(([key, max]) => {
    if (results[key] > max) {
      throw new Error(`REGRESSION: ${key} = ${results[key]} > ${max}`)
    }
  })
}
```

---

**Run this weekly. Share results with team. Speed is signal. Signal is learning.**
