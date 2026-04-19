-- Response cache: store high-quality LLM replies keyed by (normalized_message + tags)
CREATE TABLE IF NOT EXISTS response_cache (
  hash TEXT PRIMARY KEY,
  tags TEXT NOT NULL,
  model TEXT NOT NULL,
  response TEXT NOT NULL,
  quality REAL NOT NULL,
  group_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Call log: track every LLM call for cost analysis
CREATE TABLE IF NOT EXISTS call_log (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  model TEXT NOT NULL,
  tags TEXT NOT NULL,
  tokens_est INTEGER,
  cost_est REAL,
  quality REAL,
  reason TEXT,
  latency_ms INTEGER,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_response_cache_expires ON response_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_call_log_group ON call_log(group_id, ts);
CREATE INDEX IF NOT EXISTS idx_call_log_model ON call_log(model, ts);
