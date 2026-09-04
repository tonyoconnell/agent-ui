#!/usr/bin/env bash
# compress.sh — COMPRESS stage of the merge loop
# Runs AFTER a feature lands, finds what the new code made obsolete, removes it.
# Three deterministic sweeps: S1 orphaned exports, S2 AST hash duplicates, S3 TSC dead locals.
#
# Usage:
#   bash scripts/merge-loop/compress.sh [--dry-run] [--report <path>]

set -euo pipefail

# ─── args ────────────────────────────────────────────────────────────────────
DRY_RUN=false
REPORT_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)   DRY_RUN=true; shift ;;
    --report)    REPORT_PATH="$2"; shift 2 ;;
    *)           echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

# ─── resolve repo root ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC_DIR="$REPO_ROOT/src"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "ERROR: src/ not found at $SRC_DIR" >&2
  exit 1
fi

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# ─── tmp files ───────────────────────────────────────────────────────────────
ORPHANS_TMP="$(mktemp /tmp/compress-orphans.XXXXXX)"
DUPES_TMP="$(mktemp /tmp/compress-dupes.XXXXXX)"
DEAD_TMP="$(mktemp /tmp/compress-dead.XXXXXX)"
trap 'rm -f "$ORPHANS_TMP" "$DUPES_TMP" "$DEAD_TMP"' EXIT

# ─── S1: Orphaned exports ─────────────────────────────────────────────────────
# Find TypeScript exports defined in src/ but not imported anywhere in src/.
# Skips .d.ts files.
s1_orphans() {
  local sym file line count

  # Build a list of (symbol, file, line) tuples from export declarations.
  # Pattern matches: export (function|const|class|interface|type|enum) Name
  while IFS=: read -r file line decl; do
    # skip declaration files
    [[ "$file" == *.d.ts ]] && continue
    sym="$(echo "$decl" | sed -E 's/.*export (async )?(function|const|class|interface|type|enum) ([A-Za-z_][A-Za-z0-9_]*).*/\3/')"
    [[ -z "$sym" || "$sym" == "$decl" ]] && continue   # sed produced no match

    count=$(grep -r --include="*.ts" --include="*.tsx" \
              --exclude="*.d.ts" \
              -l "\\b${sym}\\b" "$SRC_DIR" 2>/dev/null \
            | grep -v "^${file}$" \
            | wc -l | tr -d ' ')

    if [[ "$count" -eq 0 ]]; then
      echo "${file}:${line}:${sym}"
    fi
  done < <(
    grep -rn \
      --include="*.ts" --include="*.tsx" \
      --exclude="*.d.ts" \
      -E "^export (async )?(function|const|class|interface|type|enum) [A-Za-z_][A-Za-z0-9_]*" \
      "$SRC_DIR"
  ) > "$ORPHANS_TMP"
}

# ─── S2: AST hash duplicates (bit-exact function bodies) ─────────────────────
# Hash every top-level export function body; flag pairs with identical hashes.
s2_duplicates() {
  local hash_file
  hash_file="$(mktemp /tmp/compress-hashes.XXXXXX)"

  find "$SRC_DIR" \( -name "*.ts" -o -name "*.tsx" \) \
    ! -name "*.d.ts" \
    -print0 \
  | while IFS= read -r -d '' f; do
      # Extract top-level export (async) function blocks.
      # Collect lines from "export [async] function Name(" up to the first
      # standalone "}" at column 0.
      awk -v FILENAME="$f" '
        /^export (async )?function [A-Za-z_][A-Za-z0-9_]*\(/ {
          start = NR; body = $0
          next
        }
        start > 0 {
          body = body "\n" $0
          if (/^\}/) {
            print FILENAME ":" start "\t" body
            start = 0; body = ""
          }
        }
      ' "$f"
    done \
  | while IFS=$'\t' read -r location body; do
      hash="$(printf '%s' "$body" | sha256sum | awk '{print $1}')"
      printf '%s\t%s\n' "$hash" "$location"
    done \
  | sort -k1,1 \
  | awk -F'\t' '
      {
        if ($1 == prev_hash) {
          print "DUP: " $2 " == " prev_loc
        }
        prev_hash = $1; prev_loc = $2
      }
    ' > "$DUPES_TMP"

  rm -f "$hash_file"
}

# ─── S3: TSC dead locals ─────────────────────────────────────────────────────
s3_dead_locals() {
  (
    cd "$REPO_ROOT"
    npx tsc --noEmit 2>&1 \
      | grep -E "'[^']+' is declared but" \
      || true
  ) > "$DEAD_TMP"
}

# ─── Run sweeps ───────────────────────────────────────────────────────────────
echo "Running S1 — orphaned exports …"
s1_orphans

echo "Running S2 — AST hash duplicates …"
s2_duplicates

echo "Running S3 — TSC dead locals …"
s3_dead_locals

# ─── Parse results ────────────────────────────────────────────────────────────
mapfile -t ORPHAN_LINES  < "$ORPHANS_TMP"
mapfile -t DUPE_LINES    < "$DUPES_TMP"
mapfile -t DEAD_LINES    < "$DEAD_TMP"

S1_COUNT="${#ORPHAN_LINES[@]}"
S2_COUNT="${#DUPE_LINES[@]}"
S3_COUNT="${#DEAD_LINES[@]}"
TOTAL=$(( S1_COUNT + S2_COUNT + S3_COUNT ))

# ─── Human-readable report ────────────────────────────────────────────────────
echo ""
echo "COMPRESS report  ($TIMESTAMP)"

# S1
printf "  S1 orphans:      %d candidate%s" "$S1_COUNT" "$([[ $S1_COUNT -ne 1 ]] && echo 's' || echo '')"
if [[ $S1_COUNT -eq 0 ]]; then
  echo " → none"
else
  echo " →"
  for line in "${ORPHAN_LINES[@]}"; do
    # line format: file:lineno:symbol
    IFS=: read -r ofile olineno osym <<< "$line"
    printf "    %-60s  %s\n" "${ofile}:${olineno}" "$osym"
  done
fi

# S2
printf "  S2 duplicates:   %d candidate%s" "$S2_COUNT" "$([[ $S2_COUNT -ne 1 ]] && echo 's' || echo '')"
if [[ $S2_COUNT -eq 0 ]]; then
  echo " → none"
else
  echo " →"
  for line in "${DUPE_LINES[@]}"; do
    echo "    $line"
  done
fi

# S3
printf "  S3 dead-locals:  %d candidate%s" "$S3_COUNT" "$([[ $S3_COUNT -ne 1 ]] && echo 's' || echo '')"
if [[ $S3_COUNT -eq 0 ]]; then
  echo " → none"
else
  echo " →"
  for line in "${DEAD_LINES[@]}"; do
    echo "    $line"
  done
fi

echo ""
echo "  Total candidates: $TOTAL"

if [[ "$DRY_RUN" == true ]]; then
  echo "  --dry-run: candidates shown above; no changes made."
else
  echo "  Action required: review and delete manually (--prune to auto-delete not yet implemented)."
fi

# ─── JSON report ─────────────────────────────────────────────────────────────
if [[ -n "$REPORT_PATH" ]]; then
  # Pass raw sweep outputs to Python via temp files — no shell interpolation of
  # file content into Python source code.
  python3 - "$ORPHANS_TMP" "$DUPES_TMP" "$DEAD_TMP" "$TIMESTAMP" "$TOTAL" "$REPORT_PATH" <<'PYEOF'
import json, sys

orphans_file, dupes_file, dead_file, ts, total_str, report_path = sys.argv[1:]

orphans = []
with open(orphans_file) as f:
    for line in f:
        line = line.rstrip('\n')
        if not line:
            continue
        # format: /path/to/file.ts:42:SymbolName
        # split on first two colons only
        parts = line.split(':', 2)
        if len(parts) == 3:
            orphans.append({"file": parts[0], "line": int(parts[1]), "symbol": parts[2]})

duplicates = []
with open(dupes_file) as f:
    for line in f:
        line = line.rstrip('\n')
        if not line:
            continue
        # format: DUP: loc1 == loc2
        if line.startswith('DUP: '):
            rest = line[5:]
            idx = rest.find(' == ')
            if idx != -1:
                duplicates.append({"location1": rest[:idx], "location2": rest[idx+4:]})

dead_locals = []
with open(dead_file) as f:
    for line in f:
        line = line.rstrip('\n')
        if line:
            dead_locals.append(line)

report = {
    "ts": ts,
    "orphans": orphans,
    "duplicates": duplicates,
    "dead_locals": dead_locals,
    "total_candidates": int(total_str),
}

with open(report_path, 'w') as out:
    json.dump(report, out, indent=2)
    out.write('\n')
PYEOF

  echo "  JSON report written to: $REPORT_PATH"
fi

exit 0
