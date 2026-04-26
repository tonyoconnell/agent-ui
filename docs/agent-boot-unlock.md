# Agent Boot-Unlock Protocol

## Summary

When a Cloudflare Worker agent cold-starts, it needs its Ed25519 keypair to sign Sui
transactions. Under the owner architecture (owner.md §Gap 1) there is no `SUI_SEED` in
any worker env. Instead, each agent's 32-byte seed is stored in D1 (`agent_wallet` table)
wrapped under the owner's WebAuthn-PRF-derived AES-GCM KEK. At boot the worker fetches
its ciphertext and requests a short-lived unlock token from the owner API. The owner API
derives the KEK on the owner's machine (Touch ID gate), wraps the token, and returns it
signed by the owner key. The worker verifies the signature, decrypts the ciphertext to
recover the raw seed, builds the keypair, and discards everything except the in-process
`Ed25519Keypair`. Nothing persists. If the owner API is offline at boot the worker returns
503 on all endpoints and retries with exponential backoff rather than proceeding without a
key.

---

## Sequence Diagram

### Happy Path

```
Agent Worker (CF)         Owner API (one.ie)         D1 (agent_wallet)       Owner Mac (browser)
      |                          |                            |                       |
      |-- boot start             |                            |                       |
      |                          |                            |                       |
      |-- GET /api/agents/:uid/ciphertext ----------------->  |                       |
      |                          |                            |                       |
      |                          |<-- SELECT ciphertext, iv, kdf_version WHERE uid=:uid
      |                          |                            |                       |
      |<- 200 { ciphertext_b64, iv_b64, kdf_version } ------  |                       |
      |                          |                            |                       |
      |-- POST /api/agents/:uid/unlock                        |                       |
      |     Authorization: Bearer <agent_bearer> -----------> |                       |
      |                          |                            |                       |
      |                          |-- validate bearer (role=agent, uid match) -------> |
      |                          |                            |  <-- Touch ID (WebAuthn PRF)
      |                          |                            |      HKDF(owner_prf,  |
      |                          |                            |      "agent-key:{uid}:v1")
      |                          |                            |       -> agent KEK     |
      |                          |                            |                       |
      |                          |      AES-GCM(seed, agent_KEK) -> confirm decrypt OK
      |                          |      build unlock token (seal ciphertext, sign)    |
      |                          |                            |                       |
      |<- 200 { ciphertext_b64, iv_b64, kdf_version,         |                       |
      |          expires_at, sig } <------------------------- |                       |
      |                          |                            |                       |
      | verify sig (owner pub key, fields + worker_uid)       |                       |
      | check expires_at > now                                |                       |
      | AES-GCM decrypt ciphertext -> 32-byte seed            |                       |
      | Ed25519Keypair.fromSecretKey(seed)                    |                       |
      | seed = null (discard)                                 |                       |
      |                          |                            |                       |
      |-- agent serving requests |                            |                       |
```

### Failure Path (Owner Offline)

```
Agent Worker (CF)         Owner API (one.ie)
      |                          |
      |-- POST /api/agents/:uid/unlock (attempt 0)
      |     Authorization: Bearer <agent_bearer> -----------> |
      |                          |  (owner Mac unavailable / PRF timeout)
      |<- 503 Service Unavailable |
      |                          |
      | backoff = min(60000, 1000 * 2^0) = 1000ms
      | sleep 1s                 |
      |                          |
      |-- POST /api/agents/:uid/unlock (attempt 1) --------> |
      |<- 503                    |
      |                          |
      | backoff = 2000ms         |
      | sleep 2s                 |
      |  ... (cap at 60s)        |
      |                          |
      | Worker is fail-closed:   |
      |   all incoming requests return 503 until keypair loads
```

---

## Token Format

The unlock token is a self-contained sealed value returned as JSON. It carries everything
the worker needs to decrypt its own seed and nothing the worker cannot already read (the
ciphertext is already in D1 — the token is the re-assertion of it, plus the owner's
signature over time-bound context).

```
{
  ciphertext_b64:  string,   // base64url of AES-GCM(agent_seed, agent_KEK)
  iv_b64:          string,   // base64url of 12-byte AES-GCM nonce
  kdf_version:     number,   // KDF version used to derive the KEK (default 1)
  expires_at:      number,   // Unix epoch seconds; TTL is 60 seconds from mint
  sig:             string    // base64url of owner Ed25519 signature
}
```

`sig` covers the concatenation:

```
sig_input = ciphertext_b64 || ":" || iv_b64 || ":" || kdf_version || ":" || expires_at || ":" || worker_uid
```

The worker verifies `sig` against the owner's registered Ed25519 public key before
decrypting. A mismatched signature is treated as a compromised path: the worker logs
`security:unlock:bad-sig`, does not attempt decryption, and retries from scratch on the
next boot cycle.

TTL rationale: 60 seconds is long enough to absorb clock skew between the owner machine
and the worker and survive a slow network leg. It is short enough that a token intercepted
in transit cannot be replayed once it expires. The token is single-use by design: the
worker decrypts immediately on receipt and discards the token. The raw seed is never
written to any persistent store.

---

## HTTP Endpoint Specs

### POST /api/agents/register-owner

Owner-only. Creates the D1 `agent_wallet` row and returns the agent's bearer token once.

**Authentication:** owner bearer (`Authorization: Bearer sk_owner_...`).
**Role check:** `roleCheck('owner', 'register_agent')` — 403 if caller is not the owner.

**Request body:**
```json
{
  "uid":       "marketing:scout",   // required; agent uid string
  "kind":      "agent",             // optional; defaults to "agent"
  "expiresAt": 1800000000           // optional; Unix epoch for D1 row expires_at
}
```

**Server flow:**
1. Assert `auth.role === 'owner'` via `roleCheck`; emit `audit:owner:register_agent` to
   D1 `owner_audit` before proceeding (per Gap 2 protocol).
2. `seed = crypto.getRandomValues(new Uint8Array(32))`.
3. `agent_kek = await deriveAgentKEK(owner_prf, uid)` — requires Touch ID on owner Mac.
4. `iv = crypto.getRandomValues(new Uint8Array(12))`.
5. `ciphertext = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, agent_kek, seed)`.
6. `address = Ed25519Keypair.fromSecretKey(seed).toSuiAddress()`.
7. `INSERT INTO agent_wallet (uid, ciphertext, iv, kdf_version, address, expires_at)`.
8. Derive bearer: `HKDF(seed, "api-key:agent:v1")` -> `sk_agent_<base64url>`.
9. Register bearer hash in D1 `api_keys`; mark `returned_at = now` (bearer shown once).
10. `seed = null` — discard from server memory.

**Response 200:**
```json
{
  "uid":         "marketing:scout",
  "address":     "0x...",
  "bearer":      "sk_agent_...",   // returned ONCE; owner must provision to worker
  "kdf_version": 1
}
```

**Response 403:** caller is not the owner.
**Response 409:** uid already has an `agent_wallet` row (use `POST /api/agents/:uid/rotate`
for replacement — tracked in Gap 4).

---

### POST /api/agents/:uid/unlock

Agent-bearer authenticated. Returns the short-lived unlock token so the worker can
decrypt its own seed.

**Authentication:** agent bearer (`Authorization: Bearer sk_agent_...`).
**Role check:** validate bearer belongs to `uid` in path; 401 if mismatch or revoked.

**Request body:** empty (`{}`). The uid is in the path; identity is the bearer.

**Server flow:**
1. Validate agent bearer: resolve uid from bearer hash; confirm uid matches path param.
2. `SELECT ciphertext, iv, kdf_version FROM agent_wallet WHERE uid = :uid`.
3. Derive agent KEK: `agent_kek = await deriveAgentKEK(owner_prf, uid)`.
   - If PRF derivation is unavailable (owner Mac offline, WebAuthn timeout): return **503**.
   - `OWNER_OFFLINE_AFTER_MS` (default 5000) controls how long to wait before failing.
4. Verify the ciphertext can be decrypted (integrity check only; do not return the seed).
   If decryption fails: return 500 (corrupted D1 row — escalate to owner).
5. `expires_at = Math.floor(Date.now() / 1000) + 60`.
6. Build `sig_input = ciphertext_b64 + ":" + iv_b64 + ":" + kdf_version + ":" + expires_at + ":" + uid`.
7. `sig = ownerEd25519Keypair.sign(sig_input)`.
8. Return token.

**Response 200:**
```json
{
  "ciphertext_b64": "...",
  "iv_b64":         "...",
  "kdf_version":    1,
  "expires_at":     1714000860,
  "sig":            "..."
}
```

**Response 401:** bearer invalid or revoked. Worker must not retry; the key is gone.
**Response 503:** owner is offline (PRF unavailable). Worker must exponential-backoff and
retry. The response body is `{ "error": "owner_offline" }`.

503 is the canonical signal for "try again later." Workers MUST NOT proceed without a
successfully verified unlock token. Serving requests without a keypair is not an option.

---

## Worker Boot Path

```ts
async function bootAgent(uid: string, bearer: string): Promise<Ed25519Keypair> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://one.ie/api/agents/${uid}/unlock`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${bearer}` },
    })

    if (res.ok) {
      const token = await res.json() as UnlockToken

      // Reject expired tokens (clock skew or slow network)
      if (token.expires_at < Math.floor(Date.now() / 1000)) {
        throw new Error('unlock token expired (clock skew or network delay > 60s)')
      }

      // Verify owner signature before touching the ciphertext
      await verifyOwnerSig(token, uid)   // throws security:unlock:bad-sig if invalid

      // Decrypt ciphertext to recover the raw 32-byte seed
      const seed = await aesGcmUnwrap(token.ciphertext_b64, token.iv_b64, uid)

      // Build keypair; seed is discarded by GC after this frame
      return Ed25519Keypair.fromSecretKey(seed)
    }

    // 401 = revoked; do not retry
    if (res.status === 401) {
      throw new Error(`unlock rejected: bearer revoked for ${uid}`)
    }

    // Any non-503 unexpected status is a hard failure
    if (res.status !== 503) {
      throw new Error(`unlock failed: HTTP ${res.status} for ${uid}`)
    }

    // 503 = owner offline; backoff and retry
    const backoffMs = Math.min(60_000, 1_000 * Math.pow(2, attempt))
    await new Promise(r => setTimeout(r, backoffMs))
  }
}
```

`verifyOwnerSig` reconstructs `sig_input`, fetches the cached owner Ed25519 public key
(stored in worker env as `OWNER_PUBLIC_KEY`), and verifies using `crypto.subtle.verify`.
It emits `security:unlock:bad-sig` and throws on mismatch; does not fall through.

`aesGcmUnwrap` derives the agent KEK locally using the token fields (kdf_version gates
which HKDF info string to use), decrypts with `crypto.subtle.decrypt`, and returns the
raw seed bytes. It does not store the seed.

The worker holds only the `Ed25519Keypair` instance. The raw seed bytes are eligible for
garbage collection as soon as `fromSecretKey` returns. On CF Worker shutdown the keypair
is GC'd. Every cold start goes through this full sequence — there is no warm-start cache.

---

## Failure Modes

| Failure | Detection | Worker response | Recovery |
|---------|-----------|-----------------|----------|
| Owner offline at boot | `/unlock` returns 503 | Fail closed; return 503 on all endpoints; backoff retry (1s -> 2s -> 4s ... cap 60s) | Owner comes online -> next retry succeeds |
| Token expired between mint and use | `token.expires_at < now` | Refetch: call `/unlock` again immediately | Usually succeeds on retry; if not, treat as 503 and backoff |
| Token signature mismatch | `verifyOwnerSig` rejects | Emit `security:unlock:bad-sig`; treat as hard failure; do not retry the same token | Operator investigates; may indicate token interception or misconfiguration |
| Bearer revoked | `/unlock` returns 401 | Hard stop; do not retry | Owner must issue new bearer via `/api/agents/register-owner` and re-provision to worker env |
| Corrupted D1 row | `/unlock` returns 500 | Hard stop; emit alert | Owner must re-register agent: DELETE row, POST /api/agents/register-owner |
| KDF version mismatch | `kdf_version` in token does not match expected | Emit `security:unlock:kdf-version-mismatch`; hard stop | Gap 4 versioning tracks which KEK version to use; owner rotates as needed |

---

## Why Not a Long-Lived Agent Secret?

The naive alternative is to provision each agent with a long-lived `AGENT_KEY` env var
that it reads directly. Three problems with this:

1. **Rotation requires reprovisioning every worker.** Under the boot-unlock protocol,
   rotating a compromised key means the owner updates one D1 row and re-mints the bearer.
   The worker picks up the new key on its next cold start without any wrangler secret
   update.

2. **The seed never sits in worker persistent storage.** Any env var written to a worker
   can be read by anyone with `wrangler secret list` access. The boot-unlock protocol
   ensures the raw seed never touches worker storage — only the AES-GCM ciphertext is in
   D1, which is useless without the owner PRF.

3. **The owner is only online for cold starts, not for every request.** Once the keypair
   is loaded, requests run at worker speed with no per-request owner involvement. The
   owner machine serves unlock tokens only when a new cold start occurs. In production
   this is rare: CF Workers stay warm for minutes to hours. The operator needs to be
   available for deploys and failures, not for routine traffic.

---

## References

- `owner.md` §Bootstrap, §"Owner identity vs the consumer wallet"
  Full algebra for HKDF key derivation from the owner PRF; address registration flow.
- `owner-todo.md` §Gap 1 tasks `1.s3`, `1.s5`, `1.s6`, `1.s7`, `1.s8`
  Dependency chain: register endpoint -> this spec -> unlock endpoint -> worker boot ->
  boot-without-owner test.
- `migrations/0031_agent_wallet.sql`
  D1 schema: `agent_wallet (uid, ciphertext, iv, kdf_version, address, created_at,
  expires_at)`. `iv` is a separate column because AES-GCM requires a unique 12-byte nonce
  per encryption; co-locating it avoids coupling to a wire format.
- `src/lib/owner-key.ts`
  `deriveAgentKEK(prf, uid)` — HKDF-SHA256 with info `"agent-key:{uid}:v1"`; throws
  `OwnerOnlyCodePathError` if called inside a Cloudflare Worker runtime.
