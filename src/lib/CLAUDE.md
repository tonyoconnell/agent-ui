# Lib

**Skills: `/typedb` for query patterns, `/react19` for hooks.**

## Files

| File | Purpose | Skill |
|------|---------|-------|
| `typedb.ts` | TypeDB client: read/write/decay/callFunction | `/typedb` |
| `auth.ts` | Better Auth server config (PBKDF2, TypeDB backend) | — |
| `auth-client.ts` | Better Auth client (React) | `/react19` |
| `typedb-auth-adapter.ts` | TypeDB adapter for Better Auth | `/typedb` |
| `utils.ts` | cn() and other utilities | `/shadcn` |

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
