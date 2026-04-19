# Collision Avoidance for Parallel Agent Sessions

## Problem

Multiple Claude Code sessions and agent instances working the ONE substrate simultaneously collide:
- Two agents pick the same task → duplicate work
- Two agents run the same wave → merge conflicts
- Sessions overwrite each other's task state
- No ownership tracking, no atomic claim, no lease expiry

## Solution: Task Ownership + Atomic Claim + TTL Recovery

**Core mechanism:** Atomic TypeDB transaction (single HTTP call) claims a task by transitioning `task-status "open"` → `"active"` + storing `owner` (session ID). Only one writer wins.

```
┌─────────────────────────────────────────────┐
│ Agent A                                     │
│  1. SELECT highest-priority open task      │
│  2. CLAIM (POST /claim {sessionId})         │
│  3. TypeDB: match open → delete → insert    │  ← One atomic transaction
│     active + owner="claude-1234-xxxx"       │     only one succeeds
│  4. EXECUTE (read, edit, test)              │
│  5. COMPLETE (mark done, clear owner)       │
└──────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────┐
│ Agent B (simultaneously)                    │
│  1. SELECT highest-priority open task      │
│  2. CLAIM (POST /claim {sessionId})         │
│  3. TypeDB: match open → NOT FOUND          │  ← Claim already taken
│     (task-status is now "active")           │     returns 409 Conflict
│  4. SELECT next task (loop back)            │
│  5. CLAIM different task → succeeds         │
└──────────────────────────────────────────────┘
```

## Architecture

### TypeDB Schema Changes

Add to `task` entity:
```typeql
owns owner,       # session-id: "claude-{pid}-{timestamp}"
owns claimed-at;  # datetime: when claimed
```

Add new entity for wave-level locking:
```typeql
entity wave-lock,
    owns wave-lock-id @key,  # "TODO-{docname}"
    owns owner,              # session-id
    owns claimed-at;         # datetime
```

### API Endpoints (New)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tasks/:id/claim` | POST | Atomic claim (match open → set active + owner) |
| `/api/tasks/:id/release` | POST | Release (owner-checked, revert to open) |
| `/api/tasks/expire` | GET | TTL recovery (auto-release stale claims) |
| `/api/waves/:docname/claim` | POST | Claim entire wave (prevent competing waves) |
| `/api/waves/:docname/release` | POST | Release wave lock |

### Command Flow

#### `/work` — Pick and Claim

```bash
SESSION_ID="claude-$$-$(date +%s)"     # Generate unique session ID

# W0 Gate: verify baseline
bun run verify

# SELECT: find highest-priority open task
TASK=$(curl /api/tasks | jq '.[] | select(.status=="open")' | head -1)

# CLAIM: atomic transition to active
curl -X POST /api/tasks/$TASK_ID/claim \
  -d '{"sessionId":"'$SESSION_ID'"}'   # → 200 or 409

# EXECUTE: do the work
# ... (waves W1-W4, edits, tests)

# COMPLETE: mark done, clear owner
curl -X POST /api/tasks/$TASK_ID/complete \
  -d '{"from":"'$SESSION_ID'"}'
```

If claim returns 409 (already claimed), loop back to SELECT with a different task.

#### `/wave TODO-{name}.md` — Claim Wave

```bash
SESSION_ID="claude-$$-$(date +%s)"

# Claim the entire wave at document level
curl -X POST /api/waves/TODO-rename.md/claim \
  -d '{"sessionId":"'$SESSION_ID'"}'   # → 200 or 409

# W1: Haiku recon (safe to read in parallel)
# W2: Opus decide (single agent, decision is atomic via task claims)
# W3: Sonnet edit (single agent, file edits per task)
# W4: Sonnet verify (single agent, final gate)

# Release wave lock when done
curl -X POST /api/waves/TODO-rename.md/release \
  -d '{"sessionId":"'$SESSION_ID'"}'
```

### Stale Lease Recovery

If a session crashes mid-task, the claim is never released. TTL recovery auto-expires stale claims:

- **Task TTL:** 30 minutes
  - If `claimed-at < now - 30min` and `task-status == "active"`, auto-release
  - Called from `/api/tick` on every cycle
  
- **Wave-lock TTL:** 2 hours
  - Waves may take longer; 2-hour TTL is conservative
  - Same recovery mechanism as tasks

## Implementation Order

1. **Schema:** Update `src/schema/world.tql` (add `owner`, `claimed-at`, `wave-lock`)
2. **New endpoints:** Create claim.ts, release.ts, expire.ts (no dependencies)
3. **Filter active:** Modify `tasks/index.ts` (GET /api/tasks excludes active)
4. **Clear owner:** Modify `tasks/[id]/complete.ts` (remove owner on done)
5. **Guard sync:** Modify `task-sync.ts` (skip active tasks during re-sync)
6. **Expire task:** Create `tasks/expire.ts` + integrate into `/api/tick`
7. **Wave-lock endpoints:** Create `waves/[docname]/claim.ts` and `release.ts`
8. **Update commands:** Modify `.claude/commands/work.md` and `done.md` (add SESSION_ID, claim step)

## Atomicity & Serialization

**Why this works:** Each API call to the CF gateway → one TypeDB transaction. The `match open ... delete ... insert active+owner` query is a single atomic write. If two sessions send identical claim queries simultaneously:

1. Both queries arrive at TypeDB
2. TypeDB serializes the transactions (write lock on the entity)
3. First writer commits: `match` finds `task-status="open"`, modifies entity, commits
4. Second writer commits: `match` finds `task-status="active"`, **match fails**, no insert happens
5. Second writer gets empty result → endpoint returns 409

No application-level locking needed — TypeDB's transaction isolation is the mutex.

## Testing Verification

```bash
# 1. Schema migration
bun run verify  # Must pass with new schema

# 2. Two-session collision test
SESSION_A="claude-$$-$(date +%s)"
SESSION_B="claude-$$-$(($(date +%s) + 1))"

# A claims task
curl -X POST http://localhost:4322/api/tasks/TODO-SUI-2-1/claim \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"'$SESSION_A'"}'
# → 200 { ok: true, owner: "claude-..." }

# B tries same task
curl -X POST http://localhost:4322/api/tasks/TODO-SUI-2-1/claim \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"'$SESSION_B'"}'
# → 409 { error: "Task already claimed", owner: "claude-..." }

# 3. Stale recovery test
# Set claimed-at to 31 minutes ago
# Call GET /api/tasks/expire
# → Task back to open

# 4. Wave-lock test
curl -X POST http://localhost:4322/api/waves/TODO-SUI.md/claim \
  -d '{"sessionId":"'$SESSION_A'"}'
# → 200
curl -X POST http://localhost:4322/api/waves/TODO-SUI.md/claim \
  -d '{"sessionId":"'$SESSION_B'"}'
# → 409

# 5. Filter active tasks
# After claiming, GET /api/tasks
# → Claimed task not in list
```

## Monitoring & Debugging

```bash
# See all claimed tasks (active)
curl http://localhost:4322/api/tasks | jq '.[] | select(.status=="active")'

# See who owns what
curl http://localhost:4322/api/tasks | jq '.[] | select(.owner) | {id, owner, claimedAt}'

# Check for ghost tasks (claimed but not completed)
curl http://localhost:4322/api/tasks/expire | jq .

# Manual release (admin only)
curl -X POST http://localhost:4322/api/tasks/{id}/release \
  -d '{"sessionId":"'$ADMIN_SESSION'", "force": true}'
```

## Session ID Format

```
claude-{process-id}-{unix-timestamp-seconds}
```

Example: `claude-12345-1713089543`

**Uniqueness:** Process ID is unique within an OS per moment. Timestamp adds the second. Two sessions on the same PID won't happen in practice (different processes = different PIDs). If it does, collision is indistinguishable from legitimate concurrency — claim wins atomically either way.

## Related Concepts

- **Pheromone routing:** Weak selection bias (strength/resistance accumulates on used paths). Complements collision avoidance by making idle agents naturally diverge toward unexplored tasks.
- **Blocks relations:** Dependencies prevent work on blocked tasks. Collision avoidance complements this by ensuring only one agent claims a task, blocks or not.
- **Wave gates (W0-W4):** Sequential phases within a TODO document. Wave-level locking ensures no two agents run waves on the same document simultaneously, preventing merge conflicts.

---

**Status:** Approved for implementation.  
**Impact:** Zero breaking changes to `/work` or `/done` for existing sessions. New sessions automatically generate SESSION_ID. Backward compatible.

