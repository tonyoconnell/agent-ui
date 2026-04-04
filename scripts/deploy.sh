#!/bin/bash
# Deploy to Cloudflare Pages
# Proven pattern from ../ants-at-work/scripts/cloudflare-deploy.sh
#
# Usage:
#   ./scripts/deploy.sh              # production deploy
#   ./scripts/deploy.sh preview      # preview deploy
#   ./scripts/deploy.sh preview dev  # preview on dev branch

set -euo pipefail

PROJECT="${1:-production}"
BRANCH="${2:-main}"
OUTPUT_DIR="dist"

# Check wrangler
if ! command -v wrangler &> /dev/null; then
  echo "Installing wrangler..."
  npm i -g wrangler
fi

# Build if needed
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "Building..."
  NODE_ENV=production npm run build
fi

# Deploy
if [ "$PROJECT" = "production" ]; then
  echo "Deploying to production..."
  wrangler pages deploy "$OUTPUT_DIR" \
    --project-name=world \
    --branch=main
  echo "Live at https://one.ie"
else
  echo "Deploying preview on branch: $BRANCH..."
  wrangler pages deploy "$OUTPUT_DIR" \
    --project-name=world \
    --branch="$BRANCH"
  echo "Preview at https://$BRANCH.envelopes.pages.dev"
fi
