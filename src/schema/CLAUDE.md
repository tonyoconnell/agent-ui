# Schema Directory

**Skill: `/typedb` — Use for ALL TQL work. TypeDB 3.x uses `fun` NOT `rule`.**

TypeDB 3.0 schema for the ONE world. TypeDB is the brain — not task tracker.

## Files

| File | Purpose |
|------|---------|
| `one.tql` | Main schema: 6 dimensions, functions, classification (~230 lines) |
| `skins.tql` | Metaphor layer: actor/group/connection patterns for any domain |
| `sui.tql` | On-chain mirror: Move structs as TQL entities |
| `agents.tql` | Legacy envelope system |
| `archive/` | Old versions |

## The Collapse

The runtime handles task lifecycle. TypeDB handles memory + intelligence.

**Runtime (nervous system):**
- Tasks → `.on()` handlers on units
- Dependencies → `.then()` continuations
- Trails → scent map entries (mark/warn/fade)
- Queue → signals waiting to be consumed

**TypeDB (brain):**
- Units persist (model, system-prompt, generation)
- Paths persist (strength, alarm, revenue)
- Signals recorded (event log)
- Skills registered (capability relation)
- Knowledge emerges (hypothesis, frontier, objective)
- Classification inferred (path_status, unit_classification, needs_evolution)

## Entity Types

- **swarm** — groups of units (scope, isolation, hierarchy)
- **unit** — actors (human, agent, llm, system) with `model`, `system-prompt`, `generation`
- **skill** — what units can do, with optional x402 price (capability)
- **hypothesis/frontier/objective** — emergent knowledge
- **contribution** — impact tracking

## Relation Patterns

- `path(source, target)` — pheromone between units (strength, alarm, revenue)
- `capability(provider, offered)` — unit can do skill at price
- `signal(sender, receiver)` — event record (data, amount, success, latency)
- `membership(group, member)` — unit belongs to swarm
- `hierarchy(parent, child)` — swarm nesting
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

Task entity (now `.on()` handlers), trail relation (now scent map),
dependency relation (now `.then()` continuations), assignment relation
(implicit from signal routing), and all task lifecycle functions
(is_attractive, is_repelled, ready_tasks, exploratory_tasks, trail_status).

## Runtime Mapping

| Schema | Runtime |
|--------|---------|
| unit | `unit(id)` / `world().actor(id)` |
| path.strength | `mark(path)` increments |
| path.alarm | `warn(path)` increments |
| signal | `emit({ receiver, data })` |
| capability | unit `.on()` handler + TypeDB skill entity |
| highways() | `colony.highways(n)` |
| suggest_route() | routing decision from TypeDB |
| needs_evolution() | trigger for agent self-improvement |
