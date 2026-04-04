# Schema Directory

**Skill: `/typedb` — Use for ALL TQL work. TypeDB 3.x uses `fun` NOT `rule`.**

TypeDB 3.0 schemas for the ONE world.

## Files

| File | Purpose |
|------|---------|
| `one.tql` | Main schema: 6 dimensions (groups, actors, things, paths, events, knowledge) |
| `skins.tql` | Metaphor layer: actor/group/carrier/connection patterns for any domain |
| `sui.tql` | On-chain mirror: Move structs as TQL entities, same inference rules |
| `agents.tql` | Legacy envelope system: agent/action/routing for React frontend |
| `archive/` | Old versions (unified.tql, substrate.tql, one.tql) |

## TypeDB as Substrate

TypeDB is not just storage. It is the signal relay, the router, and the brain.
The router process writes signals in, reads routing decisions out, executes agents, repeats.
Multiple machines pointing at one TypeDB instance = one shared world.

## Entity Types

- **swarm/colony** - groups of units
- **unit** - actors (human, agent, llm, system) with `model`, `system-prompt`, `generation`
- **task** - work with optional x402 price (task + price = service)
- **path/flow** - weighted unit-to-unit connections
- **trail** - weighted task-to-task sequences
- **signal** - event records (sender, receiver, data, amount)
- **hypothesis/frontier/objective** - inferred knowledge

## Relation Patterns

- `path(source, target)` - pheromone between units (strength, alarm, revenue)
- `trail(source-task, destination-task)` - pheromone between tasks
- `capability(provider, skill)` - unit can do task at price
- `membership(group, member)` - unit belongs to swarm

## Classification Functions

Functions auto-classify based on thresholds:
- `path_status` - "highway" | "fresh" | "fading" | "toxic"
- `unit_classification` - "proven" | "active" | "at-risk"
- `trail_status` - "proven" | "fresh" | "fading" | "dead"
- `is_attractive` / `is_repelled` - task pheromone selection
- `needs_evolution` - agent self-improvement trigger (success-rate < 0.50, samples >= 20)

## Two Layers of Learning

1. **Substrate** — pheromone on paths/trails. Colony gets smarter. Individual agents unchanged.
2. **Agent** — `model`, `system-prompt`, `generation` on unit. When `needs_evolution` fires,
   the agent rewrites its own prompt. The substrate provides the data; the agent evolves.

## Runtime Mapping

| Schema | Runtime (`src/engine/substrate.ts`) |
|--------|-------------------------------------|
| unit | `unit(id)` |
| path.strength | `drop(path)` increments |
| path.alarm | `alarm(path)` increments |
| signal | `emit({ receiver, data })` |
| trail | implicit via task routing |
| highways() | `colony.highways(n)` |
| suggest_route() | routing decision — TypeDB as relay |
| needs_evolution() | trigger for agent self-improvement |
