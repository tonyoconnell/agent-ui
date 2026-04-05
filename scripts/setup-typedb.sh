#!/bin/bash
#
# TypeDB Cloud Setup Script
# Run this to initialize the ONE world database
#

set -e

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "=== ONE TypeDB Setup ==="
echo ""
echo "TypeDB URL: ${TYPEDB_URL:-not set}"
echo "Database: ${TYPEDB_DATABASE:-one}"
echo ""

# Check if TypeDB CLI is available
if ! command -v typedb &> /dev/null; then
  echo "TypeDB CLI not found. Install with:"
  echo "  brew install typedb"
  echo "  or download from https://typedb.com/download"
  echo ""
  echo "Alternatively, use TypeDB Studio to:"
  echo "  1. Connect to: ${TYPEDB_URL}"
  echo "  2. Create database: ${TYPEDB_DATABASE:-one}"
  echo "  3. Load schema: src/schema/world.tql"
  echo "  4. Load seed: src/schema/seeds/marketing-team.tql"
  exit 1
fi

# Connect and setup
echo "Connecting to TypeDB Cloud..."

# Create database if needed
echo "Creating database '${TYPEDB_DATABASE:-one}'..."
typedb cloud database create ${TYPEDB_DATABASE:-one} \
  --cloud ${TYPEDB_URL} \
  --username ${TYPEDB_USERNAME:-admin} \
  --password ${TYPEDB_PASSWORD} \
  2>/dev/null || echo "Database may already exist"

# Load schema
echo "Loading world.tql schema..."
typedb cloud transaction ${TYPEDB_DATABASE:-one} schema write \
  --cloud ${TYPEDB_URL} \
  --username ${TYPEDB_USERNAME:-admin} \
  --password ${TYPEDB_PASSWORD} \
  --file src/schema/world.tql

echo "Schema loaded."

# Optionally load marketing seed
if [ "$1" == "--seed" ]; then
  echo "Loading marketing team seed..."
  typedb cloud transaction ${TYPEDB_DATABASE:-one} data write \
    --cloud ${TYPEDB_URL} \
    --username ${TYPEDB_USERNAME:-admin} \
    --password ${TYPEDB_PASSWORD} \
    --file src/schema/seeds/marketing-team.tql
  echo "Marketing team seeded."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Test with:"
echo "  curl -X POST http://localhost:4321/api/health"
echo ""
echo "Seed marketing team with:"
echo "  curl -X POST http://localhost:4321/api/seed/marketing"
