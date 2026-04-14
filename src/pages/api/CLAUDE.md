# API Routes

**Skills: `/typedb` for TQL queries, `/astro` for route patterns, `/sui` for Sui integration.**

All routes map to the Six Verbs from [dictionary.md](../../docs/dictionary.md):
`send → signal`, `mark → mark/warn`, `fade → decay`, `follow → discover/highways`, `harden → hypotheses`.

---

## Core Loop — The Six Verbs

These endpoints implement the substrate's nervous system.

| Route | Method | Verb | Purpose |
|-------|--------|------|---------|
| `/api/signal` | POST | send | Emit signal into substrate `{receiver, data: {tags, weight, content}}` |
| `/api/mark` | POST | mark | Strengthen a path (positive feedback) |
| `/api/tick` | GET | tick | Run one growth cycle (L1-L7 loops, interval-gated) |
| `/api/decay` | POST | fade | Trigger asymmetric decay (resistance fades 2x faster) |
| `/api/decay-cycle` | POST | fade | Decay with before/after stats |
| `/api/subscribe` | POST | follow | Subscribe unit to tags for filtered signal delivery |

### Signal Shape

Every signal follows the canonical shape from dictionary.md:

```typescript
{
  receiver: string,           // "unit" or "unit:skill"
  data?: {
    tags?: string[],          // classification + routing
    weight?: number,          // pheromone: + marks, − warns
    content?: unknown         // the actual payload
  }
}
```

### Tick Response

```typescript
{
  ticked: boolean,
  result: { selected, success, task?, highways, evolved?, hardened?, frontiers? },
  loopTimings: { l1...l7: { interval, lastAtMs, nextAtMs } }
}
```

Query params: `?interval=60` (seconds), `?reload=1` (force TypeDB refresh), `?peek=1` (report without running).

---

## Actors — Dimension 2

Manage units (agents, humans, worlds).

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agents` | GET | List all units with success-rate, generation, status |
| `/api/agents/sync` | POST | Sync agent(s) from markdown to TypeDB (single or world) |
| `/api/agents/register` | POST | Register new unit in TypeDB + derive Sui wallet |
| `/api/agents/discover` | GET | Find units by tag or capability |
| `/api/agents/:id/status` | POST | Set unit active/inactive |
| `/api/agents/:id/commend` | POST | Boost success-rate +0.1, strengthen outgoing paths |
| `/api/agents/:id/flag` | POST | Lower success-rate −0.15, add resistance to paths |
| `/api/agents/:id/capabilities` | GET | List unit's offered skills |
| `/api/claw` | POST | Generate NanoClaw config for any agent |

### /api/claw

Add a NanoClaw (edge worker + LLM + substrate tools) to any agent.

```bash
# From agent markdown
curl -X POST /api/claw -d '{"agentId": "tutor"}'

# Direct config
curl -X POST /api/claw -d '{"name": "helper", "model": "...", "systemPrompt": "..."}'
```

Returns: `{persona, wranglerConfig, deployCommands, tools}`.

**Tools available to every claw:**
- `signal` — emit signal to substrate
- `discover` — find agents by tag
- `remember` — store insight in TypeDB
- `recall` — retrieve learned patterns
- `highways` — get proven paths
- `mark` / `warn` — feedback on paths

---

## Things — Dimension 3

Manage skills and tasks.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tasks` | GET | List tasks with pheromone categories (ready/attractive/repelled/exploratory) |
| `/api/tasks` | POST | Create task with `{id, name, tags, value, phase, persona, blocks}` |
| `/api/tasks/:category` | GET | Filter by category: `ready`, `attractive`, `repelled`, `exploratory` |
| `/api/tasks/:id/complete` | POST | Close loop: `{outcome: "result"|"timeout"|"dissolved"|"failure"}` |
| `/api/tasks/:id/claim` | POST | Claim task for execution (lease-based) |
| `/api/tasks/:id/release` | POST | Release claimed task |
| `/api/tasks/sync` | POST | Sync tasks from TODO markdown to TypeDB |
| `/api/tasks/expire` | POST | Release stale claims (>30min) |
| `/api/tasks/import-roadmap` | POST | Seed roadmap as tagged skills + paths |

### Task Categories (Pheromone-Based)

| Category | Condition | Meaning |
|----------|-----------|---------|
| `attractive` | strength ≥ 50 | Proven path, high confidence |
| `repelled` | resistance ≥ 30, resistance > strength | Toxic path, avoid |
| `exploratory` | strength = 0, resistance = 0 | Never tried |
| `ready` | everything else | Normal priority |

### Four Outcomes (dictionary.md)

```
result     → mark(edge, depth)    chain strengthens
timeout    → neutral              slow, not bad
dissolved  → warn(edge, 0.5)      missing unit/capability
failure    → warn(edge, 1)        agent produced nothing
```

---

## Paths — Dimension 4

Read and manage weighted connections.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/export/paths` | GET | All paths with strength/resistance/traversals |
| `/api/export/highways` | GET | Proven paths (strength ≥ threshold) |
| `/api/export/toxic` | GET | Blocked paths (resistance > 2× strength) |
| `/api/resistance` | GET | Paths sorted by resistance (failure patterns) |
| `/api/state` | GET | Full world state (units, edges, highways, stats) |

### Path Formula

```
effective = strength − resistance
toxic = resistance ≥ 10 && resistance > strength × 2 && samples > 5
```

---

## Events — Dimension 5

Signal history and loop execution.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/signals` | GET | Recent signal history |
| `/api/loop/close` | POST | Close current loop iteration with rubric scores |
| `/api/loop/stage` | GET/POST | Wave execution stage tracking |
| `/api/loop/highways` | GET | Highways visible to current loop |
| `/api/loop/mark-dims` | POST | Mark rubric dimensions `{fit, form, truth, taste}` |

### Rubric Dimensions

Every task completion scores four dimensions (from rubrics.md):

| Dim | What it measures |
|-----|-----------------|
| `fit` | Does it solve the stated problem? |
| `form` | Is the code/doc well-structured? |
| `truth` | Is it factually correct? |
| `taste` | Does it feel right? |

Gate: all dims ≥ 0.65 to pass.

---

## Knowledge — Dimension 6

What the substrate has learned.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/hypotheses` | GET | Confirmed and testing hypotheses |
| `/api/frontiers` | GET | Unexplored tag clusters |
| `/api/intents/learn` | POST | Learn intent → canonical mapping |
| `/api/intents/stats` | GET | Intent cache statistics |
| `/api/context` | GET | Load context docs by key |
| `/api/context/ingest` | POST | Ingest docs into context store |

### Hypothesis Status

```
testing   → still accumulating observations
confirmed → p-value < 0.05, enough samples
rejected  → failed to confirm after samples
```

---

## Groups — Dimension 1

Organization and team structures.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/export/groups` | GET | All groups with members |
| `/api/team` | GET | Team structure for current world |

---

## Infrastructure

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Health check (returns `{ok: true}`) |
| `/api/stats` | GET | Aggregate stats (units, skills, highways, revenue) |
| `/api/query` | POST | Run raw TypeQL `{query: "match..."}` |
| `/api/chat` | POST | AI chat endpoint (OpenRouter streaming) |
| `/api/pay` | POST | Payment signal (L4 economic loop) |
| `/api/revenue` | GET | Revenue by path |
| `/api/absorb` | POST | Poll Sui events, sync to TypeDB (bridge) |
| `/api/ws` | GET | WebSocket upgrade for real-time updates |

### Export Endpoints

| Route | Format | What |
|-------|--------|------|
| `/api/export/units` | JSON | All units |
| `/api/export/skills` | JSON | All skills |
| `/api/export/paths` | JSON | All paths |
| `/api/export/groups` | JSON | All groups |
| `/api/export/highways` | JSON | Proven paths |
| `/api/export/toxic` | JSON | Blocked paths |
| `/api/export/public/*` | JSON | Public-safe versions |

---

## Auth

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...all]` | ALL | Better Auth endpoints |
| `/api/auth/agent` | POST | Agent authentication |
| `/api/auth/api-keys` | GET/POST | API key management |

---

## Waves

Wave-based execution control.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/waves/:docname/claim` | POST | Claim wave for execution |
| `/api/waves/:docname/release` | POST | Release wave claim |
| `/api/waves/expire` | POST | Release stale wave locks (>2h) |

---

## Pattern

```typescript
import type { APIRoute } from 'astro'
import { readParsed, writeSilent } from '@/lib/typedb'

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  
  // Read from TypeDB
  const rows = await readParsed(`match $u isa unit; select $u;`)
  
  // Write (fire-and-forget for speed)
  writeSilent(`insert $s isa signal, has data "...";`)
  
  return Response.json({ ok: true, rows })
}
```

---

## Substrate Learning

Every endpoint participates in the closed loop:

```
POST /api/signal     → signal enters → mark/warn → learning happens
GET  /api/tick       → select → ask → mark/warn → fade → evolve → know
POST /api/tasks/:id/complete → selfCheckoff → mark path → unblock dependents
POST /api/claw       → generate config → deploy → tools available
```

**Speed contract:** routing `<0.005ms`, mark `<0.001ms`. The API is the substrate's surface — fast enough to be invisible next to the LLM.

---

## See Also

- [dictionary.md](../../docs/dictionary.md) — The Six Verbs, The Seed, canonical names
- [DSL.md](../../docs/DSL.md) — Signal grammar
- [routing.md](../../docs/routing.md) — The deterministic sandwich
- [rubrics.md](../../docs/rubrics.md) — Quality scoring
- [speed.md](../../docs/speed.md) — Performance benchmarks
