# Lib

**Skills: `/typedb` for query patterns, `/react19` for hooks, `/sui` for Sui client patterns.**

## Files

| File | Purpose | Skill |
|------|---------|-------|
| `typedb.ts` | TypeDB client: read/write/decay/callFunction | `/typedb` |
| `sui.ts` | **NEW:** Sui client: contract functions, keypair derivation, faucet | `/sui` |
| `auth.ts` | Better Auth server config (PBKDF2, TypeDB backend) | — |
| `auth-client.ts` | Better Auth client (React) | `/react19` |
| `typedb-auth-adapter.ts` | TypeDB adapter for Better Auth | `/typedb` |
| `utils.ts` | cn() and other utilities | `/shadcn` |

## Substrate Learning

This folder connects the nervous system to the brain. `typedb.ts` is the synapse:

```
mark() in engine  →  writeSilent() in typedb.ts  →  TypeDB Cloud
  <0.001ms              fire-and-forget                ~100ms
  (in-memory)           (non-blocking)                 (persistent)
```

`readParsed()` hydrates the in-memory state from TypeDB on boot. After that, the engine runs at memory speed. TypeDB catches up asynchronously via `writeSilent()`. This is why mark/warn is `<0.001ms` — the write to TypeDB is fire-and-forget.

**Context:** [DSL.md](../../docs/DSL.md) — what flows through these clients. [routing.md](../../docs/routing.md) — the sandwich that wraps every TypeDB call. [speed.md](../../docs/speed.md) — why fire-and-forget matters (43,200 marks/day at memory speed).

## TypeDB Client Usage

```typescript
import { read, write, readParsed, writeSilent, decay } from '@/lib/typedb'

// Read
const rows = await readParsed('match $u isa unit, has name $n; select $n;')

// Write
await write('insert $u isa unit, has uid "x", has name "X";')

// Fire and forget
writeSilent('match $e isa path...; delete...; insert...;')

// Asymmetric decay (trail 5%, alarm 20%)
await decay(0.05, 0.20)
```

## Connection Modes

- **Browser**: fetch → `PUBLIC_GATEWAY_URL` (Cloudflare Worker) → TypeDB Cloud
- **Server (SSR)**: fetch → `TYPEDB_URL` directly → TypeDB Cloud (with JWT)
