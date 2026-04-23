-- ONE Substrate — D1 Schema
-- Vault passkey sign-in + cross-device restore.
--
-- One row per (user_id, cred_id). Stores:
--   - WebAuthn credential public key + sign_count for server-side assertion
--     verification (via @simplewebauthn/server).
--   - A wrapping of the vault master key produced by the client using a
--     GLOBAL PRF salt (so any device that can authenticate this passkey can
--     re-derive the wrapping key and unwrap the master).
--
-- Nothing in this table is secret: the wrapped master is AES-GCM ciphertext
-- under a key derivable only with the physical authenticator's PRF output.

CREATE TABLE IF NOT EXISTS vault_passkey_hints (
  cred_id        TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  pub_key        TEXT NOT NULL,
  sign_count     INTEGER NOT NULL DEFAULT 0,
  wrapped_master TEXT NOT NULL,
  label          TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_vault_passkey_hints_user ON vault_passkey_hints(user_id);
