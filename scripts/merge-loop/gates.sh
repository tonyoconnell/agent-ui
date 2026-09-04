#!/usr/bin/env bash
# gates.sh — W4 gate script for the merge loop
# Runs all deterministic gates before allowing a cycle to proceed to G1.
#
# Usage:
#   bash scripts/merge-loop/gates.sh [--ratchet-min 0.40] [--translate <path>]
#
# Exit codes:
#   0 — all hard gates passed
#   2 — one or more hard gates failed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
RATCHET_MIN="0.40"
TRANSLATE_PATH=""

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ratchet-min)
      RATCHET_MIN="$2"
      shift 2
      ;;
    --translate)
      TRANSLATE_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
GATE1_STATUS="PASS"
GATE2_STATUS="PASS"
GATE3_STATUS="PASS"
GATE4_STATUS="PASS"

GATE1_DETAIL=""
GATE2_DETAIL=""
GATE3_DETAIL=""
GATE4_DETAIL=""

HARD_FAIL=0

# ---------------------------------------------------------------------------
# Gate 1 — Ratchet
# ---------------------------------------------------------------------------
RATCHET_FILE="$REPO_ROOT/.merge-loop/ratchet/ratchet.json"

if [[ ! -f "$RATCHET_FILE" ]]; then
  GATE1_STATUS="SKIP"
  GATE1_DETAIL="no ratchet.json (run ratchet.sh first)"
else
  # Extract the ratchet field value using pure bash + awk (no jq required)
  RATCHET_VAL=$(awk -F'"ratchet"[[:space:]]*:[[:space:]]*' 'NF>1{split($2,a,/[^0-9.]/); print a[1]}' "$RATCHET_FILE")

  if [[ -z "$RATCHET_VAL" ]]; then
    GATE1_STATUS="FAIL"
    GATE1_DETAIL="could not parse ratchet field from ratchet.json"
    HARD_FAIL=1
  else
    # Compare floats using awk
    PASS=$(awk -v val="$RATCHET_VAL" -v min="$RATCHET_MIN" 'BEGIN { print (val + 0 >= min + 0) ? "1" : "0" }')
    if [[ "$PASS" == "1" ]]; then
      GATE1_DETAIL="$RATCHET_VAL >= $RATCHET_MIN"
    else
      GATE1_STATUS="FAIL"
      GATE1_DETAIL="ratchet=${RATCHET_VAL} < threshold=${RATCHET_MIN}"
      HARD_FAIL=1
    fi
  fi
fi

# ---------------------------------------------------------------------------
# Gate 2 — Secrets (re-run on changed files)
# ---------------------------------------------------------------------------
CHANGED_TMP="/tmp/merge-changed.txt"
SECRETS_TMP="/tmp/merge-secrets.txt"

# Build list of changed/added files that still exist on disk
# Only scan imported files (skip trusted src/ — secrets there are env refs, not hardcoded)
git -C "$REPO_ROOT" diff --name-only HEAD 2>/dev/null | while read -r f; do
  [[ "$f" =~ ^src/ ]] && continue
  [[ -f "$REPO_ROOT/$f" ]] && echo "$REPO_ROOT/$f"
done > "$CHANGED_TMP"

SECRETS_COUNT=0

if [[ -s "$CHANGED_TMP" ]]; then
  SREG=$(cat "$SCRIPT_DIR/secrets.regex")
  : > "$SECRETS_TMP"
  while read -r f; do
    grep -lE "$SREG" "$f" 2>/dev/null >> "$SECRETS_TMP" || true
  done < "$CHANGED_TMP"

  if [[ -s "$SECRETS_TMP" ]]; then
    GATE2_STATUS="FAIL"
    GATE2_DETAIL="secrets detected in changed files"
    HARD_FAIL=1
  else
    SECRETS_COUNT=0
    GATE2_DETAIL="0 files"
  fi
else
  GATE2_DETAIL="0 files"
fi

# ---------------------------------------------------------------------------
# Gate 3 — TSC clean
# ---------------------------------------------------------------------------
cd "$REPO_ROOT"
TSC_RAW=$(npx tsc --noEmit 2>&1 || true)
TSC_ERRORS=$(echo "$TSC_RAW" | { grep "error TS" || true; } | wc -l | tr -d ' ')
TSC_ERRORS_TMP="/tmp/merge-tsc-errors.txt"
echo "$TSC_RAW" | grep "error TS" | head -15 > "$TSC_ERRORS_TMP" || true

if [[ "$TSC_ERRORS" -gt 0 ]]; then
  GATE3_STATUS="FAIL"
  GATE3_DETAIL="$TSC_ERRORS TypeScript errors"
  HARD_FAIL=1

  # Diagnose: are errors in imported/ files? Suggest translate.md fix.
  IMPORTED_ERRORS=$(grep -c "imported/" "$TSC_ERRORS_TMP" 2>/dev/null || echo 0)
  if [[ "$IMPORTED_ERRORS" -gt 0 ]]; then
    GATE3_DETAIL="${GATE3_DETAIL} (${IMPORTED_ERRORS} in imported/ — likely missing translate.md mappings)"
  fi
else
  GATE3_DETAIL="0 errors"
fi

# ---------------------------------------------------------------------------
# Gate 4 — No dead names in changed files (soft / warn only)
# ---------------------------------------------------------------------------
# (Gate 5 — Lighthouse — runs after Gate 4 below)
DEAD_NAMES_TMP="/tmp/merge-deadnames.txt"
: > "$DEAD_NAMES_TMP"

DEAD_NAMES_PATTERN="\\b(knowledge|connections|scent|alarm|colony)\\b"

if [[ -s "$CHANGED_TMP" ]]; then
  while read -r f; do
    [[ "$f" =~ \.(ts|tsx|md)$ ]] || continue
    grep -nE "$DEAD_NAMES_PATTERN" "$f" 2>/dev/null | head -3 >> "$DEAD_NAMES_TMP" || true
  done < "$CHANGED_TMP"
fi

if [[ -s "$DEAD_NAMES_TMP" ]]; then
  GATE4_STATUS="WARN"
  DEAD_COUNT=$(wc -l < "$DEAD_NAMES_TMP" | tr -d ' ')
  GATE4_DETAIL="${DEAD_COUNT} occurrences — fix before landing"
else
  GATE4_DETAIL="0 occurrences"
fi

# ---------------------------------------------------------------------------
# Gate 5 — Lighthouse scores (soft / warn — skips when server not running)
# ---------------------------------------------------------------------------
GATE5_STATUS="SKIP"
GATE5_DETAIL="no dev server"

if bash "$SCRIPT_DIR/lighthouse.sh" check 2>&1 | tee /tmp/merge-lh-check.txt | grep -q "LIGHTHOUSE SKIP"; then
  GATE5_STATUS="SKIP"
  GATE5_DETAIL="$(grep 'LIGHTHOUSE SKIP' /tmp/merge-lh-check.txt | sed 's/.*SKIP: //' | head -1)"
elif grep -q "Lighthouse FAIL" /tmp/merge-lh-check.txt; then
  GATE5_STATUS="WARN"
  DROP_COUNT=$(grep -c "FAIL  " /tmp/merge-lh-check.txt || true)
  GATE5_DETAIL="${DROP_COUNT} route/category scores dropped beyond threshold"
elif grep -q "Lighthouse PASS" /tmp/merge-lh-check.txt; then
  GATE5_STATUS="PASS"
  GATE5_DETAIL="all routes within threshold"
fi
rm -f /tmp/merge-lh-check.txt

# ---------------------------------------------------------------------------
# Print results
# ---------------------------------------------------------------------------
echo ""

if [[ "$GATE1_STATUS" == "SKIP" ]]; then
  printf "GATE 1 ratchet:    SKIP (%s)\n" "$GATE1_DETAIL"
elif [[ "$GATE1_STATUS" == "FAIL" ]]; then
  printf "GATE FAIL: %s\n" "$GATE1_DETAIL"
  printf "GATE 1 ratchet:    FAIL (%s)\n" "$GATE1_DETAIL"
else
  printf "GATE 1 ratchet:    PASS (%s)\n" "$GATE1_DETAIL"
fi

if [[ "$GATE2_STATUS" == "FAIL" ]]; then
  printf "GATE FAIL: secrets detected in changed files:\n"
  cat "$SECRETS_TMP"
  printf "GATE 2 secrets:    FAIL\n"
else
  printf "GATE 2 secrets:    PASS (%s)\n" "$GATE2_DETAIL"
fi

if [[ "$GATE3_STATUS" == "FAIL" ]]; then
  printf "GATE FAIL: %s\n" "$GATE3_DETAIL"
  printf "GATE 3 tsc:        FAIL (%s)\n" "$GATE3_DETAIL"
  if [[ -s "$TSC_ERRORS_TMP" ]]; then
    printf "\n  First errors:\n"
    while IFS= read -r line; do
      printf "    %s\n" "$line"
    done < "$TSC_ERRORS_TMP"
    printf "\n"
    # Hint: unresolved imports in imported/ → translate.md
    if grep -q "Cannot find module" "$TSC_ERRORS_TMP" 2>/dev/null; then
      printf "  Hint: 'Cannot find module' in imported/ files usually means a missing\n"
      printf "        translate.md mapping. Add the package under ## host_primitives:\n"
      grep -o "'[^']*'" "$TSC_ERRORS_TMP" | grep -v "^'\\.\\|^'@/" | sort -u | head -5 | while read -r pkg; do
        printf "        %s → TODO\n" "$pkg"
      done
      printf "\n"
    fi
  fi
else
  printf "GATE 3 tsc:        PASS (%s)\n" "$GATE3_DETAIL"
fi

if [[ "$GATE4_STATUS" == "WARN" ]]; then
  printf "GATE WARN: dead names found (fix before landing)\n"
  cat "$DEAD_NAMES_TMP"
  printf "GATE 4 dead-names: WARN (%s)\n" "$GATE4_DETAIL"
else
  printf "GATE 4 dead-names: PASS (%s)\n" "$GATE4_DETAIL"
fi

if [[ "$GATE5_STATUS" == "SKIP" ]]; then
  printf "GATE 5 lighthouse: SKIP (%s)\n" "$GATE5_DETAIL"
elif [[ "$GATE5_STATUS" == "WARN" ]]; then
  printf "GATE WARN: lighthouse scores dropped\n"
  printf "GATE 5 lighthouse: WARN (%s)\n" "$GATE5_DETAIL"
else
  printf "GATE 5 lighthouse: PASS (%s)\n" "$GATE5_DETAIL"
fi

echo ""

# ---------------------------------------------------------------------------
# Final verdict
# ---------------------------------------------------------------------------
if [[ "$HARD_FAIL" -ne 0 ]]; then
  echo "One or more hard gates failed. Fix before proceeding to G1."
  exit 2
fi

echo "All gates passed. Ready for G1."
exit 0
