-- 0034_owner_pubkeys.sql — Federation V4
--
-- Owner public keys (COSE format) published via /.well-known/owner-pubkey.json
-- for federation peers to verify bridge handshake assertions.
--
-- Replaces the env-var OWNER_PUBKEYS_JSON path from V2.2: D1-backed lets
-- operators add/remove keys without a redeploy.
--
-- Key lifecycle:
--   register   → row inserted with revoked_at = NULL (active)
--   revoke     → revoked_at = unixepoch() (append-only soft delete)
--
-- Schema is intentionally append-only: hard deletes are forbidden so the
-- audit trail survives. The well-known endpoint filters WHERE revoked_at IS NULL.

CREATE TABLE IF NOT EXISTS owner_pubkeys (
  cred_id        TEXT PRIMARY KEY,              -- base64url WebAuthn credential ID
  pub_key        TEXT NOT NULL,                 -- base64url COSE public key bytes
  alg            TEXT NOT NULL DEFAULT 'ES256', -- COSE algorithm name (informational)
  registered_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  revoked_at     INTEGER,                       -- nullable; set on revoke (soft delete)
  CHECK (alg IN ('ES256', 'EdDSA', 'RS256'))
);

CREATE INDEX IF NOT EXISTS idx_owner_pubkeys_active ON owner_pubkeys(revoked_at) WHERE revoked_at IS NULL;
