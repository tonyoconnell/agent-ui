# ADL Integration

**Three gates. One enforcement mode. Signal dissolves on deny.**

ADL (Agent Definition Language) wraps the signal path with security gates. Every `POST /api/signal` passes all three before reaching TypeDB.

## Gates (in order)

| Stage | Gate | Check | Default |
|-------|------|-------|---------|
| 1 | Lifecycle | receiver `adl-status` ∈ {retired, deprecated} → dissolve | enforce |
| 2 | Network | sender hostname ∉ receiver `perm-network.allowedHosts` → dissolve | enforce |
| 3 | Sensitivity | sender `data-sensitivity` > receiver `data-sensitivity` → dissolve | enforce |

## Enforcement Mode

Default: `enforce` — gates block with 403/dissolved.
Override: `ADL_ENFORCEMENT_MODE=audit` — gates log only, signal passes through.

```typescript
// adl-cache.ts
const mode = envProc || envMeta || 'enforce'
return mode === 'audit' ? 'audit' : 'enforce'
```

## Sensitivity Levels

`public (0) < internal (1) < confidential (2) < restricted (3)`

A `confidential` sender cannot signal a `public` receiver in enforce mode.

## Audit Trail

Every gate decision is recorded via `audit(rec)`:
- Logged to `console.warn` with `[adl-audit]` prefix
- Buffered to D1 `adl_audit` table (flushed per request)

## See Also

- `src/engine/adl.ts` — ADL document parsing and TypeDB sync
- `src/engine/adl-cache.ts` — Enforcement mode + cache management
- `src/pages/api/signal.ts` — Gate enforcement in the signal path
- [dictionary.md](dictionary.md) — Canonical signal terminology
