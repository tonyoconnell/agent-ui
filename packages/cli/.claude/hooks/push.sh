#!/bin/bash

# Push to all remotes: main repo + subtrees + one.ie
# Usage: ./.claude/hooks/push.sh [all|main|one|web|oneie]
#
# CRITICAL: This script ALWAYS:
# 1. Stages all changes (git add -A)
# 2. Commits changes (if any exist)
# 3. Pulls before pushing to prevent branch divergence
# 4. Pushes to remotes
#
# Rule: Always add → commit → pull → push. Never skip steps.

set -e

COMMAND="${1:-all}"

# ============================================================
# STAGE AND COMMIT - Always commit changes before pushing
# ============================================================
commit_changes() {
    echo "📋 Checking for uncommitted changes..."

    # Check if there are changes to commit
    if [[ -z $(git status --porcelain) ]]; then
        echo "✅ No changes to commit"
        return
    fi

    echo "📝 Staging all changes..."
    git add -A

    # Generate commit message from changed files
    CHANGED_FILES=$(git status --short | head -5 | awk '{print $2}' | tr '\n' ', ' | sed 's/,$//')
    CHANGE_COUNT=$(git status --short | wc -l | tr -d ' ')

    COMMIT_MSG="chore: Update $CHANGE_COUNT file(s)

Changed: $CHANGED_FILES

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MSG"
    echo "✅ Changes committed"
}

# ============================================================
# PULL FIRST - Prevent branch divergence
# ============================================================
pull_main() {
    echo "🔄 Pulling latest from origin/main..."
    if ! git pull origin main --ff-only 2>/dev/null; then
        echo "⚠️  Fast-forward pull failed (branches may be diverged)"
        echo "Attempting merge pull..."
        git pull origin main --no-rebase
    fi
    echo "✅ Pulled latest changes"
}

# ============================================================
# PREPARE REPO - Stage, commit, and pull once before all pushes
# ============================================================
prepare_repo() {
    # Commit changes first (if any)
    commit_changes
    echo ""

    # Pull first (CRITICAL - prevents divergence)
    pull_main
    echo ""
}

push_main() {
    echo "📤 Pushing main repo to origin (one-ie/one)..."
    git push origin main
    echo "✅ Main repo pushed"
}

push_one() {
    echo "📤 Pushing /one subtree to one-repo (one-ie/ontology)..."
    git push one-repo $(git subtree split --prefix one main):main --force
    echo "✅ /one subtree pushed"
}

push_web() {
    echo "📤 Pushing /web subtree to web-repo (one-ie/web)..."
    git push web-repo $(git subtree split --prefix web main):main --force
    echo "✅ /web subtree pushed"
}

push_oneie() {
    echo "📤 Pushing to one.ie repo (one-ie/one.ie)..."
    if [ -d "one.ie" ]; then
        cd one.ie
        # Check for changes and commit
        if [[ -n $(git status --porcelain) ]]; then
            git add -A
            git commit -m "chore: Sync from main repo"
        fi
        # Pull in one.ie directory too
        git pull origin main --ff-only 2>/dev/null || git pull origin main --no-rebase
        git push origin main
        cd ..
        echo "✅ one.ie repo pushed"
    else
        echo "⚠️  one.ie directory not found, skipping"
    fi
}

case "$COMMAND" in
    all)
        prepare_repo
        push_main
        echo ""
        push_one
        echo ""
        push_web
        echo ""
        push_oneie
        echo ""
        echo "🎉 All remotes synced!"
        ;;
    main)
        prepare_repo
        push_main
        ;;
    one)
        prepare_repo
        push_one
        ;;
    web)
        prepare_repo
        push_web
        ;;
    oneie)
        prepare_repo
        push_oneie
        ;;
    *)
        echo "Usage: ./.claude/hooks/push.sh [all|main|one|web|oneie]"
        echo ""
        echo "Examples:"
        echo "  ./.claude/hooks/push.sh all        # Push to all remotes"
        echo "  ./.claude/hooks/push.sh main       # Push main repo only"
        echo "  ./.claude/hooks/push.sh one        # Push /one subtree only"
        echo "  ./.claude/hooks/push.sh web        # Push /web subtree only"
        echo "  ./.claude/hooks/push.sh oneie      # Push one.ie repo only"
        exit 1
        ;;
esac
