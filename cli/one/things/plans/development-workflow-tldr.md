---
title: Development Workflow Tldr
dimension: things
category: plans
tags: ai, architecture
related_dimensions: people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/development-workflow-tldr.md
  Purpose: Documents development workflow - tl;dr
  Related dimensions: people
  For AI agents: Read this to understand development workflow tldr.
---

# Development Workflow - TL;DR

**Version:** 1.1.0 | **Last Updated:** 2025-10-29

---

## The Answer: Developing in /oneie

**When you develop in `/oneie`, you:**

1. ✅ Edit files in `/oneie/` directly
2. ✅ Test locally with `bun run dev`
3. ✅ Commit to `/oneie` Git repo
4. ✅ Deploy with `bun run deploy`
5. ✅ Don't worry about syncing or /web

**What happens:**

- Changes stay in `/oneie` only
- Changes don't sync anywhere
- `/oneie` is independent from `/web`
- Your production site updates immediately

---

## Understanding the Architecture

```
Your Monorepo Has 3 Independent Astro Projects:

/oneie/          ← Your main production site (one.ie)
├─ Edit here directly
├─ Deploy: bun run deploy
└─ Independent from /web

/web/            ← Starter template for users
├─ Edit here directly
├─ Deploy: ./scripts/release.sh patch
├─ Syncs to: /apps/oneie/web and /apps/one/web
└─ Independent from /oneie

/apps/oneie/web  ← Auto-generated copy of /web
├─ DO NOT edit here
├─ Gets overwritten by release.sh
└─ Only use for assembly/packaging
```

---

## Three Workflows

### Workflow 1: Developing one.ie (Most Common)

```bash
cd /oneie                    # Your main project
bun run dev                  # Start dev server
# ... edit & test
git add .
git commit -m "feat: description"
git push origin main
bun run deploy              # Live on one.ie
```

**No syncing needed.** Changes don't affect `/web`.

---

### Workflow 2: Developing /web (Sharing With Users)

```bash
cd /web                     # Starter template
bun run dev
# ... edit & test
git add .
git commit -m "feat: description"
git push origin main
cd ..
./scripts/release.sh sync   # Copies to /apps/oneie/web and /apps/one/web
```

**Syncing only affects `/apps/*/web/`.** Doesn't touch `/oneie`.

---

### Workflow 3: Syncing Changes Between Projects

If you want `/web` components to appear in `/oneie`:

```bash
# Step 1: Edit and commit /web
cd /web
# ... make changes
git add . && git commit -m "feat: update"
git push origin main

# Step 2: Sync /web to /apps/
cd ..
./scripts/release.sh sync

# Step 3: Copy to /oneie manually
cp -r /web/src/components/[specific] /oneie/src/components/
```

**Remember:** Syncing doesn't automatically update `/oneie`.

---

## When to Use Each

| Project    | Use When                  | Deploy               | Sync? |
| ---------- | ------------------------- | -------------------- | ----- |
| `/oneie`   | Building one.ie           | `bun run deploy`     | No    |
| `/web`     | Creating reusable starter | `./release.sh patch` | Yes   |
| `/backend` | Adding shared features    | `npx convex deploy`  | N/A   |
| `/one`     | Updating docs             | `./release.sh sync`  | Yes   |

---

## The Golden Rules

**1. Two Independent Projects**

- `/oneie/` won't sync to `/web/`
- `/web/` won't sync to `/oneie/`
- Syncing `/web` only affects `/apps/`, not `/oneie`

**2. Edit at Source, Never at Copy**

- ✅ Edit `/oneie` for one.ie
- ✅ Edit `/web` for starter
- ❌ Never edit `/apps/oneie/web` (it's auto-generated)

**3. Deploy Accordingly**

- `/oneie` → `bun run deploy`
- `/web` → `./scripts/release.sh patch`
- `/backend` → `npx convex deploy`

**4. Commit Before Syncing**

- Always `git push` before `release.sh`
- Sync will use what's in Git

**5. Test Locally First**

- `cd [project] && bun run dev`
- Test on `http://localhost:4321`
- Commit when satisfied

---

## Quick Decisions

**Q: I want to edit one.ie**
A: `cd /oneie && bun run dev` → Edit → `bun run deploy`

**Q: I want to edit the starter template**
A: `cd /web && bun run dev` → Edit → `./scripts/release.sh patch`

**Q: I want to share code between /web and /oneie**
A: Copy files manually or commit to both

**Q: Will my /oneie changes affect /web?**
A: No, they're independent.

**Q: Will my /web changes affect /oneie?**
A: No, unless you manually copy them.

**Q: What does syncing do?**
A: Copies `/web/` → `/apps/oneie/web` and `/apps/one/web` (not `/oneie`)

**Q: Should I edit /apps/oneie/web?**
A: No, it's auto-generated. Edit `/oneie` instead.

---

## TL;DR of TL;DR

```
You have 2 independent projects:

/oneie/  = production site (one.ie)
/web/    = starter template

Pick one. Edit it. Deploy it. Done.

Don't expect them to sync automatically.
Copy code between them manually when needed.
```
