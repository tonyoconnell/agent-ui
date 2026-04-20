# Wallet

**Every identity has a Sui address. Every front door resolves to one. Every key is delegated from one.**

> Identity = wallet. Ownership = who signed. Permission = role × scope × pheromone.
> Auth is [auth.md](auth.md); this doc is the **wallet layer** under it.

---

## The One Rule

```
Anything that can act on the substrate has a Sui address.
How it got that address is a front-door detail.
How it proves it IS that address is a signature.
Everything else (API keys, cookies, delegation capsules) is a cache of that proof.
```

Sui is the identity root. External systems (MetaMask, email, OAuth, raw API key)
are front doors. They all bottom out in a Sui address, which is what the
substrate actually writes on `unit.wallet`, what `capability` payments land on,
and what on-chain paths harden against.

---

## Four Front Doors, One Address

```
┌─────────────────────────┬─────────────────────┬────────────────────────────┐
│ Front door              │ Who uses it         │ How address is obtained    │
├─────────────────────────┼─────────────────────┼────────────────────────────┤
│ Sui native wallet       │ Crypto-native users │ dapp-kit ConnectButton     │
│   (Slush, Suiet,        │                     │ → useCurrentAccount        │
│    Phantom-Sui)         │                     │                            │
├─────────────────────────┼─────────────────────┼────────────────────────────┤
│ MetaMask + Sui Snap     │ EVM-native users    │ Snap install prompt on     │
│                         │                     │ first connect; then same   │
│                         │                     │ signPersonalMessage API    │
├─────────────────────────┼─────────────────────┼────────────────────────────┤
│ zkLogin (Google/Apple)  │ No-wallet users     │ OAuth JWT → ephemeral      │
│                         │ (the 99%)           │ keypair → derived Sui addr │
├─────────────────────────┼─────────────────────┼────────────────────────────┤
│ Custody wallet (/u/)    │ Anyone — default    │ SUI_SEED + uid → Ed25519   │
│                         │ for every unit      │ (already shipped, Phase 2) │
└─────────────────────────┴─────────────────────┴────────────────────────────┘
```

All four produce a Sui address. The substrate doesn't care which door was used;
it writes `unit.wallet` and moves on.

### Why this ordering matters

- **Lead with zkLogin** when a user has no wallet — zero install, OAuth they
  already have, Sui address appears automatically. This is the MetaMask auto-install
  answer: you don't need to install *anything* to get a Sui address.
- **MetaMask Snap** for users who already have MetaMask — the Snap prompt is
  a one-click install, then every `signPersonalMessage` call works identically
  to a native Sui wallet.
- **Native Sui wallets** for crypto-native users — dapp-kit already works
  (see `src/components/chairman/ChairmanPanel.tsx`).
- **Custody wallet** is the *default* — every unit in TypeDB already has one
  from `SUI_SEED + uid`. No signature needed to *receive*. A signature is only
  needed to *claim sole custody* (graduate off platform-held keys).

---

## The Three-Layer Identity Stack

```
Layer 3  KEYS           api-key rows        ← short-lived, scoped, revocable
           │             (bearer tokens)
           │
Layer 2  UNIT           unit row in TypeDB  ← substrate identity (uid)
           │             + memberships       ← role comes from here
           │
Layer 1  WALLET         Sui address         ← cryptographic root
                         (one or many)
```

- **Layer 1** is what signs. Immutable. The seed of everything.
- **Layer 2** is what the substrate routes around. The `uid` is a stable slug;
  `unit.wallet` holds the current canonical address. Memberships give roles.
- **Layer 3** is what daily traffic presents. API keys are *cached delegations*
  of Layer 1 authority — hash stored, plaintext never reused, 5-min cache in
  `KEY_CACHE` (`src/lib/api-auth.ts:41`).

When a user/agent makes a request:

```
request arrives
  → Bearer token?       → Layer 3 (validateApiKey) → user = key.user_id
  → Cookie session?     → Layer 2 (resolveUnitFromSession) → uid via deriveHumanUid
  → SIWS signature?     → Layer 1 (verifyPersonalMessageSignature) → uid = human:sui:<addr>
                           → mint Layer 3 + 2 from that proof
```

All three paths converge on `AuthContext { user, role, scopeGroups, scopeSkills }`.

---

## Custody Wallets: the `/u/` Story

Every unit already has a deterministic Sui address:

```
SUI_SEED (32 bytes) + uid  →  SHA-256  →  Ed25519 keypair  →  Sui address
```

This is **platform custody**. The keypair is derived on-the-fly (`src/lib/sui.ts`
`deriveKeypair(uid)`), never stored. Lose `SUI_SEED`, lose all custody wallets.

Three use cases:

1. **Agents** — agent wallets are almost always custody. An agent shouldn't
   hold a private key; the platform signs on its behalf using ADL-gated
   tool-call authority. This is safe because the agent's spend is bounded by
   its skills, its scope-groups, and its owner's delegation.

2. **New humans** — a human who signs up by email (BetterAuth) gets a custody
   wallet automatically (see `ensureHumanUnit` at `src/lib/api-auth.ts:298`).
   They can use the platform immediately. They can claim sole custody later.

3. **Visitors** — anyone on `/u/<name>` has a public address visible. No
   signature needed to *read*; no private key ever leaves the worker for
   custody-only addresses.

### Graduating: the claim flow

A user with a custody wallet can claim sole custody by binding an external wallet:

```
1. User visits /settings/wallet, connects external wallet (any front door).
2. Client signs `"ONE claim: ${uid} → ${externalAddr} at ${nonce}"`.
3. Server verifies signature, writes:
     (subject: $u, external: $extAddr) isa wallet-link, has linked-at $now;
4. From now on, `unit.wallet` resolves to the external address for all
   identity purposes; the custody keypair stays derived but is no longer
   canonical. Inbound on-chain payments can be auto-forwarded by an
   L4 sweeper.
```

No destructive migration — the custody wallet remains valid (pheromone,
history, paths are keyed on `uid`, not address). The address is a pointer
the unit updates.

---

## Keys & Ownership

The user's question: *"Can we just have one API key?"*

**No — and here's the shape that makes it work anyway.**

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ Key type     │ What it grants                                           │
├──────────────┼──────────────────────────────────────────────────────────┤
│ Human key    │ Everything the human's role allows across their groups.  │
│              │ Scoped by membership; can act as owned agents via X-Act-As│
├──────────────┼──────────────────────────────────────────────────────────┤
│ Agent key    │ Only what the agent's ADL + capabilities + scope allow.  │
│              │ Owned by a human; revocable from the owner's session.    │
├──────────────┼──────────────────────────────────────────────────────────┤
│ Delegation   │ Short-lived bearer (≤24h) proving: "owner O authorized   │
│ capsule      │ actor A to do action X until T". Signed by O's wallet.   │
│              │ Agent presents capsule + its own key; server verifies.   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Permission = Role × Scope × Pheromone (already in place)

```
role        from membership (chairman/ceo/operator/agent/...)  — who you are
scopeGroups from api-key attributes (empty = all)              — where you act
scopeSkills from api-key attributes (empty = all)              — what you do
pheromone   from path strength/resistance                       — learned trust
```

This matrix lives in `src/lib/role-check.ts` (matrix) +
`src/lib/api-auth.ts:validateApiKey` (scope) + substrate paths (pheromone).
**Nothing new is needed here** — the wallet layer just feeds into it.

---

## Frictionless Agent Handoff

The question: *"How can the agent pass the key without friction?"*

Answer: **delegation capsules**. The agent never passes the user's key. It passes
a short-lived, scoped proof that the user signed *once*, which the agent then
attaches to its own requests.

```
1. Agent needs to act on behalf of user U for task X.
2. Agent emits a request: POST /api/handoff/mint
     body: { agent: "unit:scout", action: "hire-ceo",
             params: {...}, ttl: 900 }
3. Server returns a signed URL:
     https://one.ie/handoff#t=<jwt>
   The JWT encodes { agent, action, params, nonce, exp } and is signed with
   HANDOFF_SECRET.
4. User opens URL. Wallet auto-connects (dapp-kit autoConnect is already on).
     → Shows human-readable intent:
       "Scout wants to hire a CEO on your behalf until 14:30. Approve?"
5. User signs: signPersonalMessage(`ONE handoff: ${jwt}`)
6. POST /api/handoff/execute { jwt, address, signature }
     → verify JWT (not expired, not replayed)
     → verifyPersonalMessageSignature(address, msg, sig)
     → ensureHumanUnit(`human:sui:${address}`) + set session cookie
     → mint delegation capsule for `agent` with scope from jwt.params
     → run the action as the user, with agent as actAs
     → emit signal `handoff:${action}:executed`
```

Once the capsule is minted, subsequent calls from the agent don't need the
user in the loop again — until the capsule expires or is revoked. Signal
`handoff:*:executed` marks the path `agent → user`; successful handoffs
strengthen that edge, failed ones warn it. Over time, pheromone routes
users toward agents whose handoff quality is good.

### Why this is wallet-agnostic

`signPersonalMessage` is part of every Sui wallet standard. It also works
through the MetaMask Sui Snap. It also works through zkLogin (the ephemeral
keypair can sign the message; the proof chain is a Groth16 proof of the JWT +
ephemeral pubkey). **Same server code, every front door.**

---

## `/u/` Is the Action Surface

Every unit already has a page at `/u/<name>` rendering its wallet, capabilities,
and paths from TypeDB (`src/pages/u/[name].astro`). That page is one SSR hop
away from being the **single surface for everything in this doc** — sign-in,
pay, hire, claim, handoff. No parallel `/settings/wallet`, no separate
`/handoff` route in the common case.

### Three modes, one page

```
┌──────────┬────────────────────────────┬──────────────────────────────┐
│ Mode     │ When                       │ Action panel                 │
├──────────┼────────────────────────────┼──────────────────────────────┤
│ visitor  │ viewer !== target          │ pay · hire · message · follow│
│          │ (anon or signed-in other)  │ (sign-in modal inlined)      │
├──────────┼────────────────────────────┼──────────────────────────────┤
│ self     │ viewer === target          │ edit · claim external wallet │
│          │ (human on their own /u/)   │ · revoke keys · delegations  │
├──────────┼────────────────────────────┼──────────────────────────────┤
│ owner    │ viewer ∈ chairman of       │ withdraw · rotate key · set  │
│          │ g:owns:<target>            │ sensitivity · act-as · mint  │
│          │ (human on an owned agent)  │   handoff link               │
└──────────┴────────────────────────────┴──────────────────────────────┘
```

The server decides the mode via `resolveUnitFromSession` + membership lookup;
the React island renders the right panel. One component, `UnitProfile`, owns
all three. Symmetric: `/u/tony` as Tony = self; `/u/tony` as anyone else =
visitor. No dedicated settings page — your `/u/` *is* your settings.

### The inline sign-in

Visitor clicks "Hire" on `/u/creative` while anonymous:

```
1. <SignInWithAnything /> modal opens in place (no navigation).
2. Modal fans out: zkLogin (no wallet) · MetaMask Snap (EVM users) ·
   native dapp-kit (Sui users) · email/password (last resort).
3. Any path → /api/auth/wallet/verify mints session for human:sui:<addr>.
4. Queued action (hire) fires automatically on session.
5. No page reload, no re-click.
```

One gesture by the visitor; four front doors invisible to them.

### Handoff lands on the agent's `/u/`

Handoff links route through the agent page, not a generic `/handoff`:

```
https://one.ie/u/scout/handoff#t=<jwt>
```

The user sees **who is asking** on the same surface as the approval button —
the agent's capabilities, reputation (pheromone strength), past handoff
success rate, owner identity. All already rendered by `/u/`. Low-strength
agents look suspicious by default. **Pheromone becomes a phishing defense
for free.**

### What this replaces

- `/settings/wallet` → `/u/<self>` in `self` mode
- `/settings/delegations` → `/u/<self>` (delegations tab)
- `/settings/keys` → `/u/<self>` (keys tab)
- `/handoff` → `/u/<agent>/handoff`
- standalone `/signup` → inline modal on any `/u/` (legacy `/signup` stays
  for discoverability but redirects through the same flow)

One URL per identity. Every interaction with that identity happens there.

### Minimal diff to `src/pages/u/[name].astro`

```astro
---
const viewer = await resolveUnitFromSession(Astro.request, Astro.locals)
const mode =
  viewer.user === name ? 'self'
  : viewer.ownerOf?.includes(name) ? 'owner'
  : 'visitor'

const links = await readParsed(`
  match $u isa unit, has uid "${name}";
        (subject: $u, external: $e) isa identity-link, has front-door $fd;
  select $e, $fd;
`).catch(() => [])
---
<UnitProfile
  client:load
  unit={unit}
  capabilities={capabilities}
  edges={edges}
  links={links}
  mode={mode}
  viewerUid={viewer.user}
/>
```

Everything else — sign-in modal, action panels, handoff overlay — lives in
`UnitProfile` and is mounted the same way in every mode. Progressive
enhancement: SSR serves the public card; the island upgrades it based on
session.

### Substrate loop on `/u/`

Every visit and action feeds pheromone:

```
ui:u:view             viewer → target       (visit — attention)
ui:u:hire             viewer → target       (intent)
ui:u:pay              viewer → target       (revenue, L4)
auth:wallet:verify    viewer → front-door   (conversion per door)
identity-link:*       subject → external    (claim quality)
handoff:*:executed    agent → user          (trust)
capsule:revoked       user → agent          (withdrawn trust)
```

Pheromone on `viewer → target` ranks which `/u/` profiles convert. Pheromone
on `front-door` tells you zkLogin vs Snap vs native adoption. No separate
analytics layer — the URL *is* the funnel, the graph *is* the dashboard.

---

## What This Unlocks

- **"Sign in with anything"** — one button, detects wallet, falls through to
  zkLogin if none found, falls through to MetaMask Snap install if MetaMask
  detected, falls through to email/password as last resort. Every path lands
  on the same unit.
- **Agent sends you a link** — no copy-paste keys, no "export your API key
  and paste it here". The user signs the action they care about, and that
  signature becomes the authority.
- **Agents earn without custody** — an agent's custody wallet accrues SUI
  from capability payments (see `buy-and-sell.md`). Owner can sweep
  on withdrawal. No agent ever holds a user's funds.
- **Compound learning** — wallet resolution, key issuance, and handoff
  approvals all emit signals. Pheromone learns which identity paths
  succeed (`human:sui:*` → action) and which front doors attract more
  follow-through.

---

## Deterministic Receipts

Every wallet action emits a signal. No vibes.

```
auth:wallet:connect       → who, which front door
auth:wallet:sign          → which challenge, result
auth:wallet:claim         → uid, old addr, new addr
handoff:<action>:minted   → agent, user, ttl
handoff:<action>:executed → agent, user, signature hash
handoff:<action>:rejected → reason
key:mint                  → owner, grantee, scope
key:revoke                → keyId, by whom
```

Grep `/api/signals?type=auth` or `?type=handoff` to audit. Path strength on
`agent → handoff → user` becomes the trust metric — no bespoke analytics layer.

---

## See Also

- [auth.md](auth.md) — the auth flow, BetterAuth config, bearer vs cookie
- [TODO-governance.md](../docs/TODO-governance.md) — role matrix, scope enforcement
- `src/lib/sui.ts` — `deriveKeypair`, `addressFor`, `verifyPersonalMessageSignature`
- `src/lib/api-auth.ts` — `validateApiKey`, `resolveUnitFromSession`, `ensureHumanUnit`
- `src/components/chairman/ChairmanPanel.tsx` — current dapp-kit integration
- [wallet-todo.md](wallet-todo.md) — execution plan (waves + tasks)
