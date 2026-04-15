# /push - Push to All Repositories

**Purpose:** Push changes to all ONE Platform repositories using the unified push script.

## ⚠️ CRITICAL RULE: Always Pull Before Push

**Every push MUST be preceded by a pull.** This prevents branch divergence.

```bash
# CORRECT workflow:
git add -A
git commit -m "Your message"
git pull origin main       # ← ALWAYS pull first
git push origin main       # ← Then push
```

**Branch divergence happens when:**
- Remote has commits you don't have locally
- You try to push without pulling first
- Multiple processes push simultaneously without coordination

**Prevention:**
- Always run `git pull origin main` before `git push origin main`
- Configure git: `git config pull.ff only` (forces fast-forward only)
- This makes it impossible to accidentally diverge

## How It Works

This command uses `./.claude/hooks/push.sh` to automatically:
1. **Stage all changes** (`git add -A`) if any exist
2. **Commit changes** with generated message if needed
3. **Pull latest** from remote (prevent divergence)
4. **Push to remotes**:
   - Main repository: `github.com/one-ie/one`
   - `/one` subtree: `github.com/one-ie/ontology`
   - `/web` subtree: `github.com/one-ie/web`
   - `one.ie/` directory: `github.com/one-ie/one.ie`

**You don't need to manually run `git add` or `git commit` - the script handles it automatically!**

## Usage

```bash
# Push to all remotes (after pulling!)
/push all

# Push to specific remote
/push main          # Main repo only
/push one           # /one subtree only
/push web           # /web subtree only
/push oneie         # one.ie directory only
```

## Workflow: Automatic Push (No Manual Steps)

**The `/push` command handles everything automatically:**

```bash
# Just make your changes, then run:
/push all

# That's it! The script automatically:
# 1. Stages all changes (git add -A)
# 2. Commits with generated message
# 3. Pulls latest from remote (prevents divergence)
# 4. Pushes to all remotes
```

**You can also push to specific remotes:**

```bash
/push main    # Push to one-ie/one only
/push one     # Push to one-ie/ontology only
/push web     # Push to one-ie/web only
/push oneie   # Push to one-ie/one.ie only
```

**Result:** Zero divergence, always in sync with remote, zero manual steps.

## What the Script Does (Automatically)

1. **Checks for uncommitted changes** - If any exist, proceeds to stage and commit
2. **Stages all changes** - Runs `git add -A` to stage everything
3. **Commits with generated message** - Creates commit from changed file list
4. **Pulls latest changes** - Always pulls before pushing (prevents divergence)
5. **Pushes to remotes** - Pushes to main repo and/or subtrees
6. **Reports summary** - Shows what was pushed where

**You never need to manually run `git add`, `git commit`, or `git pull` - it's all automatic!**

## Your Task

When the user runs `/push [option]`, you MUST:

1. **Simply run the push script** with the appropriate argument:
   ```bash
   ./.claude/hooks/push.sh [all|main|one|web|oneie]
   ```

   **DO NOT run `git add`, `git commit`, or `git pull` manually** - the script handles everything!

2. **Handle errors gracefully**:
   - If a directory doesn't exist, the script handles it
   - If push fails, display the error and suggest fixes
   - Respect pre-commit hooks if configured

3. **Report results** with clear summary:
   ```
   ✅ Push Complete!

   📦 Repositories Updated:
   - Main repo: pushed to origin main
   - /one: pushed to one-repo
   - /web: pushed to web-repo
   - one.ie: pushed (if directory exists)
   ```

**IMPORTANT:** Do not manually stage, commit, or pull. The script does this automatically to ensure consistency.

## Examples

**Push all remotes:**
```
User: /push all
→ Runs: ./.claude/hooks/push.sh all
→ Pushes to all 4 remotes
```

**Push specific remote:**
```
User: /push oneie
→ Runs: ./.claude/hooks/push.sh oneie
→ Pushes to one-ie/one.ie only
```

**Push main repo:**
```
User: /push main
→ Runs: ./.claude/hooks/push.sh main
→ Pushes to one-ie/one only
```

## Important Notes

- The script uses `git subtree split` for `/one` and `/web` with `--force` to handle history
- `one.ie` directory is pushed as a normal git repository if it exists
- Each push operation is isolated - failures in one don't block others
- Run from the project root directory

## Common Issues & Solutions

### Issue: "Rejected - non-fast-forward"

**Cause:** Remote is ahead of your local branch (you didn't pull first).

**Fix:**
```bash
# Pull the latest changes
git pull origin main

# Now push safely
/push main
```

### Issue: "Branches have diverged"

**Cause:** Remote and local have different commits (push without pull happened).

**Fix:**
```bash
# Pull and merge (or rebase)
git pull origin main

# Resolve any conflicts if they occur
# Then push
/push main
```

**Prevention:** Always pull before push.

### Issue: Multiple Processes Pushing Simultaneously

**Cause:** Background hooks, slash commands, and manual operations running at once.

**Fix:**
1. **Wait for all background operations to complete**
2. **Run one operation at a time**
3. **Follow the pull-before-push rule strictly**

**Prevention:**
- Disable auto-push hooks: Comment out lines in `.git/hooks/post-commit`
- Use one unified push command, not multiple parallel operations
- Always: pull → push sequence

---

## Setup: Prevent Divergence Permanently

**Configure git to reject pushes without pull:**

```bash
# This forces fast-forward only (prevents divergence)
git config pull.ff only

# Verify it worked
git config --get pull.ff
# Should output: only
```

**Result:** If you try to push without pulling, git will refuse.

---

**Safe, reliable push to all repositories! 🚀**
