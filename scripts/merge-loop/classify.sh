#!/usr/bin/env bash
set -euo pipefail
SRC="${1:?usage: classify.sh <source-dir>}"
DRY=0; [[ "${2:-}" == "--dry-run" ]] && DRY=1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$SRC" && pwd)"

SOURCE_SHA=$(find "$SRC" -type f | sort | sha256sum | cut -c1-12)
OUT="${MERGE_LOOP_DIR:-.merge-loop}/classify/$SOURCE_SHA"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# write to tmp always; copy to OUT only when not dry
w() { cat > "$TMP/$1"; [[ $DRY -eq 0 ]] && cp "$TMP/$1" "$OUT/$1" || true; }
cnt() { wc -l < "$TMP/$1" 2>/dev/null || echo 0; }

# A — NOISE
find "$SRC" -type f \( \
  -name "*.lock" -o -name "*.log" -o -name "*.map" -o -name ".DS_Store" \
  -o -name "*.min.js" -o -name "*.min.css" -o -name "*.pyc" \
  -o -name "*.o" -o -name "*.class" \
  -o -path "*/node_modules/*" -o -path "*/.git/*" -o -path "*/dist/*" \
  -o -path "*/.next/*" -o -path "*/.nuxt/*" -o -path "*/build/*" \
  -o -path "*/__pycache__/*" \
\) | w noise.txt

# A' — SECRETS (halt if found)
SREG=$(cat "$SCRIPT_DIR/secrets.regex")
grep -rlE "$SREG" "$SRC" 2>/dev/null | w secrets.txt || true
N_SEC=$(cnt secrets.txt)
if [[ $N_SEC -gt 0 ]]; then echo "HALT: secrets found in $N_SEC files"; exit 2; fi

# B — DUPLICATES
SRC_H=$(find "$SRC" -type f | sort | while read -r f; do printf '%s\t%s\n' "$(git hash-object "$f")" "$f"; done)
TRUNK_H=$(find /Users/toc/Server/one.ie/src /Users/toc/Server/one.ie/agents -type f 2>/dev/null | sort | xargs git hash-object 2>/dev/null || true)
comm -12 <(echo "$SRC_H" | cut -f1 | sort) <(echo "$TRUNK_H" | sort) | \
  while read -r h; do echo "$SRC_H" | awk -F'\t' -v H="$h" '$1==H{print $2}'; done | w duplicates.txt

# C — REFERENCE (pass-through)
if [ -f ~/.merge-loop/reference-globs.txt ]; then true; fi

# D — SCHEMA GATE
find "$SRC" -type f \( \
  -name "*.tql" -o -name "*.move" -o -name "dictionary.md" \
  -o -name "schema.md" -o -name "*.prisma" -o -name "*.graphql" \
\) | w schema-gate.txt
N_SCH=$(cnt schema-gate.txt)
[[ $N_SCH -gt 0 ]] && echo "SCHEMA-GATE: $N_SCH schema files require spec reconciliation" && cat "$TMP/schema-gate.txt"

# RESIDUE — all files minus noise and duplicates
comm -23 \
  <(find "$SRC" -type f | sort) \
  <(sort "$TMP/noise.txt" "$TMP/duplicates.txt" 2>/dev/null | sort -u) | \
  while read -r f; do
    SZ=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
    EX="${f##*.}"; [[ "$EX" == "$f" ]] && EX=""
    printf '%s\t%s\t%s\n' "$f" "$SZ" "$EX"
  done | w residue.txt

N_NOISE=$(cnt noise.txt)
N_DUP=$(cnt duplicates.txt)
N_SCH2=$(cnt schema-gate.txt)
N_RES=$(cnt residue.txt)

echo "  secrets: $(cnt secrets.txt) files flagged"

if [[ "$N_NOISE" -gt 0 ]]; then
  echo "  noise:   $N_NOISE files filtered"
  # Show up to 6 filtered files so user can verify .storybook etc. aren't wanted
  head -6 "$TMP/noise.txt" | sed "s|$SRC/||g" | while read -r f; do echo "             $f"; done
  [[ "$N_NOISE" -gt 6 ]] && echo "             ... ($(( N_NOISE - 6 )) more — see $OUT/noise.txt)"
else
  echo "  noise:   0 files filtered"
fi

if [[ "$N_DUP" -gt 0 ]]; then
  echo "  dedupe:  $N_DUP exact-hash duplicates (already in trunk — will skip)"
  head -3 "$TMP/duplicates.txt" | sed "s|$SRC/||g" | while read -r f; do echo "             $f"; done
else
  echo "  dedupe:  0 duplicates found"
fi

[[ "$N_SCH2" -gt 0 ]] && echo "  schema:  $N_SCH2 schema files need spec reconciliation (see above)"
echo "  residue: $N_RES files remaining for LAND"

if [[ $DRY -eq 0 ]]; then echo "  output:  $OUT"; fi
