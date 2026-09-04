#!/usr/bin/env bash
# lighthouse.sh — Lighthouse score gate for the merge loop
# Captures baseline scores; checks for regressions after landing.
# Skips gracefully when no server is reachable (never hard-blocks).
#
# Usage:
#   bash scripts/merge-loop/lighthouse.sh snapshot [--url http://localhost:4321] [--routes /,/chat,/agents]
#   bash scripts/merge-loop/lighthouse.sh check    [--url http://localhost:4321] [--max-drop 2]
#
# Exit codes:
#   0  pass / skipped
#   2  scores dropped beyond --max-drop threshold

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LH_DIR="$REPO_ROOT/.merge-loop/lighthouse"
mkdir -p "$LH_DIR"

cmd="${1:-}"; shift || true

BASE_URL="http://localhost:4321"
MAX_DROP=2
ROUTES_CSV="/, /chat, /agents"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)      BASE_URL="$2"; shift 2 ;;
    --routes)   ROUTES_CSV="$2"; shift 2 ;;
    --max-drop) MAX_DROP="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

# Split routes CSV into array
IFS=',' read -ra ROUTES <<< "$ROUTES_CSV"

# ── Check lighthouse is available ─────────────────────────────────────────────
if ! command -v lighthouse &>/dev/null; then
  if ! npx lighthouse --version &>/dev/null 2>&1; then
    echo "  LIGHTHOUSE SKIP: not installed (npm install -g lighthouse to enable)"
    exit 0
  fi
  LH_CMD="npx lighthouse"
else
  LH_CMD="lighthouse"
fi

# ── Check server is reachable ─────────────────────────────────────────────────
if ! curl -sf --max-time 3 "${BASE_URL}" >/dev/null 2>&1; then
  echo "  LIGHTHOUSE SKIP: server not reachable at ${BASE_URL}"
  echo "  (start dev server with: npx astro dev)"
  exit 0
fi

# ── Run lighthouse on one URL, extract category scores ───────────────────────
run_lh() {
  local url="$1"
  local out_json="$2"
  $LH_CMD "$url" \
    --output=json \
    --output-path="$out_json" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --only-categories=performance,accessibility,best-practices,seo \
    --quiet 2>/dev/null || true
}

extract_scores() {
  local json_file="$1"
  python3 - "$json_file" <<'PYEOF'
import json, sys
with open(sys.argv[1]) as f:
  d = json.load(f)
cats = d.get('categories', {})
out = {k: round(v['score'] * 100) for k, v in cats.items()}
print(json.dumps(out))
PYEOF
}

# ── snapshot command ──────────────────────────────────────────────────────────
if [[ "$cmd" == "snapshot" ]]; then
  echo "Lighthouse snapshot on ${#ROUTES[@]} routes (${BASE_URL})..."
  declare -A SCORE_MAP

  for route in "${ROUTES[@]}"; do
    route="$(echo "$route" | xargs)"  # trim whitespace
    slug="$(echo "$route" | tr '/' '_' | sed 's/^_/root/')"
    [[ -z "$slug" ]] && slug="root"
    tmp="$(mktemp "/tmp/lh-snap-${slug}.XXXXXX.json")"

    run_lh "${BASE_URL}${route}" "$tmp"

    if [[ -s "$tmp" ]]; then
      scores="$(extract_scores "$tmp")"
      SCORE_MAP["$route"]="$scores"
      echo "  ${route}: ${scores}"
    else
      echo "  ${route}: SKIP (lighthouse returned no output)"
    fi
    rm -f "$tmp"
  done

  # Write combined baseline JSON
  python3 - "$LH_DIR/baseline.json" <<PYEOF
import json, sys

baseline = {}
PYEOF

  # Build JSON via python with the captured scores
  {
    echo '{'
    sep=""
    for route in "${ROUTES[@]}"; do
      route="$(echo "$route" | xargs)"
      scores="${SCORE_MAP[$route]:-null}"
      printf '%s  %s: %s' "$sep" "$(python3 -c "import json; print(json.dumps('$route'))")" "$scores"
      sep=","$'\n'
    done
    echo ''
    echo '}'
  } > "$LH_DIR/baseline.json"

  echo "  Baseline saved: $LH_DIR/baseline.json"
  exit 0
fi

# ── check command ─────────────────────────────────────────────────────────────
if [[ "$cmd" == "check" ]]; then
  if [[ ! -f "$LH_DIR/baseline.json" ]]; then
    echo "  LIGHTHOUSE SKIP: no baseline.json — run 'lighthouse.sh snapshot' first"
    exit 0
  fi

  echo "Lighthouse check — max allowed drop: ${MAX_DROP} points"
  HARD_FAIL=0

  for route in "${ROUTES[@]}"; do
    route="$(echo "$route" | xargs)"
    slug="$(echo "$route" | tr '/' '_' | sed 's/^_/root/')"
    [[ -z "$slug" ]] && slug="root"
    tmp="$(mktemp "/tmp/lh-check-${slug}.XXXXXX.json")"

    run_lh "${BASE_URL}${route}" "$tmp"

    if [[ ! -s "$tmp" ]]; then
      echo "  ${route}: SKIP (no output)"
      rm -f "$tmp"
      continue
    fi

    # Compare against baseline
    python3 - "$LH_DIR/baseline.json" "$tmp" "$route" "$MAX_DROP" <<'PYEOF'
import json, sys

baseline_file, current_file, route, max_drop_str = sys.argv[1:]
max_drop = int(max_drop_str)

with open(baseline_file) as f:
  baseline = json.load(f)
with open(current_file) as f:
  current_data = json.load(f)

baseline_route = baseline.get(route, {})
if not isinstance(baseline_route, dict):
  print(f"  {route}: SKIP (no baseline for this route)")
  sys.exit(0)

current_cats = current_data.get('categories', {})
current_scores = {k: round(v['score'] * 100) for k, v in current_cats.items()}

failed = False
for cat, cur in current_scores.items():
  base = baseline_route.get(cat, cur)
  drop = base - cur
  if drop > max_drop:
    print(f"  FAIL  {route} {cat}: {base} → {cur}  (dropped {drop})")
    failed = True
  elif drop > 0:
    print(f"  WARN  {route} {cat}: {base} → {cur}  (drop: {drop})")
  else:
    gained = cur - base
    arrow = f" (+{gained})" if gained > 0 else ""
    print(f"  ✓     {route} {cat}: {cur}{arrow}")

if failed:
  sys.exit(1)
PYEOF
    result=$?
    [[ $result -ne 0 ]] && HARD_FAIL=1
    rm -f "$tmp"
  done

  echo ""
  if [[ $HARD_FAIL -ne 0 ]]; then
    echo "Lighthouse FAIL: one or more scores dropped > ${MAX_DROP} points"
    exit 2
  fi
  echo "Lighthouse PASS"
  exit 0
fi

echo "Usage: lighthouse.sh snapshot|check [--url URL] [--routes /,/chat] [--max-drop N]" >&2
exit 1
