-- Stage 12: Subscribe — operational subscription table
-- Stores reverse tag edges (uid subscribes to tag) with scope control.
-- scope: 'private' (shared-group senders only) | 'public' (any world member)
-- Routing resolution in Cycle 2; this table is the declaration store.
CREATE TABLE IF NOT EXISTS subscriptions (
  uid        TEXT    NOT NULL,
  tag        TEXT    NOT NULL,
  scope      TEXT    NOT NULL DEFAULT 'public',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (uid, tag)
);
-- Fast lookup: "who subscribes to tag X?"
CREATE INDEX IF NOT EXISTS idx_subscriptions_tag ON subscriptions(tag, scope);
