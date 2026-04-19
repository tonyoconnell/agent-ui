---
allowed-tools: Bash
description: Fast commit and push
---

# /commit - Fast Commit + Push

⚡ **Streamlined commit and push in one command**

## Usage

```bash
/commit "your commit message"
```

## Examples

```bash
# Quick feature update
/commit "add new endpoint"

# Documentation fix
/commit "update readme"

# Cleanup
/commit "refactor code structure"

# Default (if no message provided)
/commit
# Uses: "chore: quick update"
```

## What It Does

The `/commit` command runs `./.claude/hooks/commit-push.sh` which:

1. **Checks for changes** – Verifies there are files to commit
2. **Stages everything** – Runs `git add -A`
3. **Creates commit** – Writes commit message with Claude attribution
4. **Pushes to origin** – Immediately syncs to `origin/main`
5. **Reports summary** – Shows commit hash, file count, and status

## Output Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Fast Commit + Push
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Check for changes
✓ Found 3 file(s) to commit

Step 2: Stage all changes
✓ Changes staged

Step 3: Create commit
✓ Committed: a1b2c3d

Step 4: Push to origin
✓ Pushed to origin/main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Commit + Push Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  📝 Commit: a1b2c3d
  📦 Files: 3
  ✅ Status: Synced to origin/main
```

## When to Use

- **Quick fixes** – Single command instead of 3+ git commands
- **Iterative work** – Commit frequently while developing
- **Rapid prototyping** – Get changes live fast
- **Documentation updates** – Quick knowledge base syncs

## Speed Benefits

Traditional git workflow:
```bash
git add -A                          # Stage
git commit -m "message"             # Commit
git push origin main                # Push
```

With `/commit`:
```bash
/commit "message"                   # All 3 steps at once
```

---

**Fast, simple, and always synced to origin! 🚀**
