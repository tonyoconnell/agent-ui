# The Migration

One vocabulary. One ontology. One pass.

Merge the substrate vocabulary into metaphor-neutral words. Rename files to
match the six dimensions. Run haiku agents in parallel to do the work.

---

## Why

The old vocabulary leaked the ant colony metaphor into the substrate layer.
`colony`, `scent`, `alarm`, `spawn` — all ant words baked into what was
supposed to be metaphor-free.

The fix: make the substrate vocabulary genuinely neutral so it skins cleanly
to ANY domain. The test — every word must map naturally to ant, brain, team,
mail, water, and radio without forcing.

The deepest insight: **weighted memory on paths** is the universal dynamic.
Every domain has its own word for the substance that accumulates:

| Domain | The substance | Positive | Negative | Result | Decay |
|--------|--------------|----------|----------|--------|-------|
| **ONE** | weight | strength | resistance | highway | fade |
| **Ant** | pheromone | scent | alarm | trail | evaporation |
| **Brain** | synaptic weight | potentiation | inhibition | pathway | decay |
| **Team** | reputation | trust | distrust | go-to person | forgetting |
| **Mail** | stamps | stamps | returns | express route | archiving |
| **Water** | sediment | erosion | damming | river | drying |
| **Radio** | signal power | boost | interference | clear channel | attenuation |

The pattern is always the same:

```
something accumulates on a connection over time
  → positive: the connection gets used more
  → negative: the connection gets avoided
  → without use: it fades
  → survivors become the proven paths
```

The substrate doesn't pick a metaphor. It says **strength** and **resistance**.
That's why it skins to everything — the dynamic is universal.

---

## Ontology

Six dimensions. Everything maps.

```
1. Groups      who belongs together
2. People      who acts
3. Things      what they work on
4. Paths       how they connect (strength + resistance)
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

## Phase 7 — Docs (59 files, parallel)

Each agent gets one file. Apply the vocabulary table.
Only replace terms in substrate/engine context, NOT in metaphor skin columns.

### Already done (skip)

- `docs/dictionary.md` ✓
- `docs/DSL.md` ✓
- `docs/metaphors.md` ✓
- `docs/migration.md` (this file — skip)

### Delete first (old duplicates)

```bash
git rm "docs/dictionary 1.md"
git rm "docs/DSL 1.md"
git rm "docs/metaphors 1.md"
git rm "docs/agents 1.md"
```

### Clean (zero old vocab — skip)

- `docs/CHAT_ARCHITECTURE.md`
- `docs/executive-summary.md`
- `docs/one-protocol.md`
- `docs/one.md`

### Core docs (high hit count, update carefully)

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7A | `docs/README.md` | 15 | all |
| 7B | `docs/groups.md` (was swarm.md) | 33 | `swarm`→`group`, `colony`→`world`, `crystallize`→`know`, `scent`→`strength`, `spawn`→`add` |
| 7C | `docs/code-tutorial.md` | 59 | `colony`→`world`, `scent`→`strength`, `alarm`→`resistance`, `crystallize`→`know`, `spawn`→`add`, `swarm`→`group` |
| 7D | `docs/examples.md` | 53 | `colony`→`world`, `scent`→`strength`, `spawn`→`add`, `swarm`→`group` |
| 7E | `docs/100-lines.md` | 47 | `colony`→`world`, `scent`→`strength`, `alarm`→`resistance`, `spawn`→`add`, `swarm`→`group`, `swarm-type`→`group-type` |
| 7F | `docs/one-protocol-gaps.md` | 44 | `colony`→`world`, `spawn`→`add`, `swarm`→`group` |
| 7G | `docs/task-management.md` | 37 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `scent`→`strength`, `spawn`→`add` |
| 7H | `docs/ants.md` | 37 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `spawn`→`add`, `swarm`→`group` |

### Ontology & architecture docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7I | `docs/world.md` | 26 | `colony`→`world`, `scent`→`strength`, `swarm`→`group` |
| 7J | `docs/ontology.md` | 18 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `swarm`→`group` |
| 7K | `docs/architecture.md` | 18 | `colony`→`world`, `alarm`→`resistance`, `swarm`→`group`, `swarm-type`→`group-type` |
| 7L | `docs/one-ontology.md` | 5 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know` |
| 7M | `docs/primitives.md` | 11 | `alarm`→`resistance`, `swarm`→`group`, `swarm-type`→`group-type`, `colony`→`world` |
| 7N | `docs/loops.md` | 13 | `colony`→`world`, `alarm`→`resistance`, `scent`→`strength`, `swarm`→`group`, `swarm-type`→`group-type` |
| 7O | `docs/the-stack.md` | 3 | `colony`→`world`, `crystallize`→`know`, `scent`→`strength` |

### Flow & signal docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7P | `docs/flows.md` | 15 | `colony`→`world`, `scent`→`strength`, `alarm`→`resistance`, `crystallize`→`know`, `spawn`→`add`, `swarm`→`group` |
| 7Q | `docs/flow.md` | 12 | `colony`→`world`, `alarm`→`resistance`, `spawn`→`add` |
| 7R | `docs/events.md` (was signal.md) | 1 | `crystallize`→`know` |
| 7S | `docs/patterns.md` | 9 | `colony`→`world`, `alarm`→`resistance`, `swarm`→`group` |
| 7T | `docs/effects.md` | 13 | `colony`→`world`, `alarm`→`resistance`, `spawn`→`add`, `swarm`→`group` |

### Learning & knowledge docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7U | `docs/knowledge.md` (was emergence.md) | 14 | `colony`→`world`, `crystallize`→`know`, `scent`→`strength`, `swarm`→`group` |
| 7V | `docs/lifecycle.md` | 12 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `swarm`→`group` |
| 7W | `docs/llm-training.md` | 20 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `scent`→`strength`, `spawn`→`add` |
| 7X | `docs/substrate-learning.md` | 10 | `colony`→`world`, `alarm`→`resistance`, `swarm`→`group` |
| 7Y | `docs/llms.md` | 23 | `colony`→`world`, `alarm`→`resistance`, `scent`→`strength` |

### Code & implementation docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7Z | `docs/code.md` | 20 | `colony`→`world`, `scent`→`strength`, `spawn`→`add` |
| 7AA | `docs/tutorial.md` | 9 | `spawn`→`add` |
| 7AB | `docs/sdk.md` | 11 | `colony`→`world`, `swarm`→`group` |
| 7AC | `docs/typedb.md` | 15 | `colony`→`world`, `swarm`→`group` |
| 7AD | `docs/framework.md` | 5 | `colony`→`world`, `alarm`→`resistance`, `scent`→`strength` |

### Strategy & business docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7AE | `docs/strategy.md` | 15 | `colony`→`world`, `crystallize`→`know`, `swarm`→`group` |
| 7AF | `docs/value.md` | 23 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `swarm`→`group` |
| 7AG | `docs/revenue.md` | 12 | `colony`→`world`, `crystallize`→`know`, `swarm`→`group` |
| 7AH | `docs/contracts.md` | 23 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `swarm`→`group` |
| 7AI | `docs/opensource.md` | 16 | `colony`→`world`, `swarm`→`group` |
| 7AJ | `docs/asi-world.md` | 3 | `colony`→`world` |

### Agent & integration docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7AK | `docs/people.md` (was agents.md) | 8 | `colony`→`world`, `swarm`→`group` |
| 7AL | `docs/hermes-agent.md` | 26 | `colony`→`world`, `alarm`→`resistance`, `spawn`→`add`, `swarm`→`group` |
| 7AM | `docs/integration.md` | 7 | `colony`→`world`, `crystallize`→`know`, `spawn`→`add` |
| 7AN | `docs/agent-launch.md` | 1 | `colony`→`world` |
| 7AO | `docs/claude-code-integration.md` | 15 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know` |

### Chain & commerce docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7AP | `docs/SUI.md` | 11 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know` |
| 7AQ | `docs/sync-skills.md` | 2 | `swarm`→`group` |

### UI docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7AR | `docs/ui-plan.md` | 3 | `spawn`→`add` |
| 7AS | `docs/gaps.md` | 3 | `colony`→`world`, `swarm`→`group` |

### Planning & TODO docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7AT | `docs/plan.md` | 7 | `colony`→`world`, `crystallize`→`know`, `scent`→`strength` |
| 7AU | `docs/Update Plan.md` | 26 | `colony`→`world`, `crystallize`→`know`, `scent`→`strength`, `swarm`→`group` |
| 7AV | `docs/PLAN-emerge.md` | 10 | `colony`→`world`, `scent`→`strength`, `swarm`→`group` |
| 7AW | `docs/TODO.md` | 24 | `colony`→`world`, `alarm`→`resistance`, `crystallize`→`know`, `scent`→`strength`, `spawn`→`add`, `swarm`→`group` |
| 7AX | `docs/TODO-emerge.md` | 12 | `colony`→`world` |
| 7AY | `docs/TODO-ui.md` | 9 | `colony`→`world`, `alarm`→`resistance`, `spawn`→`add` |
| 7AZ | `docs/TODO-fill-gaps.md` | 9 | `colony`→`world`, `alarm`→`resistance`, `swarm`→`group` |
| 7BA | `docs/TODO-create.md` | 5 | `colony`→`world`, `alarm`→`resistance` |
| 7BB | `docs/TODO-loops.md` | 2 | `alarm`→`resistance`, `swarm`→`group` |
| 7BC | `docs/TODO-deploy.md` | 1 | `colony`→`world` |

### Internal docs

| ID | File | Hits | Terms |
|----|------|-----:|-------|
| 7BD | `docs/CLAUDE.md` | 3 | `colony`→`world`, `scent`→`strength`, `swarm`→`group` |

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

╔══════════════════════════════════════════════════════════════╗
║  RULE #1: DO NOT DELETE ANY CONTENT.                        ║
║                                                             ║
║  This is the highest priority rule. You are ONLY replacing  ║
║  old vocabulary words with new ones. You must NOT remove    ║
║  any sentences, paragraphs, sections, code blocks, tables,  ║
║  comments, or any other content. Every line that exists in  ║
║  the file before your edit must exist after your edit.      ║
║  The ONLY change is swapping vocabulary words.              ║
║                                                             ║
║  If you are unsure whether something should change,         ║
║  LEAVE IT AS-IS. Preserving content is more important       ║
║  than catching every rename.                                ║
╚══════════════════════════════════════════════════════════════╝

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
- DO NOT DELETE ANY CONTENT. Swap words only. Every line stays.
- Only replace in substrate/engine/ONE context
- Do NOT replace in metaphor skin columns (ant keeps "alarm" etc.)
- Do NOT replace inside string literals that are metaphor examples
- DO replace TypeDB attribute names (alarm → resistance, sid → gid)
- Update import paths where they reference renamed files
- Update type names: Colony → World, Swarm → Group
- Preserve ALL formatting, indentation, style, and structure
- Do not add or remove any functionality, text, or sections
- Read the file first, then make targeted edits
- When in doubt, leave it unchanged
```

---

## Execution Order

```
Phase 0    sequential     git mv renames + delete duplicates + commit
           ─────────
Phase 1    5 agents       core engine
Phase 2    8 agents       schema
           ─────────      (wait for 1+2 before continuing)
Phase 3    5 agents       types, lib, skins
Phase 4    11 agents      API endpoints
Phase 5    7 agents       components
Phase 6    9 agents       Claude config
Phase 7    59 agents      docs (the big wave)
Phase 8    12 agents      packages, scripts
Phase 9    4 agents       archive (optional)
           ─────────
           ~120 files, 10 phases
```

Phases 1-2 are the foundation. Everything else reads from them.
Within each phase, all agents run fully parallel.
Phase 7 is the largest — 59 doc files, all independent, perfect for haiku swarm.

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
# docs/migration.md stays as record of what was done
```

---

*One plan. ~120 files. One world.*
