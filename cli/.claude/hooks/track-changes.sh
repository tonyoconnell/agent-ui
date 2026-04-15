#!/bin/bash

# Track Changes Hook - ONE Platform
# Tracks file paths and names (most important for customizations)
# Helps users diff from template and export their changes
# Works regardless of custom directory names

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
CHANGES_LOG="$PROJECT_DIR/one/events/0-changes.md"

# Get commit info
COMMIT_SHORT=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B | head -1)
COMMIT_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)

# Separate template vs custom files
TEMPLATE_FILES=""
CUSTOM_FILES=""

while IFS= read -r file; do
  # Template directories
  if [[ "$file" =~ ^(web|one|\.claude)/ ]]; then
    TEMPLATE_FILES+="  - $file"$'\n'
  else
    CUSTOM_FILES+="  - $file"$'\n'
  fi
done <<< "$COMMIT_FILES"

# Count files
TEMPLATE_COUNT=$(echo "$TEMPLATE_FILES" | grep -c "  - " || true)
CUSTOM_COUNT=$(echo "$CUSTOM_FILES" | grep -c "  - " || true)

# Create summary header
SUMMARY=""
[ "$TEMPLATE_COUNT" -gt 0 ] && SUMMARY+="template:$TEMPLATE_COUNT "
[ "$CUSTOM_COUNT" -gt 0 ] && SUMMARY+="custom:$CUSTOM_COUNT"

SUMMARY=$(echo "$SUMMARY" | xargs)
TAG=""
[ "$CUSTOM_COUNT" -gt 0 ] && TAG=" [customization]"

# Create detailed markdown entry with file paths
ENTRY="### **$COMMIT_SHORT** — $SUMMARY — \`$COMMIT_MSG\`\`$TAG

"

if [ "$TEMPLATE_COUNT" -gt 0 ]; then
  ENTRY+="**Template:**
$TEMPLATE_FILES
"
fi

if [ "$CUSTOM_COUNT" -gt 0 ]; then
  ENTRY+="**Your Changes:**
$CUSTOM_FILES
"
fi

ENTRY+="
"

# Create one/events directory if it doesn't exist
mkdir -p "$(dirname "$CHANGES_LOG")" 2>/dev/null

# Initialize changes log if it doesn't exist
if [ ! -f "$CHANGES_LOG" ]; then
  cat > "$CHANGES_LOG" << 'EOF'
# Change Tracking

Track your customizations with file paths. Updated on each commit.

**What's tracked:**
- All file names and relative paths
- Which changes are template upgrades vs your customizations
- Easy to export for diffs, upgrades, or documentation

**Format:**
```
### hash — template:N custom:M — `message` [customization]

**Template:**
  - path/to/file1
  - path/to/file2

**Your Changes:**
  - custom/path/file1
  - custom/path/file2
```

---

EOF
fi

# Prepend new entry to changes log (newest first)
{
  echo "$ENTRY"
  cat "$CHANGES_LOG"
} > "$CHANGES_LOG.tmp" && mv "$CHANGES_LOG.tmp" "$CHANGES_LOG" 2>/dev/null

exit 0
