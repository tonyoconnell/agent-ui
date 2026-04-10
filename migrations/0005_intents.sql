-- Intent registry: canonical names seeded from button config
CREATE TABLE IF NOT EXISTS intents (
  name        TEXT PRIMARY KEY,    -- 'refund-policy'
  label       TEXT NOT NULL,       -- 'Return Policy' (button label)
  keywords    TEXT NOT NULL,       -- JSON: ["return","refund","money back","exchange"]
  examples    TEXT,                -- JSON: typed queries that mapped here (auto-learning)
  hit_count   INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intents_hits ON intents(hit_count DESC);

-- Typed query log: what did users actually type?
CREATE TABLE IF NOT EXISTS intent_queries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  raw         TEXT NOT NULL,       -- "how do I return this"
  intent      TEXT,                -- 'refund-policy' (null if unknown)
  resolver    TEXT,                -- 'keyword' | 'typedb' | 'llm' | 'unknown'
  cached      INTEGER DEFAULT 0,   -- 1 if cache hit after resolution
  ts          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_queries_intent ON intent_queries(intent, ts);
CREATE INDEX IF NOT EXISTS idx_queries_unknown ON intent_queries(intent, ts)
  WHERE intent IS NULL;
