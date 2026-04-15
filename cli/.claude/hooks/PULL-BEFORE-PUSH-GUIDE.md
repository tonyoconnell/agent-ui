# Pull Before Push: The Anti-Divergence Guide

**CRITICAL RULE:** Always pull before push. This prevents branch divergence forever.

---

## The Problem

Branch divergence happens when:

```
Local:   5daac2b4 → b871c846 (your commit)
Remote:  5daac2b4 → c0430725 (someone else's commit)
         ↑
         Same parent, but different children
         → DIVERGED! (requires manual resolution)
```

**How it happens:**
1. Remote gets a commit you don't have
2. You make a local commit
3. You try to push
4. Git says "rejected - remote is ahead"
5. You're now in "diverged" state

**Time to recover:** 5-10 minutes (pull, resolve conflicts, push again)

---

## The Solution: Pull Before Push

```bash
# Always use this sequence:
git add -A
git commit -m "Your message"
git pull origin main       # ← ALWAYS pull first
git push origin main       # ← Then push
```

**Why it works:**
- If remote is ahead, you get their commits
- If you're ahead, pull is a no-op (fast-forward)
- If both diverged, pull merges and you fix conflicts once
- After pull, your branch is always in sync
- Push always succeeds (never rejected)

---

## How ONE Platform Enforces This

We have **THREE LAYERS** of protection:

### Layer 1: Git Config (Local)
```bash
git config pull.ff only
```
- Forces fast-forward only pulls
- Git refuses to pull if it would create divergence
- You get immediate feedback if something's wrong

### Layer 2: Claude Hooks (.claude/hooks/)

#### push.sh
```bash
./.claude/hooks/push.sh main    # or: all, one, web, oneie
```
- Automatically pulls before pushing
- Tries fast-forward first, falls back to merge
- Shows progress: pull → push

#### commit-push.sh
```bash
./.claude/hooks/commit-push.sh "Your message"
```
- All-in-one: stage → commit → pull → push
- Same pull logic as push.sh
- Fully automated workflow

### Layer 3: Git Hook (Server-Side)
```bash
.git/hooks/pre-push
```
- Final safety check before ANY push
- Runs automatically on `git push`
- Detects divergence and prevents push if not synced
- Suggests fix: "git pull origin main"

---

## Workflows

### Workflow 1: Using commit-push.sh (Easiest)

**Command:**
```bash
./.claude/hooks/commit-push.sh "Your commit message"
```

**What happens:**
1. ✅ Stages all changes
2. ✅ Creates commit
3. ✅ Pulls latest from remote
4. ✅ Pushes to origin
5. ✅ Shows summary

**Result:** Always synced, zero divergence.

### Workflow 2: Using push.sh

**Commands:**
```bash
git add -A
git commit -m "Your message"
./.claude/hooks/push.sh main
```

**What happens:**
1. ✅ You create commits locally
2. ✅ push.sh pulls before pushing
3. ✅ push.sh pushes all your commits

**Result:** Always synced, zero divergence.

### Workflow 3: Manual (Most Control)

**Commands:**
```bash
git add -A
git commit -m "Your message"
git pull origin main
git push origin main
```

**What happens:**
1. ✅ You do everything manually
2. ✅ pre-push hook validates before push
3. ✅ pre-push hook prevents bad pushes

**Result:** Manual control, still safe.

---

## What If Divergence Already Happened?

### Symptom
```
error: failed to push some refs
hint: Updates were rejected because the tip of your current branch is behind
```

### Fix
```bash
# 1. Pull to get remote commits
git pull origin main

# 2. Resolve conflicts if they occur
# (edit conflicted files)

# 3. Complete merge
git add -A
git commit -m "Merge remote changes"

# 4. Push (now safe)
git push origin main
```

**Time:** 5-10 minutes

---

## Git Config Details

### Current Settings
```bash
git config pull.ff only
```

### What This Does
- ✅ `git pull` succeeds if fast-forward possible
- ❌ `git pull` fails if would create divergence
- Forces you to explicitly handle divergence

### Verify It's Set
```bash
git config --get pull.ff
# Output: only
```

### If You Want to Change
```bash
# Allow merges on divergence (less safe)
git config pull.ff false

# Restore safety (recommended)
git config pull.ff only
```

---

## Hook Details

### pre-push Hook

**Location:** `.git/hooks/pre-push`

**What it does:**
1. Fetches latest from remote
2. Checks if local and remote are in sync
3. If diverged: prevents push, suggests fix
4. If synced: allows push
5. Shows progress with colors

**Triggers:** Automatically on `git push` (all types)

**Can't bypass:** This hook is local, you control it

### .claude/hooks/push.sh

**Location:** `.claude/hooks/push.sh`

**Usage:**
```bash
./.claude/hooks/push.sh [all|main|one|web|oneie]
```

**Options:**
- `all` - Push to all remotes (main, one, web, oneie)
- `main` - Push only main repo (one-ie/one)
- `one` - Push only /one subtree (one-ie/ontology)
- `web` - Push only /web subtree (one-ie/web)
- `oneie` - Push only one.ie directory

**Pull logic:**
```bash
git pull origin main --ff-only       # Try fast-forward
# If that fails:
git pull origin main --no-rebase     # Fall back to merge
```

### .claude/hooks/commit-push.sh

**Location:** `.claude/hooks/commit-push.sh`

**Usage:**
```bash
./.claude/hooks/commit-push.sh "Your commit message"
```

**Workflow:**
1. Check for changes
2. Stage all changes
3. Create commit
4. Pull latest (with fallback to merge)
5. Push to origin
6. Show summary

**Benefits:**
- One command instead of 4
- Automatic pull-before-push
- Clear progress output
- Shows commit hash and file count

---

## Testing the Setup

### Test 1: Verify Config
```bash
git config --get pull.ff
# Expected: only
```

### Test 2: Verify Hooks Exist
```bash
ls -la .git/hooks/pre-push
# Expected: -rwxr-xr-x (executable)

ls -la .claude/hooks/push.sh
# Expected: -rwxr-xr-x (executable)

ls -la .claude/hooks/commit-push.sh
# Expected: -rwxr-xr-x (executable)
```

### Test 3: Simulate Push
```bash
# Create a test commit
echo "test" > test.txt
git add test.txt
./.claude/hooks/commit-push.sh "test: verify push workflow"

# If successful, hooks are working!
# Clean up
git reset --soft HEAD~1
git rm test.txt
git checkout test.txt
```

---

## Common Scenarios

### Scenario 1: Fast Development (Multiple Commits)

```bash
# Commit 1
git add file1.js
git commit -m "feat: add feature 1"

# Commit 2
git add file2.js
git commit -m "feat: add feature 2"

# Push both together (pull happens once)
./.claude/hooks/push.sh main
```

**Result:** Both commits pushed, no divergence.

### Scenario 2: Concurrent Work

**Person A:**
```bash
git add feature-a.js
./.claude/hooks/commit-push.sh "feat: feature A"
# Pushes successfully
```

**Person B (at same time):**
```bash
git add feature-b.js
./.claude/hooks/commit-push.sh "feat: feature B"
# push.sh pulls A's commit, then pushes B
```

**Result:** Both commits pushed in order, no conflicts.

### Scenario 3: Long-Running Branch

```bash
# Day 1
git commit -m "work in progress"
./.claude/hooks/commit-push.sh "wip: day 1"

# Day 2 (remote got other commits)
git commit -m "more work"
./.claude/hooks/commit-push.sh "wip: day 2"
# push.sh pulls day-1 commits, pushes day-2
```

**Result:** Always synced despite long time between commits.

---

## Troubleshooting

### Problem: Pre-push hook blocks push

**Message:**
```
PUSH REJECTED: Branches have diverged!
```

**Cause:** Remote and local have different commits.

**Fix:**
```bash
git pull origin main
git push origin main
```

### Problem: Merge conflicts during pull

**Message:**
```
CONFLICT (content): Merge conflict in file.js
```

**Cause:** You and someone else edited same file.

**Fix:**
```bash
# 1. Open conflicted file
vim file.js

# 2. Resolve conflicts (look for <<<<, ====, >>>>)

# 3. Mark resolved
git add file.js

# 4. Complete merge
git commit -m "Merge remote changes"

# 5. Push
git push origin main
```

### Problem: Hook script not executable

**Message:**
```
permission denied: .claude/hooks/push.sh
```

**Fix:**
```bash
chmod +x .claude/hooks/push.sh
chmod +x .claude/hooks/commit-push.sh
chmod +x .git/hooks/pre-push
```

### Problem: Config not working

**Verify:**
```bash
git config --get pull.ff
# Should return: only
```

**If not set:**
```bash
git config pull.ff only
```

---

## Philosophy

**Why we do this:**

1. **Prevention > Recovery**
   - Preventing divergence (5 seconds) < Fixing divergence (10 minutes)

2. **Safety First**
   - Triple-layer protection means mistakes are impossible
   - Hooks auto-correct most issues

3. **Simple Rule**
   - One rule: Always pull before push
   - Easy to remember, easy to implement

4. **Automation**
   - Hooks do the pulling automatically
   - You just run one command

---

## Quick Reference

| Task | Command | Time | Safety |
|------|---------|------|--------|
| Quick commit & push | `./.claude/hooks/commit-push.sh "msg"` | 10s | ✅✅✅ |
| Push existing commits | `./.claude/hooks/push.sh main` | 5s | ✅✅✅ |
| Manual (full control) | `git pull && git push` | 5s | ✅✅ |
| No hooks (dangerous) | `git push origin main` | 2s | ✅ (only pre-push hook) |

---

## Success Criteria

✅ **You've successfully implemented anti-divergence if:**

- [ ] `git config pull.ff only` is set
- [ ] `.git/hooks/pre-push` exists and is executable
- [ ] `.claude/hooks/push.sh` pulls before pushing
- [ ] `.claude/hooks/commit-push.sh` pulls before pushing
- [ ] You always use `commit-push.sh` or `push.sh` (never raw `git push`)
- [ ] No more divergence errors when pushing

---

**Remember:** Pull before push, every time. It's that simple. 🔒

