#!/usr/bin/env bash
# bootstrap.sh — Create database, load schema, seed data
# Usage: npm run bootstrap

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA="$ROOT/src/schema/one.tql"
SEEDS_DIR="$ROOT/src/schema/seeds"

# Load .env if present
if [ -f "$ROOT/.env" ]; then
  set -a
  source "$ROOT/.env"
  set +a
fi

DB="${TYPEDB_DATABASE:-envelopes}"
ADDR="${TYPEDB_ADDRESS:-localhost:1729}"

echo "=== Envelope System Bootstrap ==="
echo "TypeDB: $ADDR"
echo "Database: $DB"
echo ""

# ── Check TypeDB is running ──────────────────────────────────────────────────

if ! command -v typedb &>/dev/null; then
  echo "Error: typedb CLI not found. Install TypeDB 3.x first."
  echo "  https://typedb.com/docs/home/install"
  exit 1
fi

if ! typedb console --address "$ADDR" --command "database list" &>/dev/null; then
  echo "Error: Cannot connect to TypeDB at $ADDR"
  echo "  Start it with: typedb server"
  exit 1
fi

echo "TypeDB: connected"

# ── Create database if needed ────────────────────────────────────────────────

EXISTING=$(typedb console --address "$ADDR" --command "database list" 2>/dev/null)

if echo "$EXISTING" | grep -q "$DB"; then
  echo "Database '$DB': exists"
else
  echo "Creating database '$DB'..."
  typedb console --address "$ADDR" --command "database create $DB"
  echo "Database '$DB': created"
fi

# ── Load schema ──────────────────────────────────────────────────────────────

if [ ! -f "$SCHEMA" ]; then
  echo "Error: Schema not found at $SCHEMA"
  exit 1
fi

echo "Loading schema..."
typedb console --address "$ADDR" --command "transaction $DB schema write" \
  --command "source $SCHEMA" \
  --command "commit"
echo "Schema: loaded"

# ── Load seed data ───────────────────────────────────────────────────────────

if [ -d "$SEEDS_DIR" ]; then
  SEED_FILES=$(find "$SEEDS_DIR" -name '*.tql' -type f 2>/dev/null | sort)
  if [ -n "$SEED_FILES" ]; then
    echo ""
    echo "Loading seed data..."
    for seed in $SEED_FILES; do
      NAME=$(basename "$seed")
      echo "  Seeding: $NAME"
      typedb console --address "$ADDR" --command "transaction $DB data write" \
        --command "source $seed" \
        --command "commit"
    done
    echo "Seeds: loaded"
  fi
fi

echo ""
echo "=== Bootstrap complete ==="
echo "Run: npm run dev"
