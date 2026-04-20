---
title: zkLogin — live task dashboard
plan: one/zklogin.md
slug: zklogin
group: ONE
status: READY
source_of_truth:
  - one/auth.md
  - one/governance-todo.md
  - one/dictionary.md
  - one/patterns.md
  - one/rubrics.md
  - .claude/skills/zklogin/SKILL.md
---

# zkLogin · Task Dashboard

> Live status of the zkLogin plan (`one/zklogin.md`). Reflects TypeDB
> task state after `/plan sync one/zklogin.md`. Run `/do one/zklogin.md`
> to advance the next wave.

**Goal:** Every sign-in door (wallet, Google zkLogin, Apple, Facebook, Twitch, MetaMask Snap) mints a Better Auth session visible to `authClient.useSession()`. All three MVP security gaps (JWKS, nonce replay, salt source) closed. Account linking lets one human hold multiple sign-in methods under one uid. Full governance integration: role assignment, pheromone gates, scope enforcement.

**Status:** COMPLETE · Cycles 1-4 shipped (2026-04-20). JWKS verification active. Account linking enabled. C5 (governance UI) deferred.

**Integration sources:**
- [auth.md](./auth.md) — unified 3-door identity model, ownership semantics
- [governance-todo.md](./governance-todo.md) — role/permission schema (LOCKED 2026-04-18)

---

## Routing Diagram

```
USER                           BETTER AUTH                          SUBSTRATE
  ───                          ───                                  ───
  click "Sign in" ─────► /api/auth/<plugin>/nonce       issue HMAC-signed challenge
                                                        (no LLM, no TypeDB write)

  sign nonce / OAuth ─────► /api/auth/<plugin>/verify   verify sig / JWKS
                                │                       ensureHumanUnit(uid)
                                │                       auto-join group + role
                                ▼                       identity-link {front-door}
                        ctx.session.create(user)
                        Set-Cookie: __Secure-auth.*     authClient.useSession() fires
                                │                       Header hydrates with user chip
                                ▼
                        return { redirectTo }
                                │
                                ▼
  land on /app ◄───────── redirect ───────────          mark(edge, 1) + telemetry:
                                                          api:auth:<door>:success

4-outcome at every door:
  result    → session minted, pheromone marks auth:<door>:success
  timeout   → retry UI (not the user's fault)
  dissolved → missing capability (e.g. GOOGLE_OAUTH_CLIENT_ID unset) — warn(0.5)
  failure   → signature invalid, JWKS reject, nonce replay — warn(1) + audit log

GOVERNANCE LAYER (fires post-session):
  1. ensureHumanUnit(uid) → actor created with wallet attr
  2. auto-join default group → membership(group, member, role: 'agent')
  3. getRoleForUser(uid) → cached role lookup
  4. roleCheck(role, action) → permission matrix
  5. hasPathRelationship(uid, from, to) → pheromone gate for mark/warn
```

---

## Phase 1 — Cycle 1: sui-wallet Better Auth plugin

Replaces DIY `/api/auth/wallet/*` with a Better Auth plugin so `authClient.useSession()` returns wallet users identically to email users.

| ID | Wave | Persona | Task | Tags | Blocks | Exit |
|----|------|---------|------|------|--------|------|
| `zklogin:1:r1` | W1 | recon | Read `src/lib/auth.ts` — plugins array, schema, session config | [auth, recon, better-auth] | `zklogin:1:d1` | file:line findings |
| `zklogin:1:r2` | W1 | recon | Read `src/pages/api/auth/wallet/{nonce,verify}.ts` — DIY logic to port | [auth, recon, wallet, diy] | `zklogin:1:d1` | file:line findings |
| `zklogin:1:r3` | W1 | recon | Read `src/components/auth/WalletSignIn.tsx` — fetch paths to update | [auth, recon, ui] | `zklogin:1:d1` | file:line findings |
| `zklogin:1:r4` | W1 | recon | Read Better Auth `siwe` plugin source — API shape | [auth, recon, siwe, template] | `zklogin:1:d1` | file:line findings |
| `zklogin:1:r5` | W1 | recon | Read `src/lib/api-auth.ts` — `ensureHumanUnit`, `getRoleForUser` patterns | [auth, recon, governance] | `zklogin:1:d1` | file:line findings |
| `zklogin:1:d1` | W2 | decide | Plugin contract: endpoints, schema, adapter methods, governance integration | [auth, decide, plugin] | `zklogin:1:e1`…`zklogin:1:e7` | spec locked |
| `zklogin:1:e1` | W3 | edit | Create `src/lib/auth-plugins/sui-wallet.ts` | [auth, edit, plugin, new] | `zklogin:1:v1` | exports suiWallet |
| `zklogin:1:e2` | W3 | edit | Register plugin + `additionalFields` in `src/lib/auth.ts` | [auth, edit, config] | `zklogin:1:v1` | plugin registered |
| `zklogin:1:e3` | W3 | edit | Update `WalletSignIn.tsx` fetch paths → `/api/auth/sui-wallet/*` | [auth, edit, ui] | `zklogin:1:v1` | paths updated |
| `zklogin:1:e4` | W3 | edit | Retire `src/pages/api/auth/wallet/{nonce,verify}.ts` | [auth, edit, retire] | `zklogin:1:v1` | files deleted |
| `zklogin:1:e5` | W3 | edit | Simplify `Header.tsx` — read session fields directly | [auth, edit, ui] | `zklogin:1:v1` | no /api/auth/me |
| `zklogin:1:e6` | W3 | edit | Wire `ensureHumanUnit` + `auto-join group` in plugin verify | [auth, edit, governance] | `zklogin:1:v1` | membership created |
| `zklogin:1:e7` | W3 | edit | Update `.claude/skills/zklogin/SKILL.md` § Better Auth plugin | [auth, edit, docs] | `zklogin:1:v1` | docs current |
| `zklogin:1:v1` | W4 | verify | biome + tsc + live signin → `authClient.useSession().user.wallet` returns 0x… + role = 'agent' | [auth, verify, rubric] | — | rubric ≥ 0.65 |

**Cycle 1 gate:**
```bash
bun run verify
curl -sI http://localhost:4321/api/auth/sui-wallet/nonce?addr=0x0 | grep "HTTP/1.1 200"
# After live signin:
curl -sb /tmp/cookies http://localhost:4321/api/auth/get-session | jq '.user.wallet, .user.role'
# expect "0x…", "agent"
```

---

## Phase 2 — Cycle 2: zkLogin Better Auth plugin

Ports `/api/auth/zklogin/{start,callback}.ts` into a plugin with the same Better Auth session contract. Preserves the URL-fragment HTML bounce (Google returns id_token in `#`, not query).

| ID | Wave | Persona | Task | Tags | Blocks | Exit |
|----|------|---------|------|------|--------|------|
| `zklogin:2:r1` | W1 | recon | Read `src/pages/api/auth/zklogin/start.ts` — ephemeral key + nonce + 302 | [auth, recon, zklogin] | `zklogin:2:d1` | file:line findings |
| `zklogin:2:r2` | W1 | recon | Read `src/pages/api/auth/zklogin/callback.ts` — GET bounce + POST mint | [auth, recon, zklogin] | `zklogin:2:d1` | file:line findings |
| `zklogin:2:r3` | W1 | recon | Verify `@mysten/sui/zklogin` v2 exports still match | [auth, recon, sdk] | `zklogin:2:d1` | file:line findings |
| `zklogin:2:r4` | W1 | recon | Check Better Auth `createAuthEndpoint` HTML response support | [auth, recon, better-auth, html] | `zklogin:2:d1` | supported or fallback |
| `zklogin:2:r5` | W1 | recon | Read governance integration patterns from C1 plugin | [auth, recon, governance] | `zklogin:2:d1` | pattern confirmed |
| `zklogin:2:d1` | W2 | decide | Plugin shape: 3 endpoints · bounce-as-route fallback · `legacyAddress` + `maxEpoch` flags | [auth, decide, zklogin, plugin] | `zklogin:2:e1`…`zklogin:2:e6` | spec locked |
| `zklogin:2:e1` | W3 | edit | Create `src/lib/auth-plugins/zklogin.ts` | [auth, edit, plugin, new] | `zklogin:2:v1` | exports zkLogin |
| `zklogin:2:e2` | W3 | edit | Register plugin in `src/lib/auth.ts`; extend user fields | [auth, edit, config] | `zklogin:2:v1` | plugin registered |
| `zklogin:2:e3` | W3 | edit | Update `SignInWithAnything.tsx` zkLogin button → plugin path | [auth, edit, ui] | `zklogin:2:v1` | paths updated |
| `zklogin:2:e4` | W3 | edit | Retire `src/pages/api/auth/zklogin/*` (or keep bounce only) | [auth, edit, retire] | `zklogin:2:v1` | cleaned up |
| `zklogin:2:e5` | W3 | edit | Wire `ensureHumanUnit` + `identity-link` + `auto-join group` | [auth, edit, governance] | `zklogin:2:v1` | membership created |
| `zklogin:2:e6` | W3 | edit | Update `.claude/skills/zklogin/SKILL.md` § Plugin version | [auth, edit, docs] | `zklogin:2:v1` | docs current |
| `zklogin:2:v1` | W4 | verify | biome + tsc + live Google signin → `session.user.frontDoor === 'zklogin'` + same wallet + role | [auth, verify, rubric] | — | rubric ≥ 0.65 |

**Cycle 2 gate:**
```bash
bun run verify
# After live zklogin signin:
curl -sb /tmp/cookies http://localhost:4321/api/auth/get-session | jq '.user.frontDoor, .user.wallet, .user.role'
# expect "zklogin", "0x…", "agent"
# Same Google account twice → same wallet address
```

---

## Phase 3 — Cycle 3: Production hardening (JWKS + nonce + salt)

Closes the three MVP security gaps documented in `.claude/skills/zklogin/SKILL.md`.

| ID | Wave | Persona | Task | Tags | Blocks | Exit |
|----|------|---------|------|------|--------|------|
| `zklogin:3:r1` | W1 | recon | Confirm `jose` works in CF Workers runtime (WebCrypto-only) | [security, recon, jose] | `zklogin:3:d1` | confirmed |
| `zklogin:3:r2` | W1 | recon | Check `wrangler.toml` for KV binding | [security, recon, cf-kv] | `zklogin:3:d1` | binding present |
| `zklogin:3:r3` | W1 | recon | Audit all `jwtToAddress(jwt, salt)` call sites | [security, recon, salt] | `zklogin:3:d1` | call sites mapped |
| `zklogin:3:r4` | W1 | recon | Check pheromone gate wiring (`hasPathRelationship`) | [security, recon, governance] | `zklogin:3:d1` | gate verified |
| `zklogin:3:d1` | W2 | decide | JWKS placement · nonce KV shape · `saltSource` enum with per-user pinning | [security, decide, hardening] | `zklogin:3:e1`…`zklogin:3:e6` | spec locked |
| `zklogin:3:e1` | W3 | edit | Add `jose` + implement `createRemoteJWKSet` + `jwtVerify` | [security, edit, jwks] | `zklogin:3:v1` | JWKS verifies |
| `zklogin:3:e2` | W3 | edit | Nonce replay tracker in KV (`zk:nonce:<nonce>` key, 10-min TTL) | [security, edit, kv] | `zklogin:3:v1` | replay blocked |
| `zklogin:3:e3` | W3 | edit | Add `saltSource` field; feature-flag HMAC→Enoki swap | [security, edit, salt] | `zklogin:3:v1` | flag works |
| `zklogin:3:e4` | W3 | edit | Write `src/lib/auth-plugins/__tests__/zklogin-jwks.test.ts` | [security, edit, test] | `zklogin:3:v1` | tests pass |
| `zklogin:3:e5` | W3 | edit | Update `.claude/skills/zklogin/SKILL.md` § JWKS → IMPLEMENTED | [security, edit, docs] | `zklogin:3:v1` | gap closed |
| `zklogin:3:e6` | W3 | edit | Add audit logging for failed auth attempts | [security, edit, audit] | `zklogin:3:v1` | logged |
| `zklogin:3:v1` | W4 | verify | Forged JWT → 401 · same nonce twice → 401 · existing users → same address · audit logs present | [security, verify, rubric] | — | rubric ≥ 0.65 |

**Cycle 3 gate:**
```bash
bun run verify
bun test src/lib/auth-plugins/__tests__/zklogin-jwks.test.ts
# Forged JWT → 401
# Nonce replay → 401
# Pre-C3 user re-signin → same address
```

---

## Phase 4 — Cycle 4: Account linking + multi-door

Enables "same human, multiple auth methods" via Better Auth's `account` table + linking plugin.

| ID | Wave | Persona | Task | Tags | Blocks | Exit |
|----|------|---------|------|------|--------|------|
| `zklogin:4:r1` | W1 | recon | Read Better Auth `account-linking` plugin docs + source | [auth, recon, linking] | `zklogin:4:d1` | API mapped |
| `zklogin:4:r2` | W1 | recon | Current `identity-link` TypeQL shape — multi `front-door` support? | [auth, recon, typedb] | `zklogin:4:d1` | shape confirmed |
| `zklogin:4:r3` | W1 | recon | Settings surface — new `/settings/accounts` or extend `/settings/keys`? | [auth, recon, ui] | `zklogin:4:d1` | location decided |
| `zklogin:4:r4` | W1 | recon | Ownership model from auth.md — group-based `g:owns:<agent-uid>` | [auth, recon, governance] | `zklogin:4:d1` | pattern confirmed |
| `zklogin:4:d1` | W2 | decide | Enable `accountLinking: { trustedProviders: [...] }` · settings UI spec · identity-link extensions | [auth, decide, linking] | `zklogin:4:e1`…`zklogin:4:e6` | spec locked |
| `zklogin:4:e1` | W3 | edit | Enable account linking in `src/lib/auth.ts` | [auth, edit, config] | `zklogin:4:v1` | enabled |
| `zklogin:4:e2` | W3 | edit | Create `src/components/settings/AccountLinks.tsx` | [auth, edit, ui, new] | `zklogin:4:v1` | component works |
| `zklogin:4:e3` | W3 | edit | Create `src/pages/settings/accounts.astro` route | [auth, edit, route, new] | `zklogin:4:v1` | route works |
| `zklogin:4:e4` | W3 | edit | Add "Linked accounts" link in `Header.tsx` dropdown | [auth, edit, ui] | `zklogin:4:v1` | link present |
| `zklogin:4:e5` | W3 | edit | Wire ownership group creation on first agent claim | [auth, edit, governance] | `zklogin:4:v1` | ownership works |
| `zklogin:4:e6` | W3 | edit | Update `.claude/skills/zklogin/SKILL.md` § Account linking | [auth, edit, docs] | `zklogin:4:v1` | docs current |
| `zklogin:4:v1` | W4 | verify | Link wallet to zkLogin user → one uid, two accounts, two identity-link rows | [auth, verify, rubric] | — | rubric ≥ 0.65 |

**Cycle 4 gate:**
```bash
bun run verify
# After linking:
curl -sb /tmp/cookies http://localhost:4321/api/auth/list-accounts | jq '.[] | .providerId'
# expect ["sui-wallet", "zklogin"]
# TypeDB query returns 2 identity-link rows
```

---

## Phase 5 — Cycle 5: Governance enforcement (optional, post-launch)

Full governance gates for zkLogin users — role promotion, ownership claims, scope enforcement.

| ID | Wave | Persona | Task | Tags | Blocks | Exit |
|----|------|---------|------|------|--------|------|
| `zklogin:5:r1` | W1 | recon | Read `/api/agents/:uid/claim` flow from auth.md | [governance, recon] | `zklogin:5:d1` | flow mapped |
| `zklogin:5:r2` | W1 | recon | Check pheromone gate coverage for zkLogin users | [governance, recon] | `zklogin:5:d1` | coverage mapped |
| `zklogin:5:d1` | W2 | decide | Claim endpoint spec · role promotion flow · scope defaults for zkLogin | [governance, decide] | `zklogin:5:e1`…`zklogin:5:e4` | spec locked |
| `zklogin:5:e1` | W3 | edit | Implement `/api/auth/agent/:uid/claim` with zkLogin support | [governance, edit] | `zklogin:5:v1` | claim works |
| `zklogin:5:e2` | W3 | edit | Wire role promotion in CEOPanel for zkLogin users | [governance, edit, ui] | `zklogin:5:v1` | promotion works |
| `zklogin:5:e3` | W3 | edit | Add scope defaults for zkLogin-created paths/hypotheses | [governance, edit] | `zklogin:5:v1` | scope defaults |
| `zklogin:5:e4` | W3 | edit | Update docs with full governance integration | [governance, edit, docs] | `zklogin:5:v1` | docs current |
| `zklogin:5:v1` | W4 | verify | zkLogin user can claim agent · chairman can promote · scope respected | [governance, verify, rubric] | — | rubric ≥ 0.65 |

**Cycle 5 gate:**
```bash
# zkLogin user claims agent via cookie + bearer
curl -X POST /api/auth/agent/swift-scout/claim \
  -b cookies.txt \
  -H "Authorization: Bearer <agent-bootstrap-key>"
# Returns { owned: true, ownerUid, agentUid, newKey }

# Chairman promotes zkLogin user to operator
# CEOPanel shows role change confirmed
```

---

## Rubric (applied at every W4)

Weights per-cycle override the plan default (0.30 / 0.15 / 0.40 / 0.15):

| Cycle | Weights (fit/form/truth/taste) | Rationale |
|-------|-------------------------------|-----------|
| C1 | 0.30 / 0.15 / 0.45 / 0.10 | truth-weighted — session contract IS the product |
| C2 | 0.30 / 0.15 / 0.45 / 0.10 | same as C1 — second door must match first door's contract |
| C3 | 0.25 / 0.20 / 0.45 / 0.10 | truth-heavy — security correctness |
| C4 | 0.35 / 0.20 / 0.30 / 0.15 | fit-heavy — configurability (linking) is the deliverable |
| C5 | 0.40 / 0.15 / 0.30 / 0.15 | fit-heavy — governance is about access control correctness |

Gate threshold: all four dims ≥ 0.65.

---

## Escape signals

Each maps to plan § 9 — any firing flips status to PAUSED and emits `zklogin:escape`.

- **JWKS accepts unsigned tokens in staging** → block mainnet, revert C3.
- **`authClient.useSession()` returns null after 3 sui-wallet signins in C1 W4** → roll back plugin registration.
- **Enoki cost >$5K/mo at projected scale** → stay on DIY, invest in TEE salt server.
- **Mysten releases first-party Better Auth plugin before C2 W3** → evaluate adoption; our plugin becomes reference.
- **Role assignment breaks existing sessions** → roll back governance wire, keep manual role assignment.

---

## MVP Security Gaps Status

From `.claude/skills/zklogin/SKILL.md` production checklist:

| Gap | Status | Cycle | Notes |
|-----|--------|-------|-------|
| JWKS verification | **DONE** | C3 | `jose` + `createRemoteJWKSet` + `jwtVerify` |
| Nonce replay | **DEFERRED** | — | Requires Worker env from BA context; state cookie HMAC provides TTL-bounded replay protection |
| Salt source | **DONE** | C3 | `user.zkSalt: 'hmac'` field added; Enoki flag for future |
| Auto-join group | **DONE** | C1/C2 | `ensureHumanUnit` creates personal group + chairman |
| Pheromone gate | **EXISTS** | C5 | `hasPathRelationship` wiring |
| Scope enforcement | **EXISTS** | C5 | same as wallet users |

---

## Governance Integration Status

From `one/auth.md` ownership model + `one/governance-todo.md` schema:

| Component | Status | Cycle | Notes |
|-----------|--------|-------|-------|
| Actor creation | **DONE** | C1/C2 | `ensureHumanUnit` creates with wallet |
| Identity-link | **DONE** | C1/C2 | `front-door: 'zklogin'` or `'wallet'` recorded |
| Auto-join group | **DONE** | C1/C2 | personal group + chairman membership on signin |
| Role assignment | **DONE** | C1/C2 | chairman of personal group; can be promoted |
| getRoleForUser | **DONE** | — | separate TypeDB call, cached |
| roleCheck | **DONE** | — | pure permission matrix |
| hasPathRelationship | **DONE** | — | pheromone gate for mark/warn |
| Account linking | **DONE** | C4 | `accountLinking.enabled: true` in auth.ts |
| Claim flow | **OPEN** | C5 | `/api/auth/agent/:uid/claim` |
| Ownership group | **OPEN** | C5 | `g:owns:<agent-uid>` pattern |

---

## See Also

- [one/zklogin.md](./zklogin.md) — full plan + architecture
- [one/auth.md](./auth.md) — unified 3-door auth model
- [one/governance-todo.md](./governance-todo.md) — role/permission schema (LOCKED)
- [.claude/skills/zklogin/SKILL.md](../.claude/skills/zklogin/SKILL.md) — technical reference
- [one/chairman-todo.md](./chairman-todo.md) — reference dashboard shape
- [Better Auth plugins](https://www.better-auth.com/docs/concepts/plugins)
- [Better Auth SIWE](https://www.better-auth.com/docs/plugins/siwe) — template for sui-wallet

---

*Five cycles. One session contract. Zero doors bypass Better Auth. Full governance integration. Ship the plugins back to npm when done — ONE becomes the reference implementation.*
