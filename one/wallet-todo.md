# TODO — Wallet Unification

**Goal:** one identity layer, four front doors, zero-friction agent handoff.
**Spec:** [wallet.md](wallet.md) · **Auth flow:** [auth.md](auth.md) · **Governance:** [TODO-governance.md](../docs/TODO-governance.md)

## Source of Truth

- [dictionary.md](../docs/dictionary.md) — canonical names (`unit`, `wallet`, `api-key`, `membership`)
- [DSL.md](../docs/DSL.md) — signal grammar for `auth:*`, `handoff:*`, `key:*` receivers
- [rubrics.md](../docs/rubrics.md) — fit/form/truth/taste gates on every wave
- [one-ontology.md](../docs/one-ontology.md) — dimensions 1 (group) + 2 (actor) + 4 (path)

## Schema

Dimension 2 (Actors) + Dimension 4 (Paths). Additions:

```tql
unit owns wallet;                # already shipped (Phase 2)
unit owns auth-hash;             # already shipped
identity-link sub relation,      # NEW — links uid to external wallet address
  relates subject,
  relates external,
  owns linked-at,
  owns front-door;               # "sui-native" | "metamask-snap" | "zklogin" | "custody"
unit plays identity-link:subject;
wallet plays identity-link:external;

delegation-capsule sub entity,   # NEW — short-lived signed grant
  owns capsule-id,
  owns grantor,                  # owner uid (source of authority)
  owns grantee,                  # agent uid
  owns action,                   # scoped action string
  owns signature,                # wallet signature of capsule body
  owns expires-at,
  owns status;                   # "active" | "revoked" | "expired"
```

## Routing Diagram

```
                      ┌──────────────────────────┐
 signup / visit  ────►│  /api/auth/wallet/start  │──► zkLogin | Snap | native | email
                      └──────────────┬───────────┘
                                     ▼
                      ┌──────────────────────────┐        ensureHumanUnit
                      │ /api/auth/wallet/verify  │──────► unit + membership + wallet
                      └──────────────┬───────────┘
                                     ▼
                      ┌──────────────────────────┐
        agent ───────►│ /api/handoff/mint        │────► signed JWT URL
                      └──────────────┬───────────┘
                                     ▼
                      ┌──────────────────────────┐
        user signs ──►│ /api/handoff/execute     │────► capsule + session
                      └──────────────┬───────────┘
                                     ▼
                               substrate action
                                  (mark path)
```

Quality marks up: every step emits `auth:*` or `handoff:*` signals;
`handoff:executed` → mark(agent→user, +2); `handoff:rejected` → warn(0.5).

---

## Cycles

### Cycle 1 — SIWS primitive (Sign-In With Sui)

**Intent:** prove wallet ownership, mint session, collapse the "wallet is UI-only" gap.

- [ ] **C1.1** — add `/api/auth/wallet/nonce` — returns `{nonce, expires}` (signed JWT, 5 min). *id: wallet-nonce · value: 5 · effort: 1 · phase: W1 · persona: edge-api · tags: [auth, sui, security]*
- [ ] **C1.2** — add `/api/auth/wallet/verify` — body `{address, signature, nonce}`; uses `verifyPersonalMessageSignature` from `@mysten/sui/verify`; mints BetterAuth session; calls `ensureHumanUnit(human:sui:${addr})`. *id: wallet-verify · value: 8 · effort: 2 · phase: W1 · persona: edge-api · blocks: [wallet-button] · tags: [auth, sui, security]*
- [ ] **C1.3** — `<WalletSignIn />` component — uses `useSignPersonalMessage` from dapp-kit; replaces raw `ConnectButton` on `/chairman` and `/signup`; emits `auth:wallet:sign`. *id: wallet-button · value: 5 · effort: 1 · phase: W1 · persona: react-islands · tags: [ui, auth]*
- [ ] **C1.4** — update `/api/chairman/hire` to trust **session** address, not request-body `owner`. *id: chairman-trust-session · value: 3 · effort: 1 · phase: W1 · persona: edge-api · tags: [security, refactor]*

**Exit:** a signed-in user can hire a CEO without the server ever accepting an unverified address.
**Rubric target:** truth ≥ 0.85 (cryptographic verification), fit ≥ 0.80 (replaces existing UX), form ≥ 0.75, taste ≥ 0.70.

---

### Cycle 2 — Front-door fan-out

**Intent:** any wallet works. No install friction for wallet-less users.

- [ ] **C2.1** — integrate zkLogin via `@mysten/sui/zklogin` — OAuth (Google first), ephemeral keypair, JWT → salt → address; `/api/auth/zklogin/callback` lands user with a Sui address they never had to install a wallet to get. *id: zklogin · value: 13 · effort: 5 · phase: W2 · persona: auth-stack · tags: [zklogin, oauth, conversion]*
- [ ] **C2.2** — integrate MetaMask Sui Snap — detect `window.ethereum`, prompt Snap install on first connect, reuse `signPersonalMessage` pathway. *id: metamask-snap · value: 8 · effort: 3 · phase: W2 · persona: react-islands · tags: [metamask, snap]*
- [ ] **C2.3** — unified `<SignInWithAnything />` — detects wallets, falls through: native Sui → MetaMask Snap → zkLogin → email/password; one button, progressive enhancement. *id: unified-signin · value: 13 · effort: 3 · phase: W2 · persona: react-islands · blocks: [claim-flow] · tags: [ui, conversion]*
- [ ] **C2.4** — annotate `identity-link` with `front-door` so pheromone learns which doors convert best. *id: front-door-tag · value: 3 · effort: 1 · phase: W2 · persona: typedb · tags: [telemetry, schema]*

**Exit:** anyone — EVM user, Google-only user, Sui-native user — reaches the same `unit` with the same capabilities.
**Rubric target:** fit ≥ 0.85 (every user type served), form ≥ 0.75, truth ≥ 0.80, taste ≥ 0.80.

---

### Cycle 3 — `/u/` as the action surface

**Intent:** every identity action — sign-in, pay, hire, claim, delegate, handoff — happens on `/u/<name>`. No parallel settings pages.

- [ ] **C3.1** — extend `src/pages/u/[name].astro` — compute `mode = 'self' | 'owner' | 'visitor'` via `resolveUnitFromSession` + `ownerOf`; fetch `identity-link` rows; pass `mode`, `viewerUid`, `links` to `UnitProfile`. *id: u-mode · value: 8 · effort: 2 · phase: W1 · persona: edge-api · blocks: [u-panels] · tags: [ui, auth, refactor]*
- [ ] **C3.2** — `UnitProfile` action panels — three modes render three panels from one component. Visitor: pay/hire/message + inlined `<SignInWithAnything />`. Self: edit/claim/keys/delegations tabs. Owner: withdraw/rotate/act-as/mint-handoff. *id: u-panels · value: 13 · effort: 4 · phase: W2 · persona: react-islands · blocks: [u-claim, u-delegations, u-keys] · tags: [ui, conversion]*
- [ ] **C3.3** — inline sign-in flow — queued action before auth fires after auth on the same page (no navigation). Action queue lives in `UnitProfile` state; `<SignInWithAnything />` resolves a promise. *id: u-inline-auth · value: 8 · effort: 2 · phase: W2 · persona: react-islands · tags: [ui, conversion, auth]*

**Exit:** `/u/tony` works three different ways for Tony, Tony's CEO, and a random visitor — same URL, different affordances, same component.
**Rubric target:** fit ≥ 0.85 (consolidates 4 pages into 1), form ≥ 0.80, truth ≥ 0.75, taste ≥ 0.85.

---

### Cycle 4 — Custody graduation

**Intent:** the `/u/` wallet is a training-wheels default; users claim sole custody from their own `/u/` page.

- [ ] **C4.1** — `/api/wallet/claim` — body `{uid, externalAddr, signature}`; verifies signature via `verifyPersonalMessageSignature`; writes `identity-link`; updates canonical `unit.wallet`. *id: u-claim · value: 8 · effort: 2 · phase: W2 · persona: edge-api · blocks: [custody-sweep] · tags: [sui, claim, custody]*
- [ ] **C4.2** — claim UI inside `UnitProfile` self-mode — "Link external wallet" button, shows both addresses after claim, labels custody as "legacy — swept on withdrawal". *id: u-claim-ui · value: 5 · effort: 1 · phase: W3 · persona: react-islands · tags: [ui, settings]*
- [ ] **C4.3** — delegations tab in self-mode — lists active `delegation-capsule` rows for this user, one-click revoke per capsule (emits `capsule:revoked`). *id: u-delegations · value: 5 · effort: 1 · phase: W3 · persona: react-islands · tags: [ui, trust]*
- [ ] **C4.4** — keys tab in self-mode — lists `api-key` rows, mint new scoped key, revoke. (Relocates `/settings/keys` into `/u/`.) *id: u-keys · value: 5 · effort: 1 · phase: W3 · persona: react-islands · tags: [ui, security]*
- [ ] **C4.5** — optional on-chain sweeper — worker that scans custody addresses with balance > epsilon, forwards to linked external. Fires on `claim` and on schedule. Runs in restricted env (no direct `SUI_SEED`). *id: custody-sweep · value: 5 · effort: 3 · phase: W3 · persona: sui-bridge · tags: [sui, L4-economic, security]*

**Exit:** a user can bring their external wallet, link it from their own `/u/`, sweep any custody balance, and revoke delegations — all on one page.
**Rubric target:** truth ≥ 0.90 (no funds lost), fit ≥ 0.80, form ≥ 0.75, taste ≥ 0.80.

---

### Cycle 5 — Delegation capsules (handoff)

**Intent:** agents act on behalf of users without ever seeing their key. Handoff URL lands on the agent's `/u/` page for trust context.

- [ ] **C5.1** — `/api/handoff/mint` — agent POSTs `{action, params, ttl}`; server returns signed JWT URL `https://one.ie/u/<agent>/handoff#t=<jwt>` (HANDOFF_SECRET). Emits `handoff:${action}:minted`. *id: handoff-mint · value: 8 · effort: 2 · phase: W3 · persona: edge-api · tags: [handoff, delegation]*
- [ ] **C5.2** — `/u/[name]/handoff.astro` — reuses `UnitProfile` for agent context (reputation, capabilities, past handoff rate) + overlays intent card with Approve button. Parses JWT client-side for display; server re-verifies on execute. *id: handoff-page · value: 13 · effort: 3 · phase: W3 · persona: react-islands · blocks: [handoff-execute] · tags: [handoff, ui, trust]*
- [ ] **C5.3** — `/api/handoff/execute` — verifies JWT + signature via `verifyPersonalMessageSignature`; calls `ensureHumanUnit`; mints `delegation-capsule`; sets session cookie; runs the action as user with `actAs=agent`. Emits `handoff:${action}:executed` or `:rejected`. Marks path `agent→user` on success. *id: handoff-execute · value: 13 · effort: 4 · phase: W3 · persona: edge-api · tags: [handoff, delegation, substrate]*
- [ ] **C5.4** — capsule validator middleware — `X-Delegation: <capsule-id>` on agent requests; cross-checks `capsule.grantee` matches key's user, action matches, not expired/revoked. *id: capsule-middleware · value: 8 · effort: 2 · phase: W3 · persona: edge-api · tags: [security, middleware]*

**Exit:** an agent can send a user a link to its own `/u/`, the user sees who's asking on the same page they approve on, signs once with any wallet, the action executes, and subsequent actions in that scope don't re-prompt until expiry.
**Rubric target:** truth ≥ 0.90, fit ≥ 0.85 (solves the "key-passing" problem), form ≥ 0.80, taste ≥ 0.90.

---

### Cycle 6 — Verify + learn

- [ ] **C6.1** — integration test: end-to-end SIWS → visit `/u/<agent>` → hire inline → handoff → revoke, across all four front doors (mocked where needed: zkLogin, Snap). *id: wallet-e2e · value: 8 · effort: 3 · phase: W4 · persona: test-author · tags: [integration, test]*
- [ ] **C6.2** — pheromone dashboard tile at `/dashboard` — top `front-door` by conversion, top `/u/<x>` by `ui:u:view → ui:u:hire` ratio, top `handoff:action` by strength. *id: wallet-dashboard · value: 3 · effort: 1 · phase: W4 · persona: react-islands · tags: [ui, telemetry]*
- [ ] **C6.3** — docs sync — update `auth.md` flow diagram, add wallet section to `one/backend-tutorial.md`, add `/u/` unification note to `src/pages/CLAUDE.md`, reference from `README.md`. *id: wallet-docs · value: 3 · effort: 1 · phase: W4 · persona: docs · tags: [docs]*

**Exit:** all 6 cycles pass `npm run verify`; rubric scored ≥ 0.70 overall; live site shows at least one handoff path forming on `/world` and the `/u/<agent>/handoff` flow working end-to-end.

---

## Wave Mechanics

- **W1 — recon:** read `sui.ts`, `api-auth.ts`, `ChairmanPanel.tsx`, `useSignPersonalMessage` docs. Map current wallet touch points.
- **W2 — decide:** lock JWT shape for handoff, lock capsule TQL schema, choose zkLogin provider order (Google first — 80% coverage).
- **W3 — edit:** code + docs in parallel per `.claude/rules/documentation.md`. SDK additions land in `packages/sdk/src/auth.ts`.
- **W4 — verify:** deterministic results — signature-verify tests, handoff replay-attack tests, capsule expiry test, conversion-by-front-door benchmark.

## Deterministic Receipts

Every wave must report:
- test count passed/failed
- capsule verify latency p50/p95
- front-door conversion rate (sessions / landings) per front door
- pheromone mass on `handoff:*:executed` paths

## Security Non-Negotiables

- `HANDOFF_SECRET` in `.env`, rotated per env. Never in source.
- All signatures verified server-side with `@mysten/sui/verify`. Client-side verify is UX only.
- Nonces stored in D1 with TTL; replay-attack test in C5.1.
- `CLOUDFLARE_GLOBAL_API_KEY` for deploy (locked rule from [CLAUDE.md](../CLAUDE.md)).
- Custody sweeper (C3.3) MUST NOT have access to `SUI_SEED` — runs as a restricted worker that calls a minimal signer service.

## See Also

- [wallet.md](wallet.md) — spec
- [auth.md](auth.md) — current auth flow this extends
- [chairman.md](chairman.md) / [chairman-todo.md](chairman-todo.md) — first consumer of SIWS
- [TODO-template.md](TODO-template.md) — the shape this follows
- [TODO-governance.md](../docs/TODO-governance.md) — role × scope × pheromone matrix
- `src/lib/sui.ts` · `src/lib/api-auth.ts` · `src/components/chairman/ChairmanPanel.tsx`
