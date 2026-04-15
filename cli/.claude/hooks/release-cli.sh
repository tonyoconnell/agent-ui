#!/bin/bash

# ============================================================
# ONE CLI Release Script (OPTIMIZED v2)
# ============================================================
# Syncs /one to cli/one/, publishes to npm
# Optimized for parallel execution and performance
# Hooks stay in root repository (single source of truth)
#
# Usage: ./scripts/release-cli.sh [patch|minor|major|sync]
#
# Examples:
#   ./scripts/release-cli.sh patch     # Bug fix release
#   ./scripts/release-cli.sh minor     # New feature release
#   ./scripts/release-cli.sh major     # Breaking change release
#   ./scripts/release-cli.sh sync      # Sync files without version bump
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Version bump (default: sync)
VERSION_BUMP="${1:-sync}"

# Validate input
if [[ ! "$VERSION_BUMP" =~ ^(patch|minor|major|sync)$ ]]; then
    echo -e "${RED}Error: Invalid version bump. Use: patch, minor, major, or sync${NC}"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   ONE CLI Release (${VERSION_BUMP}) v2${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get script directory and navigate to root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"  # Up two levels: hooks -> .claude -> root
cd "$ROOT_DIR" || exit 1

# Track timing
RELEASE_START=$(date +%s)

# Step 1: Verify CLI directory exists
echo -e "${BLUE}Step 1: Verify CLI directory${NC}"
if [ ! -d "cli" ]; then
    echo -e "${RED}✗ cli/ directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ cli/ directory exists${NC}"
echo ""

# Step 2: Sync /one to cli/one/ (documentation)
echo -e "${BLUE}Step 2: Sync /one/ to cli/one/${NC}"
if [ -d "one" ]; then
    mkdir -p cli/one
    rsync -av --delete --quiet one/ cli/one/ 2>&1 | tail -1 || true
    echo -e "${GREEN}✓ /one/ synced to cli/one/${NC}"
else
    echo -e "${YELLOW}⚠ /one/ directory not found, skipping${NC}"
fi
echo ""

# Step 3: Sync root markdown and config files to cli/
echo -e "${BLUE}Step 3: Sync root markdown and config files (parallel)${NC}"
for file in CLAUDE.md README.md LICENSE.md SECURITY.md AGENTS.md .mcp.json.on .mcp.json.off; do
    if [ -f "$file" ]; then
        cp "$file" "cli/$file" &
    fi
done
wait  # Wait for all copies to complete
echo -e "${GREEN}✓ All markdown and config files synced${NC}"
echo ""

# Step 4: Sync .claude/ to cli/.claude/ (agents, commands, hooks, skills)
echo -e "${BLUE}Step 4: Sync .claude/ to cli/.claude/${NC}"
if [ -d ".claude" ]; then
    mkdir -p cli/.claude
    for dir in agents commands hooks skills; do
        if [ -d ".claude/$dir" ]; then
            rsync -av --delete --quiet ".claude/$dir/" "cli/.claude/$dir/" 2>&1 | tail -1 || true
            echo -e "${GREEN}✓ .claude/$dir/ synced${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠ .claude/ directory not found, skipping${NC}"
fi
echo ""

# Step 5: Version bump (if not sync)
if [[ "$VERSION_BUMP" != "sync" ]]; then
    echo -e "${BLUE}Step 5: Version bump (${VERSION_BUMP})${NC}"
    cd cli
    OLD_VERSION=$(node -p "require('./package.json').version")
    npm version "$VERSION_BUMP" --no-git-tag-version > /dev/null 2>&1
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo -e "${GREEN}✓ Version bumped: ${OLD_VERSION} → ${NEW_VERSION}${NC}"
    cd ..
    echo ""
else
    echo -e "${YELLOW}⚠ Skipping version bump${NC}"
    echo ""
fi

# Step 6: Commit changes to cli/
echo -e "${BLUE}Step 6: Commit cli/ changes${NC}"
cd cli
if [[ -n $(git status -s) ]]; then
    git add . > /dev/null 2>&1
    git commit -m "chore: sync /one, .claude/, markdown, and config files

Synced from root repository:
- /one/* → CLI documentation
- .claude/* → CLI automation (agents, commands, hooks, skills)
- CLAUDE.md, README.md, LICENSE.md, SECURITY.md, AGENTS.md
- .mcp.json.on, .mcp.json.off → MCP server configurations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>" > /dev/null 2>&1
    echo -e "${GREEN}✓ Changes committed${NC}"
else
    echo -e "${YELLOW}⚠ No changes to commit${NC}"
fi
cd ..
echo ""

# Step 7: Build CLI
echo -e "${BLUE}Step 7: Build CLI${NC}"
cd cli
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
cd ..
echo ""

# Step 8: Verify npm credentials (skip if sync-only)
if [[ "$VERSION_BUMP" != "sync" ]]; then
    echo -e "${BLUE}Step 8: Verify npm credentials${NC}"
    if npm whoami > /dev/null 2>&1; then
        NPM_USER=$(npm whoami)
        echo -e "${GREEN}✓ Logged in as: ${NPM_USER}${NC}"
    else
        echo -e "${RED}✗ Not logged in to npm. Run: npm login${NC}"
        exit 1
    fi
    echo ""

    # Step 9: Publish to npm
    echo -e "${BLUE}Step 9: Publish to npm${NC}"
    cd cli
    if npm publish --access public > /dev/null 2>&1; then
        PUBLISHED_VERSION=$(node -p "require('./package.json').version")
        echo -e "${GREEN}✓ Published to npm: oneie@${PUBLISHED_VERSION}${NC}"

        # Verify publication (non-blocking)
        sleep 1
        if npm view "oneie@${PUBLISHED_VERSION}" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Package verified on npm${NC}"
        else
            echo -e "${YELLOW}⚠ Package not immediately visible on npm (may take a few seconds)${NC}"
        fi
    else
        echo -e "${RED}✗ npm publish failed${NC}"
        exit 1
    fi
    cd ..
    echo ""
fi

# Calculate elapsed time
RELEASE_END=$(date +%s)
ELAPSED=$((RELEASE_END - RELEASE_START))

# Step 10: Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ CLI Release Complete! (${ELAPSED}s)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [[ "$VERSION_BUMP" != "sync" ]]; then
    CURRENT_VERSION=$(node -p "require('./cli/package.json').version")
    echo -e "${GREEN}📦 npm: oneie@${CURRENT_VERSION}${NC}"
    echo -e "${GREEN}🔗 GitHub: https://github.com/one-ie/cli${NC}"
    echo ""
    echo -e "${BLUE}Test your release:${NC}"
    echo "  npx oneie@latest --version"
    echo ""
fi

echo -e "${BLUE}Synced:${NC}"
echo "  ✓ /one/* → cli/one/ (documentation)"
echo "  ✓ .claude/* → cli/.claude/ (agents, commands, hooks, skills)"
echo "  ✓ CLAUDE.md, README.md, LICENSE.md, SECURITY.md, AGENTS.md"
echo "  ✓ .mcp.json.on, .mcp.json.off (MCP server configurations)"
echo ""
