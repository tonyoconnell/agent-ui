#!/usr/bin/env bash
set -euo pipefail

SRC="${1:?usage: extract.sh <source-file> <symbol> [--out <output-path>]}"
SYM="${2:?usage: extract.sh <source-file> <symbol> [--out <output-path>]}"
OUT=""
if [[ "${3:-}" == "--out" ]]; then OUT="${4:?--out requires a path}"; fi

# Find definition line number
# Patterns: export function|const|class|interface|type <symbol>, function <symbol>, const <symbol> =
DEF_LINE=$(grep -n "^\(export \)\{0,1\}\(function\|const\|class\|interface\|type\) ${SYM}[^A-Za-z0-9_]" "$SRC" 2>/dev/null | head -1 | cut -d: -f1 || true)

# Fallback: try `const <symbol> =` explicitly (grep pattern above may miss some const forms)
if [[ -z "$DEF_LINE" ]]; then
  DEF_LINE=$(grep -n "^\(export \)\{0,1\}const ${SYM} \{0,\}=" "$SRC" 2>/dev/null | head -1 | cut -d: -f1 || true)
fi

if [[ -z "$DEF_LINE" ]]; then
  echo "symbol '$SYM' not found in $SRC" >&2
  exit 1
fi

# Extract imports: lines starting with 'import ' or 'import type '
IMPORTS=$(grep "^import " "$SRC" 2>/dev/null || true)

# Extract symbol body using awk brace counter
# Handles multi-line functions, classes, interfaces, and const with object/arrow bodies.
# Key rule: depth reaching 0 mid-line (e.g. destructured params) does NOT end extraction —
# only a depth-0 crossing at END of a line (after all chars processed) terminates the body.
BODY=$(awk -v start="$DEF_LINE" '
  NR == start {
    printing = 1
    depth = 0
    braces_seen = 0
  }
  printing {
    line = $0
    closed = 0
    for (i = 1; i <= length(line); i++) {
      c = substr(line, i, 1)
      if (c == "{") { depth++; braces_seen++ }
      if (c == "}") {
        depth--
        if (depth == 0 && braces_seen > 0) closed = 1
      }
    }
    print line
    if (closed && depth == 0) { printing = 0; exit }
  }
' "$SRC")

END_LINE=$(awk -v start="$DEF_LINE" '
  NR == start {
    printing = 1
    depth = 0
    braces_seen = 0
  }
  printing {
    line = $0
    closed = 0
    for (i = 1; i <= length(line); i++) {
      c = substr(line, i, 1)
      if (c == "{") { depth++; braces_seen++ }
      if (c == "}") {
        depth--
        if (depth == 0 && braces_seen > 0) closed = 1
      }
    }
    if (closed && depth == 0) { print NR; exit }
  }
' "$SRC")

echo "extracted: $SYM from $SRC (lines ${DEF_LINE}-${END_LINE:-$DEF_LINE})" >&2

if [[ -n "$IMPORTS" ]]; then
  RESULT="${IMPORTS}

${BODY}"
else
  RESULT="${BODY}"
fi

if [[ -n "$OUT" ]]; then
  mkdir -p "$(dirname "$OUT")"
  printf '%s\n' "$RESULT" > "$OUT"
else
  printf '%s\n' "$RESULT"
fi
