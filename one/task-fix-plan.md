# Task Management Fix Plan

> 6 bugs, 3 root causes, 6 targeted fixes. No rewrite.

---

## Root Causes

### RC1: Module-scope env reads die on HMR (bugs 1, 5, 6)

`TYPEDB_URL` and `TYPEDB_DATABASE` are captured at module eval time (lines 17-18 of `typedb.ts`). Vite HMR re-evaluates modules but `import.meta.env` may not be populated yet. The URL becomes `''`, queries fall through to gateway (no credentials), silently fail.

### RC2: `writeSilent` swallows everything (bugs 2, 6)

`writeSilent = write().catch(() => {})`. `insertTask` uses it for all 3 writes per task. `Promise.allSettled` always sees `'fulfilled'`. Error count is dead code. `syncTasks` reports "105 synced, 0 errors" even when TypeDB is unreachable.

### RC3: Task ID length mismatch (bug 3)

`slugify()` truncates to 60 chars. Complete endpoint receives IDs from API that may be truncated differently. `doc-scan.ts` prepends `${source}-` before slugify, so composite IDs can exceed 60.

---

## Fixes (in order)

### Fix 1: Move env reads to runtime — `src/lib/typedb.ts`

Replace module-scope constants with a `getConfig()` function:

```typescript
// BEFORE (dies on HMR)
const TYPEDB_URL = import.meta.env.TYPEDB_URL || ''
const TYPEDB_DATABASE = import.meta.env.TYPEDB_DATABASE || 'one'

// AFTER (reads at call time, survives HMR)
function getConfig() {
  return {
    gatewayUrl: import.meta.env.PUBLIC_GATEWAY_URL || (globalThis as any).PUBLIC_GATEWAY_URL || 'https://one-gateway.oneie.workers.dev',
    typedbUrl: import.meta.env.TYPEDB_URL || (globalThis as any).TYPEDB_URL || '',
    typedbDatabase: import.meta.env.TYPEDB_DATABASE || (globalThis as any).TYPEDB_DATABASE || 'one',
  }
}
```

Update `query()` and `getDirectToken()` to call `getConfig()` instead of referencing dead constants. Invalidate `cachedToken` when URL changes.

### Fix 2: Add retry for TypeDB Cloud 503s — `src/lib/typedb.ts`

```typescript
async function fetchWithRetry(url: string, init: RequestInit, retries = 3, backoffMs = 500): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init)
    if (res.status !== 503 || attempt === retries) return res
    await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)))
    cachedToken = null  // force re-auth
  }
  throw new Error('unreachable')
}
```

Replace `fetch(...)` in both direct and gateway paths with `fetchWithRetry(...)`. Only retries 503. All other errors fail immediately.

### Fix 3: Add `writeTracked` for sync ops — `src/lib/typedb.ts` + `src/engine/task-sync.ts`

```typescript
// typedb.ts — new export
export async function writeTracked(tql: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await write(tql)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
```

In `task-sync.ts`, change `insertTask` to use `writeTracked` instead of `writeSilent`. Propagate failures so `Promise.allSettled` actually detects them.

Keep `writeSilent` for fire-and-forget scenarios (decay, pheromone, hypotheses in loop.ts).

### Fix 4: Complete endpoint uses `write` not `writeSilent` — `src/pages/api/tasks/[id]/complete.ts`

Replace all `writeSilent` → `write`. Wrap in try/catch, return 502 on failure:

```typescript
try {
  await write(`...reinforce/alarm...`)
  await write(`...update success-rate...`)
  if (!failed) await write(`...mark task done...`)
  return Response.json({ ok: true, unit: id, outcome })
} catch (e) {
  return Response.json({ ok: false, error: e.message }, { status: 502 })
}
```

Mark-done MUST report failure to the caller.

### Fix 5: Surface errors in GET /api/tasks — `src/pages/api/tasks/index.ts`

Remove `.catch(() => [])` from readParsed calls. Wrap handler in try/catch, return 502 with error detail instead of 200 with empty tasks:

```typescript
try {
  const tasks = await readParsed(`...`)
  // ...build response
} catch (e) {
  return Response.json({ error: 'TypeDB query failed', detail: e.message, tasks: [] }, { status: 502 })
}
```

### Fix 6: Stabilize task IDs — `src/engine/task-parse.ts` + `src/engine/doc-scan.ts`

- Increase slug length from 60 → 80 chars in `task-parse.ts` line 98
- In `doc-scan.ts`, truncate composite ID (`${source}-${slug}`) to same max after concatenation
- Explicit `id:` metadata in TODO files bypasses slugify entirely (already supported)

---

## Implementation Sequence

```
1. Fix 1  typedb.ts env reads      ← root cause of 3/6 bugs, unblocks everything
2. Fix 2  typedb.ts retry          ← same file, reduces transient failures
3. Fix 3  writeTracked + task-sync ← makes sync reliable and observable
4. Fix 4  complete.ts              ← makes mark-done reliable
5. Fix 5  tasks/index.ts           ← makes failures visible to UI
6. Fix 6  ID stabilization         ← least urgent, cosmetic
```

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Cached token from old URL | Store URL alongside token, invalidate on mismatch |
| Duplicate inserts after writeTracked | Sync should delete-then-insert, or check existence first |
| loop.ts uses writeSilent | Keep it — hypotheses/frontiers are genuinely fire-and-forget |
| CF Workers production | `getConfig()` fallback to `(globalThis as any)` already handles this |

---

## Files

| File | Fixes |
|------|-------|
| `src/lib/typedb.ts` | 1, 2, 3 |
| `src/engine/task-sync.ts` | 3 |
| `src/pages/api/tasks/[id]/complete.ts` | 4 |
| `src/pages/api/tasks/index.ts` | 5 |
| `src/engine/task-parse.ts` | 6 |
| `src/engine/doc-scan.ts` | 6 |
