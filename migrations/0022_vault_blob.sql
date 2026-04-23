-- ONE Substrate — D1 Schema
-- Vault cloud sync: one encrypted envelope per Better Auth user.
--
-- The blob carries vault meta (recovery sentinel, password hash, auto-lock
-- settings) plus every wallet record, encrypted under a key derived from the
-- vault master secret. The server stores ciphertext only — the master is
-- reachable only via the user's BIP-39 recovery phrase (or a device-local
-- passkey/password on an already-initialised device).
--
-- Restore flow: sign in → GET /api/vault/fetch → paste recovery phrase →
-- decrypt → seed IndexedDB → re-enroll passkey on this device.

CREATE TABLE IF NOT EXISTS vault_blob (
  user_id    TEXT PRIMARY KEY,
  blob       TEXT NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
