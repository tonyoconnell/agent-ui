# zkLogin — OAuth → Sui address, no wallet install

**Users sign in with Google (or Facebook, Twitch, Apple, etc.). We get a Sui address they control. No private key on our server, no wallet extension, no pop-up.**

The user's OAuth `id_token` + an ephemeral keypair + a Groth16 zero-knowledge proof derives a Sui address that only the id_token holder can control. Mysten's zk circuit proves "I hold the id_token for this address" without revealing the token. We never see the private key. The OAuth provider never sees the address.

---

## TL;DR — pick your path first

| Decision | Path | When |
|----------|------|------|
| I want zkLogin shipped in a day, zero infra | **Enoki** (`@mysten/enoki`) | Default. Mysten manages prover + salt + JWT. Free tier exists; paid tiers for scale. |
| I want full control, no vendor lock | **DIY** (what ONE has today) | You run/self-host the prover, manage salts in a TEE, verify JWTs yourself. ~2–3 weeks to production-grade. |
| I want to migrate from DIY to Enoki later | Start DIY, keep addresses stable | Enoki-derived addresses match DIY addresses for the same `(sub, iss, aud, salt)` — migration is session-level, not address-level. |

ONE currently runs the **DIY path**. This skill documents it in detail AND lays out Enoki as the migration target.

---

## Works With

| Skill         | Load when                                                                       |
|---------------|---------------------------------------------------------------------------------|
| `/sui`        | Writing Move contracts the zkLogin address will sign. Address is a normal Sui address. |
| `/signal`     | Every step emits `ui:auth:zklogin:*` — pheromone tracks the OAuth funnel.        |
| `/astro`      | Endpoints under `src/pages/api/auth/zklogin/` — must set `export const prerender = false`. |
| `/cloudflare` | Production deploy — secrets via `wrangler secret put`, not `.env`.              |
| `/react19`    | Client-side hooks (`useZkLogin`, Enoki integration) use React 19 patterns.       |
| `/typedb`     | `ensureHumanUnit(uid, meta)` persists zkLogin users — uid pattern `human:sui:<addr>`. |

---

## The 3-step flow (DIY)

```
1. GET /api/auth/zklogin/start
     generate ephemeral Ed25519 keypair
     fetch currentEpoch from Sui fullnode
     maxEpoch = currentEpoch + 2               (≈48 hours)
     randomness = generateRandomness()
     nonce = generateNonce(eph_pk, maxEpoch, randomness)
     sign state into HttpOnly cookie (HMAC-SHA256, 10 min TTL)
     302 → accounts.google.com/o/oauth2/v2/auth?response_type=id_token&nonce=<nonce>&…

2. GET /api/auth/zklogin/callback
     Google redirected back with id_token in URL FRAGMENT (#id_token=…)
     Fragments are CLIENT-ONLY — browsers never send them to servers.
     Return 200-byte HTML bounce that reads location.hash and POSTs to same route.

3. POST /api/auth/zklogin/callback
     verify state cookie HMAC (CSRF protection)
     verify id_token signature via JWKS (see §JWKS below — NOT in MVP, must add)
     parse JWT payload: {sub, email, nonce, aud, iss, exp}
     assert jwt.nonce === state.nonce           (replay protection)
     derive salt = HMAC(WALLET_NONCE_SECRET, sub)   // MVP; swap for salt service
     address = jwtToAddress(id_token, salt)
     ensureHumanUnit("human:sui:<addr>", {id, email})
     mint `one.sui.session` cookie (HMAC, 30-day TTL)
     return { uid, wallet, frontDoor: 'zklogin' }
```

Three redirects, two cookies, one session. Zero wallet installs.

---

## Files in ONE

| File | Role |
|------|------|
| `src/pages/api/auth/zklogin/start.ts` | Step 1 — nonce + redirect to Google |
| `src/pages/api/auth/zklogin/callback.ts` | Step 2 (GET bounce) + Step 3 (POST session mint) |
| `src/components/auth/SignInWithAnything.tsx` | "Continue with Google" button — `window.location = '/api/auth/zklogin/start'` |
| `src/components/auth/CryptoAuthPanel.tsx` | Wraps `SignInWithAnything` with mode=signin/signup copy |
| `src/components/Header.tsx` | Reads session via `authClient.useSession()`, shows signed-in chip |
| `src/lib/api-auth.ts` | `ensureHumanUnit`, `getRoleForUser`, `resolveUnitFromSession` |
| `src/pages/api/auth/me.ts` | Reads session cookie, returns `{uid, wallet, role}` |

---

## Supported OAuth providers (as of 2026-04)

**Mainnet:**
- Google
- Facebook
- Twitch
- Apple
- AWS Tenant
- Karrier One
- Credenza3

**Testnet / devnet only:**
- Slack
- Kakao
- Microsoft

**Under review** (may reach mainnet): RedBull, Amazon, WeChat, Auth0, Okta.

> **Source:** [Sui docs — developer account](https://docs.sui.io/guides/developer/cryptography/zklogin-integration/developer-account)

Each provider needs its own OAuth client registered in its console and its own redirect URI mapped to your `/api/auth/zklogin/callback`. Multi-provider support is a matter of adding provider-specific `start.ts` branches (`/start/google`, `/start/facebook`) and dispatching in the callback on `iss`.

---

## Required env vars

```bash
# OAuth client (per provider — Google shown)
GOOGLE_OAUTH_CLIENT_ID=<client-id>.apps.googleusercontent.com
GOOGLE_OAUTH_REDIRECT_URI=https://dev.one.ie/api/auth/zklogin/callback

# Shared HMAC secrets — 32-byte random hex each
WALLET_NONCE_SECRET=<openssl rand -hex 32>   # HMAC for state cookie + salt derivation
SUI_SESSION_SECRET=<openssl rand -hex 32>    # HMAC for session cookie (defaults to WALLET_NONCE_SECRET)

# Optional — prover endpoint (self-hosted or third-party)
ZKLOGIN_PROVER_URL=https://your-prover.example.com/v1   # leave unset while sign-in only, not signing txs yet
```

**Dev:** append to `.env`, restart. The dev script must be `bun --env-file=.env astro dev` — plain `astro dev` does NOT read `.env` into `process.env` on macOS. (Lesson learned 2026-04-20.)

**Prod:** `wrangler secret put <NAME>` per Worker. Never commit.

---

## `@mysten/sui/zklogin` — full SDK surface (v2.x)

```ts
import {
  // Nonce + ephemeral key
  generateNonce,                   // (eph_pk, maxEpoch, randomness) => string
  generateRandomness,              // () => string  (field element for the nonce)
  getExtendedEphemeralPublicKey,   // (pk) => string  (prover input format)

  // Address derivation
  jwtToAddress,                    // (jwt, salt, legacyAddress?) => string
  computeZkLoginAddress,           // (claimName, claimValue, issuer, opts?) => string
  computeZkLoginAddressFromSeed,   // (seed, issuer) => string
  genAddressSeed,                  // (claimName, claimValue, issuer) => string

  // Signing (after fetching proof)
  getZkLoginSignature,             // ({inputs, maxEpoch, userSignature}) => Signature
  parseZkLoginSignature,           // (sig) => parsed
  ZkLoginPublicIdentifier,         // class — identity helpers

  // Low-level
  toBigEndianBytes,                // (value) => Uint8Array
  poseidonHash,                    // (bigint[]) => bigint
} from '@mysten/sui/zklogin'

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
```

> **Source:** [Mysten SDK reference](https://sdk.mystenlabs.com/typescript/zklogin) · [typedoc](https://sdk.mystenlabs.com/typedoc/modules/_mysten_sui.zklogin.html)

### v1 → v2 breaking change (MUST READ)

SDK v2 fixed a bug in `genAddressSeed()` that produced different addresses than v1. Existing users need `legacyAddress: true` to keep their wallet:

```ts
// User signed in via v1 at some point — preserve their address
const oldAddr = jwtToAddress(jwt, salt, true)    // legacyAddress=true

// New user — use v2 (correct)
const newAddr = jwtToAddress(jwt, salt)          // defaults to false
```

**Migration:** store `legacyAddress: boolean` on the user record at first sign-in. Re-derive with the stored flag on every subsequent session.

---

## Prover service — the real picture

The Groth16 prover generates the ZK proof needed to **sign transactions**. For sign-in only (our current use), the proof is NOT required — `jwtToAddress` is deterministic.

### Mysten does not expose a public mainnet prover URL

Paths in order of preference:

| Option | URL / Source | Cost | Pros | Cons |
|--------|--------------|------|------|------|
| **Enoki** | `https://api.enoki.mystenlabs.com` | Free tier + paid | Mysten-managed, includes salt + gas sponsorship | Vendor; but v2 adds portable wallets |
| **Self-host** | Docker `mysten/zklogin:prover-<hash>` | Infrastructure | Full control, no rate limits | 18 GB zkey, 50 GB disk, Linux amd64, startup latency |
| **Shinami** | `https://api.shinami.com` | Per-proof pricing | Turn-key | Rate limit: 2 proofs/address/min → `-32012` |
| **Contact Mysten** | (direct) | — | Mainnet access | Out-of-band approval |

> **Source:** [Sui blog — proving service guide](https://blog.sui.io/proving-service-zklogin/) · [Shinami zkLogin API](https://docs.shinami.com/reference/zklogin-wallet-api)

### Self-host the prover

```bash
# Pull the ceremony-contributed zkey (~18 GB via git-lfs)
mkdir -p ~/data && cd ~/data
GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/sui-foundation/zklogin-ceremony-contributions.git
cd zklogin-ceremony-contributions && git lfs pull --include "zkLogin.zkey"
# Verify Blake2b hash:
# 060beb961802568ac9ac7f14de0fbcd55e373e8f5ec7cc32189e26fb65700aa4e36f5604f868022c765e634d14ea1cd58bd4d79cef8f3cf9693510696bcbcbce

# Run the prover backend
docker run -d \
  -e ZKEY=/app/binaries/zkLogin.zkey \
  -e WITNESS_BINARIES=/app/binaries \
  -v ~/data/zklogin-ceremony-contributions/zkLogin.zkey:/app/binaries/zkLogin.zkey \
  -p 5000:8080 \
  mysten/zklogin:prover-a66971815c15ba10c699203c5e3826a18eabc4ee

# Run the frontend (exposes /v1 for clients)
docker run -d \
  --add-host=host.docker.internal:host-gateway \
  -e PROVER_URI='http://host.docker.internal:5000/input' \
  -e NODE_ENV=production \
  -p 5001:8080 \
  mysten/zklogin:prover-fe-a66971815c15ba10c699203c5e3826a18eabc4ee
```

### Prover request / response

```ts
// POST https://your-prover/v1
{
  "jwt": "eyJhbGciOiJSUzI1NiI…",
  "extendedEphemeralPublicKey": "ucbuFjDvPnERRKZI2wa7sihPcnTPvuU…=",
  "maxEpoch": "10",
  "jwtRandomness": "S76Qi8c/SZlmmotnFMr13Q==",
  "salt": "urgFnwIxJ++Ooswtf0Nn1w==",
  "keyClaimName": "sub"
}
// →
{
  "proofPoints": {
    "a": ["…", "…"],                       // G1 point
    "b": [["…", "…"], ["…", "…"]],         // G2 point
    "c": ["…", "…"]                        // G1 point
  },
  "issBase64Details": { "value": "aHR0cHM6…", "indexMod4": 0 },
  "headerBase64": "eyJhbGciOiJSUzI1NiI…"
}
```

**Latency:** cold ~500 ms–2 s, warm ~200–500 ms. Proof is valid until `currentEpoch ≥ maxEpoch`.

### Cache the proof client-side

```ts
// Key: (addressSeed, maxEpoch). Store in IndexedDB (not localStorage — proof is too large).
const key = `zk:${addressSeed}:${maxEpoch}`
const cached = await idb.get(key)
if (cached) return cached
const proof = await fetch(PROVER_URL + '/v1', { method: 'POST', body: JSON.stringify(req) }).then(r => r.json())
await idb.set(key, proof)
```

**Never cache the ephemeral private key alongside the proof.** Proof-only is safe; key+proof together = full compromise.

---

## JWKS verification — the MUST-DO

MVP gap #1: `callback.ts` currently trust-on-parses the JWT. **Before mainnet**, verify Google's signature using `jose`.

### The 5-line pattern

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: 'https://accounts.google.com',
  audience: env.GOOGLE_OAUTH_CLIENT_ID,
})
```

### Why `jose` (not `jsonwebtoken`)

- Uses WebCrypto only — works in CF Workers, Deno, Bun, browsers
- Zero dependencies
- `createRemoteJWKSet` caches in-memory with automatic rotation detection (Google rotates keys ~every 2 weeks)
- Bundle size: **~12 KB compressed** (fits CF Workers 1 MB limit easily)

### Errors thrown

| Error class | When |
|-------------|------|
| `JWTExpired` | `exp` is past |
| `JWTClaimValidationFailed` | `aud` mismatch, `iss` mismatch, bad signature |
| `JWTInvalid` | Malformed JWT |

Catch all three at the callback site:

```ts
try {
  const { payload } = await jwtVerify(idToken, JWKS, { issuer, audience })
  // …
} catch (e) {
  if (e instanceof errors.JWTExpired) return Response.json({ error: 'token expired' }, { status: 401 })
  if (e instanceof errors.JWTClaimValidationFailed) return Response.json({ error: 'claim failed' }, { status: 401 })
  return Response.json({ error: 'jwt invalid' }, { status: 400 })
}
```

### Claims to verify beyond `iss` and `aud`

```ts
// Nonce binding — prevents replay of a stolen id_token against our endpoint
if (payload.nonce !== stateCookie.nonce) throw new Error('nonce mismatch')

// Email is verified (Google says so)
if (!payload.email_verified) throw new Error('email not verified')

// sub is the stable user ID — use for salt derivation and unit uid
const sub = payload.sub
```

### Testing JWKS locally

Use `createLocalJWKSet(fixture)` instead of remote:

```ts
import { createLocalJWKSet, jwtVerify } from 'jose'
const JWKS = createLocalJWKSet({ keys: [{ kid: 'test', kty: 'RSA', alg: 'RS256', use: 'sig', n: '…', e: 'AQAB' }] })
const { payload } = await jwtVerify(testToken, JWKS, { issuer, audience })
```

---

## Salt management — the HMAC shortcut and the real path

ONE's current MVP: `salt = HMAC(WALLET_NONCE_SECRET, sub)`. Deterministic, no state. Works fine until `WALLET_NONCE_SECRET` leaks — then every user's salt is predictable, linking their OAuth identity to their Sui address.

### What Mysten recommends (blog.sui.io/zklogin-salt-server-architecture)

- **Trusted Execution Environment** (AWS Nitro Enclave or similar) holds the master seed
- Salt server derives per-user salt inside the enclave and returns it over TLS
- Master seed never leaves the enclave; compromise requires breaking the enclave attestation

### What Enoki does

Runs the salt server for you. Address stability guaranteed across sessions. You call Enoki SDK; Mysten returns the address. You lose control; you gain correctness.

### Shamir Secret Sharing (Horcrux) for disaster recovery

Split the master seed across N trustees (e.g., 3 of 5). If the enclave dies, reassemble the seed from M trustees and migrate to a new TEE. Without this, losing the master seed = losing every user's wallet permanently.

### Never store salt client-side

```
// BAD
localStorage.setItem('salt', salt)       // phishing-exposed
sessionStorage.setItem('salt', salt)     // same

// GOOD
// Salt lives server-side in a TEE or managed by Enoki. Client only sees the derived ADDRESS.
```

---

## Nonce binding + replay protection

### The nonce IS the state binding

```
nonce = Poseidon(eph_pk, maxEpoch, randomness)
```

This commits to:
- The ephemeral public key (only the holder can sign later)
- The max epoch (expires the session)
- Random entropy (each flow unique)

The nonce goes into the OAuth request. Google embeds it in the id_token. We verify on return. If anything changes, the `jwtToAddress` derivation and the proof both break.

### Add a nonce tracker (KV with TTL)

Even with nonce-in-JWT, a stolen id_token could be replayed against our callback. Block by tracking consumed nonces:

```ts
// CF Workers KV (or D1)
const nonceKey = `zk:nonce:${payload.nonce}`
if (await env.KV.get(nonceKey)) return Response.json({ error: 'nonce reused' }, { status: 401 })
await env.KV.put(nonceKey, '1', { expirationTtl: 600 })  // 10 min > state cookie TTL
```

Cost: one KV read + write per sign-in. Worth it.

### CSRF via signed state cookie (already implemented)

`one.zk.state` cookie carries the HMAC-signed state. The callback verifies HMAC before trusting. Don't weaken `SameSite=Lax` → `SameSite=None` unless you absolutely must (and then add a double-submit token).

---

## Epoch cliff handling

Sui epochs are ~24 h on mainnet. `maxEpoch = currentEpoch + 2` gives ~48 h of validity. When `currentEpoch > maxEpoch - 2`, the ephemeral key is nearing expiry.

### Silent refresh pattern

```ts
// Poll Sui system state on each signed-in page load
const { result } = await fetch('https://fullnode.mainnet.sui.io', {
  method: 'POST',
  body: JSON.stringify({ jsonrpc: '2.0', method: 'suix_getLatestSuiSystemState', params: [] }),
}).then(r => r.json())

const currentEpoch = Number(result.epoch)
if (currentEpoch > session.maxEpoch - 2) {
  // Silent re-auth: re-run zklogin/start with prompt=none
  window.location.href = '/api/auth/zklogin/start?silent=1'
}
```

Add `prompt=none` to the Google OAuth URL in silent mode — Google returns a fresh id_token without a UI if the user's Google session is still valid. Falls back to full flow otherwise.

### Session cookie outliving the ephemeral key

Today ONE's session cookie is 30 days but the ephemeral key is 2 epochs. A user with a valid session cookie can't sign transactions after epoch expiry. Two options:

1. **Tie session TTL to maxEpoch.** Session cookie expires at the epoch cliff. Forces re-auth; simple.
2. **Session cookie survives; ephemeral key refreshes on demand.** User's session (who they are) persists; signing (what they can do) requires a quick `zklogin/start?silent=1` round-trip.

Option 2 is better UX. Pattern: store `{uid, maxEpoch, addressSeed}` in the session; on first transaction attempt with expired maxEpoch, silently re-auth.

---

## Session cookie best practices

```ts
Set-Cookie: one.sui.session=<HMAC-signed payload>;
            HttpOnly;
            Secure;
            SameSite=Lax;
            Path=/;
            Max-Age=<seconds>
```

**Payload shape:**

```ts
{
  u: uid,                    // "human:sui:0x…"
  e: sessionExp,             // unix ms
  me: maxEpoch,              // for refresh detection
  la: legacyAddress,         // v1 vs v2 derivation flag
  fd: 'zklogin' | 'wallet'   // front-door provenance
}
```

**Rotation:** issue a new session cookie on every ephemeral key refresh. Old sessions invalidate on next request. Tie to an in-KV session row if you want server-side revocation (useful for "sign out all devices").

---

## Cloudflare Workers specifics

✅ **Works:**
- `crypto.subtle` (HMAC, SHA-256, key import) — native WebCrypto
- `jose` — uses only WebCrypto
- Fetch to Sui fullnode + JWKS + prover — standard
- HMAC-signed cookies for state + session

⚠️ **Watch:**
- **Poseidon hash is NOT native.** `generateNonce()` computes it inside the SDK; `@mysten/sui/zklogin` bundles the implementation. Bundle size with full zklogin import: ~200 KB. Verify it stays under the 10 MiB worker limit.
- **Groth16 proof verifier is large** (~5 MiB). Keep it out of the worker — run proof generation on the prover service, not in-worker. Sign-in only needs address derivation, not verification.
- **KV for nonce tracking** — eventual consistency means a replay attacker with a 1-second window between two CF isolates could slip through. For high-value flows, use D1 (strongly consistent) or Durable Object.

Add to `wrangler.toml` if not already:

```toml
[vars]
GOOGLE_OAUTH_REDIRECT_URI = "https://dev.one.ie/api/auth/zklogin/callback"

# Secrets (set via `wrangler secret put`, never commit):
#   GOOGLE_OAUTH_CLIENT_ID
#   WALLET_NONCE_SECRET
#   SUI_SESSION_SECRET
#   ZKLOGIN_PROVER_URL (optional)
```

---

## Signing transactions with zkLogin

Sign-in alone doesn't need the proof. Signing a transaction does.

```ts
import { getZkLoginSignature } from '@mysten/sui/zklogin'

// 1. Fetch proof (cached client-side per maxEpoch)
const proof = await fetch(PROVER_URL + '/v1', {
  method: 'POST',
  body: JSON.stringify({
    jwt: idToken,
    extendedEphemeralPublicKey,
    maxEpoch,
    jwtRandomness,
    salt,
    keyClaimName: 'sub',
  }),
}).then(r => r.json())

// 2. Sign the transaction with the ephemeral key
const { bytes, signature: userSignature } = await txb.sign({ signer: ephemeralKeypair })

// 3. Bundle into a zkLogin signature
const zkSignature = getZkLoginSignature({
  inputs: { ...proof, addressSeed },   // addressSeed from genAddressSeed
  maxEpoch,
  userSignature,
})

// 4. Execute with zkSignature in place of a normal wallet signature
await suiClient.executeTransactionBlock({ transactionBlock: bytes, signature: zkSignature })
```

**Cache the proof** per `(addressSeed, maxEpoch)` in IndexedDB — one proof lasts the ephemeral key's lifetime.

### Sponsored transactions (gas paid by your treasury)

zkLogin + sponsored transactions = users pay nothing to transact. Mysten's pattern: your backend acts as the gas sponsor via a coin object you control.

```
user signs tx with zkLogin signature
  → backend sponsors gas (signs same tx with gas sponsor key)
  → both signatures submitted
  → user pays 0 SUI
```

Enoki bundles this. DIY: [Sui sponsored transactions guide](https://docs.sui.io/guides/developer/sui-101/sponsor-txn).

---

## Enoki — the official Mysten path

Launched April 2026 (Enoki 2.0). Drop-in replacement for everything on this page.

```bash
bun add @mysten/enoki
```

### Integration with dapp-kit

```tsx
import { ConnectButton, useCurrentAccount, useConnectWallet } from '@mysten/dapp-kit'
import { registerEnokiWallets } from '@mysten/enoki'

// In your WalletProvider setup (once at app root):
registerEnokiWallets({
  apiKey: process.env.PUBLIC_ENOKI_API_KEY,
  providers: {
    google: { clientId: process.env.PUBLIC_GOOGLE_CLIENT_ID },
    facebook: { clientId: process.env.PUBLIC_FACEBOOK_APP_ID },
  },
})

// In any component:
const account = useCurrentAccount()   // works whether user came via Enoki or a native wallet
```

Enoki wallets appear as options in `ConnectButton` alongside Sui Wallet, Suiet, Phantom, etc. User clicks "Sign in with Google" inside the wallet modal, OAuth flow runs, returns a wallet-shaped account object.

### What Enoki handles for you

- Prover (no self-hosting)
- Salt service (no TEE)
- JWT verification (no JWKS wiring)
- Nonce tracking (no KV)
- Ephemeral key refresh (no silent re-auth)
- Sponsored transactions (your treasury pays gas for users)

### What you pay

Free tier exists. Paid tiers for scale + sponsored gas allowances. Pricing at [enoki.mystenlabs.com](https://docs.enoki.mystenlabs.com).

### Migration path (DIY → Enoki)

Addresses are deterministic: for the same `(sub, iss, aud, salt)`, DIY and Enoki produce the same address. Migration is only about session cookies, not on-chain identity.

1. Register your Google OAuth client ID with Enoki
2. Configure Enoki to use the same salt source (or let Enoki manage new users while DIY keeps old)
3. Deploy `registerEnokiWallets(...)` alongside existing DIY endpoints
4. On next user sign-in, route new sessions through Enoki; old sessions work until cookie expiry
5. After 30 days (session TTL), remove DIY endpoints

No on-chain migration. No address change. No lost assets.

---

## Production checklist

### Security-critical (blockers for mainnet)

- [ ] **JWKS verification in `callback.ts` POST** (`jose` 5-liner above). Current code trust-on-parses — forgeable.
- [ ] **Nonce replay tracker** in KV or D1 with 10-min TTL. Even with state cookie, a stolen id_token is replayable without this.
- [ ] **Salt source upgrade** — either move to a TEE-backed salt server OR adopt Enoki. HMAC-derived salt is fine for MVP but an incident waiting to happen.
- [ ] **Redirect URI allowlist** — hardcoded in Google Cloud Console, exactly matching `GOOGLE_OAUTH_REDIRECT_URI` (scheme + trailing slash matter).
- [ ] **CSP** allows `https://accounts.google.com` as redirect target; no `unsafe-inline` on the callback bounce HTML (use a nonce or hash).

### Correctness (blockers for correctness)

- [ ] **`legacyAddress` flag** stored per user on first sign-in to prevent silent wallet migration on SDK updates.
- [ ] **Cookie flags** — `HttpOnly; Secure; SameSite=Lax` on state + session (already set in code; don't weaken).
- [ ] **Secrets** — `GOOGLE_OAUTH_CLIENT_ID`, `WALLET_NONCE_SECRET`, `SUI_SESSION_SECRET` deployed as `wrangler secret put` on every Worker that reads them.
- [ ] **Epoch refresh endpoint** — silent `zklogin/start?prompt=none` when `maxEpoch` is within 2 of current. Required before users can sign transactions past day 2.

### UX (blockers for launch)

- [ ] **Multi-provider** — at minimum Google + Apple for mainstream coverage. Add `zklogin/start/<provider>` branches.
- [ ] **Error surfaces** — JWKS failure, nonce mismatch, expired token, prover down all map to distinct user-visible messages.
- [ ] **Session persistence across tabs** — `Secure; SameSite=Lax; Path=/` cookie is cross-tab by default; verify.

### Observability

- [ ] Every step emits `ui:auth:zklogin:*` or `api:auth:zklogin:*` signals so pheromone tracks conversion funnel.
- [ ] Front-door provenance persisted via `identity-link` relation (already in callback).
- [ ] Failed verifications log the JWKS check error class (`JWTExpired` vs `JWTClaimValidationFailed` vs `JWTInvalid`) for debugging.

---

## Top 5 integrator mistakes (from zkLogin security research)

1. **Trusting the JWT without JWKS verification.** An attacker can craft any id_token they want. Your server must verify Google's signature. Non-negotiable for mainnet.
2. **Storing salt in browser storage.** Privacy-catastrophic — an XSS vulnerability becomes a deanonymization event. Salt lives server-side in a TEE or with Enoki.
3. **Reusing nonces.** Same nonce + same id_token = replay. Track consumed nonces in KV/D1 for the length of your state cookie TTL.
4. **Hardcoding redirect URIs on the client.** Attacker can steer OAuth callback to their domain, steal id_token. URIs are server config, allowlisted in the OAuth provider console.
5. **Not refreshing the ephemeral keypair before epoch cliff.** User signed in yesterday, tries to pay today, transaction rejects. Silent re-auth at `maxEpoch - 2`.

---

## Testing

### Unit / endpoint

```bash
# Start endpoint — expect 302 to accounts.google.com
curl -sI http://localhost:4321/api/auth/zklogin/start | grep -E "HTTP|Location"
# HTTP/1.1 302 Found
# Location: https://accounts.google.com/o/oauth2/v2/auth?...

# Nonce shared-secret check — must succeed (same WALLET_NONCE_SECRET)
curl -s "http://localhost:4321/api/auth/wallet/nonce?addr=0x0" | jq .
# { "nonce": "...", "message": "...", "exp": ... }
```

### JWKS verification test

```ts
import { createLocalJWKSet, jwtVerify } from 'jose'
import { describe, it, expect } from 'vitest'

describe('zklogin callback JWKS verify', () => {
  it('rejects unsigned JWT', async () => {
    const JWKS = createLocalJWKSet({ keys: [] })
    await expect(jwtVerify(forgedToken, JWKS, { issuer, audience })).rejects.toThrow()
  })

  it('accepts signed JWT with valid claims', async () => {
    const JWKS = createLocalJWKSet(testKeys)
    const { payload } = await jwtVerify(testToken, JWKS, { issuer, audience })
    expect(payload.sub).toBe('test-user')
  })
})
```

### End-to-end

1. Open `/signup`
2. Click "Continue with Google"
3. Complete Google OAuth
4. Land on `/chairman` (or `redirect` param)
5. Header flips to signed-in chip with truncated address
6. `curl -s /api/auth/me` returns `{uid, wallet, role}`

---

## Why zkLogin matters for payments

The same cryptographic root that identifies the user signs their payments. For ONE:

- **Sign-in is free** (`jwtToAddress` is deterministic). No proof fetch, no on-chain activity, no gas.
- **First payment needs the Groth16 proof** (~500 ms from Enoki or self-hosted prover). Proof is cached per-maxEpoch → every subsequent tx in the next 48 h is as fast as a regular wallet.
- **No wallet install.** A signed-in Google user can pay you in SUI without downloading Sui Wallet, MetaMask Snap, or anything else. Enoki also sponsors gas — users pay literally zero.
- **One identity root for everything.** Chairman governance, agent ownership, payment sender, capability buyer — all the same address. The BaaS → Payments story compresses into one cryptographic primitive.

> zkLogin IS the superfast payments infrastructure. Every other door (native wallets, MetaMask Snap) adds steps; zkLogin removes them.

---

## See Also

- [/sui](./sui.md) — Move contracts the zkLogin address signs; Phase 2 agent wallet derivation shares the ephemeral keypair pattern.
- [/signal](./signal.md) — `ui:auth:zklogin:*` telemetry shape.
- `src/pages/api/auth/zklogin/start.ts` — reference implementation (start flow).
- `src/pages/api/auth/zklogin/callback.ts` — reference implementation (bounce + mint).
- `src/lib/api-auth.ts` — `ensureHumanUnit`, `getRoleForUser`.

### External canon

- [Sui zkLogin concepts](https://docs.sui.io/concepts/cryptography/zklogin)
- [Sui zkLogin integration guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration)
- [Mysten SDK zkLogin reference](https://sdk.mystenlabs.com/typescript/zklogin)
- [Enoki docs](https://docs.enoki.mystenlabs.com/)
- [Mysten salt server architecture](https://blog.sui.io/zklogin-salt-server-architecture/)
- [Mysten prover self-host guide](https://blog.sui.io/proving-service-zklogin/)
- [jose (JWT verification library)](https://github.com/panva/jose)
- [Shinami zkLogin API](https://docs.shinami.com/reference/zklogin-wallet-api) — third-party prover with published rate limits
- [zkLogin ceremony contributions](https://github.com/sui-foundation/zklogin-ceremony-contributions) — zkey download for self-host
