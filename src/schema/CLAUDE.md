# Schema Directory

**Skills: `/typedb` for TQL work (TypeDB 3.x uses `fun` NOT `rule`), `/sui` for Sui entity mapping.**

TypeDB 3.0 schema for the ONE world. TypeDB is the brain — not task tracker.

## Substrate Learning

This folder IS the brain. Schema defines what the substrate can learn:

```
task entity     → what work exists (priority, wave, context, exit condition)
path relation   → what the graph learned (strength, resistance, revenue)
capability      → who can do what (unit → skill at price)
hypothesis      → what was discovered (confirmed, testing, rejected)
frontier        → what's unexplored (tag clusters, unit gaps)
signal          → what happened (event log with latency, success)
```

**The schema shapes the learning.** Every `mark()` writes to `path.strength`. Every `warn()` writes to `path.resistance`. Every `know()` promotes to `hypothesis`. Rubric dimensions are tagged edges — `path` from agent→skill:fit, agent→skill:truth, etc. The schema doesn't need new entities for quality scoring — tags on paths ARE the dimensions.

**Speed contract:** TypeDB is the slow layer (~100ms writes, ~300ms queries). The nervous system (`src/engine/`) runs in-memory at `<0.001ms`. TypeDB catches up on a schedule. But the schema defines WHAT is learned — the engine defines HOW FAST.

**Context:** [DSL.md](one/DSL.md) — signal grammar. [dictionary.md](dictionary.md) — canonical names. [routing.md](routing.md) — schema is routing's persistent memory: `path.strength` is what `mark()` accumulates, `path.resistance` is what `warn()` accumulates, `path.revenue` is what L4 settles. `suggest_route()` and `optimal_route()` are `follow()` expressed in TQL. `path_status()` labels the formula's output: highway/fresh/fading/toxic. [rubrics.md](rubrics.md) — quality as tagged edges. [patterns.md](one/patterns.md) — 10 emergent patterns from this schema. [lifecycle.md](one/lifecycle.md) — into/through/out. [speed.md](one/speed.md) — why in-memory matters. [buy-and-sell.md](buy-and-sell.md) — `capability(provider, offered)` is the listing; `cheapest_provider()` is discovery; `path.revenue` is settlement. [revenue.md](one/revenue.md) — Layer 1 routing + Layer 4 marketplace are the schema's two revenue surfaces.

## Files

| File | Purpose |
|------|---------|
| `one.tql` | **Master ontology (~125 lines):** single source of truth — 6 dimensions, 6 verbs, stable forever |
| `world.tql` | Full schema: 6 dimensions, functions, classification (~230 lines) |
| `skins.tql` | Metaphor layer: actor/group/connection patterns for any domain |
| `sui.tql` | On-chain mirror: Move structs as TQL entities |
| `agents.tql` | Legacy envelope system |
| `skins/engineering.tql` | Engineering skin: maps unit/path/signal to sprint/PR/review |
| `seeds/marketing-team.tql` | Seed data: marketing team units + capabilities |
| `seeds/engineering-team.tql` | Seed data: engineering team units + capabilities |
| `patterns/` | Reference patterns (L1–L6); REFERENCE ONLY — not loadable alongside one.tql |
| `archive/` | Old versions |

## The Collapse

The runtime handles task lifecycle. TypeDB handles memory + intelligence.

**Runtime (nervous system):**
- Tasks → `.on()` handlers on units
- Dependencies → `.then()` continuations
- Trails → strength map entries (mark/warn/fade)
- Queue → signals waiting to be consumed

**TypeDB (brain):**
- Units persist (model, system-prompt, generation)
- Paths persist (strength, resistance, revenue)
- Signals recorded (event log)
- Skills registered (capability relation)
- Knowledge emerges (hypothesis, frontier, objective)
- Classification inferred (path_status, unit_classification, needs_evolution)

## Entity Types

- **group** — groups of units (scope, isolation, hierarchy)
- **unit** — actors (human, agent, llm, system) with `model`, `system-prompt`, `generation`
- **skill** — what units can do, with optional x402 price (capability)
- **hypothesis/frontier/objective** — emergent knowledge
- **contribution** — impact tracking

## Relation Patterns

- `path(source, target)` — pheromone between units (strength, resistance, revenue)
- `capability(provider, offered)` — unit can do skill at price
- `signal(sender, receiver)` — event record (data, amount, success, latency)
- `membership(group, member)` — unit belongs to group
- `hierarchy(parent, child)` — group nesting
- `spawns(frontier, objective)` — knowledge creates goals

## Classification Functions

Functions auto-classify based on thresholds:
- `path_status` — "highway" | "fresh" | "fading" | "toxic"
- `unit_classification` — "proven" | "active" | "at-risk"
- `needs_evolution` — agent self-improvement trigger (success-rate < 0.50, samples >= 20)
- `is_action_ready` — hypothesis confirmed + statistically significant

## Routing Functions

- `suggest_route(from, skill)` — top 5 by path strength
- `optimal_route(from, skill)` — single best
- `cheapest_provider(skill)` — lowest price with capability

## What Was Removed

Task entity (now `.on()` handlers), trail relation (now strength map),
dependency relation (now `.then()` continuations), assignment relation
(implicit from signal routing), and all task lifecycle functions
(is_attractive, is_repelled, ready_tasks, exploratory_tasks, trail_status).

## Runtime Mapping

| Schema | Runtime |
|--------|---------|
| unit | `unit(id)` / `world().actor(id)` |
| path.strength | `mark(path)` increments |
| path.resistance | `warn(path)` increments |
| signal | `emit({ receiver, data })` |
| capability | unit `.on()` handler + TypeDB skill entity |
| highways() | `net.highways(n)` |
| suggest_route() | routing decision from TypeDB |
| needs_evolution() | trigger for agent self-improvement |
