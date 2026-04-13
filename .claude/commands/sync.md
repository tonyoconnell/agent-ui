Run the doc-scan sync loop. Scans all `docs/TODO-*.md` files, writes to CF KV (hot cache), syncs to TypeDB (durable), writes `todo.json` (snapshot), regenerates `docs/TODO.md` (master index ranked by pheromone weight).

Three-layer architecture: KV (10ms) → TypeDB (100ms) → TODO.md (regenerate).

## Steps

1. **Scan** — Parse all `docs/TODO-*.md` files via `scanTodos()` (deterministic, no LLM)

2. **Sync to KV** — Write Task[] to CF KV cache (`tasks.json`):
   - Hash Task[] array (FNV-1a)
   - If hash changed → write to KV (skips if unchanged)
   - Returns immediately (10ms, hot cache ready)

3. **Async to TypeDB** — Background write (non-blocking):
   - Call `POST /api/tasks/sync` (or simulate if server isn't running):
   ```bash
   curl -s -X POST http://localhost:4321/api/tasks/sync | jq .
   ```

4. **If server not running**, do a dry run:
   ```bash
   curl -s http://localhost:4321/api/tasks/sync | jq .
   ```
   Or parse locally and report without TypeDB/KV sync.

4. **Report** what was synced:
   - Total tasks (open / done)
   - Count per TODO-*.md file
   - Count per phase (C1-C7)
   - Top 10 by effective priority (priority + pheromone)
   - Any sync errors

5. **Verify sync artifacts:**
   - `docs/TODO.md` — master index with links to all TODO-*.md files
   - `todo.json` — snapshot with all tasks + pheromone + effective priority
   - TypeDB — task entities + skill entities + capability + blocks relations

6. **Check consistency:**
   - Every TODO-*.md task has a matching TypeDB task entity
   - Every TypeDB task has a matching TODO-*.md checkbox
   - `todo.json` matches both (generated timestamp shows freshness)
   - `docs/TODO.md` links to all active TODO-*.md files

7. **Suggest next actions** based on highest-ranked open items:
   - `/wave TODO-{name}.md` for the highest-priority TODO
   - `/next` to pick the single best task
   - `/work` for autonomous loop

## The Sync Chain

```
TODO-*.md (edit here)
    │
    ├── task-parse.ts → Task[]              (deterministic, no LLM)
    │
    ├── CF KV (hot cache)
    │   ├─ tasks.json (hash-gated write)   (10ms read)
    │   └─ avoids re-parsing on every tick
    │
    ├── TypeDB (durable, async)
    │   ├─ task-sync.ts → entities         (100ms write, non-blocking)
    │   ├─ capability → links to skills
    │   ├─ blocks → dependency relations
    │   └─ pheromone → strength/resistance
    │
    ├── todo.json (snapshot)
    │   └─ all tasks + effective priority   (for CI, dashboards)
    │
    └── TODO.md (master index)
        └─ regenerated, ranked by pheromone
```

Four sources, one truth:
- **TODO-*.md** — human-editable source
- **CF KV** — hot cache for routing (10ms)
- **TypeDB** — durable brain (100ms, learns)
- **todo.json** — snapshot for verification

Edit the TODO-*.md files. Everything else regenerates from them.
