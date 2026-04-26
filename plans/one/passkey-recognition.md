---
title: Passkey Recognition — biometrics IS the security
slug: passkey-recognition
goal: "Server always recognises a valid passkey. Same Touch ID → same user_id → same vault, on any device, after any wipe. No 'passkey not recognised', no orphaned accounts, no 'recovery phrase' fallback for the common case."
group: ONE
cycles: 1
mode: lean
lifecycle: maintenance
route_hints:
  primary: [auth, passkey, vault, identity]
  secondary: [d1, biometrics, prf, webauthn]
rubric_weights:
  fit: 0.40
  form: 0.20
  truth: 0.30
  taste: 0.10
escape:
  condition: "any test in src/__tests__/integration/auth-* fails OR signing in on a fresh browser cannot recover an existing vault_blob"
  action: "halt cycle, revert touched files, emit signal → chairman with reproduction steps"
downstream:
  capability: deterministic-passkey-identity
  price: 0.00
  scope: public
source_of_truth:
  - passkeys.md
  - one.ie/CLAUDE.md (auth section)
  - migrations/0023_vault_passkey_hints.sql
---

# Passkey Recognition

## 0 — Why this cycle exists (the evidence)

Local dev D1 + dev-hint-file inspection on 2026-04-26:

```
D1 vault_passkey_hints:    1 row   → user uucOD00I…
.dev-passkey-hints.json:   4 rows  → 4 DIFFERENT user_ids
D1 vault_blob:             2 rows  → users uucOD00I… and wJ93FrY6…
```

Same Touch ID, five "users" minted, three vaults orphaned. The architecture
already supports the right outcome — `master = prfToMaster(prfSecret)` is
deterministic — but the server identity layer doesn't use it, so every
forgetful moment forks a new account.

Source: conversation 2026-04-26 (transcript in session log).

## 1 — Architectural target

> The biometric IS the master. The master IS the user identity.
> The server is a CACHE of identity, not a SOURCE OF TRUTH for it.

Concretely: `user_id_pub = SHA256("user-id-v1" || master)` becomes the
**stable identity key**. D1 stores `(user_id_pub → user_id, cred_ids,
vault_blob)`. If D1 forgets, the next Touch ID re-derives the same
`user_id_pub`, the existing `vault_blob` is still keyed by it, and a
self-heal endpoint re-inserts the credential row.

`recovery phrase` becomes the disaster-recovery path it was always meant
to be — not a routine fallback for "server forgot."

## 2 — The seven gaps

| # | Gap | Closes via |
|---|-----|-----------|
| 1 | `user_id` is server-random, not derived from master | Tracks A + C + D + E |
| 2 | D1/file split-brain in dev (`if (db) {…} else if (isDev()) {file}`) | Tracks B + D |
| 3 | No self-heal on 401 | Track D (`/heal` endpoint) |
| 4 | Server can't derive `user_id` from PRF (it never sees the secret) | Tracks C + E (client sends `user_id_pub`) |
| 5 | `deviceHandle` couples identity to localStorage | Track D (use `user_id_pub` instead) |
| 6 | `excludeCredentials` doesn't include cross-device synced creds | Track D (server-side lookup) |
| 7 | Misleading "passkey not recognised — clear vault" error | Track E (replace with auto-heal) |

## 3 — Parallel tracks (Cycle 1, W3)

Five tracks. Five files. Zero file-edit conflicts. All can ship in
parallel; each owner is its own Sonnet agent.

### Track A — `migrations/0024_user_id_pub.sql` (NEW)

```sql
ALTER TABLE user                ADD COLUMN user_id_pub TEXT;
ALTER TABLE vault_blob          ADD COLUMN user_id_pub TEXT;
ALTER TABLE vault_passkey_hints ADD COLUMN user_id_pub TEXT;

CREATE INDEX IF NOT EXISTS idx_user_user_id_pub                ON user(user_id_pub);
CREATE INDEX IF NOT EXISTS idx_vault_blob_user_id_pub          ON vault_blob(user_id_pub);
CREATE INDEX IF NOT EXISTS idx_vault_passkey_hints_user_id_pub ON vault_passkey_hints(user_id_pub);
```

**Exit:** column present in dev D1, indexes created, no existing rows broken.
**Verify:** `sqlite3 .wrangler/.../*.sqlite "PRAGMA table_info(vault_blob);"`

### Track B — `scripts/migrate-dev-passkey-hints.ts` (NEW)

Reads `.dev-passkey-hints.json`, inserts each row into D1's
`vault_passkey_hints` (ON CONFLICT skip), renames the file to
`.dev-passkey-hints.json.migrated-{date}`. Run once locally.

**Exit:** D1 row count grows by 4, file moved, sign-in with each cred
returns 200 (verified manually on each of the 4 cred_ids).
**Verify:** `bun run scripts/migrate-dev-passkey-hints.ts && sqlite3 ... "SELECT COUNT(*) FROM vault_passkey_hints"` returns 5.

### Track C — `src/components/u/lib/vault/crypto.ts` (EDIT)

Add one helper:

```ts
/** Stable public identifier derived from the vault master.
 *  Same biometric → same master → same user_id_pub, on any device, forever.
 *  Safe to send to the server — leaking it does not reveal the master. */
export async function masterToUserIdPub(master: Uint8Array): Promise<string> {
  const hkdf = await crypto.subtle.importKey('raw', master, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('user-id-v1') },
    hkdf,
    256,
  )
  return b64url(new Uint8Array(bits))
}
```

**Exit:** function exported, unit test (`src/__tests__/integration/master-to-user-id.test.ts`) confirms determinism (same master → same output) and uniqueness (different master → different output).

### Track D — `src/lib/auth-plugins/passkey-webauthn.ts` (EDIT)

Four changes, one file, one agent:

1. **Remove file fallback** (Gap 2) — `upsertHint`/`findHint`/`bumpSignCount`: drop the `if (isDev()) { file }` branches. If `db` is null, return error 503.
2. **Use `user_id_pub` as identity key** (Gaps 1+4+5) — `register-anonymous` body schema accepts `user_id_pub: string`. `createOrFindUser` becomes `createOrFindUserByPub(user_id_pub)`: SELECT user WHERE user_id_pub = ?, or INSERT new user with that pub. WebAuthn `userID` becomes the bytes of `user_id_pub` (replaces `deviceHandle`).
3. **Add `/heal` endpoint** (Gap 3) — `POST /passkey-webauthn/heal { user_id_pub, attestation }`. Verifies attestation cryptographically via `verifyRegistrationResponse`. On success, upserts the cred_id row keyed by `user_id_pub`. No session minted; this is identity rescue, not sign-in.
4. **Server-side excludeCredentials** (Gap 6) — `register-anonymous/options` looks up all `cred_id` for the given `user_id_pub` and includes them in `excludeCredentials`.

**Exit:** all existing auth tests pass. New tests: `auth-passkey-heal.test.ts` covers the heal path. `auth-passkey-pub.test.ts` covers deterministic user_id_pub matching.

### Track E — `src/components/u/lib/vault/passkey-cloud.ts` (EDIT)

Three changes, one file, one agent:

1. **Send `user_id_pub` on register/auth** (Gap 4) — both `createAccountWithPasskey` and `registerPasskeyForSignin` compute `masterToUserIdPub(master)` and include it in the request body.
2. **Auto-heal on 401 with local vault** (Gap 7) — replace the `throw new VaultError('Your passkey is not recognised…')` branch (line 489-493) with: re-run a quick `navigator.credentials.create({excludeCredentials: [thisCredId]})` ceremony to capture an attestation, POST `/passkey-webauthn/heal { user_id_pub, attestation }`, then retry `signInWithPasskey()`. If heal also fails → THEN show a clear error (not "clear your vault").
3. **Delete misleading recovery-phrase prompt** — only surface recovery-phrase as the disaster-recovery path on the dedicated `/u/recover` page, never as a server-restart fallback.

**Exit:** the four steps in the original repro produce the same vault every time. Manual test: clear D1, sign in with same Touch ID → vault unlocks (heal path), no orphan account minted.

## 4 — W4 verify (cycle gate)

Deterministic checks (numbers must clear):

```
✓ bun run verify                       # biome + tsc + vitest, no regressions
✓ all auth-passkey-*.test.ts pass      # new + existing
✓ rm .wrangler/state/v3/d1/*.sqlite    # nuke local D1
✓ apply migrations 0001..0024
✓ sign in with same Touch ID           # → no fresh user, vault unlocks
✓ sqlite3 ... "SELECT user_id_pub FROM user GROUP BY user_id_pub HAVING COUNT(*) > 1;" → 0 rows
✓ .dev-passkey-hints.json              # does not exist (migrated + removed)
```

Rubric:
- **fit (0.40 weight)** — does same biometric → same vault on a fresh server? pass/fail
- **truth (0.30 weight)** — proof: D1 wipe + sign-in produces no orphaned `vault_blob`
- **form (0.20 weight)** — diff fits in the file budget; no surprise refactors
- **taste (0.10 weight)** — error messages match the new mental model

Cycle gate: rubric ≥ 0.65 OR escape condition fires (revert).

## 5 — What this cycle does NOT do

- Doesn't migrate existing 5 orphan accounts on this machine. That's a
  follow-up cleanup script (`scripts/dedupe-orphaned-users.ts`) gated on
  Cycle 1 landing. The orphans are local-dev artifacts; production has
  zero affected users.
- Doesn't add cross-device biometric attestation. Sui Move authority
  binding is in `passkeys.md` long-term plan, not this cycle.
- Doesn't change the recovery phrase mechanism. It stays as the disaster-
  recovery path; this cycle just stops *misusing* it as a routine fallback.

## 6 — See also

- `passkeys.md` — root spec for the 5-state lifecycle and PRF derivation
- `mac.md` — biometric architecture
- `migrations/0023_vault_passkey_hints.sql` — schema being extended
- `src/lib/auth-plugins/passkey-webauthn.ts` — server-side plugin
- `src/components/u/lib/vault/passkey-cloud.ts` — client-side flow
