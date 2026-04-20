#!/bin/bash
#
# Auto-Format Hook for ONE Platform
#
# Automatically formats files based on extension after Edit/Write operations:
# - TypeScript/JavaScript: Prettier
# - Astro: astro check --fix
# - JSON: Prettier
# - CSS/SCSS: Prettier
#

set -e

# ANSI color codes
GREEN='\033[92m'
YELLOW='\033[93m'
RED='\033[91m'
BLUE='\033[94m'
RESET='\033[0m'

# Get file path from environment or command line
FILE_PATH="${CLAUDE_EDIT_FILE:-${1:-}}"

if [ -z "$FILE_PATH" ]; then
    echo -e "${YELLOW}⚠ Auto-Format: No file path provided${RESET}"
    exit 0
fi

if [ ! -f "$FILE_PATH" ]; then
    echo -e "${YELLOW}⚠ Auto-Format: File does not exist: $FILE_PATH${RESET}"
    exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"
BASENAME=$(basename "$FILE_PATH")

# Skip formatting for certain files
if [[ "$FILE_PATH" == *"node_modules"* ]] || \
   [[ "$FILE_PATH" == *"_generated"* ]] || \
   [[ "$FILE_PATH" == *".git"* ]] || \
   [[ "$FILE_PATH" == *"dist/"* ]] || \
   [[ "$FILE_PATH" == *".next/"* ]]; then
    exit 0
fi

# Format based on extension
case "$EXT" in
    ts|tsx|js|jsx|json|css|scss)
        # Check if prettier is available
        if command -v prettier &> /dev/null; then
            echo -e "${BLUE}→ Formatting $BASENAME with Prettier...${RESET}"
            prettier --write "$FILE_PATH" --log-level=error 2>&1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Formatted: $BASENAME${RESET}"
            else
                echo -e "${YELLOW}⚠ Prettier formatting failed for $BASENAME${RESET}"
            fi
        elif [ -f "web/package.json" ] && grep -q "prettier" "web/package.json"; then
            # Try using bun/npm from web directory
            cd web
            echo -e "${BLUE}→ Formatting $BASENAME with Prettier (via bun)...${RESET}"
            bun run prettier --write "../$FILE_PATH" --log-level=error 2>&1 || true
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Formatted: $BASENAME${RESET}"
            fi
            cd ..
        fi
        ;;

    astro)
        # Check if in web directory for astro check
        if [[ "$FILE_PATH" == *"/web/"* ]] && [ -f "web/package.json" ]; then
            cd web
            echo -e "${BLUE}→ Checking $BASENAME with Astro...${RESET}"
            bunx astro check --minimumSeverity warning 2>&1 | grep -v "Getting diagnostics" || true
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Astro check: $BASENAME${RESET}"
            fi
            cd ..
        fi

        # Also run prettier on .astro files
        if command -v prettier &> /dev/null; then
            prettier --write "$FILE_PATH" --log-level=error 2>&1 || true
        fi
        ;;

    md|mdx)
        # Format markdown with prettier if available
        if command -v prettier &> /dev/null; then
            echo -e "${BLUE}→ Formatting $BASENAME with Prettier...${RESET}"
            prettier --write "$FILE_PATH" --log-level=error 2>&1 || true
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Formatted: $BASENAME${RESET}"
            fi
        fi
        ;;

    *)
        # Skip other file types
        exit 0
        ;;
esac

exit 0
