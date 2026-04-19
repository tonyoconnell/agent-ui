---
title: Development Commands Reference
dimension: knowledge
category: development
tags: commands, development, workflow, tools
related_dimensions: all
scope: global
created: 2025-11-08
version: 1.0.0
ai_context: |
  Complete reference of all development commands for frontend, backend, testing,
  and deployment workflows in the ONE platform.
---

# Development Commands Reference

**Quick reference for all development workflows.**

---

## Frontend Development

```bash
cd web/

# Development server (localhost:4321)
bun run dev

# Build for production (includes type checking)
bun run build

# Type checking only
bunx astro check

# Generate content collection types
bunx astro sync

# Linting
bun run lint

# Formatting
bun run format
```

---

## Backend Development

```bash
cd backend/

# Start Convex dev server (watch mode)
npx convex dev

# Deploy to production
npx convex deploy

# Run query from CLI
npx convex run queries/entities:list '{"type": "user"}'

# View function logs
npx convex logs --history 50 --success
```

---

## Testing

```bash
cd web/

# Run all tests
bun test

# Run auth tests specifically
bun test test/auth

# Watch mode
bun test --watch
```

**Test Coverage:**

- 50+ test cases for authentication (6 methods: email/password, OAuth, magic links, password reset, email verification, 2FA)
- Integration tests verify frontend → backend auth flows
- Backend connection: `https://shocking-falcon-870.convex.cloud`

---

## Cycle Workflow Commands

```
     ██████╗ ███╗   ██╗███████╗
    ██╔═══██╗████╗  ██║██╔════╝
    ██║   ██║██╔██╗ ██║█████╗
    ██║   ██║██║╚██╗██║██╔══╝
    ╚██████╔╝██║ ╚████║███████╗
     ╚═════╝ ╚═╝  ╚═══╝╚══════╝

       Make Your Ideas Real

   https://one.ie  •  npx oneie

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /now   /next   /todo   /done
 /build /design /deploy  /see
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Workflow Commands:**
- `/now` - Display current cycle and what you're working on
- `/next` - Advance to next cycle and load context
- `/todo` - View complete task list (100-cycle sequence)
- `/done` - Mark current cycle complete and advance

**Creation Commands:**
- `/build` - Build features with AI specialists
- `/design` - Create wireframes & UI components
- `/deploy` - Ship to production

**Insight Commands:**
- `/see` - View analytics, refine vision, explore courses

---

## Deployment

### Automated Release (v3.0.0+)

```bash
# Patch release (bug fixes)
/release patch

# Minor release (new features)
/release minor

# Major release (breaking changes)
/release major

# Sync files without version bump
/release sync
```

**Read full deployment guide:** `/.claude/commands/release.md`

### Manual Deployment

**Web (Cloudflare Pages):**

```bash
cd web/
bun run build
wrangler pages deploy dist --project-name=web
```

**Backend (Convex Cloud):**

```bash
cd backend/
npx convex deploy
```

Convex automatically deploys on git push when connected to GitHub.

---

## Installation Management

```bash
# Initialize new installation folder
npx oneie init

# Prompts for:
# - Organization name
# - Installation identifier
# Creates folder structure and updates .env.local
```

---

## Common Command Sequences

**Starting a new feature:**
```bash
# 1. Load current cycle
/now

# 2. Run dev servers (parallel terminals)
cd web && bun run dev          # Terminal 1
cd backend && npx convex dev    # Terminal 2

# 3. Work on feature...

# 4. Test changes
cd web && bun test

# 5. Mark cycle complete
/done
```

**Deploying a release:**
```bash
# All-in-one deployment
/release minor

# Manual deployment
cd web && bun run build && wrangler pages deploy dist
cd backend && npx convex deploy
```

**Debugging an issue:**
```bash
# Check types
cd web && bunx astro check

# Check backend logs
cd backend && npx convex logs --history 50

# Run specific tests
cd web && bun test test/auth/email-password.test.ts
```

---

## Environment Setup

**Root (.env):**
```bash
CLOUDFLARE_GLOBAL_API_KEY=your-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_EMAIL=your-email
```

**Web (.env.local):**
```bash
PUBLIC_CONVEX_URL=https://shocking-falcon-870.convex.cloud
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:4321
```

**Backend (.env.local):**
```bash
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

**Quick access to the right command for the task at hand.**
