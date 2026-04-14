Create a new TODO from a source doc using the wave template. Arguments: `$ARGUMENTS` (source doc path or name)

## Steps

1. **Resolve the source doc path.**
   - If `$ARGUMENTS` is a full path, use it directly.
   - Otherwise try `docs/$ARGUMENTS` then `docs/$ARGUMENTS.md`.
   - If no arguments, ask which doc to convert.

2. **Run extract-tasks to get raw tasks (Haiku one-shot).**
   Call the `/extract-tasks` skill with the doc path. This writes a flat
   `docs/TODO-{docname}.md` with checkbox task blocks (one LLM call, ~$0.004).
   Read the output file — it is the raw task list you will promote.

3. **Load baseline context:**
   ```
   docs/DSL.md
   docs/dictionary.md
   docs/rubrics.md
   docs/TODO-template.md
   ```

4. **Promote the raw tasks into the full template.**
   Group the extracted tasks into cycles (Wire → Prove → Grow) and waves (W1–W4).
   Assign models: W1 Haiku recon, W2 Opus decide, W3 Sonnet edit, W4 Sonnet verify.
   Overwrite `docs/TODO-{docname}.md` with the full structure.

   **Required sections when writing the final file:**
   - Frontmatter (title, type, version, priority, total_tasks, status)
   - Goal + source of truth (always include DSL.md, dictionary.md, rubrics.md)
   - **Routing diagram** — signal flow down, marks up, fan-out sideways
   - **Schema reference** — link tasks to world.tql task entity
   - **Dependency graph** — waves acquire context, .then() carries it forward
   - **Testing** — W0 baseline (`bun run verify`), W4 verify + rubric, cycle gate
   - Cycles with wave pattern (W1-W4 per cycle)
   - Tasks with full metadata (id, value, effort, phase, persona, blocks, exit, tags)
   - Source of truth table
   - Cost discipline
   - Status checkboxes
   - Execution commands
   - See Also (always include DSL.md, dictionary.md, rubrics.md)

   **Task metadata rules:**
   - `id`: kebab-case, unique within the TODO
   - `value`: critical (can't ship without) | high | medium
   - `effort`: low (haiku) | medium (sonnet) | high (opus)
   - `phase`: C1 (foundation) → C7 (scale)
   - `persona`: who does this best
   - `blocks`: task IDs this blocks (dependency graph)
   - `exit`: verifiable condition — not "done", but "GET /api/x returns 200"
   - `tags`: domain + action + priority (engine, build, P0)

5. **Verify** the written TODO file:
   - Every task has all 7 metadata fields
   - Blocks references point to real task IDs within the file
   - Exit conditions are verifiable (grep, curl, type check)
   - DSL.md and dictionary.md are in the source of truth
   - Routing section shows signal flow

6. **Report:**
   - How many cycles, how many tasks per cycle
   - The critical path (longest dependency chain)
   - Estimated cost breakdown per cycle
   - Suggest: "Run `/wave TODO-{docname}.md` to start Cycle 1"

## The Template Shape

```
ROUTING DIAGRAM (signal down, marks up, fan-out sideways)
    │
SCHEMA (link to world.tql task entity)
    │
DEPENDENCY GRAPH (waves acquire context via .then())
    │
TESTING (W0 baseline, W4 verify, cycle gate)
    │
CYCLE 1: WIRE
    Tasks with metadata
    │
CYCLE 2: PROVE
    Tasks with metadata
    │
CYCLE 3: GROW
    Tasks with metadata
    │
SOURCE OF TRUTH TABLE
COST DISCIPLINE
STATUS CHECKBOXES
SEE ALSO (DSL, dictionary, rubrics, + domain docs)
```

## Rules

- **Always include DSL.md + dictionary.md + rubrics.md** in source of truth and See Also
- **Always include the routing diagram** — it's the architecture
- **Tasks are signals** — use the DSL vocabulary (signal, mark, warn, etc.)
- **Exit conditions must be verifiable** — by code, not by human judgment
- **Blocks create the dependency graph** — think about what must complete first
- **The template IS a unit** — it runs via `/wave`, checks off via selfCheckoff
