# /see

Read the world — query substrate state without emitting signals.

## Nouns

| Noun | What | Loop |
|------|------|------|
| `tasks [--tag X] [--status Y]` | Open work sorted by effective priority | L1 |
| `highways [--limit N]` | Proven paths — strength ≥ 50 (default top 20) | L2 |
| `toxic` | Blocked paths — resistance > strength | L3 |
| `frontiers` | Unexplored tag clusters (<10% traversed) | L7 |
| `paths [--from X] [--to Y]` | Any path query by source/target | L2 |
| `hypotheses` | Permanent knowledge (hardened by L6) | L6 |
| `evolved` | Agents that rewrote their system prompts | L5 |
| `revenue` | Per-path earnings from L4 economic loop | L4 |
| `events [--since T]` | Signal history and Four Outcomes audit | L1 |

## Routing

`/see` maps to `follow()` — deterministic read along strongest paths.
No mark(), no warn(), no side effects. Every noun is read-only.

| Noun | Primitive | Source |
|------|-----------|--------|
| tasks | `follow()` queue read | `/api/tasks` or `scanTodos()` |
| highways | `follow()` path read | `/api/state` strength ≥ 50 |
| toxic | `follow()` path read | `/api/state` resistance > strength |
| frontiers | `follow()` gap read | `/api/state` <10% traversed |
| paths | `follow()` path query | `/api/state` filtered |
| hypotheses | TypeDB read | knowledge entities |
| evolved | TypeDB read | units where generation > 1 |
| revenue | TypeDB read | paths with revenue attribute |
| events | TypeDB read | signal history |

## Steps

### tasks

1. GET `http://localhost:4321/api/tasks` (falls back to `scanTodos()` in `src/engine/task-parse.ts` if server not running)
2. Filter by `$ARGUMENTS` if provided — tags or phase (e.g. `/see tasks build P0`, `/see tasks C1`)
3. Report tasks sorted by effective priority (priority score + pheromone strength − resistance):
   - Name, id, priority formula (e.g. `90 = critical=30 + C1=40 + dev=20`)
   - Phase, value, persona, tags
   - Category: attractive / ready / exploratory / repelled
   - Pheromone: strength, resistance (if any)
   - Blocks: what tasks this blocks
   - Exit condition
4. Group by phase (C1→C7), sorted by effective priority within each phase
5. Summary: total open/done, count per phase, count per value, top 5 by priority
6. Suggest what to work on next based on priority + pheromone state

### highways

1. GET `http://localhost:4321/api/export/highways?context=1` (falls back to `/api/state` if server not running)
2. Show paths where `strength ≥ 50`, sorted by strength desc (default limit 20; use `--limit N` to override)
3. Each: from → to, strength, traversals, revenue — and `context: <docs>` if contextHint is present
4. Report:
   ```
   Highways:  N paths ≥ 50 strength
   Hardened:  N paths promoted to permanent (L6)
   Top path:  <from> → <to>  strength=N  traversals=M  revenue=$X
              context: dsl, dictionary  (docs that led to success on this path)
   ```

### toxic

1. GET `http://localhost:4321/api/state`
2. Show paths where `resistance > strength`
3. Each: from → to, resistance, strength, hypothesis (if any)
4. Report:
   ```
   Toxic:      N paths with resistance > strength
   Worst path: <from> → <to>  resistance=N  strength=M  reason="<hypothesis>"
   ```

### frontiers

1. GET `http://localhost:4321/api/state`
2. Show tag clusters with <10% traversal rate
3. Each: tag cluster, % explored, expected value
4. Report:
   ```
   Frontiers:       N clusters
   Least explored:  <cluster>  X% traversed  expected=$Y
   ```

### paths

1. GET `http://localhost:4321/api/state`
2. Filter by `--from` and/or `--to` if provided in `$ARGUMENTS`
3. Show matching paths: from → to, strength, resistance, net weight (strength − resistance)
4. Report all matching paths with full pheromone state

### hypotheses

1. Query TypeDB: match hypothesis entities
2. Show each: pattern, confidence, created, reinforced count
3. Report:
   ```
   Hypotheses: N
   Top:        <pattern>  confidence=X  reinforced=M times
   ```

### evolved

1. Query TypeDB: units where `generation > 1`
2. Show each: uid, name, generation, current model, last evolution timestamp
3. Report:
   ```
   Evolved: N agents
   Most:    <uid>  gen=N  model=<model>
   ```

### revenue

1. Query TypeDB: paths with revenue attribute, sorted desc
2. Show per-path earnings
3. Report:
   ```
   Revenue:  total=$X across N paths
   Top path: <from>→<to>  $Y
   ```

### events

1. Query TypeDB signals, optionally filtered by `--since T` from `$ARGUMENTS`
2. Show each signal: receiver, data summary, outcome, timestamp
3. Report:
   ```
   Events:   N signals
   Outcomes: result=A  timeout=B  dissolved=C  failure=D
   ```

---

*Every `/see` query is a `follow()` call — the substrate answers without learning.*
