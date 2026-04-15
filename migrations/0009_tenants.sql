-- Migration: 0009_tenants
-- Premium world tenancy table
-- Tracks provisioned branded worlds and their billing tier.

CREATE TABLE IF NOT EXISTS tenants (
  gid             TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  brand           TEXT NOT NULL,
  tier            TEXT NOT NULL DEFAULT 'starter',   -- starter | growth | enterprise
  price_per_month INTEGER NOT NULL DEFAULT 499,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_brand  ON tenants(brand);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);

-- Seed: OO Agency as anchor tenant #1
INSERT OR IGNORE INTO tenants (gid, name, brand, tier, price_per_month, active, created_at)
VALUES (
  'world:oo-agency',
  'OO Agency',
  'oo-agency',
  'growth',
  1999,
  1,
  1744761600000
);
