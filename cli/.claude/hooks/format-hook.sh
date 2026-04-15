#!/bin/bash

# Format Hook - ONE Platform
# Auto-formats markdown and YAML files aligned with 6-dimension ontology
# Dimensions: groups, people, things, connections, events, knowledge

set -e

# Source the logger
source "$CLAUDE_PROJECT_DIR/.claude/hooks/hook-logger.sh"

# Get file path from stdin or argument
FILE_PATH="${1:-}"

# Log start
log_message "INFO" "Starting format-hook for: ${FILE_PATH:-all files}"
START_TIME=$(get_time_ms)

# 6-dimension ontology directories
ONTOLOGY_DIMENSIONS=("groups" "people" "things" "connections" "events" "knowledge")

# Function to format markdown files with ontology preservation
format_markdown() {
  local file="$1"

  # Extract dimension if file is in ontology structure
  local dimension=""
  for dim in "${ONTOLOGY_DIMENSIONS[@]}"; do
    if [[ "$file" =~ /one/$dim/ ]] || [[ "$file" =~ /[^/]+/$dim/ ]]; then
      dimension="[$dim]"
      break
    fi
  done

  if command -v prettier &> /dev/null; then
    prettier --write "$file" --parser markdown 2>/dev/null && echo "✅ Formatted $dimension: $file"
  else
    echo "⚠️  prettier not found, skipping markdown formatting"
  fi
}

# Function to format YAML files with ontology preservation
format_yaml() {
  local file="$1"

  # Extract dimension if file is in ontology structure
  local dimension=""
  for dim in "${ONTOLOGY_DIMENSIONS[@]}"; do
    if [[ "$file" =~ /one/$dim/ ]] || [[ "$file" =~ /[^/]+/$dim/ ]]; then
      dimension="[$dim]"
      break
    fi
  done

  if command -v prettier &> /dev/null; then
    prettier --write "$file" --parser yaml 2>/dev/null && echo "✅ Formatted $dimension: $file"
  else
    echo "⚠️  prettier not found, skipping YAML formatting"
  fi
}

EXIT_CODE=0
FILES_FORMATTED=0

# Check if specific file provided
if [ -n "$FILE_PATH" ]; then
  # Format specific file
  if [[ "$FILE_PATH" =~ \.md$ ]]; then
    format_markdown "$FILE_PATH"
    FILES_FORMATTED=$((FILES_FORMATTED + 1))
  elif [[ "$FILE_PATH" =~ \.(yaml|yml)$ ]]; then
    format_yaml "$FILE_PATH"
    FILES_FORMATTED=$((FILES_FORMATTED + 1))
  else
    log_message "INFO" "File type not supported for formatting: $FILE_PATH"
  fi
else
  # Format all files in ontology-aligned directories
  if command -v prettier &> /dev/null; then

    # Format /one directory (global ontology)
    if [ -d "$CLAUDE_PROJECT_DIR/one" ]; then
      echo "🔧 Formatting global ontology: /one/"

      # Format each dimension directory
      for dim in "${ONTOLOGY_DIMENSIONS[@]}"; do
        if [ -d "$CLAUDE_PROJECT_DIR/one/$dim" ]; then
          echo "  📁 Formatting dimension: $dim"
          find "$CLAUDE_PROJECT_DIR/one/$dim" -type f -name "*.md" 2>/dev/null | while read -r file; do
            format_markdown "$file"
            FILES_FORMATTED=$((FILES_FORMATTED + 1))
          done
          find "$CLAUDE_PROJECT_DIR/one/$dim" -type f \( -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | while read -r file; do
            format_yaml "$file"
            FILES_FORMATTED=$((FILES_FORMATTED + 1))
          done
        fi
      done

      # Format root-level files in /one
      find "$CLAUDE_PROJECT_DIR/one" -maxdepth 1 -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | while read -r file; do
        format_markdown "$file" 2>/dev/null || format_yaml "$file" 2>/dev/null
        FILES_FORMATTED=$((FILES_FORMATTED + 1))
      done
    else
      log_message "WARN" "/one directory not found"
    fi

    # Format installation folders (e.g., /nine-padel, /one-inc)
    # Look for directories with hyphenated names that aren't system directories
    echo "🔧 Scanning for installation folders..."
    for install_dir in "$CLAUDE_PROJECT_DIR"/*-*/; do
      # Skip if not a directory or is a system directory
      if [ ! -d "$install_dir" ] || [[ "$install_dir" =~ (node_modules|\.git|\.claude) ]]; then
        continue
      fi

      install_name=$(basename "$install_dir")
      echo "  🏢 Formatting installation: $install_name"

      # Format knowledge directory in installation
      if [ -d "$install_dir/knowledge" ]; then
        echo "    📁 Formatting knowledge/"
        find "$install_dir/knowledge" -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | while read -r file; do
          if [[ "$file" =~ \.md$ ]]; then
            format_markdown "$file"
          else
            format_yaml "$file"
          fi
          FILES_FORMATTED=$((FILES_FORMATTED + 1))
        done
      fi

      # Format dimension directories in installation (e.g., /nine-padel/groups/)
      for dim in "${ONTOLOGY_DIMENSIONS[@]}"; do
        if [ -d "$install_dir/$dim" ]; then
          echo "    📁 Formatting $dim/"
          find "$install_dir/$dim" -type f \( -name "*.md" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | while read -r file; do
            if [[ "$file" =~ \.md$ ]]; then
              format_markdown "$file"
            else
              format_yaml "$file"
            fi
            FILES_FORMATTED=$((FILES_FORMATTED + 1))
          done
        fi
      done
    done

    echo ""
    echo "✅ Formatting completed: $FILES_FORMATTED files processed"

  else
    echo "⚠️  prettier not installed. Install with: npm install -g prettier"
    EXIT_CODE=0  # Don't fail if prettier not installed
  fi
fi

# Log completion
END_TIME=$(get_time_ms)
log_hook_execution "format-hook" "$0 $*" "$START_TIME" "$END_TIME" "$EXIT_CODE"

exit $EXIT_CODE
