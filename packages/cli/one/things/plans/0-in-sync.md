# In-Sync Development Strategy

**Status:** Active
**Phase:** Development Workflow
**Target:** Develop in `/web`, sync to private `one.ie`, override custom pages

---

## Overview

Three-repository strategy (you have this set up):

```
/ (root repo)
  origin → github.com/one-ie/one.git
  ↓ (develop in /web, push entire root)
github.com/one-ie/one (public template on GitHub)
  ↓ (clone entire repo)
/one.ie (your local working copy)
  origin → github.com/one-ie/one.git (pulls from same upstream)
```

**Key:** Root repo (`/`) has `origin` pointing to `github.com/one-ie/one.git`. Your `/one.ie` clone also pulls from the same repo. When you push from root, `/one.ie` pulls to sync.

---

## Workflow

### 1. Develop in `/web` (inside root repo)

```bash
cd /Users/toc/Server/ONE/web

# Make template changes here
# (or anywhere in the root repo - /one, /.claude, etc.)
```

### 2. Commit & Push Entire Root

```bash
cd /Users/toc/Server/ONE

# Stage all changes (web updates + anything else)
git add -A

# Commit
git commit -m "feat: update web components and docs"

# Push entire root to one-ie/one
git push origin main
```

### 3. Sync Everything to `one.ie`

```bash
cd /Users/toc/Server/ONE/one.ie

# Pull all updates (web, one, .claude, etc.)
git pull origin main

# This syncs everything from the root repo
```

### 4. Override Custom Pages in `one.ie`

- Keep your custom `web/src/pages/index.astro` (home page)
- On sync conflicts, keep your version
- Update everything else (components, layouts, one docs, etc.)
- Git will preserve your custom files

---

## File Strategy

**Develop in `/web`:**

- `src/components/` - UI components
- `src/layouts/` - Page layouts
- `src/lib/` - Utilities
- `src/styles/` - Global CSS
- `astro.config.mjs` - Core config
- `package.json` - Dependencies
- `src/pages/` - Template pages (standard)

**Custom in `one.ie` (your private clone):**

- `web/src/pages/index.astro` - Custom home page (override)
- Any other pages you want different
- Custom branding/styling overrides
- `.env.local` - Deployment config

---

## Example: Updating Web Components

```bash
# 1. Make a change in /web
cd /Users/toc/Server/ONE/web/src/components
# Edit Button.tsx

# 2. Commit & push from root
cd /Users/toc/Server/ONE
git add -A
git commit -m "fix: Button component loading state"
git push origin main

# 3. Sync to one.ie
cd /Users/toc/Server/ONE/one.ie
git pull origin main

# 4. If you have custom pages that conflict, resolve them:
# git will show the conflicts, keep your versions
git checkout --ours web/src/pages/index.astro
git add web/src/pages/index.astro
git commit -m "Merge: keep custom home page"
git push origin main
```

---

## That's It

Simple workflow:

1. Develop in `/web` (or anywhere in root repo)
2. Commit & push entire root
3. Pull into `/one.ie` to sync everything
4. Keep your custom files (git preserves them)

---

## Change Tracking

All commits are automatically logged to `one/events/0-changes.md` with directory grouping.

**Last Updated:** 2025-11-05
