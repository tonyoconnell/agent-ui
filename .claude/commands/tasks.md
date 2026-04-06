Read the current task state from the ONE substrate and report what you find.

## Steps

1. Read the task API to get current state:

```bash
curl -s http://localhost:4321/api/tasks | jq .
```

2. If that fails (server not running), read TODO-*.md files directly with the parser:
   - `src/engine/task-parse.ts` — `scanTodos()` parses TODO files
   - `src/schema/world.tql` — task entity schema
   - `src/engine/loop.ts` — growth loop

3. Report tasks sorted by **effective priority** (priority + pheromone):

   For each task show:
   - **Name** and **id**
   - **Priority**: score + formula (e.g., `90 = critical=30 + C1=40 + dev=20`)
   - **Phase** / **Value** / **Persona**
   - **Tags**
   - **Category**: attractive / ready / exploratory / repelled
   - **Pheromone**: strength, resistance (if any)
   - **Blocks**: what tasks this blocks
   - **Exit condition** (if set)

4. Group by **phase** (C1 Foundation → C7 Scale), sorted by effective priority within each phase.

5. If the user provided arguments like `$ARGUMENTS`, filter by those tags or phase.
   Example: `/tasks build P0` shows only tasks tagged both "build" and "P0".
   Example: `/tasks C1` shows only C1 (Foundation) phase tasks.

6. Summary stats:
   - Total open / done
   - Count per phase
   - Count per value (critical / high / medium)
   - Top 5 by effective priority

7. Suggest what to work on next based on priority + pheromone state.
