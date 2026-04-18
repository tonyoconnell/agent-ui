#!/usr/bin/env bash
set -euo pipefail

# C5 CONSUME — install oneie@3.7.0 globally from npm, run consume script
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[consume-sh] Step 1: install oneie@3.7.0 + @oneie/* globally from npm"
npm install -g oneie@3.7.0 @oneie/sdk@0.2.0 @oneie/mcp@0.1.0 @oneie/templates@0.2.0

echo "[consume-sh] Step 2: verify oneie --version"
ONEIE_VER=$(oneie --version 2>&1 | head -1 || true)
echo "[consume-sh] oneie: $ONEIE_VER"

echo "[consume-sh] Step 3: run consume-published.mjs"
node "$REPO_ROOT/scripts/consume-published.mjs"

echo "[consume-sh] DONE"
