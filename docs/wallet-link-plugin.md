# Wallet Link Plugin

Links a Sui wallet address to a Better Auth user in TypeDB. This is the
State 3 transition: an authenticated user associates their wallet address
with their Google / Better Auth identity.

Source files: `src/lib/auth-plugins/wallet-link.ts`, `src/schema/world.tql`.

---

## What it does

State 3 adds two attributes to the `auth-user` entity in TypeDB:

| Attribute | Type | Meaning |
|-----------|------|---------|
| `wallet-address` | string | Sui address derived client-side from passkey PRF |
| `passkey-cred-ids` | string | JSON array of hex-encoded credIds (multi-device hints, max 20) |

No seed material crosses to the server. The address is derived deterministically
client-side (`Ed25519Keypair.fromSecretKey(seed).toSuiAddress()`) and sent as a
plain string. The server treats it as a capability assertion only.

---

## TypeDB schema (world.tql)

```typeql
entity auth-user,
    owns wallet-address,              # State 3: Sui address linked to this user
    owns passkey-cred-ids;            # State 3: JSON array of hex credIds

attribute wallet-address, value string;      # Sui 0x... address
attribute passkey-cred-ids, value string;    # JSON array, e.g. ["a1b2c3..."]
```

`auth-user` is keyed by `auth-id` (the Better Auth user ID). `wallet-address`
does not carry `@key` or `@unique` — it is replaced on re-link by a
delete-then-insert pattern (TypeDB attributes without `@key` allow
re-insertion after deletion).

---

## linkWallet(userId, address, credId?)

```typescript
import { linkWallet } from '@/lib/auth-plugins/wallet-link'

await linkWallet(userId, '0xabc...', credIdArrayBuffer)
// Returns: { userId, walletAddress, linkedAt }
```

Steps:
1. Delete any existing `wallet-address` on the `auth-user` entity (idempotent)
2. Insert new `wallet-address` via `writeTracked` (throws if entity not found)
3. If `credId` is provided:
   - Read existing `passkey-cred-ids` JSON array
   - Append new hex credId (deduplicated, capped at 20)
   - Delete old array value, insert updated array

The delete-before-insert pattern is required because TypeDB attributes without
`@key` can accumulate multiple values on the same owner — deletion ensures
exactly one `wallet-address` value exists after the call.

---

## getLinkedWallet(userId)

```typescript
import { getLinkedWallet } from '@/lib/auth-plugins/wallet-link'

const result = await getLinkedWallet(userId)
// Returns: { userId, walletAddress, linkedAt } | null
```

Returns `null` when:
- No `auth-user` entity for `userId`
- `auth-user` exists but has no `wallet-address` (State < 3)

`linkedAt` in the return value is `new Date().toISOString()` — a sentinel;
exact link timestamp is not stored separately.

---

## ensureHumanUnit (human-unit.ts)

Called on every authenticated request (via `api-auth.ts`) to ensure a TypeDB
`unit` entity exists for the human. Creates:

1. `unit` entity with `uid`, `name`, `unit-kind "human"`, `wallet` (derived from `SUI_SEED + uid`)
2. Personal group `group:{uid}` (type `"personal"`)
3. `chairman` membership in that group

Idempotent: queries for existing unit before inserting; skips if already present.
`wallet` derivation requires `SUI_SEED` to be set; silently omitted otherwise.

`ensureHumanUnit` creates the substrate actor. `linkWallet` writes the explicit
user-controlled address association. The two can point to different addresses:
the substrate address is platform-derived; the linked address is user-chosen.
