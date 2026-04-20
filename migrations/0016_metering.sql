-- Migration: 0016_metering
-- Platform BaaS metering + tier enforcement (TODO platform-baas cycle 1, T-B1-08).
--
-- Three tables track per-developer usage:
--   meter             — monthly API call count per key
--   developer_agents  — agent registrations per key (for tier agent cap)
--   developer_tiers   — tier assignment per user (free|builder|scale|world|enterprise)
--
-- Tier values here intentionally differ from `tenants.tier` (starter|growth|enterprise).
-- This table is the developer BaaS tier axis; tenants is the world tenancy axis.
-- Cycle 4 (T-B4-03) reconciles them.
--
-- Migration 0015 slot is already used by 0015_claw_patterns.sql; metering moved to 0016.

CREATE TABLE IF NOT EXISTS meter (
  key_id  TEXT NOT NULL,
  month   TEXT NOT NULL,              -- "YYYY-MM" (UTC)
  calls   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_id, month)
);

CREATE INDEX IF NOT EXISTS idx_meter_key_id ON meter(key_id);

CREATE TABLE IF NOT EXISTS developer_agents (
  key_id      TEXT NOT NULL,
  uid         TEXT NOT NULL,
  created_at  INTEGER NOT NULL,       -- unixepoch() seconds
  PRIMARY KEY (key_id, uid)
);

CREATE INDEX IF NOT EXISTS idx_developer_agents_key ON developer_agents(key_id);

CREATE TABLE IF NOT EXISTS developer_tiers (
  user_id     TEXT PRIMARY KEY,
  tier        TEXT NOT NULL DEFAULT 'free',   -- free | builder | scale | world | enterprise
  updated_at  INTEGER NOT NULL                -- unixepoch() seconds
);
