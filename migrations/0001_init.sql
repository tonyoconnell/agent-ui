-- ONE Substrate — D1 Schema
-- Signal history, messages, tasks, sync metadata

-- Signal history
CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender TEXT NOT NULL,
  receiver TEXT NOT NULL,
  data TEXT,
  success INTEGER,
  latency_ms INTEGER,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_ts ON signals(ts);
CREATE INDEX IF NOT EXISTS idx_signals_sender ON signals(sender, ts);
CREATE INDEX IF NOT EXISTS idx_signals_receiver ON signals(receiver, ts);

-- Message history (for NanoClaw agents)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_group ON messages(group_id, ts);

-- Scheduled tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  cron TEXT NOT NULL,
  prompt TEXT NOT NULL,
  next_run INTEGER,
  enabled INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_tasks_next ON tasks(next_run) WHERE enabled = 1;

-- Sync metadata
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_type TEXT NOT NULL,
  record_count INTEGER,
  ts INTEGER NOT NULL
);
