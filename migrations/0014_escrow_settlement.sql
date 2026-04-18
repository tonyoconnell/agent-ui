-- Durable escrow settlement state — survives Cloudflare Worker restarts.
-- When a client funds an escrow and releases it on Sui, the settlement
-- must persist through the re-execution of the original hire request.

CREATE TABLE IF NOT EXISTS escrow_settlements (
  id                 TEXT PRIMARY KEY,          -- 'settle:${escrow_id}'
  escrow_id          TEXT NOT NULL UNIQUE,      -- Sui object ID
  tx_digest          TEXT NOT NULL,             -- Sui TX digest
  original_request   TEXT NOT NULL,             -- JSON: { buyer, provider, skillId, initialMessage, groupId, chatUrl? }
  status             TEXT NOT NULL,             -- 'pending' | 'settled' | 'failed'
  result_json        TEXT,                      -- null until settled; result of re-executed hire
  error_message      TEXT,                      -- null unless failed
  retry_count        INTEGER DEFAULT 0,
  created_at         INTEGER NOT NULL,
  settled_at         INTEGER,
  expires_at         INTEGER NOT NULL           -- Unix ms (24h after created)
);

CREATE INDEX IF NOT EXISTS idx_settlements_escrow_id ON escrow_settlements(escrow_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON escrow_settlements(status) WHERE status != 'settled';
CREATE INDEX IF NOT EXISTS idx_settlements_expires ON escrow_settlements(expires_at) WHERE status IN ('pending', 'failed');
