#!/usr/bin/env bash
set -euo pipefail

# C3 DOGFOOD — pack all 4 packages, install from tarballs in /tmp, assert they work
# Usage: bash scripts/dogfood-local.sh [--clean]
# Artifacts preserved in /tmp/dogfood-toolkit/ on success for inspection.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOGFOOD_DIR="/tmp/dogfood-toolkit"
LOG_FILE="$DOGFOOD_DIR/dogfood.log"
PASS=0
FAIL=0

log() { echo "[dogfood] $*" | tee -a "$LOG_FILE"; }
ok()  { log "✓ $*"; PASS=$((PASS+1)); }
err() { log "✗ $*"; FAIL=$((FAIL+1)); }

# Cleanup only on failure (keep on success for inspection)
on_err() {
  log "FAILED at line $1 — artifacts preserved in $DOGFOOD_DIR"
  log "PASS=$PASS FAIL=$FAIL"
  exit 1
}
trap 'on_err $LINENO' ERR

# --clean: wipe previous run
if [[ "${1:-}" == "--clean" ]]; then
  rm -rf "$DOGFOOD_DIR"
fi
mkdir -p "$DOGFOOD_DIR"
: > "$LOG_FILE"

log "=== C3 DOGFOOD LOCAL ==="
log "repo=$REPO_ROOT  dir=$DOGFOOD_DIR"
log "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# ─── Step 1: Pack all 4 packages ─────────────────────────────────────────────
log ""
log "── Step 1: npm pack ×4"
cd "$REPO_ROOT"

CLI_TGZ=$(npm pack --workspace cli --pack-destination "$DOGFOOD_DIR" 2>&1 | tail -1)
SDK_TGZ=$(npm pack --workspace packages/sdk --pack-destination "$DOGFOOD_DIR" 2>&1 | tail -1)
MCP_TGZ=$(npm pack --workspace packages/mcp --pack-destination "$DOGFOOD_DIR" 2>&1 | tail -1)
TPL_TGZ=$(npm pack --workspace packages/templates --pack-destination "$DOGFOOD_DIR" 2>&1 | tail -1)

# Resolve just the filename from potentially full paths
CLI_TGZ=$(basename "$CLI_TGZ")
SDK_TGZ=$(basename "$SDK_TGZ")
MCP_TGZ=$(basename "$MCP_TGZ")
TPL_TGZ=$(basename "$TPL_TGZ")

log "cli:       $CLI_TGZ"
log "sdk:       $SDK_TGZ"
log "mcp:       $MCP_TGZ"
log "templates: $TPL_TGZ"

# ─── Step 2: Install tarballs ─────────────────────────────────────────────────
log ""
log "── Step 2: npm install tarballs → $DOGFOOD_DIR"
cd "$DOGFOOD_DIR"
cat > package.json << 'PKGJSON'
{"name":"dogfood-toolkit","version":"0.0.0","private":true,"type":"module"}
PKGJSON

T0=$SECONDS
npm install --no-save \
  "$DOGFOOD_DIR/$CLI_TGZ" \
  "$DOGFOOD_DIR/$SDK_TGZ" \
  "$DOGFOOD_DIR/$MCP_TGZ" \
  "$DOGFOOD_DIR/$TPL_TGZ" \
  >> "$LOG_FILE" 2>&1
INSTALL_S=$((SECONDS-T0))
ok "install completed in ${INSTALL_S}s"

# Assert all 4 are in node_modules
for pkg in oneie @oneie/sdk @oneie/mcp @oneie/templates; do
  if [[ -d "$DOGFOOD_DIR/node_modules/$pkg" ]]; then
    ok "node_modules/$pkg present"
  else
    err "node_modules/$pkg MISSING"
  fi
done

# ─── Step 3: Assert oneie CLI binary ─────────────────────────────────────────
log ""
log "── Step 3: oneie CLI binary"
ONEIE_BIN="$DOGFOOD_DIR/node_modules/.bin/oneie"

if [[ ! -x "$ONEIE_BIN" ]]; then
  err "oneie binary not found at $ONEIE_BIN"
else
  ONEIE_VER=$("$ONEIE_BIN" --version 2>&1 | head -1 || true)
  ok "oneie --version → $ONEIE_VER"

  VERB_COUNT=$("$ONEIE_BIN" --help 2>&1 | grep -c '^\s*[a-z]' || true)
  if [[ "$VERB_COUNT" -ge 17 ]]; then
    ok "oneie --help enumerates $VERB_COUNT verbs (≥17)"
  else
    err "oneie --help only shows $VERB_COUNT verbs (need ≥17)"
  fi
fi

# ─── Step 4: SubstrateClient live test ───────────────────────────────────────
log ""
log "── Step 4: SubstrateClient → localhost:4321"

# Check dev server is up
if curl -sf --max-time 5 -o /dev/null http://localhost:4321/ 2>/dev/null; then
  ok "dev server reachable"
  DOGFOOD_DIR="$DOGFOOD_DIR" node "$REPO_ROOT/scripts/smoke-tests/test-substrate-client-live.mjs" \
    >> "$LOG_FILE" 2>&1 \
    && ok "test-substrate-client-live.mjs exit 0" \
    || err "test-substrate-client-live.mjs FAILED"
else
  err "dev server not reachable at localhost:4321 — skipping SubstrateClient live test"
fi

# ─── Step 5: Templates live test ─────────────────────────────────────────────
log ""
log "── Step 5: @oneie/templates from installed package"
DOGFOOD_DIR="$DOGFOOD_DIR" node "$REPO_ROOT/scripts/smoke-tests/test-templates-live.mjs" \
  >> "$LOG_FILE" 2>&1 \
  && ok "test-templates-live.mjs exit 0" \
  || err "test-templates-live.mjs FAILED"

# ─── Step 6: Emit toolkit-verified-local signal ──────────────────────────────
log ""
log "── Step 6: emit toolkit-verified-local signal"
SIGNAL_BODY=$(cat <<SIGEOF
{"receiver":"substrate:toolkit-verified-local","data":{"tags":["toolkit","dogfood","local"],"content":{"cliVersion":"${ONEIE_VER:-unknown}","pass":$PASS,"fail":$FAIL,"installS":$INSTALL_S}}}
SIGEOF
)
curl -sf --max-time 5 -X POST http://localhost:4321/api/signal \
  -H "Content-Type: application/json" \
  -d "$SIGNAL_BODY" >> "$LOG_FILE" 2>&1 \
  && ok "toolkit-verified-local signal emitted" \
  || log "signal emit skipped (non-fatal)"

# ─── Summary ─────────────────────────────────────────────────────────────────
log ""
log "=== SUMMARY ==="
log "PASS=$PASS  FAIL=$FAIL"
log "Log: $LOG_FILE"
log "Artifacts: $DOGFOOD_DIR"

if [[ "$FAIL" -gt 0 ]]; then
  log "RESULT: FAILED"
  exit 1
fi
log "RESULT: SUCCESS"
