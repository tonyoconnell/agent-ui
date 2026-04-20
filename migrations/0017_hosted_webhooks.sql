-- Migration: 0017_hosted_webhooks
-- Platform BaaS: hosted webhooks for developers (T-B2-07, platform-baas-todo.md).
-- ONE handles Telegram/Discord webhooks on behalf of Scale+ developers.

CREATE TABLE IF NOT EXISTS developer_webhooks (
  id          TEXT PRIMARY KEY,              -- "wh_<keyId>_<ts36>"
  key_id      TEXT NOT NULL,
  uid         TEXT NOT NULL,                 -- agent uid this webhook routes to
  channel     TEXT NOT NULL DEFAULT 'telegram',  -- telegram | discord | web
  channel_id  TEXT NOT NULL,                -- bot token or "guild:channel" id
  webhook_url TEXT NOT NULL,                -- the URL ONE provides to the channel
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL              -- unixepoch() seconds
);

CREATE INDEX IF NOT EXISTS idx_developer_webhooks_key ON developer_webhooks(key_id);
CREATE INDEX IF NOT EXISTS idx_developer_webhooks_uid ON developer_webhooks(uid);
