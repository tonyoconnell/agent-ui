-- ONE Substrate — D1 Schema
-- Wallet backups: server-held largeBlob fallback ciphertext (AES-GCM)

-- Stores one ciphertext per (user_id, cred_id) — upsert on conflict.
-- Written atomically with passkey largeBlob write when largeBlob is unavailable
-- (e.g. Firefox). The server copy is a fallback; the canonical copy lives in
-- largeBlob. Version column reserved for future envelope schema changes.
CREATE TABLE IF NOT EXISTS wallet_backups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  cred_id TEXT NOT NULL,
  iv TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, cred_id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_backups_user ON wallet_backups(user_id);
