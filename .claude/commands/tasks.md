Read the current task state from the ONE substrate and report what you find.

## Steps

1. Read the task API to get current state:

```bash
curl -s http://localhost:4321/api/tasks | jq .
```

2. If that fails (server not running), read the source of truth directly:
   - `src/schema/one.tql` for the schema
   - `src/engine/loop.ts` for the growth loop
   - `src/pages/api/tasks/index.ts` for the task API

3. Report the tasks grouped by category:
   - **Attractive** (strength >= 50) — proven, follow the trail
   - **Ready** (has edges, below threshold) — available
   - **Exploratory** (no edges) — needs a scout
   - **Repelled** (alarm > strength) — failed before, being avoided

4. For each task show: name, tags, unit, strength/alarm, traversals

5. If the user provided arguments like `$ARGUMENTS`, filter by those tags.
   Example: `/tasks build P0` shows only tasks tagged both "build" and "P0".

6. Suggest what to work on next based on the pheromone state:
   - High-strength attractive tasks = proven sequences, safe to continue
   - Exploratory tasks = unknown territory, worth scouting
   - Repelled tasks = what failed and why (check alarm level)
