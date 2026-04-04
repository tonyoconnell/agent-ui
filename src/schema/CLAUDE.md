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

## Entity Types

- **swarm/colony** - groups of units
- **unit** - actors (human, agent, llm, system)
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

## Inference Rules

Rules auto-classify based on thresholds:
- `highway` - path strength >= 50
- `proven` - unit with high success-rate, activity, samples
- `attractive` - task with strong inbound trail, no blockers
- `toxic` - path/flow where alarm > strength

## Runtime Mapping

| Schema | Runtime (`src/engine/substrate.ts`) |
|--------|-------------------------------------|
| unit | `unit(id)` |
| path.strength | `drop(path)` increments |
| path.alarm | `alarm(path)` increments |
| signal | `emit({ receiver, data })` |
| trail | implicit via task routing |
| highways() | `colony.highways(n)` |
