-- Durable ask() state — survives Cloudflare Worker restarts.
-- When a human takes minutes/hours to respond, the pending ask
-- lives here instead of in-memory so it survives isolate recycling.
CREATE TABLE IF NOT EXISTS pending_asks (
  id          TEXT PRIMARY KEY,       -- 'ask:uuid'
  signal_json TEXT NOT NULL,          -- Signal serialised as JSON
  from_unit   TEXT NOT NULL,
  expires_at  INTEGER NOT NULL,       -- Unix ms
  resolved    INTEGER DEFAULT 0,      -- 0 = pending, 1 = resolved
  result_json TEXT,                   -- null until resolved
  channel     TEXT,                   -- 'telegram' | 'discord' | 'webhook'
  channel_id  TEXT,                   -- Telegram chat_id / Discord channel ID
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_asks_expires ON pending_asks(expires_at) WHERE resolved = 0;
CREATE INDEX IF NOT EXISTS idx_asks_channel ON pending_asks(channel, channel_id) WHERE resolved = 0;
