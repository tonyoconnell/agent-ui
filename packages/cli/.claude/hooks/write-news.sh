#!/bin/bash

# Write News Hook - Auto-generate news articles from git commits
# Invokes agent-writer to create engaging content about platform changes

PROJECT_DIR="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$PROJECT_DIR/.claude/hooks"
NEWS_DIR="$PROJECT_DIR/web/src/content/news"

# Get the last commit info
COMMIT_MESSAGE=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git log -1 --pretty=%H)
COMMIT_DATE=$(date +%Y-%m-%d)
COMMIT_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD | head -20)
COMMIT_STATS=$(git diff HEAD~1 HEAD --shortstat)

# Extract commit type (feat|fix|docs|refactor|perf|test)
COMMIT_TYPE=$(echo "$COMMIT_MESSAGE" | grep -oE '^(feat|fix|docs|refactor|perf|test|chore|style|build|ci)' | head -1)

# Skip if not newsworthy
if [[ "$COMMIT_TYPE" == "docs" ]] || [[ "$COMMIT_TYPE" == "chore" ]] || [[ "$COMMIT_TYPE" == "style" ]] || [[ "$COMMIT_TYPE" == "test" ]]; then
  echo "✓ Skipping news generation for $COMMIT_TYPE commit"
  exit 0
fi

# Skip if commit message contains [skip-news] or [no-news]
if echo "$COMMIT_MESSAGE" | grep -qiE '\[(skip-news|no-news)\]'; then
  echo "✓ Skipping news generation ([skip-news] flag detected)"
  exit 0
fi

# Determine category based on commit type
case "$COMMIT_TYPE" in
  feat)
    CATEGORY="feature"
    TYPE="feature_update"
    ;;
  fix)
    CATEGORY="infrastructure"
    TYPE="bug_fix"
    ;;
  perf)
    CATEGORY="article"
    TYPE="performance"
    ;;
  refactor)
    CATEGORY="infrastructure"
    TYPE="architecture"
    ;;
  *)
    CATEGORY="article"
    TYPE="update"
    ;;
esac

# Determine repo from changed files
REPO="one"
if echo "$COMMIT_FILES" | grep -q "^web/"; then
  REPO="web"
elif echo "$COMMIT_FILES" | grep -q "^backend/"; then
  REPO="backend"
elif echo "$COMMIT_FILES" | grep -q "^cli/"; then
  REPO="cli"
fi

# Generate descriptive slug from commit message
# Remove type prefix, convert to lowercase, replace spaces with hyphens
SLUG=$(echo "$COMMIT_MESSAGE" | \
  sed -E 's/^(feat|fix|docs|refactor|perf|test|chore|style|build|ci)[:(]//i' | \
  sed -E 's/\)://g' | \
  sed -E 's/[^a-zA-Z0-9 -]//g' | \
  tr '[:upper:]' '[:lower:]' | \
  tr -s ' ' '-' | \
  sed 's/^-//;s/-$//' | \
  cut -c1-60)

# Create news file path (slug only, no date in filename)
NEWS_FILE="$NEWS_DIR/${SLUG}.md"

# Skip if file already exists
if [ -f "$NEWS_FILE" ]; then
  echo "✓ News article already exists: $SLUG.md"
  exit 0
fi

# Prepare context for agent-writer
CONTEXT=$(cat <<EOF
# News Article Request

## Commit Information

**Message:** $COMMIT_MESSAGE
**Hash:** $COMMIT_HASH
**Date:** $COMMIT_DATE
**Type:** $COMMIT_TYPE
**Category:** $CATEGORY
**Repo:** $REPO

## Files Changed

\`\`\`
$COMMIT_FILES
\`\`\`

## Stats

$COMMIT_STATS

## Your Task

Write an engaging news article about this change for \`web/src/content/news/${SLUG}.md\`.

**Requirements:**
1. Use today's date ($COMMIT_DATE) in frontmatter
2. Follow the agent-writer voice guidelines (authority, humor, warmth, education)
3. Make it newsworthy—focus on user benefits, not just code changes
4. Include practical examples where relevant
5. Keep it scannable (short paragraphs, headers, code blocks)
6. Write in the style of Alex Hormozi, Wired, Ars Technica, Fast Company

**Frontmatter template:**

\`\`\`yaml
---
title: "[Benefit-Focused Headline]"
date: $COMMIT_DATE
description: "One-sentence value proposition"
author: "ONE Platform Team"
type: "$TYPE"
tags: ["tag1", "tag2", "tag3"]
category: "$CATEGORY"
repo: "$REPO"
draft: false
---
\`\`\`

**Article structure:**
1. **What Changed** - Clear explanation of the update
2. **Why This Matters** - Connect to user needs/pain points
3. **How It Works** - Technical details with examples
4. **What You Can Do Now** - Clear next steps

Make it compelling. Make people care.
EOF
)

# Create temporary file for agent-writer output
TEMP_FILE=$(mktemp)

# Write context to temp file
echo "$CONTEXT" > "$TEMP_FILE"

echo ""
echo "📝 Generating news article for: $COMMIT_MESSAGE"
echo "   File: $SLUG.md"
echo "   Category: $CATEGORY"
echo "   Repo: $REPO"
echo ""

# Note: This hook prepares the context but doesn't auto-generate
# To enable auto-generation, uncomment the following and install Claude Code CLI:

# # Invoke agent-writer via Claude Code (if available)
# if command -v claude &> /dev/null; then
#   claude task --agent agent-writer --prompt "$(cat $TEMP_FILE)" --output "$NEWS_FILE"
#   if [ $? -eq 0 ]; then
#     echo "✓ News article generated: $NEWS_FILE"
#     # Stage the new file
#     git add "$NEWS_FILE"
#   else
#     echo "✗ Failed to generate news article"
#   fi
# else
#   echo "⚠️  Claude Code CLI not found. To enable auto-generation:"
#   echo "   1. Install Claude Code CLI"
#   echo "   2. Uncomment the generation code in .claude/hooks/write-news.sh"
# fi

# Manual workflow for now
echo "📋 Context prepared. To generate the article:"
echo ""
echo "   Ask Claude Code:"
echo "   'Use agent-writer to create a news article from this commit:'"
echo "   Then paste this context or run:"
echo ""
echo "   cat $TEMP_FILE"
echo ""
echo "   Save output to: $NEWS_FILE"
echo ""

# Keep temp file for manual use
echo "$TEMP_FILE" > "$HOOKS_DIR/.last-news-context"

exit 0
