-- ONE Substrate — D1 Schema
-- User secrets: AES-GCM encrypted API keys and tokens

-- Encrypted user secrets (OpenRouter, Telegram tokens, etc.)
CREATE TABLE IF NOT EXISTS user_secrets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  key_label TEXT NOT NULL,
  iv TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, key_label)
);

CREATE INDEX IF NOT EXISTS idx_user_secrets_user ON user_secrets(user_id);
