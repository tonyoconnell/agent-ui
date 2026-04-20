---
title: zkLogin — live task dashboard
plan: one/zklogin.md
slug: zklogin
group: ONE
status: READY
---

# zkLogin · Task Dashboard

> Live status of the zkLogin plan (`one/zklogin.md`). Reflects TypeDB
> task state after `/plan sync one/zklogin.md`. Run `/do one/zklogin.md`
> to advance the next wave.

**Goal:** Every sign-in door (wallet, Google zkLogin, Apple, Facebook, Twitch, MetaMask Snap) mints a Better Auth session visible to `authClient.useSession()`. All three MVP security gaps (JWKS, nonce replay, salt source) closed. Account linking lets one human hold multiple sign-in methods under one uid.

**Status:** PLAN · tasks not yet compiled to TypeDB. Run `/plan sync one/zklogin.md` first.

---

## Phase 1 — Cycle 1: sui-wallet Better Auth plugin

Replaces DIY `/api/auth/wallet/*` with a Better Auth plugin so `authClient.useSession()` returns wallet users identically to email users.

| ID | Wave | Persona | Task | Tags | Blocks |
|----|------|---------|------|------|--------|
| `zklogin:1:r1` | W1 | recon | Read `src/lib/auth.ts` — plugins array, schema, session config | [auth, recon, better-auth] | `zklogin:1:d1` |
| `zklogin:1:r2` | W1 | recon | Read `src/pages/api/auth/wallet/{nonce,verify}.ts` — DIY logic to port | [auth, recon, wallet, diy] | `zklogin:1:d1` |
| `zklogin:1:r3` | W1 | recon | Read `src/components/auth/WalletSignIn.tsx` — fetch paths to update | [auth, recon, ui] | `zklogin:1:d1` |
| `zklogin:1:r4` | W1 | recon | Read Better Auth `siwe` plugin source (node_modules or GitHub) — API shape | [auth, recon, siwe, template] | `zklogin:1:d1` |
| `zklogin:1:d1` | W2 | decide | Plugin contract: endpoints, schema, adapter methods, migration for existing users | [auth, decide, plugin] | `zklogin:1:e1`…`zklogin:1:e6` |
| `zklogin:1:e1` | W3 | edit | Create `src/lib/auth-plugins/sui-wallet.ts` | [auth, edit, plugin, new] | `zklogin:1:v1` |
| `zklogin:1:e2` | W3 | edit | Register plugin + `additionalFields` in `src/lib/auth.ts` | [auth, edit, config] | `zklogin:1:v1` |
| `zklogin:1:e3` | W3 | edit | Update `WalletSignIn.tsx` fetch paths → `/api/auth/sui-wallet/*` | [auth, edit, ui] | `zklogin:1:v1` |
| `zklogin:1:e4` | W3 | edit | Retire `src/pages/api/auth/wallet/{nonce,verify}.ts` (deprecate → delete after C2) | [auth, edit, retire] | `zklogin:1:v1` |
| `zklogin:1:e5` | W3 | edit | Simplify `src/components/Header.tsx` — read session fields directly, drop `/api/auth/me` for wallet display | [auth, edit, ui] | `zklogin:1:v1` |
| `zklogin:1:e6` | W3 | edit | Update `.claude/skills/zklogin.md` § Better Auth integration (plugin pattern) | [auth, edit, docs] | `zklogin:1:v1` |
| `zklogin:1:v1` | W4 | verify | biome + tsc + live signin → `authClient.useSession().user.wallet` returns 0x… | [auth, verify, rubric] | — |

**Cycle 1 gate:** open `/signin`, connect wallet, land on `/app`, Header shows wallet chip with address. `curl -sb /tmp/cookies /api/auth/get-session | jq '.user.wallet'` returns a non-null address.

---

## Phase 2 — Cycle 2: zkLogin Better Auth plugin

Ports `/api/auth/zklogin/{start,callback}.ts` into a plugin with the same Better Auth session contract. Preserves the URL-fragment HTML bounce (Google returns id_token in `#`, not query).

| ID | Wave | Persona | Task | Tags | Blocks |
|----|------|---------|------|------|--------|
| `zklogin:2:r1` | W1 | recon | Read `src/pages/api/auth/zklogin/start.ts` — ephemeral key + nonce + 302 flow | [auth, recon, zklogin] | `zklogin:2:d1` |
| `zklogin:2:r2` | W1 | recon | Read `src/pages/api/auth/zklogin/callback.ts` — GET bounce + POST session mint | [auth, recon, zklogin] | `zklogin:2:d1` |
| `zklogin:2:r3` | W1 | recon | Verify `@mysten/sui/zklogin` v2 exports (`jwtToAddress`, `generateNonce`, `getZkLoginSignature`) still match | [auth, recon, sdk] | `zklogin:2:d1` |
| `zklogin:2:r4` | W1 | recon | Check Better Auth `createAuthEndpoint` HTML response support (bounce needs HTML) | [auth, recon, better-auth, html] | `zklogin:2:d1` |
| `zklogin:2:d1` | W2 | decide | Plugin shape: 3 endpoints (start GET, callback GET bounce, callback POST mint) · bounce-as-route fallback · `legacyAddress` flag on user | [auth, decide, zklogin, plugin] | `zklogin:2:e1`…`zklogin:2:e5` |
| `zklogin:2:e1` | W3 | edit | Create `src/lib/auth-plugins/zklogin.ts` | [auth, edit, plugin, new] | `zklogin:2:v1` |
| `zklogin:2:e2` | W3 | edit | Register plugin in `src/lib/auth.ts`; extend user fields with `maxEpoch`, `legacyAddress` | [auth, edit, config] | `zklogin:2:v1` |
| `zklogin:2:e3` | W3 | edit | Update `SignInWithAnything.tsx` zkLogin button → `/api/auth/zklogin/start` (plugin path) | [auth, edit, ui] | `zklogin:2:v1` |
| `zklogin:2:e4` | W3 | edit | Retire `src/pages/api/auth/zklogin/{start,callback}.ts` (or keep bounce only if plugin can't return HTML) | [auth, edit, retire] | `zklogin:2:v1` |
| `zklogin:2:e5` | W3 | edit | Update `.claude/skills/zklogin.md` § Plugin version replaces DIY walkthrough | [auth, edit, docs] | `zklogin:2:v1` |
| `zklogin:2:v1` | W4 | verify | biome + tsc + live Google signin → `session.user.frontDoor === 'zklogin'` + same wallet address across signins | [auth, verify, rubric] | — |

**Cycle 2 gate:** `/signup` → "Continue with Google" → complete OAuth → land signed in. `curl -sb /tmp/cookies /api/auth/get-session | jq '.user.frontDoor'` returns `"zklogin"`. Same Google account signed in twice produces the same `wallet` address.

---

## Phase 3 — Cycle 3: Production hardening (JWKS + nonce + salt)

Closes the three MVP security gaps documented in `.claude/skills/zklogin.md`.

| ID | Wave | Persona | Task | Tags | Blocks |
|----|------|---------|------|------|--------|
| `zklogin:3:r1` | W1 | recon | Confirm `jose` works in CF Workers runtime (WebCrypto-only, no node:crypto) | [security, recon, jose] | `zklogin:3:d1` |
| `zklogin:3:r2` | W1 | recon | Check `wrangler.toml` for KV binding — required for nonce replay tracker | [security, recon, cf-kv] | `zklogin:3:d1` |
| `zklogin:3:r3` | W1 | recon | Audit all `jwtToAddress(jwt, salt)` call sites — salt source must stay consistent across swap | [security, recon, salt] | `zklogin:3:d1` |
| `zklogin:3:d1` | W2 | decide | JWKS verification placement · nonce KV key shape + TTL · `saltSource` enum (`hmac` \| `enoki` \| `tee`) with per-user pinning | [security, decide, hardening] | `zklogin:3:e1`…`zklogin:3:e5` |
| `zklogin:3:e1` | W3 | edit | Add `jose` to dependencies; implement 5-line `createRemoteJWKSet` + `jwtVerify` in zklogin plugin | [security, edit, jwks] | `zklogin:3:v1` |
| `zklogin:3:e2` | W3 | edit | Nonce replay tracker in KV (`zk:nonce:<nonce>` key, 10-min TTL) | [security, edit, kv] | `zklogin:3:v1` |
| `zklogin:3:e3` | W3 | edit | Add `saltSource` field to user schema; feature-flag HMAC→Enoki swap without breaking existing addresses | [security, edit, salt] | `zklogin:3:v1` |
| `zklogin:3:e4` | W3 | edit | Write `src/lib/auth-plugins/__tests__/zklogin-jwks.test.ts` using `createLocalJWKSet` | [security, edit, test] | `zklogin:3:v1` |
| `zklogin:3:e5` | W3 | edit | Update `.claude/skills/zklogin.md` § JWKS → IMPLEMENTED (remove from MVP gaps) | [security, edit, docs] | `zklogin:3:v1` |
| `zklogin:3:v1` | W4 | verify | Forged JWT → 401 · same nonce twice → 401 · existing users re-signin → same address | [security, verify, rubric] | — |

**Cycle 3 gate:** unit tests pass for forged/expired/wrong-audience JWT. KV replay test blocks second use. A pre-C3 DIY user signing in post-C3 derives the same address.

---

## Phase 4 — Cycle 4: Account linking + multi-door

Enables "same human, multiple auth methods" via Better Auth's `account` table + linking plugin.

| ID | Wave | Persona | Task | Tags | Blocks |
|----|------|---------|------|------|--------|
| `zklogin:4:r1` | W1 | recon | Read Better Auth `account-linking` plugin docs + source | [auth, recon, linking] | `zklogin:4:d1` |
| `zklogin:4:r2` | W1 | recon | Current `identity-link` TypeQL shape — support multiple `front-door` per subject? | [auth, recon, typedb] | `zklogin:4:d1` |
| `zklogin:4:r3` | W1 | recon | Settings surface — new `/settings/accounts` page or extend `/settings/keys`? | [auth, recon, ui] | `zklogin:4:d1` |
| `zklogin:4:d1` | W2 | decide | Enable `accountLinking: { trustedProviders: ['google', 'sui-wallet'] }` · settings UI spec · identity-link extensions | [auth, decide, linking] | `zklogin:4:e1`…`zklogin:4:e5` |
| `zklogin:4:e1` | W3 | edit | Enable account linking in `src/lib/auth.ts` | [auth, edit, config] | `zklogin:4:v1` |
| `zklogin:4:e2` | W3 | edit | Create `src/components/settings/AccountLinks.tsx` | [auth, edit, ui, new] | `zklogin:4:v1` |
| `zklogin:4:e3` | W3 | edit | Create `src/pages/settings/accounts.astro` route | [auth, edit, route, new] | `zklogin:4:v1` |
| `zklogin:4:e4` | W3 | edit | Add "Linked accounts" link in `Header.tsx` dropdown | [auth, edit, ui] | `zklogin:4:v1` |
| `zklogin:4:e5` | W3 | edit | Update `.claude/skills/zklogin.md` § Account linking (new section) | [auth, edit, docs] | `zklogin:4:v1` |
| `zklogin:4:v1` | W4 | verify | Link wallet to existing Google-signed-in user → one uid, two accounts in list-accounts · two `identity-link` rows in substrate | [auth, verify, rubric] | — |

**Cycle 4 gate:** sign in via Google → Settings → Accounts → "Link Sui wallet" → sign nonce → list-accounts returns both providers. TypeDB query returns 2 identity-link rows with distinct `front-door` attributes for one subject uid.

---

## Rubric (applied at every W4)

Weights per-cycle override the plan default (0.30 / 0.15 / 0.40 / 0.15):

| Cycle | Weights (fit/form/truth/taste) | Rationale |
|-------|-------------------------------|-----------|
| C1 | 0.30 / 0.15 / 0.45 / 0.10 | truth-weighted — session contract IS the product |
| C2 | 0.30 / 0.15 / 0.45 / 0.10 | same as C1 — second door must match first door's contract |
| C3 | 0.25 / 0.20 / 0.45 / 0.10 | truth-heavy — security correctness |
| C4 | 0.35 / 0.20 / 0.30 / 0.15 | fit-heavy — configurability (linking) is the deliverable |

Gate threshold: all four dims ≥ 0.65.

---

## Escape signals

Each maps to plan § 9 — any firing flips status to PAUSED and emits `zklogin:escape`.

- **JWKS accepts unsigned tokens in staging** → block mainnet, revert C3.
- **`authClient.useSession()` returns null after 3 sui-wallet signins in C1 W4** → roll back plugin registration.
- **Enoki cost >$5K/mo at projected scale** → stay on DIY, invest in TEE salt server.
- **Mysten releases first-party Better Auth plugin before C2 W3** → evaluate adoption; our plugin becomes reference.

---

## See Also

- [one/zklogin.md](./zklogin.md) — full plan + architecture
- [.claude/skills/zklogin.md](../.claude/skills/zklogin.md) — 705-line technical reference
- [one/chairman-todo.md](./chairman-todo.md) — reference dashboard shape
- [Better Auth plugins](https://www.better-auth.com/docs/concepts/plugins)
- [Better Auth SIWE](https://www.better-auth.com/docs/plugins/siwe) — template for sui-wallet

---

*Four cycles. One session contract. Zero doors bypass Better Auth. Ship the plugins back to npm when done — ONE becomes the reference implementation.*
