---
title: Todo
dimension: things
primary_dimension: events
category: todo.md
tags: ai, backend, frontend
related_dimensions: events, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo.md category.
  Location: one/things/todo.md
  Purpose: Documents one platform: release workflow v1.0.0
  Related dimensions: events, people
  For AI agents: Read this to understand todo.
---

# ONE Platform: Release Workflow v1.0.0

**Focus:** Release software correctly every time
**Process:** `/release [patch|minor|major]`
**Duration:** ~12-15 minutes per release
**Last Updated:** 2025-10-30

---

## RELEASE SEQUENCE: Steps 1-100

**Golden Rule:** Execute steps IN ORDER. Never skip validation.

---

## PHASE 1: PRE-RELEASE VALIDATION (Steps 1-10)

**Purpose:** Verify system is ready to release

### Step 1: Check Git Status

- [ ] Run: `git status --short`
- [ ] Expected: Clean or acceptable uncommitted changes only
- [ ] If dirty: Commit or stash changes
- [ ] Continue: ✓

### Step 2: Run All Tests

- [ ] Frontend: `cd web && bun test`
- [ ] Backend: `cd backend && npx convex dev` (verify no errors)
- [ ] Expected: All tests passing
- [ ] If failing: Fix tests before release
- [ ] Continue: ✓

### Step 3: Check Web Builds

- [ ] Run: `cd web && bun run build`
- [ ] Expected: Build succeeds with 0 errors
- [ ] Type check: `bunx astro check`
- [ ] If errors: Fix TypeScript errors
- [ ] Continue: ✓

### Step 4: Validate Environment

- [ ] Check root `.env` exists with:
  - [ ] CLOUDFLARE_GLOBAL_API_KEY=\*\*\*
  - [ ] CLOUDFLARE_ACCOUNT_ID=\*\*\*
  - [ ] CLOUDFLARE_EMAIL=\*\*\*
- [ ] Check web `.env.local` exists with:
  - [ ] PUBLIC_CONVEX_URL=\*\*\*
  - [ ] CONVEX_DEPLOYMENT=\*\*\*
  - [ ] BETTER_AUTH_SECRET=\*\*\*
- [ ] Continue: ✓

### Step 5: Run Pre-Deployment Check

- [ ] Run: `./scripts/pre-deployment-check.sh`
- [ ] Expected: 0 errors (warnings acceptable)
- [ ] If errors: Fix issues or abort
- [ ] Continue: ✓

### Step 6: Verify npm Authentication

- [ ] Run: `npm whoami`
- [ ] Expected: Your npm username
- [ ] If not logged in: `npm login` and enter credentials
- [ ] Continue: ✓

### Step 7: Verify Wrangler Authentication

- [ ] Run: `wrangler whoami`
- [ ] Expected: Your Cloudflare email
- [ ] If not authenticated: `wrangler login`
- [ ] Continue: ✓

### Step 8: Check GitHub Remotes

- [ ] Run: `git remote -v`
- [ ] Expected: github.com/one-ie/one is configured
- [ ] If missing: `git remote add origin https://github.com/one-ie/one`
- [ ] Continue: ✓

### Step 9: Document Current Version

- [ ] Run: `cat cli/package.json | grep '"version"'`
- [ ] Note: Current version (e.g., 1.0.0)
- [ ] Next version will be:
  - [ ] patch: 1.0.1
  - [ ] minor: 1.1.0
  - [ ] major: 2.0.0
- [ ] Continue: ✓

### Step 10: Final Safety Check

- [ ] All tests passing? YES / NO
- [ ] Web builds successfully? YES / NO
- [ ] Environment variables set? YES / NO
- [ ] npm + wrangler authenticated? YES / NO
- [ ] Ready to release? YES / NO
  - [ ] If NO: Stop and fix issues
  - [ ] If YES: Continue to Phase 2

---

## PHASE 2: EXECUTE RELEASE SCRIPT (Steps 11-20)

**Purpose:** Run the automated release pipeline

### Step 11: Decide Release Type

- [ ] Patch release (bug fixes)
  - [ ] Example: 1.0.0 → 1.0.1
  - [ ] Use when: Bugs fixed, no new features
- [ ] Minor release (new features)
  - [ ] Example: 1.0.0 → 1.1.0
  - [ ] Use when: New features, backwards compatible
- [ ] Major release (breaking changes)
  - [ ] Example: 1.0.0 → 2.0.0
  - [ ] Use when: Breaking changes, major restructure

### Step 12: Run Release Script

- [ ] Command: `./scripts/release.sh [patch|minor|major]`
- [ ] Wait for script to complete
- [ ] Expected output: Version bumped, files synced, git operations
- [ ] Continue: ✓

### Step 13: Verify File Sync

- [ ] Check: 518+ files synced
- [ ] Expected locations:
  - [ ] cli/one/ (ontology files)
  - [ ] cli/.claude/ (agent files)
  - [ ] apps/one/one/ (ontology)
  - [ ] apps/one/.claude/ (agents)
  - [ ] apps/one/web/ (frontend)
- [ ] Continue: ✓

### Step 14: Verify Git Status

- [ ] Run: `git status`
- [ ] Expected: All changes committed
- [ ] If untracked files: Add and commit them
- [ ] Continue: ✓

### Step 15: Verify Version Bump

- [ ] Run: `cat cli/package.json | grep '"version"'`
- [ ] Expected: New version (e.g., 1.0.1)
- [ ] Should match what you decided in Step 11
- [ ] Continue: ✓

### Step 16: Check Git Tags

- [ ] Run: `git tag -l | tail -5`
- [ ] Expected: Latest tag is v1.0.1 (or your new version)
- [ ] Continue: ✓

### Step 17: Verify one-ie/one Repository

- [ ] Run: `cd apps/one && git status`
- [ ] Expected: All changes committed and pushed
- [ ] If not pushed: `git push origin main`
- [ ] Continue: ✓

### Step 18: Verify one-ie/cli Repository

- [ ] Run: `cd cli && git status`
- [ ] Expected: Changes committed, ready to push
- [ ] If prompted during script: Answer 'y' to push
- [ ] Continue: ✓

### Step 19: Check Release Script Output

- [ ] Script should have output:
  - [ ] ✓ Files synced (518+)
  - [ ] ✓ Version bumped
  - [ ] ✓ Git operations completed
  - [ ] ✓ Tags created
- [ ] If errors: Review and fix
- [ ] Continue: ✓

### Step 20: Confirm Ready for Publishing

- [ ] All files synced? YES / NO
- [ ] Version bumped correctly? YES / NO
- [ ] Git operations complete? YES / NO
- [ ] Ready to publish? YES / NO
  - [ ] If NO: Run release script again
  - [ ] If YES: Continue to Phase 3

---

## PHASE 3: PUBLISH TO npm (Steps 21-30)

**Purpose:** Release package to npm registry

### Step 21: Navigate to CLI Directory

- [ ] Command: `cd cli`
- [ ] Verify: You're in cli/ directory
- [ ] Continue: ✓

### Step 22: Verify Package Name

- [ ] Run: `cat package.json | grep '"name"'`
- [ ] Expected: "oneie"
- [ ] Continue: ✓

### Step 23: Verify Package Version

- [ ] Run: `cat package.json | grep '"version"'`
- [ ] Expected: Your new version (e.g., 1.0.1)
- [ ] Continue: ✓

### Step 24: Publish to npm

- [ ] Command: `npm publish --access public`
- [ ] Expected output:
  - [ ] - oneie@1.0.1
  - [ ] published 1 package
- [ ] Time: ~30 seconds
- [ ] Continue: ✓

### Step 25: Verify npm Publication

- [ ] Command: `npm view oneie version`
- [ ] Expected: Your new version (e.g., 1.0.1)
- [ ] If not matching: Wait 60 seconds and retry
- [ ] Continue: ✓

### Step 26: Check npm Registry Page

- [ ] URL: `https://www.npmjs.com/package/oneie`
- [ ] Expected: Your version appears in versions list
- [ ] Continue: ✓

### Step 27: Test npm Installation (Local)

- [ ] Command: `npm view oneie dist-tags`
- [ ] Expected: latest should show your version
- [ ] Continue: ✓

### Step 28: Test npm Installation (Via npx)

- [ ] Command: `npx oneie@latest --version`
- [ ] Expected: Your new version (e.g., 1.0.1)
- [ ] Continue: ✓

### Step 29: Document npm Success

- [ ] npm URL: https://www.npmjs.com/package/oneie
- [ ] Version: (your new version)
- [ ] Published: ✓
- [ ] Continue: ✓

### Step 30: Confirm npm Publishing Complete

- [ ] Package published to npm? YES / NO
- [ ] npm registry shows new version? YES / NO
- [ ] CLI installation works? YES / NO
- [ ] Ready to deploy to web? YES / NO
  - [ ] If NO: Troubleshoot npm issues
  - [ ] If YES: Continue to Phase 4

---

## PHASE 4: BUILD FRONTEND (Steps 31-40)

**Purpose:** Compile Astro + React for production

### Step 31: Navigate to Web Directory

- [ ] Command: `cd ../web`
- [ ] Verify: You're in web/ directory
- [ ] Continue: ✓

### Step 32: Clean Previous Build

- [ ] Command: `rm -rf dist/ .astro/`
- [ ] Verify: dist/ and .astro/ removed
- [ ] Continue: ✓

### Step 33: Install Dependencies (if needed)

- [ ] Check: `bun.lock` exists
- [ ] Command: `bun install` (only if lock file changed)
- [ ] Continue: ✓

### Step 34: Run Type Check

- [ ] Command: `bunx astro check`
- [ ] Expected: 0 errors
- [ ] If errors: Fix TypeScript errors before building
- [ ] Continue: ✓

### Step 35: Build Frontend

- [ ] Command: `bun run build`
- [ ] Expected output:
  - [ ] ✓ [build] output directory: ./dist
  - [ ] ✓ (XX files)
- [ ] Time: ~30-60 seconds
- [ ] Continue: ✓

### Step 36: Verify Build Output

- [ ] Check: `ls dist/` shows files
- [ ] Expected: HTML, CSS, JS files
- [ ] Size check: `du -sh dist/` (should be < 10MB)
- [ ] Continue: ✓

### Step 37: Check for Build Warnings

- [ ] Review build output for warnings
- [ ] Expected: No critical warnings
- [ ] OK to continue with minor warnings
- [ ] Continue: ✓

### Step 38: Generate Sitemap (if needed)

- [ ] Check: `ls dist/sitemap-index.xml`
- [ ] If exists: Sitemap generated ✓
- [ ] Continue: ✓

### Step 39: Verify Static Assets

- [ ] Check: `ls dist/` includes css/, js/, assets/
- [ ] Expected: Assets copied correctly
- [ ] Continue: ✓

### Step 40: Confirm Build Ready

- [ ] Build completed successfully? YES / NO
- [ ] 0 critical errors? YES / NO
- [ ] dist/ directory ready? YES / NO
- [ ] Ready to deploy? YES / NO
  - [ ] If NO: Fix issues and rebuild
  - [ ] If YES: Continue to Phase 5

---

## PHASE 5: DEPLOY TO CLOUDFLARE PAGES (Steps 41-50)

**Purpose:** Deploy frontend to Cloudflare Pages

### Step 41: Verify Cloudflare Credentials

- [ ] Check: Root `.env` has CLOUDFLARE_GLOBAL_API_KEY
- [ ] Check: Root `.env` has CLOUDFLARE_ACCOUNT_ID
- [ ] Check: Root `.env` has CLOUDFLARE_EMAIL
- [ ] Continue: ✓

### Step 42: Deploy to Cloudflare

- [ ] Command: `wrangler pages deploy dist --project-name=web`
- [ ] Expected output:
  - [ ] ✓ Uploading...
  - [ ] ✓ Deployment ID: \*\*\*
  - [ ] ✓ https://\*\*\* (temporary URL)
- [ ] Time: ~2-5 minutes
- [ ] Continue: ✓

### Step 43: Monitor Deployment

- [ ] Watch deployment progress in terminal
- [ ] Expected: "Successfully published" message
- [ ] Continue: ✓

### Step 44: Get Deployment URL

- [ ] Cloudflare output should show: `https://web.one.ie`
- [ ] Note this URL for verification
- [ ] Continue: ✓

### Step 45: Wait for DNS Propagation

- [ ] Time: Usually < 1 minute
- [ ] Can check: `dig web.one.ie +short`
- [ ] Continue: ✓

### Step 46: Test Deployed Site (HTTP)

- [ ] Command: `curl -I https://web.one.ie`
- [ ] Expected: HTTP 200
- [ ] Continue: ✓

### Step 47: Test Deployed Site (Browser)

- [ ] URL: `https://web.one.ie`
- [ ] Expected: Site loads
- [ ] Check: No 404 or 500 errors
- [ ] Continue: ✓

### Step 48: Verify CSS/JS Loaded

- [ ] Open browser DevTools (F12)
- [ ] Check Console: No critical errors
- [ ] Check Network: All assets loaded (200 status)
- [ ] Continue: ✓

### Step 49: Smoke Test Core Pages

- [ ] Test home page: /
- [ ] Test features page: /features (if exists)
- [ ] Test not found: /does-not-exist (should 404)
- [ ] Continue: ✓

### Step 50: Confirm Cloudflare Deployment

- [ ] Site live at https://web.one.ie? YES / NO
- [ ] Page loads correctly? YES / NO
- [ ] No JavaScript errors? YES / NO
- [ ] Ready to verify all targets? YES / NO
  - [ ] If NO: Troubleshoot deployment
  - [ ] If YES: Continue to Phase 6

---

## PHASE 6: FINAL VERIFICATION (Steps 51-60)

**Purpose:** Verify all platforms are live and consistent

### Step 51: Verify npm Package

- [ ] Command: `npm view oneie version`
- [ ] Expected: Your new version
- [ ] Status: ✓ LIVE

### Step 52: Verify npm Downloads

- [ ] URL: `https://www.npmjs.com/package/oneie`
- [ ] Check: Version appears in list
- [ ] Status: ✓ LIVE

### Step 53: Verify GitHub Tags

- [ ] Command: `git tag -l | grep v`
- [ ] Expected: Your new tag (v1.0.1)
- [ ] Status: ✓ LIVE

### Step 54: Verify GitHub Releases

- [ ] URL: `https://github.com/one-ie/cli/releases`
- [ ] Expected: New release tag appears
- [ ] Status: ✓ LIVE

### Step 55: Verify Web Deployment

- [ ] URL: `https://web.one.ie`
- [ ] Expected: Site accessible
- [ ] Status: ✓ LIVE

### Step 56: Verify Monorepo Update

- [ ] URL: `https://github.com/one-ie/one`
- [ ] Expected: Latest commit shows version bump
- [ ] Status: ✓ LIVE

### Step 57: Check Version Consistency

- [ ] npm version: (your version)
- [ ] cli/package.json version: (your version)
- [ ] git tag: v(your version)
- [ ] Expected: All match
- [ ] Status: ✓ CONSISTENT

### Step 58: Verify File Synchronization

- [ ] Check: one/knowledge/ontology.md in cli/one/knowledge/
- [ ] Check: .claude/agents/ in cli/.claude/agents/
- [ ] Check: All 518+ files present
- [ ] Status: ✓ SYNCED

### Step 59: Document Release Success

- [ ] Release date: (today)
- [ ] Version: (your version)
- [ ] npm: ✓ live
- [ ] GitHub: ✓ tagged
- [ ] Cloudflare: ✓ deployed
- [ ] Files: ✓ synced

### Step 60: Confirm Full Release Success

- [ ] All npm targets live? YES / NO
- [ ] All GitHub repos updated? YES / NO
- [ ] Web deployed to Cloudflare? YES / NO
- [ ] All versions consistent? YES / NO
- [ ] Release successful? YES / NO
  - [ ] If NO: Troubleshoot remaining issues
  - [ ] If YES: Release complete! ✓

---

## PHASE 7: POST-RELEASE TASKS (Steps 61-70)

**Purpose:** Document and notify

### Step 61: Create GitHub Release (Manual)

- [ ] URL: `https://github.com/one-ie/cli/releases`
- [ ] Click: "Draft a new release"
- [ ] Tag: v(your version)
- [ ] Title: "Release v(your version)"
- [ ] Description: Summary of changes
- [ ] Status: ✓ CREATED

### Step 62: Update CHANGELOG.md (Manual)

- [ ] File: `CHANGELOG.md`
- [ ] Add entry for new version
- [ ] List major changes
- [ ] Commit and push
- [ ] Status: ✓ UPDATED

### Step 63: Test CLI Installation (End User)

- [ ] Command: `npx oneie@latest --version`
- [ ] Expected: Your new version
- [ ] Status: ✓ WORKS

### Step 64: Test Project Init (End User)

- [ ] Command: `npx oneie@latest init test-project`
- [ ] Expected: Creates new project directory
- [ ] Status: ✓ WORKS

### Step 65: Notify Team (Optional)

- [ ] Slack: Post release announcement
- [ ] Email: Send release notes
- [ ] Twitter: Tweet about new version (if applicable)
- [ ] Status: ✓ NOTIFIED

### Step 66: Monitor Error Tracking

- [ ] Check: No spikes in error rates
- [ ] Check: Web deployment healthy
- [ ] Check: npm package downloads normal
- [ ] Status: ✓ HEALTHY

### Step 67: Archive Release Notes

- [ ] Save: Release date, version, changes
- [ ] Location: `one/events/deployments/v(version).md`
- [ ] Status: ✓ ARCHIVED

### Step 68: Plan Next Release

- [ ] Review: What to work on next
- [ ] Update: `one/things/todo.md`
- [ ] Plan: Next features or fixes
- [ ] Status: ✓ PLANNED

### Step 69: Celebrate Success

- [ ] You successfully released ONE Platform! 🎉
- [ ] Version is live across all platforms
- [ ] Status: ✓ COMPLETE

### Step 70: Review Release Performance

- [ ] Time taken: (duration)
- [ ] Issues encountered: (list)
- [ ] Lessons learned: (document)
- [ ] Next improvements: (plan)
- [ ] Status: ✓ REVIEWED

---

## ROLLBACK PROCEDURE (Emergency Only)

**Use if:** Critical bug found after release

### Rollback Steps:

1. **npm deprecation:** `npm deprecate oneie@X.X.X "Critical bug found"`
2. **Publish hotfix:** Bump patch, publish immediately
3. **Git revert:** `git revert <commit>` if needed
4. **Cloudflare rollback:** Via Cloudflare dashboard to previous deployment
5. **Notify:** Inform users of issue and hotfix

---

## TROUBLESHOOTING QUICK REFERENCE

| Problem                 | Solution                                            |
| ----------------------- | --------------------------------------------------- |
| Tests failing           | Fix code, commit, restart release from Step 1       |
| Build errors            | Run `bunx astro check`, fix TypeScript, retry build |
| npm auth fails          | Run `npm login`, enter credentials                  |
| Cloudflare deploy fails | Check `CLOUDFLARE_GLOBAL_API_KEY` in `.env`         |
| Version mismatch        | Run release script again to sync all files          |
| Files not synced        | Check release script output, verify 518+ files      |
| Site not live           | Wait 2 minutes for DNS propagation, then test       |

---

## SUCCESS CHECKLIST

At the end of a successful release:

- [ ] npm package live and installable
- [ ] GitHub repos updated with new version
- [ ] Cloudflare Pages deployed at web.one.ie
- [ ] All 518+ files synced correctly
- [ ] Version consistent across all platforms
- [ ] Tests passing everywhere
- [ ] Release notes documented
- [ ] Team notified (if applicable)
- [ ] No critical errors in logs
- [ ] Next release planned

---

## QUICK REFERENCE: RELEASE COMMAND

```bash
# From root directory
./scripts/release.sh [patch|minor|major]

# Then publish
cd cli && npm publish --access public

# Then deploy
cd ../web && bun run build && wrangler pages deploy dist --project-name=web
```

---

**Remember:** A successful release is better than a fast release.
Every step matters. Never skip validation.

**Need help?** Read `one/knowledge/ontology-release.md` for detailed mapping.
