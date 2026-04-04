# TypeDB Inference Patterns

TypeDB 3.0 inference patterns implementing ant colony algorithms. Six lessons form a self-organizing loop: Perception, Homeostasis, Hypothesis, Task Allocation, Contribution, Emergence.

## Pattern Categories

| Lesson | Pattern | Core Concept |
|--------|---------|--------------|
| L1 | Classification | Multi-attribute functions (`elite_items()`) |
| L2 | Quality Rules | Rule chaining, rejection via `reject` |
| L3 | Hypothesis | State machines via inference rules |
| L4 | Task Allocation | Negation (`not {}`), pheromone trails |
| L5 | Contribution | Parameterized aggregates (`sum($i)`) |
| L6 | Emergence | Autonomous goal spawning |

## Key Files

- `lessons/*.md` - Concepts + TypeQL in one file per lesson
- `standalone/*.tql` - Pure schemas for direct loading
- `examples/*.tql` - Domain applications (ecommerce, IoT, social, supply chain)
- `SUBSTRATE-MAPPING.md` - How patterns map to 70-line substrate

## Standalone Schemas

```bash
typedb console --cloud cluster.typedb.com:80
> transaction my-db schema write
> source standalone/classification.tql
> commit
```

| File | Purpose |
|------|---------|
| `classification.tql` | Tier functions (elite/standard/at-risk) |
| `quality-rules.tql` | Rule chaining, cascade detection |
| `hypothesis-lifecycle.tql` | pending -> testing -> confirmed |
| `task-management.tql` | Negation, pheromone-weighted selection |
| `contribution-tracking.tql` | Impact aggregation, ranking |
| `autonomous-goals.tql` | Frontier detection, objective spawning |
| `genesis.tql` | Complete unified schema (1400+ lines) |

## Extending Patterns

1. Copy closest `standalone/*.tql` as base
2. Adapt entity/attribute names to your domain
3. Preserve function signatures for substrate compatibility
4. Test with `match let $x in your_function(); select $x;`

TypeDB 3.0 syntax: `fun name() -> type:`, `value integer` (not `long`), rules fire automatically on query.
