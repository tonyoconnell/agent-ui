#!/bin/bash

# Clean Markdown Hook - ONE Platform
# Moves unwanted markdown files to one/events/
# Root allowed: README.md, CLAUDE.md, AGENTS.md, LICENSE.md, SECURITY.md
# /web allowed: README.md, CLAUDE.md, AGENTS.md, LICENSE.md, SECURITY.md
# Everything else moves to one/events/ (6-dimension EVENTS dimension)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
EVENTS_DIR="$PROJECT_DIR/one/events"

# Allowed files (same for both root and web)
ALLOWED_FILES=(
  "README.md"
  "CLAUDE.md"
  "AGENTS.md"
  "LICENSE.md"
  "SECURITY.md"
)

# Create events directory if it doesn't exist
mkdir -p "$EVENTS_DIR"

# Function to clean markdown files in a directory
clean_directory() {
  local dir="$1"
  local dir_name=$(basename "$dir")

  if [ ! -d "$dir" ]; then
    return
  fi

  # Find all markdown files in this directory (max depth 1)
  while IFS= read -r file; do
    filename=$(basename "$file")

    # Check if file is in allowed list
    is_allowed=0
    for allowed in "${ALLOWED_FILES[@]}"; do
      if [ "$filename" = "$allowed" ]; then
        is_allowed=1
        break
      fi
    done

    # If not allowed, move it to one/events/
    if [ $is_allowed -eq 0 ]; then
      # Add timestamp and source directory to avoid collisions
      timestamp=$(date +%Y%m%d-%H%M%S)

      # If root, just use filename; if /web, prefix with "web-"
      if [ "$dir_name" = "web" ]; then
        new_name="web-${filename%.md}-${timestamp}.md"
      else
        new_name="${filename%.md}-${timestamp}.md"
      fi

      echo "Moving $(basename "$file") → one/events/$new_name"
      mv "$file" "$EVENTS_DIR/$new_name"

      # Stage the changes for git
      git add -A "$file" "$EVENTS_DIR/$new_name" 2>/dev/null || true
    fi
  done < <(find "$dir" -maxdepth 1 -name "*.md" -type f)
}

# Clean root directory
clean_directory "$PROJECT_DIR"

# Clean /web directory
clean_directory "$PROJECT_DIR/web"

exit 0
