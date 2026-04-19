---
title: Ontology Release
dimension: knowledge
category: ontology-release.md
tags: 6-dimensions, backend, frontend, ontology
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the ontology-release.md category.
  Location: one/knowledge/ontology-release.md
  Purpose: Documents one platform release mapping v1.0.0
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand ontology release.
---

# ONE Platform Release Mapping v1.0.0

**What Gets Released | Where It Goes | How It Deploys**

---

## Release Flow (Single Source of Truth)

```
/Users/toc/Server/ONE/ (ROOT)
    │
    ├─ /web/          ↓ Synced to github.com/one-ie/web
    ├─ /one/          ↓ Synced to github.com/one-ie/one
    ├─ /.claude/      ↓ Synced to github.com/one-ie/one
    ├─ /backend/      ↓ Synced to github.com/one-ie/one
    ├─ /cli/          ↓ Synced to github.com/one-ie/cli
    └─ one-inc/       ↓ Organization customization (overrides /one/)
```

**Execution:** `./scripts/release.sh [major|minor|patch]`

---

## What Gets Released

### 1. **Web** (`/web/` → `github.com/one-ie/web`)
- **What:** Astro 5 + React 19 frontend (2000+ lines)
- **Where:** Frontend git subtree
- **Deploy:** Cloudflare Pages → `https://web.one.ie`
- **Build:** `bun run build` → `dist/`
- **Deploy:** `wrangler pages deploy dist --project-name=web`

### 2. **Ontology** (`/one/` → `github.com/one-ie/one`)
- **What:** 41 documentation files (73,000+ lines)
- **Includes:**
  - `one/knowledge/` - 6-dimension specs (groups, things, connections, events, knowledge, people)
  - `one/things/` - Entity types, services, plans, todo.md (100-cycle sequence)
  - `one/connections/` - Protocols (A2A, ACP, AP2, X402, AG-UI), patterns, workflows
  - `one/events/` - Deployment history, logs
  - `one/people/` - Roles, governance
- **Purpose:** Source of truth for entire platform
- **Distribution:** Synced to npm package + GitHub

### 3. **AI Agents** (`/.claude/` → `github.com/one-ie/one`)
- **What:** Agent definitions, hooks, commands, state
- **Includes:**
  - `.claude/agents/` - Director, clone, specialists (7+ agents)
  - `.claude/hooks/` - Pre-commit, post-merge, submit-prompt handlers
  - `.claude/commands/` - `/release`, `/deploy`, `/design` slash commands
  - `.claude/state/` - Agent memory and cycle context
- **Purpose:** Control center for AI-driven development
- **Distribution:** Synced to all repos

### 4. **Backend** (`/backend/` → `github.com/one-ie/one`)
- **What:** Convex + Effect.ts backend (2000+ lines)
- **Deploy:** `npx convex deploy` → `https://shocking-falcon-870.convex.cloud`
- **Includes:**
  - `schema.ts` - 6-dimension database (5 tables)
  - `queries/`, `mutations/` - Convex functions
  - `services/` - Business logic (Effect.ts)

### 5. **CLI Package** (`/cli/` → `github.com/one-ie/cli` → npm)
- **What:** npm package `oneie` (1500+ lines)
- **Entry:** `bin/oneie.js`
- **Purpose:** Bootstrap new installations (`npx oneie init`)
- **Publish:** `npm publish --access public`
- **Live:** `https://npmjs.com/package/oneie`

### 6. **Root Documentation**
- **What:** CLAUDE.md, AGENTS.md, README.md, LICENSE.md, SECURITY.md
- **Purpose:** Platform instructions + quick reference
- **Distribution:** Synced to all repos

---

## Installation Customization (`one-inc/`)

**Flow:**
```
Global (one/)
    ↓
Installation Override (one-inc/)
    ↓
Implementation (web/, backend/, cli/)
```

**Structure:**
```
one-inc/
├── knowledge/
│   ├── brand-guide.md      ← Custom branding (overrides global)
│   ├── features.md         ← Installation features
│   └── rules.md            ← Installation-specific rules
├── things/
│   └── features.md         ← Custom entity types
└── groups/
    └── (group-specific docs)
```

**Example:** Change brand color
1. Define in `one-inc/knowledge/brand-guide.md`
2. CSS reads from `web/src/styles/global.css`
3. All components use automatically
4. No code changes needed

---

## Deployment Targets

### npm Registry
```
cli/package.json (version bump)
    ↓
npm version [patch|minor|major]
    ↓
npm publish --access public
    ↓
https://npmjs.com/package/oneie (LIVE)
```

### GitHub Repositories
```
Root /Users/toc/Server/ONE/
    ↓
github.com/one-ie/one        (monorepo: web, backend, cli, one, .claude)
github.com/one-ie/web        (frontend subtree)
github.com/one-ie/cli        (npm package)
```

### Cloudflare Pages
```
web/ (root/web)
    ↓
bun run build → dist/
    ↓
wrangler pages deploy dist --project-name=web
    ↓
https://web.one.ie (LIVE)
```

---

## Release Command Sequence

**Input:** `/release patch` (or minor/major)

**Steps:**
1. **Pre-flight validation** - `./scripts/pre-deployment-check.sh`
2. **Version bump** - cli/package.json (e.g., 1.0.0 → 1.0.1)
3. **File sync** - 518+ files to distribution repos:
   - `/one/*` → `cli/one/` and `one-ie/one/one/`
   - `/.claude/*` → `cli/.claude/` and `one-ie/one/.claude/`
   - `/web/*` → `github.com/one-ie/web` (git subtree)
   - Root docs → all targets
4. **Git operations:**
   - Commit to one-ie/one (auto-push)
   - Commit to one-ie/cli (prompt for push)
   - Create git tags (v1.0.1)
5. **npm publish** - `cd cli && npm publish --access public`
6. **Web build** - `cd web && bun run build`
7. **Cloudflare deploy** - `wrangler pages deploy dist --project-name=web`
8. **Verify** - Check all targets live

**Time:** ~12-15 minutes total

---

## 6-Dimension Ontology (What Gets Defined)

**Implemented in:** `backend/convex/schema.ts` (5 tables)

### 1. Groups - Hierarchical containers
- Multi-tenancy via `groupId`
- 6 types: friend_circle, business, community, dao, government, organization
- Infinite nesting (parent → child → grandchild)

### 2. Things - All entities
- 66+ entity types (user, course, token, agent, etc.)
- Flexible `properties` field
- Status lifecycle: draft → active → published → archived

### 3. Connections - All relationships
- 25+ connection types (owns, authored, enrolled_in, etc.)
- Bidirectional with temporal validity
- Rich metadata per relationship

### 4. Events - Complete audit trail
- 67+ event types
- Every action creates an event
- Timestamp, actor, target, metadata
- Complete history for compliance

### 5. Knowledge - Semantic understanding
- Embeddings for RAG (Retrieval-Augmented Generation)
- Labels for categorization
- Junction table (thingKnowledge) for linking
- Vector search support

### 6. People - Authorization
- 4 roles: platform_owner, group_owner, group_user, customer
- Represented as things with `type: 'creator'`
- Role metadata in `properties`

---

## Critical Files

**For Release:**
- `/scripts/release.sh` - Full release pipeline
- `/.claude/commands/release.md` - Release command spec
- `/.claude/agents/agent-ops.md` - Ops agent responsibilities

**For Ontology:**
- `one/knowledge/ontology.md` - Core 6-dimension spec
- `one/things/structure.md` - Architecture overview
- `one/connections/patterns.md` - Code generation patterns

**For Development:**
- `CLAUDE.md` - Platform instructions
- `AGENTS.md` - Convex quick reference
- `one/things/todo.md` - 100-cycle release plan

---

## Environment Variables (Release)

```bash
# Root .env (CRITICAL for Cloudflare deployment)
CLOUDFLARE_GLOBAL_API_KEY=your-global-api-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_EMAIL=your-email@domain.com

# Web .env.local (Frontend)
PUBLIC_CONVEX_URL=https://shocking-falcon-870.convex.cloud
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
BETTER_AUTH_SECRET=your-secret-key

# Backend .env.local (API)
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
RESEND_API_KEY=your-resend-api-key
```

---

## Release Checklist

- [ ] All tests passing (`bun test`)
- [ ] No uncommitted changes
- [ ] Documentation updated (one/, CLAUDE.md)
- [ ] Run pre-deployment check: `./scripts/pre-deployment-check.sh`
- [ ] Web builds: `cd web && bun run build`
- [ ] Execute: `./scripts/release.sh [patch|minor|major]`
- [ ] Verify npm: `npm view oneie version`
- [ ] Verify web: `curl https://web.one.ie`
- [ ] Test CLI: `npx oneie@latest --version`

---

## Success Criteria

✅ **All targets deployed:**
- npm package live
- GitHub repos updated with tags
- Cloudflare Pages live at https://web.one.ie
- All 518+ files synced

✅ **Version consistency:**
- cli/package.json matches npm package
- Git tags match release version
- All repos show same version

✅ **No technical debt:**
- Tests passing everywhere
- Types valid (bunx astro check)
- Documentation updated
- Deployment report created

---

## Philosophy

**One Source of Truth:** Everything in `/Users/toc/Server/ONE/` is released as-is to production.

**Modular Distribution:** Same code serves three products:
1. Ontology (IP asset) - License to build
2. Infrastructure (SaaS) - Host + run
3. Distribution (CLI) - Easy onboarding

**Installation Customization:** `one-inc/` lets one codebase serve infinite groups without schema changes.

**Extreme Clarity:** If it's not in the release mapping, it doesn't get released.

---

**Last updated:** 2025-10-30
**Version:** v1.0.0
**Status:** Production Ready

**Reference:** `one/things/structure.md` (architecture source of truth)
