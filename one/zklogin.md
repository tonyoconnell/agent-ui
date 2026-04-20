---
title: zkLogin — Better Auth plugin + production hardening
slug: zklogin
goal: Every sign-in (wallet, Google zkLogin, Apple, MetaMask Snap) mints a Better Auth session; authClient.useSession() sees every user identically; all MVP security gaps closed; full governance integration (role assignment, pheromone gates, scope enforcement).
group: ONE
cycles: 5
route_hints:
  primary: [auth, zklogin, better-auth, wallet]
  secondary: [jose, jwks, prover, enoki]
rubric_weights:
  fit: 0.30
  form: 0.15
  truth: 0.40
  taste: 0.15
escape:
  condition: "JWKS verification returns valid for unsigned tokens OR session cookie not read by authClient.useSession() after 3 consecutive sign-ins"
  action: "emit signal → zklogin {plan:zklogin, trend:escape, reason:<which>}; status → PAUSED; fall back to current DIY cookie"
downstream:
  capability: auth:signin
  price: 0.00
  scope: public
source_of_truth:
  - one/auth.md
  - one/governance-todo.md
  - one/dictionary.md
  - one/patterns.md
  - one/rubrics.md
  - one/routing.md
  - one/lifecycle.md
  - .claude/skills/zklogin/SKILL.md
  - .claude/skills/sui/SKILL.md
status: PLAN
---

# zkLogin — Better Auth plugin + production hardening

**Surface:** `/signin`, `/signup`, global Header · `src/components/auth/{CryptoAuthPanel,SignInWithAnything,WalletSignIn}.tsx`
**Engine:** `src/lib/auth.ts` (Better Auth config), `src/lib/auth-plugins/{sui-wallet,zklogin}.ts` (NEW)
**API:** Better Auth plugin endpoints replace DIY `src/pages/api/auth/wallet/*` and `src/pages/api/auth/zklogin/*`

**Shipped 2026-04-20:** crypto-first sign-in flow live (wallet + zkLogin + MetaMask Snap), DIY HMAC cookies, Header component, `/api/auth/me` role endpoint. Works. But three named gaps block mainnet:
1. DIY `one.sui.session` cookie is **invisible to Better Auth's `getSession()`** — `authClient.useSession()` returns `null` after wallet/zkLogin signin. Header would show signed-out state despite a valid cookie.
2. JWT trust-on-parse — no JWKS verification in `zklogin/callback.ts` POST. Forgeable.
3. HMAC-derived salt — if `WALLET_NONCE_SECRET` leaks, every user's Sui address becomes predictable from their Google `sub`.

---

## 1 — Vision

Every sign-in door (native Sui wallet, Google zkLogin, Apple, Facebook, Twitch, MetaMask Snap) lands in the same Better Auth session. The Header reads one `authClient.useSession()`, sees every user. The substrate records front-door provenance via Better Auth's `account` table. JWTs are verified via JWKS on the way in; nonces can't be replayed; salts live in a server-side store that can rotate without breaking users. Account linking works — same human, three auth methods, one uid. Payments inherit the same cryptographic trust root as sign-in.

**Governance integration (from auth.md + governance-todo.md):**
- Every zkLogin user is auto-joined to the default group with `role: 'agent'`
- Chairman can promote to operator/ceo/board via CEOPanel
- Pheromone gate (`hasPathRelationship`) applies to mark/warn — you can only affect paths you've touched
- Scope enforcement (private/group/public) applies to zkLogin users identically to wallet users
- Agent claim flow: human can claim ownership of an agent via `/api/auth/agent/:uid/claim`

Zero friction, zero vendor lock (Enoki optional, not required), full governance integration.

---

## 2 — Closed loop

```
USER                           BETTER AUTH                          SUBSTRATE
  ───                          ───                                  ───
  click "Sign in" ─────► /api/auth/<plugin>/nonce       issue HMAC-signed challenge
                                                        (no LLM, no TypeDB write)

  sign nonce ─────────► /api/auth/<plugin>/verify       verify sig / JWKS
                                │                       ensureHumanUnit(uid)
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
```

Every door closes its loop into the same session table. The graph learns which doors convert (path strength) and which ones fail (resistance).

---

## 3 — Fronts

| Front | Tags | Rubric tilt | Picks up |
|-------|------|-------------|----------|
| Better Auth plugin — sui-wallet | [auth, wallet, sui, plugin] | 0.30 / 0.15 / 0.45 / 0.10 | substrate unifies on one session; DIY wallet cookie retires |
| Better Auth plugin — zklogin | [auth, zklogin, google, plugin] | 0.30 / 0.15 / 0.45 / 0.10 | Google OAuth + id_token → Sui address, minted into Better Auth session |
| Production hardening | [auth, security, jwks, nonce] | 0.25 / 0.20 / 0.45 / 0.10 | JWKS verification + nonce replay tracker + TEE salt path |
| Account linking + multi-door | [auth, linking, account] | 0.35 / 0.20 / 0.30 / 0.15 | same user, multiple auth methods, one Sui address |

Cycles run in order (1 → 2 → 3 → 4) because each depends on the previous: wallet plugin (C1) is the simpler SIWE-style template; zkLogin plugin (C2) reuses the plugin pattern; hardening (C3) applies to both; linking (C4) needs both plugins to exist.

---

## 4 — Architecture deltas

### Today (DIY — broken integration)

```
/api/auth/wallet/verify      →  Set-Cookie: one.sui.session  (HMAC, our own)
/api/auth/zklogin/callback   →  Set-Cookie: one.sui.session  (HMAC, our own)
/api/auth/[...all]           →  Better Auth handlers         (email/pw only)

authClient.useSession()      →  reads __Secure-auth.session_token (Better Auth)
                             →  DIY HMAC cookies INVISIBLE — returns null after wallet signin
```

### After C1-C2 (Better Auth plugins)

```
/api/auth/[...all]           →  Better Auth handlers
                                  - email/pw (existing, via emailAndPassword)
                                  - sui-wallet plugin (new, SIWE-like)
                                  - zklogin plugin (new, custom endpoints)

All doors mint the SAME cookie: __Secure-auth.session_token
authClient.useSession()      →  sees every user, every door, uniformly
```

### Plugin shape (both wallet and zklogin)

```typescript
// src/lib/auth-plugins/sui-wallet.ts
import { createAuthEndpoint } from 'better-auth/api'
import type { BetterAuthPlugin } from 'better-auth'
import { verifyPersonalMessageSignature } from '@mysten/sui/verify'

export const suiWallet = (opts: { nonceSecret: string }): BetterAuthPlugin => ({
  id: 'sui-wallet',

  schema: {
    user: {
      fields: {
        wallet: { type: 'string', unique: true, required: false },
        frontDoor: { type: 'string', required: false },          // 'wallet' | 'zklogin' | 'email'
        legacyAddress: { type: 'boolean', required: false },     // v1 vs v2 zkLogin derivation
        maxEpoch: { type: 'number', required: false },
      },
    },
  },

  endpoints: {
    suiWalletNonce: createAuthEndpoint(
      '/sui-wallet/nonce',
      { method: 'GET' },
      async (ctx) => {
        const addr = ctx.query.addr?.toLowerCase()
        if (!addr) return ctx.json({ error: 'addr required' }, { status: 400 })
        const nonce = await issueHmacNonce(opts.nonceSecret, addr)   // existing logic
        return ctx.json({ nonce, message: `Sign in to ONE as ${addr}\nNonce: ${nonce}`, exp: Date.now() + 300_000 })
      },
    ),

    suiWalletVerify: createAuthEndpoint(
      '/sui-wallet/verify',
      { method: 'POST' },
      async (ctx) => {
        const { address, signature, nonce } = ctx.body
        const valid = await verifyHmacNonce(opts.nonceSecret, address, nonce)
        if (!valid) return ctx.json({ error: 'nonce invalid' }, { status: 401 })

        const message = `Sign in to ONE as ${address}\nNonce: ${nonce}`
        const sigValid = await verifyPersonalMessageSignature(new TextEncoder().encode(message), signature, { address })
        if (!sigValid) return ctx.json({ error: 'signature invalid' }, { status: 401 })

        const uid = `human:sui:${address}`
        let user = await ctx.context.adapter.findOne({ model: 'user', where: [{ field: 'wallet', value: address }] })
        if (!user) {
          user = await ctx.context.adapter.create({
            model: 'user',
            data: {
              id: uid,
              email: `${address.slice(0, 10)}@sui.one.ie`,
              name: `${address.slice(0, 6)}…${address.slice(-4)}`,
              emailVerified: true,
              wallet: address,
              frontDoor: 'wallet',
            },
          })
        }

        await ctx.context.internalAdapter.createSession(user.id, ctx)
        return ctx.json({ user })
      },
    ),
  },
})
```

### Better Auth session, extended with wallet fields

```typescript
// After registering the plugin, TypeScript auto-infers the extended session:
const session = authClient.useSession()
// session.data.user.wallet       → '0x…'
// session.data.user.frontDoor    → 'wallet' | 'zklogin' | 'email'
// session.data.user.legacyAddress → boolean
// session.data.user.maxEpoch     → number
```

No more custom `/api/auth/me` needed — `useSession()` returns everything. `getRoleForUser(uid)` stays as a separate call because role changes shouldn't invalidate the session cookie.

---

## 5 — Wave mechanics

| Wave | Model  | Deliverable | Exit |
|------|--------|-------------|------|
| W1   | Haiku  | Recon per file (parallel) | every finding cites file:line |
| W2   | Opus   | Diff specs + plugin contract | every W1 finding has a spec or keep |
| W3   | Sonnet | Applied edits (parallel by file) | all anchors match, plugins export |
| W4   | Sonnet | Verify — biome + tsc + live signin test | rubric ≥ 0.65 all four dims |

---

## 6 — Deterministic sandwich

```
PRE                                       POST
────                                      ─────
bun run verify                            bun run verify
curl -sI /api/auth/sui-wallet/nonce       curl -sI /api/auth/sui-wallet/nonce
  returns a nonce                           returns a nonce
authClient.useSession() reads legacy      authClient.useSession() reads plugin session
  — still returns null                      — returns user with wallet field
```

---

## 7 — Cycles

### Cycle 1 — sui-wallet Better Auth plugin

**Deliverable:** `src/lib/auth-plugins/sui-wallet.ts` — SIWE-style plugin replacing `/api/auth/wallet/nonce` and `/api/auth/wallet/verify`. Updates `src/lib/auth.ts` to register it. `WalletSignIn.tsx` switches its fetch calls from `/api/auth/wallet/*` to `/api/auth/sui-wallet/*` (Better Auth's plugin paths).

**Exit:** Sign in with Sui wallet → `authClient.useSession()` returns `{user: {wallet, frontDoor: 'wallet', …}}` on first render after redirect.

**Rubric override:** 0.30 / 0.15 / 0.45 / 0.10 (truth-weighted — the session contract is what we're fixing).

#### W1 — Recon (Haiku × 4, parallel)
- `src/lib/auth.ts` — current Better Auth config, plugins array, schema
- `src/pages/api/auth/wallet/{nonce,verify}.ts` — DIY logic to port
- `src/components/auth/WalletSignIn.tsx` — fetch paths to update
- Better Auth `siwe` plugin source (node_modules or GitHub) — template to mirror

#### W2 — Decide (Opus × 1)
- Plugin file shape (endpoints, schema, hooks)
- Adapter method names for user lookup/create (`findOne`, `create`, `internalAdapter.createSession`)
- Schema field additions (wallet, frontDoor, legacyAddress, maxEpoch) — must not break existing email users
- Migration SQL/TQL for existing DIY-signed-in users (one.sui.session holders must not lose identity)
- Docs: update `.claude/skills/zklogin.md` to reflect plugin-based architecture

#### W3 — Edit (Sonnet × M)
- `src/lib/auth-plugins/sui-wallet.ts` (new)
- `src/lib/auth.ts` (register plugin, add additionalFields)
- `src/components/auth/WalletSignIn.tsx` (update fetch paths)
- Delete or deprecate `src/pages/api/auth/wallet/{nonce,verify}.ts` (route removal)
- `src/components/Header.tsx` (simplify — no more /api/auth/me call, use session fields directly)
- `.claude/skills/zklogin.md` (plugin pattern replaces DIY)
- `one/dictionary.md` (add term "Better Auth plugin session")

#### W4 — Verify (Sonnet × 2)
- consistency — WalletSignIn fetch URLs match plugin endpoint paths; adapter calls match Better Auth 2026 signatures
- integration — open `/signin` in browser, connect wallet, see Header chip populated with wallet address
- rubric: fit (session sees wallet users), form (plugin <150 lines), truth (verify works against real dapp-kit signature), taste (no visible UX regression)

#### Cycle 1 gate
```bash
bun run verify
curl -sI http://localhost:4321/api/auth/sui-wallet/nonce?addr=0x0 | grep "HTTP/1.1 200"
# After live signin:
curl -sb /tmp/cookies http://localhost:4321/api/auth/get-session | jq '.user.wallet'
# expect "0x…" — not null
```

---

### Cycle 2 — zkLogin Better Auth plugin

**Deliverable:** `src/lib/auth-plugins/zklogin.ts` — custom endpoints `POST /auth/zklogin/start` + bounce + `/auth/zklogin/callback` that mint Better Auth sessions with `frontDoor: 'zklogin'`, `legacyAddress` flag set.

**Exit:** Sign in with Google → land on `/app` → `authClient.useSession()` returns `{user: {wallet: '0x…', frontDoor: 'zklogin', …}}`. No `one.sui.session` cookie set.

**Rubric override:** 0.30 / 0.15 / 0.45 / 0.10 (same as C1).

#### W1 — Recon (Haiku × 4, parallel)
- `src/pages/api/auth/zklogin/{start,callback}.ts` — DIY logic to port (including the HTML fragment bounce)
- `@mysten/sui/zklogin` v2 API surface — exact import names
- Better Auth `createAuthEndpoint` — supports HTML responses (for the bounce), not just JSON?
- `ensureHumanUnit` + `identity-link` relation — keep as-is or fold into plugin schema

#### W2 — Decide (Opus × 1)
- Three endpoints: `/zklogin/start` (GET, 302 to Google), `/zklogin/callback` (GET: HTML bounce), `/zklogin/callback` (POST: mint session)
- Can `createAuthEndpoint` return HTML? If no, keep the bounce as a dedicated Astro route
- State cookie (`one.zk.state`) stays Better-Auth-agnostic (HMAC for CSRF), the session cookie flips to Better Auth
- `legacyAddress` boolean stored per user on first zkLogin — future derivations respect the flag
- Docs: skills/zklogin.md § "Plugin pattern" replaces current DIY walkthrough

#### W3 — Edit (Sonnet × M)
- `src/lib/auth-plugins/zklogin.ts` (new)
- `src/lib/auth.ts` (register plugin)
- `src/pages/api/auth/zklogin/*` — leave bounce if HTML-in-plugin isn't supported, else delete
- `src/components/auth/SignInWithAnything.tsx` (update endpoint path)
- `.claude/skills/zklogin.md` (plugin version)

#### W4 — Verify (Sonnet × 2)
- consistency — OAuth redirect URIs match Google Cloud Console; bounce HTML CSP-compliant
- integration — full Google signin → `session.user.frontDoor === 'zklogin'` confirmed
- rubric: fit, form, truth (jwtToAddress deterministic across signins), taste

#### Cycle 2 gate
```bash
bun run verify
# After live zklogin signin:
curl -sb /tmp/cookies http://localhost:4321/api/auth/get-session | jq '.user.frontDoor'
# expect "zklogin"
```

---

### Cycle 3 — Production hardening (JWKS + nonce + salt)

**Deliverable:** Close the three MVP gaps. `jose`-based JWKS verification in the zkLogin plugin. KV-backed nonce replay tracker. Salt derivation migration path documented + feature-flagged to swap from HMAC to Enoki/TEE without breaking existing addresses.

**Exit:** Forged JWT with valid-looking payload but invalid signature → rejected 401. Same id_token replayed twice → second request rejected 401. Existing user re-signs in → same address returned (no migration).

**Rubric override:** 0.25 / 0.20 / 0.45 / 0.10 (truth-heavy — this IS security correctness).

#### W1 — Recon (Haiku × 3, parallel)
- `jose` package — exact import names for CF Workers (`createRemoteJWKSet`, `jwtVerify`)
- CF Workers KV binding in `wrangler.toml` — confirm `env.KV` exists or must be added
- Current salt derivation call sites in `zklogin/callback.ts` → all places that compute `jwtToAddress(jwt, salt)` — must stay consistent across swap

#### W2 — Decide (Opus × 1)
- JWKS verification: where in the plugin (first thing after parsing id_token, before deriving salt)
- Nonce tracker: KV key format `zk:nonce:<nonce>`, TTL = state cookie TTL (10 min)
- Salt migration: `legacyAddress` flag extended to `saltSource: 'hmac' | 'enoki' | 'tee'` — new sign-ins use env-selected source; old users keep their source
- jose bundle size — confirm <50 KB in worker bundle

#### W3 — Edit (Sonnet × M)
- `src/lib/auth-plugins/zklogin.ts` (add jose, nonce tracker, salt source selector)
- `wrangler.toml` (ensure KV binding present for nonce tracker)
- `.env.example` (document `JWT_JWKS_URL` override for testing)
- Test fixtures — `src/lib/auth-plugins/__tests__/zklogin-jwks.test.ts` using `createLocalJWKSet`
- `.claude/skills/zklogin.md` § "JWKS verification" (update from "MUST-DO" → "IMPLEMENTED")

#### W4 — Verify (Sonnet × 2)
- unit — jose rejects unsigned/expired/audience-mismatched JWTs
- integration — KV nonce replay blocks second use
- rubric: fit (gaps closed), form (jose imported minimally), truth (attack scenarios fail), taste

#### Cycle 3 gate
```bash
bun run verify
bun test src/lib/auth-plugins/__tests__/zklogin-jwks.test.ts
# All forged-JWT tests should fail the verification, all valid tests should pass.
```

---

### Cycle 4 — Account linking + multi-door

**Deliverable:** User who signs in via Google zkLogin can later link a Sui wallet (or vice versa) and Better Auth tracks them as ONE user with two accounts. `authClient.linkAccount({provider: 'sui-wallet'})` works from the Header. Visible in substrate via `identity-link` relation with multiple `front-door` attributes per subject.

**Exit:** Fresh Google signin → link wallet → settings page shows both providers → one uid, one role, two addresses. Substrate query `match $u isa unit, has uid $uid; $l (subject: $u) isa identity-link, has front-door $fd; select $uid, $fd;` returns 2 rows.

**Rubric override:** 0.35 / 0.20 / 0.30 / 0.15 (fit-heavy — configurability is the product).

#### W1 — Recon (Haiku × 3, parallel)
- Better Auth `account` table + account-linking plugin
- Current `identity-link` TypeQL shape — extendable to multi-front-door?
- UI: what settings page hosts the linking flow (new or `/settings/keys`)?

#### W2 — Decide (Opus × 1)
- Account linking config in auth.ts: `accountLinking: { enabled: true, trustedProviders: ['google', 'sui-wallet'] }`
- Settings surface: `src/pages/settings/accounts.astro` (new) with `AccountLinks.tsx`
- Substrate: multi-front-door identity-link is already supported (attribute, not a union type); just document pattern

#### W3 — Edit (Sonnet × M)
- `src/lib/auth.ts` (enable account linking)
- `src/components/settings/AccountLinks.tsx` (new)
- `src/pages/settings/accounts.astro` (new)
- Header menu: add "Linked accounts" link when signed in
- `.claude/skills/zklogin.md` § "Account linking" (new section)

#### W4 — Verify (Sonnet × 2)
- consistency — linking a second provider doesn't create a second user row
- integration — both sessions (wallet cookie + zklogin cookie attempt) resolve to the same uid after linking
- rubric

#### Cycle 4 gate
```bash
bun run verify
# After linking:
curl -sb /tmp/cookies http://localhost:4321/api/auth/list-accounts | jq '.[] | .providerId'
# expect ["sui-wallet", "zklogin"] or similar
```

---

### Cycle 5 — Governance enforcement (optional, post-launch)

**Deliverable:** Full governance gates for zkLogin users — role promotion via CEOPanel, agent ownership claims via `/api/auth/agent/:uid/claim`, pheromone gate wiring, scope defaults. zkLogin users are first-class citizens with identical permissions as wallet users.

**Exit:** zkLogin user can claim an agent → ownership group created → bootstrap key revoked → human becomes chairman of agent's group. Chairman can promote zkLogin user to operator via CEOPanel → role persists in TypeDB membership.

**Rubric override:** 0.40 / 0.15 / 0.30 / 0.15 (fit-heavy — governance is about access control correctness).

#### W1 — Recon (Haiku × 4, parallel)
- `/api/agents/:uid/claim` flow from auth.md — the handshake contract
- Pheromone gate coverage (`hasPathRelationship`) for zkLogin users
- Ownership group pattern `g:owns:<agent-uid>` with `group-type: "owns"`
- CEOPanel role promotion flow — does it work with zkLogin users?

#### W2 — Decide (Opus × 1)
- Claim endpoint spec: cookie session (human) + bearer (agent bootstrap) → ownership group → new scoped key
- Role promotion flow: CEOPanel → update membership role → cache invalidation
- Scope defaults: paths/hypotheses created by zkLogin users default to `scope: 'group'`
- Audit logging: all governance actions emit signals for pheromone tracking

#### W3 — Edit (Sonnet × M)
- `src/pages/api/auth/agent/[uid]/claim.ts` (new endpoint)
- `src/components/ceo/CEOPanel.tsx` — verify role promotion works for zkLogin users
- `src/lib/api-auth.ts` — add scope defaults for zkLogin-created entities
- `.claude/skills/zklogin/SKILL.md` § "Governance integration" (update with implementation details)
- `one/auth.md` — update "Closed Gaps" section

#### W4 — Verify (Sonnet × 2)
- zkLogin user claims agent → ownership group created in TypeDB
- Chairman promotes zkLogin user → membership.role updated
- Pheromone gate blocks unauthorized mark/warn
- Scope defaults apply to new paths

#### Cycle 5 gate
```bash
bun run verify
# Claim flow:
curl -X POST /api/auth/agent/swift-scout/claim \
  -b cookies.txt \
  -H "Authorization: Bearer <agent-bootstrap-key>"
# Returns { owned: true, ownerUid, agentUid, group, newKey }

# TypeDB query confirms ownership:
# match $g isa group, has group-id "g:owns:swift-scout";
#       (group: $g, member: $a, role: $r) isa membership; select $a, $r;
# Returns 2 rows: agent with role "agent", human with role "chairman"
```

---

## 8 — Source of truth (auto-loaded in every W2)

| Doc | Locks |
|-----|-------|
| `one/auth.md` | unified 3-door identity model, ownership semantics, 6 gaps |
| `one/governance-todo.md` | role/permission schema (LOCKED 2026-04-18), auth flow |
| `one/dictionary.md` | canonical names; C1 adds "Better Auth plugin session" term |
| `one/patterns.md` | closed loop + zero returns (every auth attempt closes) |
| `one/rubrics.md` | fit/form/truth/taste scoring per wave |
| `.claude/skills/zklogin/SKILL.md` | full technical reference (~800 lines, governance-integrated) |
| `.claude/skills/sui/SKILL.md` | wallet signing patterns, `verifyPersonalMessageSignature` |
| `src/lib/api-auth.ts` | `ensureHumanUnit`, `getRoleForUser`, `hasPathRelationship` |
| `src/lib/role-check.ts` | `roleCheck(role, action)` — pure permission matrix |
| `.claude/rules/documentation.md` | docs updated in W2, edited in W3, verified in W4 |
| Better Auth docs | https://www.better-auth.com/docs/plugins + createAuthEndpoint + additionalFields |

---

## 9 — Escape

```
IF   JWKS verification accepts unsigned tokens in staging
THEN status → PAUSED; revert to trust-on-parse + audit log; escalate
AND  block mainnet deploy

IF   authClient.useSession() still returns null after 3 consecutive sui-wallet signins in C1 W4
THEN roll back plugin registration; DIY cookie stays authoritative
AND  file a Better Auth issue with the session contract mismatch

IF   Enoki evaluation shows >$5K/mo cost at projected scale (or lock-in terms unacceptable)
THEN stay on DIY path; invest in TEE salt server as C3.5

IF   Mysten releases first-party Better Auth plugin before C2 W3
THEN pause C2; evaluate adoption of official plugin; our custom plugin becomes reference
```

---

## 10 — Downstream pitch (fires at plan close)

After Cycle 4 closes (C5 is optional):

```yaml
pitch:
  headline: "Open source Better Auth plugins for Sui wallet and zkLogin."
  body: "Two plugins, production-hardened. JWKS via jose, nonce-replay blocked in KV, account linking across all doors, governance-integrated (roles, pheromone gates, scope). Drop them into any Astro/Node project running Better Auth and you're live in a day. First public reference implementation with full identity→permission flow."
  demo_url: /signin
  publish_target:
    - npm: @oneie/better-auth-sui-wallet
    - npm: @oneie/better-auth-zklogin
    - github: one.ie/better-auth-plugins
```

The plugins are free; the social proof is "ONE runs on them at scale." Fetch.ai, Mysten, and any other Sui-native app benefits — and every install silently cites ONE as the implementation reference.

---

## 11 — Status

- [ ] **Cycle 1 — sui-wallet Better Auth plugin**
  - [ ] W1 recon (5 parallel) — includes governance patterns
  - [ ] W2 decide + docs
  - [ ] W3 edits (parallel by file)
  - [ ] W4 verify
- [ ] **Cycle 2 — zkLogin Better Auth plugin**
  - [ ] W1 recon (5 parallel) — includes governance patterns
  - [ ] W2 decide + docs
  - [ ] W3 edits (parallel by file)
  - [ ] W4 verify
- [ ] **Cycle 3 — Production hardening (JWKS + nonce + salt)**
  - [ ] W1 recon (4 parallel) — includes pheromone gate check
  - [ ] W2 decide + docs
  - [ ] W3 edits (parallel by file)
  - [ ] W4 verify
- [ ] **Cycle 4 — Account linking + multi-door**
  - [ ] W1 recon (4 parallel) — includes ownership model
  - [ ] W2 decide + docs
  - [ ] W3 edits (parallel by file)
  - [ ] W4 verify
- [ ] **Cycle 5 — Governance enforcement** (optional, post-launch)
  - [ ] W1 recon (4 parallel)
  - [ ] W2 decide + docs
  - [ ] W3 edits (parallel by file)
  - [ ] W4 verify

---

## 12 — How to run

```bash
/plan sync one/zklogin.md                 # compile to TypeDB
/do one/zklogin.md                        # advance next wave
/do one/zklogin.md --cycle 1              # force Cycle 1 only
/close --plan zklogin --cycle 1           # close C1 once W4 passes
```

See `one/zklogin-todo.md` for the live task dashboard that reflects this plan's TypeDB state.

---

## See also

### Source of truth
- `one/auth.md` — unified 3-door identity model, ownership semantics, claim flow
- `one/governance-todo.md` — role/permission schema (LOCKED 2026-04-18), auth flow
- `.claude/skills/zklogin/SKILL.md` — ~800-line technical reference (governance-integrated)

### Implementation
- `src/lib/auth.ts` — current Better Auth config (email/pw only)
- `src/lib/api-auth.ts` — `ensureHumanUnit`, `getRoleForUser`, `hasPathRelationship`
- `src/lib/role-check.ts` — `roleCheck(role, action)` pure permission matrix
- `src/pages/api/auth/{wallet,zklogin}/*.ts` — current DIY implementations (to be retired)
- `src/components/auth/{CryptoAuthPanel,SignInWithAnything,WalletSignIn}.tsx` — UI surfaces
- `src/components/Header.tsx` — consumer of `authClient.useSession()`

### Reference
- `one/chairman.md` — reference plan shape (this plan modelled after it)
- `one/zklogin-todo.md` — live task dashboard
- [Better Auth plugin docs](https://www.better-auth.com/docs/concepts/plugins)
- [Better Auth SIWE plugin](https://www.better-auth.com/docs/plugins/siwe) — template for our sui-wallet plugin

---

*One session. Every door. Zero compromise on security. Full governance integration. Plugins publish back as open source — ONE becomes the reference.*
