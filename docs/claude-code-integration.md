# Claude Code Integration

How Claude Code uses the ONE substrate as its task management system.

---

## The Idea

Claude Code IS a unit in the world. Every conversation is a signal. Every completed task strengthens a path. Every failure deposits resistance. Over time, the colony learns which sequences of work succeed and routes future work accordingly.

```
User: "build the signup flow"
  → Claude Code reads /tasks to see what's proven
  → picks the highest-pheromone approach
  → executes
  → /done reinforces the trail
  → next time, the colony routes faster
```

---

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/tasks` | See all tasks grouped by category (attractive/ready/exploratory/repelled) |
| `/tasks build P0` | Filter by tags |
| `/add-task signup flow` | Create a new skill with auto-tagged metadata |
| `/done signup` | Mark complete, reinforce trail (+5 strength), update success-rate |
| `/grow` | Run one growth tick — select, signal, decay, evolve, know |
| `/highways` | See proven paths, toxic paths, and frontiers |

### Workflow

```
/tasks                     # What's available?
/tasks P0 build            # What's urgent and buildable?

# Work on something...
# ... edit files, run tests ...

/done api-endpoints        # Mark it complete
/tasks                     # What unlocked? What's next?
/grow                      # Run a growth cycle, see what the colony learned
/highways                  # What paths are proven now?
```

### Creating Work

```
/add-task build the signup flow with email + github auth

# Claude parses this into:
#   id: signup-flow
#   name: Build signup flow with email + github auth
#   tags: [build, onboard, P1, frontend]
#   unit: builder
```

Tags are extracted from context — the command figures out type, phase, priority, domain.

---

## How the World Learns from Claude Code

### Every `/done` teaches the colony

```
/done schema-design
  → path(previous-task→schema-design).strength += 5
  → unit(builder).success-rate recalculated
  → if this is the 10th success: trail approaches "attractive" threshold
  → future /tasks will show schema-design as attractive

/done api-endpoints (after schema-design)
  → path(schema-design→api-endpoints).strength += 5
  → the colony now knows: "after schema, do api" is a good sequence
```

### Every failure teaches too

```
/done deploy --failed
  → path(previous→deploy).resistance += 8
  → deploy becomes "repelled" if resistance > strength
  → future /tasks won't suggest deploy until resistance decays
  → but resistance decays 2x faster than strength — forgiveness built in
```

### Over many sessions

```
Session 1: /done schema → /done api → /done tests ✓
Session 2: /done schema → /done deploy ✗ (resistance)
Session 3: /done schema → /done api → /done tests → /done deploy ✓

World learns: schema → api → tests → deploy is the highway.
              schema → deploy (skipping tests) is repelled.
```

---

## Scaling to Multiple Agents

Claude Code is one unit. But the substrate supports many:

```
Tony (Claude Code)          David (Claude Code)
  ├─ /done schema            ├─ /done frontend-auth
  ├─ /done api               ├─ /done signup-ui
  └─ /done tests             └─ /done connect-flow

Both write to the same TypeDB.
Both strengthen the same paths.
The colony learns from everyone.
```

Multiple machines, one TypeDB instance = one shared world.
Tony's successes become David's highways.

---

## The Growth Loop Connection

When the dev server is running, the Dashboard polls `/api/tick` every 15 seconds. The tick:

1. **Selects** the highest-pheromone task (weighted random)
2. **Signals** it to the assigned unit
3. **Drains** the priority queue (P0 first)
4. **Fades** all paths every 5 min (trails 5%, alarms 10%)
5. **Evolves** struggling agents every 10 min (rewrites prompts)
6. **Hardens** proven paths every hour (permanent knowledge)
7. **Hypothesizes** about strong/fading paths (self-observation)
8. **Detects frontiers** from unexplored tag clusters

Claude Code's `/done` calls feed the pheromone. The tick loop turns that pheromone into intelligence. Over time, the colony routes work to the right agent via the right sequence.

---

## Without the Server

All commands work offline too. When the server isn't running:

- `/tasks` reads from the code directly (schema, roadmap data)
- `/add-task` writes to `import-roadmap.ts` for later seeding
- `/done` notes the completion for later recording
- `/grow` explains what the tick would do
- `/highways` reads from docs

The commands degrade gracefully. The colony catches up when the server restarts.

---

## Files

| File | Purpose |
|------|---------|
| `.claude/commands/tasks.md` | `/tasks` — see current task state |
| `.claude/commands/add-task.md` | `/add-task` — create tagged skill |
| `.claude/commands/done.md` | `/done` — mark complete, reinforce trail |
| `.claude/commands/grow.md` | `/grow` — run growth tick |
| `.claude/commands/highways.md` | `/highways` — see proven paths |
| `src/pages/api/tasks/` | Task API (skills + pheromone + tags) |
| `src/pages/api/tick.ts` | Growth loop endpoint |
| `src/pages/api/state.ts` | World state for visualization |
| `src/engine/loop.ts` | The 7-loop tick |
| `src/engine/one.ts` | World with TypeDB persistence |

---

*Claude Code is a unit. Every conversation is a signal. The colony learns.*
