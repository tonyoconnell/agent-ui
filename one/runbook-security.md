# Runbook: Security Incidents & Rotation

**Playbook for breach response and scheduled rotation. Assume hostile conditions; act fast; audit after.**

One principle drives every step: **contain the blast, then rotate, then learn.** Do not investigate before containing.

---

## Severity Ladder

```
P0 — MASTER_KEK or SUI_SEED leak, tenant-root compromise, RCE on gateway
P1 — Single-tenant admin key leak, bridge signing-key leak, audit-log tamper
P2 — Single user key leak, public-group spam, rate-limit bypass
P3 — Suspected probe, unusual pheromone pattern, self-dealing detector fires
```

Response time targets (wall-clock):

| Severity | Contain | Rotate | Postmortem |
|----------|--------|--------|------------|
| P0 | 15 min | 60 min | Within 48h |
| P1 | 60 min | 4h | Within 5d |
| P2 | 4h | 24h | Within 10d |
| P3 | Next cycle | As needed | If pattern holds |

---

## P0 — `SUI_SEED` Leak

**Blast:** Every agent wallet ever minted with the leaked version.

**Contain**
1. Rotate `SUI_SEED` in Cloudflare env **without deploying** (staging env first).
2. Set `wallet.rotation-active: true` on all affected tenants' root groups → PEP blocks new Sui-signing operations during rotation.
3. Emit `kind: "security", subkind: "seed-rotation-start"` to audit log.

**Rotate**
4. New `SUI_SEED` → bump `key-version` on all units from 0 → 1.
5. For each unit with `sui-unit-id`, transfer on-chain Move objects from old wallet to new (signed by old seed one last time; `src/lib/sui.ts:rotateUnitOwner`).
6. For units without on-chain objects, derive fresh v1 wallet; clients pick up new address on next `/api/auth/agent` call.
7. Deploy with new seed; clear `rotation-active` flag.

**Learn**
8. Run `/sync know` on security signals from leak-window → promote to hypothesis.
9. Audit where old seed was exposed (CI logs, env files, personnel access).
10. Ratchet: rotate `MASTER_KEK`, `BETTER_AUTH_SECRET`, and worker JWT keys in the same window.

---

## P0 — `MASTER_KEK` Leak

**Blast:** Every private-scope signal body in every tenant, decryptable by the attacker from now backwards.

**Contain**
1. Generate new `MASTER_KEK`; deploy to all workers simultaneously.
2. Derive new tenant KEKs via `HKDF(NEW_MASTER_KEK, gid, "signal-data-kek")`.

**Rotate**
3. Re-encrypt payloads: worker reads with old tenant KEK, writes with new. Run as cron batch (≤ 100k rows per pass, rate-limited to avoid quota burn).
4. Verify re-encryption by sampling 1% and decrypting with new key.

**Learn**
5. Old `MASTER_KEK` stays in a locked "grave" slot for 30 days to cover any race-lagged read; after 30 days, destroy.
6. If attacker had access for > 24h, assume all private signals from that window are compromised. Notify affected tenants.

---

## P0 — Tenant-Root Compromise

**Blast:** Attacker controls an admin key for a whole tenant world.

**Contain**
1. Revoke all API keys belonging to the tenant's admins (push-invalidation via WsHub).
2. Freeze the tenant: set `group.status: "frozen"` on the root → PEP dissolves all new signals from the tenant's actors.

**Investigate**
3. Query `signal` WHERE `kind = "security"` OR `sender in tenant.members` for the leak window.
4. Identify: which admin was compromised, what they did, which capabilities they invoked, what bridges they created.

**Rotate**
5. Mint new admin keys for verified-human admins (proof of identity outside the channel — phone, in-person).
6. Dissolve any bridges the attacker created. Unfreeze tenant.

**Learn**
7. Emit `hypothesis` rows with the attack pattern; feeds L6 detector.
8. Require 2FA or hardware keys for admins of this tenant going forward.

---

## P1 — Single Admin / Bridge Key Leak

**Contain**
1. Revoke the key via `/api/auth/api-keys DELETE` (push-invalidation).
2. If the key signed bridge creations, dissolve those bridges via `/api/paths/bridge/:id DELETE`.

**Rotate**
3. Issue replacement key to the verified holder.
4. If bridge-signing key for a worker: rotate worker JWT signing keypair; redeploy affected worker.

**Learn**
5. Check audit log for anything the leaked key did since first possible compromise.
6. If the key acted outside its normal pattern (new groups, new capabilities, unusual hours), escalate to P0.

---

## P2 — Single User Key Leak

**Contain**
1. Revoke via `/api/auth/api-keys DELETE`. Cache clears in <1s.
2. Check audit log — anything the key marked/warned/paid in the last 24h.

**Rotate**
3. User mints new key via usual flow. Same wallet (uid unchanged → HKDF stable).

**Learn**
4. If the attacker earned pheromone on any path, it will fade naturally (L3 every 5 min).
5. Self-dealing detector (L6) runs hourly — will flag if attacker marked a shell friend.

---

## P3 — Probe / Suspected Attack

The substrate handles most P3s on its own:

- Repeated `cross-tenant-probe` events `warn(0.3)` the caller's path.
- After ~10 events in a 5-min window, toxicity threshold hits → PEP auto-dissolves.
- L6 `know()` promotes the pattern to hypothesis.

**Manual action:** only if the pattern is novel — add to deny-list or tenant rate-limit config. Most P3s resolve without human touch.

---

## Scheduled Rotation Calendar

| Secret | Cadence | Trigger | Owner |
|--------|---------|---------|-------|
| `SUI_SEED` | Annual + incident | Jan 1, or P0 | Security lead |
| `MASTER_KEK` | Annual | Jan 1 | Security lead |
| `BETTER_AUTH_SECRET` | Quarterly | Q-start | Platform eng |
| `BROADCAST_SIGNING_KEY` (per-worker JWT) | Monthly | 1st of month | Platform eng |
| `CLOUDFLARE_GLOBAL_API_KEY` | Personnel change | Offboarding | Ops lead |
| `TYPEDB_PASSWORD` | Quarterly | Q-start | Platform eng |
| `OPENROUTER_API_KEY` | On suspected leak | Ad-hoc | Platform eng |

All rotations emit `kind: "security", subkind: "scheduled-rotation"` so the substrate learns rotation rhythm.

---

## Audit Queries (use during every response)

```typeql
# All security events for a caller in the last hour
match
  (sender: $s) isa signal, has kind "security", has ts $t;
  $s has aid "alice";
  $t > <now - 1h>;
select $signal, $ts;
sort $ts desc;

# All signals in leak window for a tenant
match
  $tenant isa group, has gid "acme";
  { (parent: $tenant, child: $g) isa hierarchy; } or { $g is $tenant; };
  (group: $g, member: $s) isa membership;
  (sender: $s) isa signal, has ts $t;
  $t > <leak-start>; $t < <leak-end>;
select $signal, $s, $ts;

# Bridges created in a window
match
  (source: $a, target: $b) isa path, has bridge-kind $k, has created $t;
  $t > <leak-start>;
select $a, $b, $k, $t;

# Keys active for a compromised unit
match
  (api-key: $k, authorized-unit: $u) isa api-authorization;
  $u has aid "alice";
  $k has key-status "active";
select $k;
```

Admin view at `/admin/security` (Cycle 4) renders these for quick triage.

---

## Communication Template (P0/P1)

```
SEV:       P0 | P1
INCIDENT:  <one-line>
DETECTED:  <ISO timestamp, detector>
CONTAINED: <ISO timestamp or IN PROGRESS>
SCOPE:     <tenants / users / keys affected>
ACTION:    <what we're doing now>
NEXT UPDATE: <time>
```

Posted to internal incident channel within 5 min of contain-start. User-facing
comms only after contain is complete and we know the real scope.

---

## After-Action

For every P0/P1, within the postmortem window:

1. **What happened** — timeline with UTC timestamps.
2. **What worked** — automation that caught/contained it.
3. **What failed** — manual steps that shouldn't have been needed.
4. **What changes** — one invariant added to `security.md` per incident (if applicable), one test added to `persist.test.ts` or `api-auth.test.ts`.
5. **Promote to substrate** — `know()` the attack pattern; L6 uses it in future routing.

An incident that doesn't produce a new invariant or test is an incident we haven't learned from.

---

## See Also

- [security.md](one/security.md) — the security plan
- [TODO-security.md](TODO-security.md) — five cycles to land the plan
- [auth.md](auth.md) — credential model
- [groups.md](one/groups.md) — tenant isolation
- `src/lib/sui.ts` — wallet rotation primitives
- `src/lib/api-auth.ts` — key verification + cache invalidation

---

*Contain. Rotate. Learn. Every incident feeds the pheromone.*
