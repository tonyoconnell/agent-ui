# Key rotation policy

> Gap 4 of [owner-todo](../../owner-todo.md). Defines cadence, cutover, and force-revoke for
> owner-PRF-derived keys.

## Scope

This doc covers OWNER-tier and tenant-CHAIRMAN keys — the keys whose hash
lives in D1 `owner_key` and whose plaintext is HKDF-derived from the owner's
WebAuthn PRF (or a chairman's, in the federation case). It does NOT govern
the random `api_xxx` keys minted by `POST /api/auth/api-keys` for agents and
read-only consumers; those follow a separate (existing) revoke-by-status path
in TypeDB `api-key.key-status`.

## Cadence

| Role | Default cadence | Trigger | Notes |
|---|---|---|---|
| owner | Voluntary | On compromise suspicion or annual review | Owner is singleton; rotation is rare. The PRF stays the same; only the version bumps. |
| chairman | 90 days | Scheduled cron | Each tenant chairman rotates independently. |
| board / ceo / operator | 90 days | Scheduled cron | Same as chairman. |
| agent | Per `api-key.expires-at` | Existing path (TypeDB) | Not covered by this doc. |

Compromise → immediate force-revoke (DELETE), then issue v+1 in the same
session.

## Lifecycle

```
                            ┌──── force-revoke (DELETE) ────┐
                            ▼                                │
[issue v=N] ──── overlap ────► [issue v=N+1] ──── overlap ────► [issue v=N+2] ...
                            ▲      cutover                      ▲
                            │      window                       │
              expires_at=NULL │   (5 min default)            both keys valid
                              │                              until N is revoked
```

- **issue v=N**: client derives `deriveKey(prf, role, group, N)` →
  hash via `hashKey()` → INSERT row in D1 `owner_key`
  with `version=N`, `expires_at=NULL`, `role`, `group_id`. Bearer
  returned to operator (saved to vault).
- **rotate to v=N+1**: same client + version+1; INSERT a SECOND row.
  Both rows are valid until v=N is force-revoked. Cutover window =
  the time between insert(v+1) and revoke(v). Operator's choice;
  ≥ 5 min recommended for clock-skew tolerance.
- **force-revoke v=N**: `UPDATE owner_key SET expires_at = unixepoch() WHERE key_hash = ?`.
  The auth middleware checks `expires_at IS NULL OR expires_at > unixepoch()`
  on every request; revoked rows fail the check.
- **age-out**: a background job (scheduled, low-priority) periodically
  marks rows with `issued_at < now - 365 days AND expires_at IS NULL`
  as expired. Catches forgotten keys.

## Operator runbook

### Issuing a new key (initial mint or rotation)

In owner browser at `https://one.ie/u/keys`:

1. Touch ID → unwraps the PRF into the in-memory wallet
2. Click "New API key" → form: role, group_id, version (auto-suggested as
   max(existing) + 1)
3. Browser computes `deriveKey(prf, role, group, version)` →
   `hashKey(rawKey)` → POSTs `{ keyHash, role, group, version }` to
   `/api/auth/api-keys` (owner-only branch) which INSERTs the D1 row
4. The raw bearer is shown ONCE — copy to vault (`age-encrypt > ~/.vault.age`)
5. Update worker secrets to reference the new bearer
6. Wait the cutover window, then **force-revoke v=N**

### Force-revoke (compromise response)

In owner browser:

1. Touch ID → unwraps PRF
2. Click "Revoke" next to the affected row → POSTs DELETE
   `/api/auth/api-keys` with `{ keyHash, mode: 'force' }` →
   server sets `expires_at = unixepoch()`
3. Auth middleware now rejects on next request
4. Issue replacement v+1 immediately if needed

### CLI shortcut (after browser-side derivation)

```bash
# Owner-side: read PRF from a Touch-ID-unlocked session, derive, register
bun run scripts/rotate-key.ts --role chairman --group g:acme --version 2
# → prints raw bearer ONCE; D1 row inserted; old version (if any) untouched
# Force-revoke a specific version:
bun run scripts/rotate-key.ts --revoke <key-hash>
```

(Stub script may not yet exist; the same flow can be done via curl + an
owner-Mac PRF-unwrap helper. Implementation follows when the rotation is
exercised in production.)

## Threat model + acceptance

| Threat | Mitigation |
|---|---|
| Key leak (stolen bearer) | Force-revoke → 401 on next request. Cutover window means new key already issued before revoke. |
| Stale key in env | `expires_at` check in auth middleware blocks even if env still references it. |
| Operator forgets to rotate | Age-out job marks expired automatically. |
| Compromised owner PRF | Out of scope — recovers via BIP39 paper backup per `mac.md`. New PRF → new salt root → all derived keys must be re-issued. |

**Rotation test:** see [`src/__tests__/integration/owner-rotation.test.ts`](../src/__tests__/integration/owner-rotation.test.ts) — verifies derive+register, dual-validity during cutover, force-revoke killing v=N, fresh request still passes for v=N+1.

## See also

- `owner-todo.md` Gap 4 — the build plan for this policy
- `owner.md` §"Five-state owner key lifecycle" — the parent spec
- `migrations/0028_owner_key.sql` — original owner_key schema
- `migrations/0032_owner_key_versions.sql` — versioning columns added in Gap 4
- `src/lib/api-key.ts` `deriveKey()` — HKDF derivation
