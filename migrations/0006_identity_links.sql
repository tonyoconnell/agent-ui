-- Cross-channel identity linking
-- Maps (channel, sender_id) → stable canonical_uid
-- Populated by the /link claim ceremony:
--   user types /link <nonce> in Telegram after generating nonce via POST /claim on web
CREATE TABLE IF NOT EXISTS identity_links (
  channel       TEXT    NOT NULL,
  sender_id     TEXT    NOT NULL,
  canonical_uid TEXT    NOT NULL,
  linked_at     INTEGER NOT NULL,
  PRIMARY KEY (channel, sender_id)
);
