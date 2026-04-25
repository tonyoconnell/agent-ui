-- ONE Substrate — D1 Schema
-- Vault passkey sign-in hints.
--
-- One row per cred_id. Stores WebAuthn credential public key + sign_count
-- for server-side assertion verification only (@simplewebauthn/server).
--
-- PRF-first architecture: the master key is derived entirely client-side
-- from the passkey's PRF output — HKDF(PRF, "one.ie/vault/master/v2").
-- The server stores NO cryptographic secrets. wrapped_master is kept as a
-- nullable column for legacy row compatibility only.

CREATE TABLE IF NOT EXISTS vault_passkey_hints (
  cred_id        TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  pub_key        TEXT NOT NULL,
  sign_count     INTEGER NOT NULL DEFAULT 0,
  wrapped_master TEXT,
  label          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_vault_passkey_hints_user ON vault_passkey_hints(user_id);
