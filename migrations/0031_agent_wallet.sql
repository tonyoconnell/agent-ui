-- 0031_agent_wallet.sql — owner-todo Gap 1
--
-- Per-agent encrypted seed storage. Replaces the SUI_SEED || uid
-- derivation pattern (which was stripped from production secrets in
-- sys-201 — see comments in src/lib/pay/chains/_derive.ts and
-- src/pages/api/auth/agent.ts). Now: each agent gets a fresh random
-- 32-byte seed wrapped under the owner's WebAuthn PRF KEK.
--
-- Lifecycle:
--   spawn:   POST /api/agents/register (owner-only) →
--            randomBytes(32) → AES-GCM-wrap under HKDF(owner_prf,
--            "agent-key:{uid}:v1") → INSERT row → return public address.
--   boot:    Worker fetches ciphertext → POST /api/agents/:uid/unlock
--            with its bearer → owner returns short-lived AES-GCM unlock
--            token → worker decrypts ciphertext → holds seed in process
--            memory only.
--   rotate:  Owner re-mints by replacing the row with a new ciphertext
--            (Gap 4 adds versioning columns to support cutover windows).
--
-- Why iv as a separate column: AES-GCM requires a unique 12-byte nonce
-- per encryption with the same key. Storing iv alongside ciphertext
-- lets us decrypt without coupling to a particular wire format.
--
-- address is denormalized for indexing — it's also the public component
-- of the seed and would be reproducible from the seed at decrypt time,
-- but keeping it here lets boot-time lookups by-address be O(log n).

CREATE TABLE IF NOT EXISTS agent_wallet (
  uid          TEXT PRIMARY KEY,             -- agent uid (e.g. "marketing:scout")
  ciphertext   BLOB NOT NULL,                -- AES-GCM(agent_seed, agent_kek)
  iv           BLOB NOT NULL,                -- AES-GCM nonce (12 bytes)
  kdf_version  INTEGER NOT NULL DEFAULT 1,   -- KEK derivation version (Gap 4 will bump)
  address      TEXT NOT NULL,                -- Sui address derived from agent_seed (public, indexable)
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at   INTEGER                       -- optional sunset epoch; NULL = no expiry
);

CREATE INDEX IF NOT EXISTS idx_agent_wallet_address ON agent_wallet(address);
CREATE INDEX IF NOT EXISTS idx_agent_wallet_expires ON agent_wallet(expires_at)
  WHERE expires_at IS NOT NULL;
