# The Migration

One vocabulary. One ontology. One pass.

Merge the substrate vocabulary into metaphor-neutral words. Rename files to
match the six dimensions. Run haiku agents in parallel to do the work.

---

## Ontology

```
1. Groups      who belongs together
2. People      who acts
3. Things      what they work on
4. Paths       how they connect
5. Events      what happened
6. Knowledge   what was learned
```

---

## Vocabulary

Every agent executing this plan uses this lookup table:

```
OLD              NEW              CONTEXT
─────────────    ─────────────    ──────────────────────
colony           world            container of units
Colony           World            type name
scent            strength         positive weight map
alarm            resistance       negative weight map
spawn            add              create unit
despawn          remove           destroy unit
crystallize      know             promote to knowledge
swarm            group            container of units
Swarm            Group            entity name (TypeDB)
swarm-type       group-type       attribute name
sid              gid              group identifier attribute
```

**Do NOT replace** these in metaphor skin columns (ant/brain/team/water/radio).
The ant skin keeps "alarm", "colony", "scent" etc. Only replace in the
substrate/ONE/engine context.

---

## Already Done

- [x] `docs/dictionary.md`
- [x] `docs/DSL.md`
- [x] `docs/metaphors.md`

---

## Phase 0 — File Renames (sequential, one operator)

Must happen before any content edits. Run `git mv` for each.

```bash
# Engine
git mv src/engine/substrate.ts src/engine/world.ts
git mv src/engine/one.ts src/engine/persist.ts

# Schema
git mv src/schema/one.tql src/schema/world.tql

# Types
git mv src/types/one.ts src/types/world.ts

# Components
git mv src/components/graph/ColonyEditor.tsx src/components/graph/WorldEditor.tsx

# Context
git mv src/contexts/MetaphorContext.tsx src/contexts/SkinContext.tsx

# API
git mv src/pages/api/alarm.ts src/pages/api/resistance.ts
git mv src/pages/api/drop.ts src/pages/api/mark.ts

# Docs (dimension-aligned)
git mv docs/swarm.md docs/groups.md
git mv docs/agents.md docs/people.md
git mv docs/emergence.md docs/knowledge.md
git mv docs/signal.md docs/events.md

# Delete (replaced)
git rm src/components/graph/ColonyGraph.tsx
git rm src/engine/colony.js
```

After renames, commit before launching agents.

---

## Phase 1 — Core Engine (5 files, parallel)

These define the runtime. All imports from `substrate` → `world`, `one` → `persist`.

### 1A · `src/engine/world.ts` (was substrate.ts)

```
FIND                          REPLACE
colony()                      world()
Colony                        World
scent                         strength        (the map name)
alarm                         resistance      (the map name)
spawn                         add
despawn                       remove
```

Careful: `alarm` in the `isToxic` function comments should also update.
Export names: `colony` → `world`, `Colony` → `World`.

### 1B · `src/engine/persist.ts` (was one.ts)

```
FIND                          REPLACE
import.*substrate             import from './world'
import.*Colony                import.*World
colony()                      world()
net.scent                     net.strength
net.alarm                     net.resistance
crystallize                   know
Colony                        World
```

### 1C · `src/engine/loop.ts`

```
FIND                          REPLACE
import.*substrate             import from './world'
import.*one                   import from './persist'
colony                        world
spawn                         add
crystallize                   know
```

### 1D · `src/engine/index.ts`

```
FIND                          REPLACE
from './substrate'            from './world'
from './one'                  from './persist'
colony                        world
Colony                        World
```

### 1E · `src/engine/CLAUDE.md`

All vocabulary terms. Update code examples, tables, file references.
`substrate.ts` → `world.ts`, `one.ts` → `persist.ts`.

---

## Phase 2 — Schema (8 files, parallel)

### 2A · `src/schema/world.tql` (was one.tql)

```
FIND                          REPLACE
entity swarm                  entity group
swarm                         group           (all entity/relation refs)
swarm-type                    group-type
sid                           gid
attribute alarm               attribute resistance
alarm                         resistance      (in path, functions)
owns sid                      owns gid
```

**Important:** The `membership` relation has `relates group` — this stays.
The entity name changes from `swarm` to `group`. Update `plays membership:group`
on the entity definition.

Also update all comments: "colony" → "world", "scent" → "strength", etc.

### 2B · `src/schema/CLAUDE.md`

All terms. File references: `one.tql` → `world.tql`.

### 2C · `src/schema/skins.tql`

```
colony → world, swarm → group, crystallize → know
```

### 2D · `src/schema/sui.tql`

```
swarm → group, sid → gid
```

### 2E · `src/schema/patterns/substrate.tql`

```
colony → world, swarm → group
```

### 2F · `src/schema/skins/engineering.tql`

```
swarm → group, swarm-type → group-type
```

### 2G · `src/schema/seeds/engineering-team.tql`

```
swarm → group, swarm-type → group-type, sid → gid
```

### 2H · `src/schema/patterns/genesis.tql`

```
swarm → group
```

---

## Phase 3 — Types & Lib (5 files, parallel)

### 3A · `src/types/world.ts` (was one.ts)

```
colony → world, Colony → World, scent → strength,
alarm → resistance, swarm → group, Swarm → Group, sid → gid
```

### 3B · `src/lib/typedb.ts`

```
colony → world, sid → gid
```

### 3C · `src/lib/security.ts`

```
sid → gid
```

### 3D · `src/skins/index.ts`

```
colony → world
```

### 3E · `src/contexts/SkinContext.tsx` (was MetaphorContext.tsx)

```
Metaphor → Skin (in type names, variable names)
colony → world
```

---

## Phase 4 — API Endpoints (11 files, parallel)

### 4A · `src/pages/api/seed.ts`

```
colony → world, sid → gid, spawn → add
import from substrate → import from world
```

### 4B · `src/pages/api/signal.ts`

```
colony → world, alarm → resistance
import updates
```

### 4C · `src/pages/api/state.ts`

```
colony → world, sid → gid
```

### 4D · `src/pages/api/stats.ts`

```
colony → world
```

### 4E · `src/pages/api/tasks/index.ts`

```
colony → world
```

### 4F · `src/pages/api/resistance.ts` (was alarm.ts)

```
alarm → resistance (in code, variable names, TQL queries)
```

### 4G · `src/pages/api/decay.ts`

```
alarm → resistance
```

### 4H · `src/pages/api/decay-cycle.ts`

```
alarm → resistance
```

### 4I · `src/pages/api/mark.ts` (was drop.ts)

```
drop → mark (in variable names, comments)
alarm → resistance
```

### 4J · `src/pages/api/pay.ts`

```
alarm → resistance
```

### 4K · `src/pages/api/tasks/[id]/complete.ts`

```
alarm → resistance
```

---

## Phase 5 — Components (7 files, parallel)

### 5A · `src/components/graph/WorldEditor.tsx` (was ColonyEditor.tsx)

```
colony → world, Colony → World
import from substrate → import from world
spawn → add
```

### 5B · `src/components/graph/WorldGraph.tsx`

```
colony → world (if any remaining refs)
```

### 5C · `src/components/world/WorldView.tsx`

```
colony → world
```

### 5D · `src/components/world/WorldChat.tsx`

```
colony → world
```

### 5E · `src/components/AgentWorkspace.tsx`

```
colony → world
```

### 5F · `src/components/WorldWorkspace.tsx`

```
colony → world
```

### 5G · `src/components/CLAUDE.md`

```
colony → world
```

---

## Phase 6 — Claude Config (9 files, parallel)

### 6A · `CLAUDE.md` (root)

All vocabulary terms. File references. Code examples.
`substrate.ts` → `world.ts`, `one.ts` → `persist.ts`, `one.tql` → `world.tql`.

### 6B · `README.md`

All terms.

### 6C · `.claude/README.md`

```
colony → world
```

### 6D · `.claude/rules/engine.md`

All vocabulary terms. Code examples. Method signatures.

### 6E · `.claude/commands/work.md`

```
colony → world, alarm → resistance
```

### 6F · `.claude/commands/highways.md`

```
colony → world, alarm → resistance
```

### 6G · `.claude/commands/grow.md`

```
colony → world
```

### 6H · `.claude/commands/done.md`

```
colony → world, alarm → resistance
```

### 6I · `.claude/commands/report.md`

```
colony → world
```

---

## Phase 7 — Docs (22 files, parallel)

Each agent gets one file. Apply the vocabulary table.
Only replace terms in substrate/engine context, NOT in metaphor skin columns.

| ID | File | Terms |
|----|------|-------|
| 7A | `docs/README.md` | all |
| 7B | `docs/groups.md` (was swarm.md) | `swarm`→`group`, `colony`→`world` |
| 7C | `docs/loops.md` | `colony`→`world`, `crystallize`→`know`, `swarm-type`→`group-type` |
| 7D | `docs/primitives.md` | `alarm`→`resistance`, `swarm`→`group`, `swarm-type`→`group-type` |
| 7E | `docs/architecture.md` | `colony`→`world`, `swarm-type`→`group-type` |
| 7F | `docs/flows.md` | `colony`→`world`, `scent`→`strength`, `alarm`→`resistance`, `crystallize`→`know` |
| 7G | `docs/flow.md` | `colony`→`world`, `scent`→`strength`, `alarm`→`resistance` |
| 7H | `docs/world.md` | `colony`→`world`, `swarm`→`group` |
| 7I | `docs/one-ontology.md` | `swarm`→`group`, `alarm`→`resistance` |
| 7J | `docs/knowledge.md` (was emergence.md) | `crystallize`→`know` |
| 7K | `docs/lifecycle.md` | `crystallize`→`know` |
| 7L | `docs/code.md` | `colony`→`world`, `scent`→`strength`, `spawn`→`add` |
| 7M | `docs/code-tutorial.md` | `colony`→`world`, `scent`→`strength`, `spawn`→`add` |
| 7N | `docs/examples.md` | `colony`→`world`, `scent`→`strength`, `spawn`→`add` |
| 7O | `docs/100-lines.md` | `colony`→`world`, `swarm-type`→`group-type` |
| 7P | `docs/task-management.md` | `colony`→`world`, `crystallize`→`know` |
| 7Q | `docs/llm-training.md` | `colony`→`world`, `scent`→`strength` |
| 7R | `docs/substrate-learning.md` | `colony`→`world`, `scent`→`strength` |
| 7S | `docs/TODO-loops.md` | `swarm-type`→`group-type` |
| 7T | `docs/llms.md` | `colony`→`world` |
| 7U | `docs/strategy.md` | `colony`→`world` |
| 7V | `docs/events.md` (was signal.md) | `colony`→`world`, `alarm`→`resistance` |

---

## Phase 8 — Packages & Scripts (12 files, parallel)

| ID | File | Terms |
|----|------|-------|
| 8A | `src/engine/agentverse.ts` | `colony`→`world` |
| 8B | `src/engine/agent.ts` | `spawn`→`add` |
| 8C | `src/engine/unified.py` | `colony`→`world` |
| 8D | `src/move/one/sources/one.move` | `sid`→`gid` |
| 8E | `scripts/typedb-setup.ts` | `colony`→`world` |
| 8F | `packages/typedb-inference-patterns/runtime/colony.ts` | `colony`→`world` |
| 8G | `packages/typedb-inference-patterns/CLAUDE.md` | `colony`→`world` |
| 8H | `packages/typedb-inference-patterns/SWARMS.md` | `swarm`→`group` |
| 8I | `python/README.md` | `sid`→`gid` |
| 8J | `python/examples/` | `sid`→`gid` (check all files) |
| 8K | `public/agents.json` | `colony`→`world` |
| 8L | `src/engine/boot.ts` | import paths: `substrate`→`world`, `one`→`persist` |

---

## Phase 9 — Archive (optional, parallel)

| ID | File | Terms |
|----|------|-------|
| 9A | `src/engine/archive/colony.ts` | `colony`→`world` |
| 9B | `src/engine/archive/colony-patterns.ts` | `colony`→`world` |
| 9C | `src/schema/archive/substrate.tql` | `swarm`→`group`, `swarm-type`→`group-type`, `sid`→`gid` |
| 9D | `src/schema/archive/one.tql` | `swarm`→`group`, `colony`→`world` |

---

## TypeDB Progress Tracking

Track the migration in TypeDB. Each file is an entity. Each agent marks it done.

```tql
define

entity migration-file,
    owns file-path @key,
    owns migration-phase,
    owns migration-status,
    owns agent-id,
    owns terms-updated;

attribute file-path, value string;
attribute migration-phase, value integer;
attribute migration-status, value string;   # "pending" | "in-progress" | "done" | "skipped"
attribute agent-id, value string;
attribute terms-updated, value string;
```

```tql
# Query progress per phase
fun migration_progress($phase: integer) -> { total, done }:
    match $f isa migration-file, has migration-phase $phase;
    let $total = count($f);
    match $f isa migration-file, has migration-phase $phase,
          has migration-status "done";
    let $done = count($f);
    return { $total, $done };

# What's left?
fun pending_files($phase: integer) -> { file-path }:
    match $f isa migration-file, has migration-phase $phase,
          has migration-status "pending", has file-path $fp;
    return { $fp };
```

---

## Agent Prompt Template

Each haiku agent receives:

```
You are updating file {FILE_PATH} as part of a vocabulary migration.

VOCABULARY (find → replace, substrate context only):
  colony → world | Colony → World
  scent → strength
  alarm → resistance
  spawn → add | despawn → remove
  crystallize → know
  swarm → group | Swarm → Group
  swarm-type → group-type
  sid → gid

SPECIFIC TERMS FOR THIS FILE:
  {TERMS_LIST}

IMPORT PATH UPDATES:
  from './substrate'  → from './world'
  from './one'        → from './persist'
  from '@/engine/substrate' → from '@/engine/world'
  from '@/engine/one' → from '@/engine/persist'

RULES:
- Only replace in substrate/engine/ONE context
- Do NOT replace in metaphor skin columns (ant keeps "alarm" etc.)
- Do NOT replace inside string literals that are metaphor examples
- DO replace TypeDB attribute names (alarm → resistance, sid → gid)
- Update import paths where they reference renamed files
- Update type names: Colony → World, Swarm → Group
- Preserve formatting, indentation, style
- Do not add or remove functionality
- Read the file first, then make targeted edits
```

---

## Execution Order

```
Phase 0    sequential     git mv renames + commit
           ─────────
Phase 1    5 agents       core engine
Phase 2    8 agents       schema
           ─────────      (wait for 1+2 before continuing)
Phase 3    5 agents       types, lib, skins
Phase 4    11 agents      API endpoints
Phase 5    7 agents       components
Phase 6    9 agents       Claude config
Phase 7    22 agents      docs
Phase 8    12 agents      packages, scripts
Phase 9    4 agents       archive (optional)
           ─────────
           83 files, 10 phases
```

Phases 1-2 are the foundation. Everything else reads from them.
Within each phase, all agents run fully parallel.

---

## Verification

After all phases complete:

```bash
# No old terms in engine (excluding archive)
grep -rn "colony\b" src/engine/*.ts
grep -rn "\bscent\b" src/engine/*.ts
grep -rn "\bdespawn\b" src/engine/*.ts
grep -rn "\bcrystallize\b" src/engine/*.ts

# No old terms in schema
grep -n "entity swarm" src/schema/world.tql
grep -n "attribute alarm" src/schema/world.tql

# No broken imports
grep -rn "from.*substrate\|from.*'/one'" src/ --include="*.ts" --include="*.tsx"

# Build
npm run build
```

---

## Cleanup

```bash
git rm docs/update-vocabulary.md
git rm docs/rename-files.md
# docs/migration.md stays as record of what was done
```

---

*One plan. 83 files. 83 agents. One world.*
