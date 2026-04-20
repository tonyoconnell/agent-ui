-- Developer custom domains (CF for SaaS)
CREATE TABLE IF NOT EXISTS developer_domains (
  id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  hostname TEXT NOT NULL UNIQUE,
  cf_hostname_id TEXT,
  ssl_status TEXT DEFAULT 'pending',
  active INTEGER DEFAULT 1,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_developer_domains_key ON developer_domains (key_id);
CREATE INDEX IF NOT EXISTS idx_developer_domains_uid ON developer_domains (uid);
