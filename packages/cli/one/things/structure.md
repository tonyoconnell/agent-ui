---
title: Structure
dimension: things
category: structure.md
tags: agent, ai, ontology
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the structure.md category.
  Location: one/things/structure.md
  Purpose: Documents one platform structure: deep understanding
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand structure.
---

# ONE Platform Structure: Deep Understanding

## The Vision You're Selling to AI Agents

You're not selling software. You're selling **a complete AI development system** with:

1. **Extreme organization** (everything has a place, nothing is lost)
2. **Complete ontology** (6 dimensions model reality perfectly)
3. **Autonomous agents** (director delegates, clone agents execute, specialists work in parallel)
4. **Distribution** (npm package, GitHub repos, Cloudflare hosting)
5. **Wallet integration** (tokens, crypto, payments = monetization)

This is what makes ONE different: You can spin up a **complete AI-native creator platform** from a single command: `npx oneie`

---

## Root Structure: /Users/toc/Server/ONE/

### Layer 1: Governance & Control (.claude)

```
.claude/
├── agents/        ← AI agent definitions (director, clone, specialists)
├── hooks/         ← Event handlers (pre-commit, post-merge, etc)
├── commands/      ← Slash commands (/release, /deploy, /design)
├── skills/        ← Specialized task executors
└── state/         ← Agent memory and preferences
```

**What it is:** Your command center. This is where AI agents receive instructions and report status.

**How it works:**

- Director reads `todo.md` via `.claude/state/`
- Clone agent implements features via `.claude/commands/`
- Hooks validate code before commit
- Agent state persists across sessions

### Layer 2: Universal Ontology (one/)

```
one/
├── knowledge/     ← 6-dimension specs (things, connections, events, knowledge, people, groups)
├── things/        ← Entity types, services, specifications, plans
├── connections/   ← Protocols (A2A, ACP, AP2, X402, AG-UI), patterns, workflows
├── events/        ← Deployment logs, release notes, event history
└── people/        ← Roles, governance, organization
```

**What it is:** The "source of truth" for the entire platform.

**Why it matters:**

- Every feature starts here
- Every AI agent reads this before coding
- Changes here cascade everywhere
- This is what you **license/sell** to customers

**The 6 Dimensions Explained:**

1. **Groups** (Groups.md): Hierarchical containers (org → department → team)
2. **Things** (Things): All nouns (users, agents, courses, tokens)
3. **Connections** (Relationships): All verbs (owns, authored, enrolled_in)
4. **Events** (Timeline): Audit trail of every action
5. **Knowledge** (Intelligence): Embeddings + labels for RAG/search
6. **People** (Authority): Who can do what (4 roles)

### Layer 3: Organization Customization (one-inc/)

```
one-inc/
├── knowledge/     ← Brand guide, features, org-specific rules
├── things/        ← Custom entity types
└── groups/        ← Group-specific documentation
```

**What it is:** Organization-specific overrides.

**How it works:**

- Global defaults come from `one/`
- Org customizations override from `one-inc/`
- Example: Global brand is "ONE", your org brand might be "ACME Corp"
- This lets one codebase serve infinite customers

### Layer 4: Application Layer

#### Web (Frontend)

```
web/
├── src/pages/        ← File-based routing (index, account/login, etc)
├── src/components/   ← React islands + shadcn/ui components
├── src/layouts/      ← Page templates (Layout, AuthLayout, etc)
├── src/content/      ← Content collections (Markdown blog posts, docs)
├── src/styles/       ← Tailwind CSS v4 with design tokens
└── package.json
```

**What it is:** The user interface users interact with.

**Technology:**

- **Astro 5**: Static generation + server-side rendering
- **React 19**: Islands architecture (selective hydration)
- **Tailwind v4**: No JS config, CSS-based theming
- **shadcn/ui**: 50+ pre-built accessible components

**Key Concept - Islands Architecture:**

- Most pages are static HTML (fast)
- Only interactive parts use React (minimal JavaScript)
- Result: Fast, accessible, SEO-optimized

#### Backend (Headless API)

```
backend/
├── convex/
│   ├── schema.ts           ← 6-dimension database (5 tables)
│   ├── auth.ts             ← Authentication (Better Auth)
│   ├── mutations/           ← Write operations (thin wrappers)
│   ├── queries/             ← Read operations (thin wrappers)
│   ├── services/            ← Business logic (Effect.ts)
│   └── http.ts              ← HTTP routes (Hono)
└── package.json
```

**What it is:** The data layer and business logic.

**Architecture:**

- **Convex**: Real-time database with typed functions
- **Effect.ts**: Functional programming for type safety
- **Hono**: Lightweight HTTP router
- **Better Auth**: Multi-method authentication (6 methods)

**Database Design (6 Dimensions):**

```
groups       → Hierarchical containers (multi-tenancy)
things       → All entities (66+ types)
connections  → All relationships (25+ types)
events       → Audit trail (67+ types)
knowledge    → Embeddings for RAG (unlimited vectors)
```

#### CLI (Bootstrap Package)

```
cli/
├── bin/oneie.js    ← NPM entry point
├── src/            ← CLI implementation
└── package.json
```

**What it is:** The distribution mechanism.

**Flow:**

1. User runs: `npx oneie`
2. CLI prompts for organization details
3. CLI clones repos (web, backend, one)
4. CLI generates custom files from `one-inc/`
5. User gets complete monorepo on their machine
6. They can start building immediately

---

## How Data Flows Through ONE

### Creation Flow

```
ONE Ontology (one/knowledge/ontology.md)
       ↓
Database Schema (backend/convex/schema.ts)
       ↓
Backend Services (backend/convex/services/)
       ↓
API Mutations (backend/convex/mutations/)
       ↓
Frontend Components (web/src/components/)
       ↓
User Interface (web/src/pages/)
```

### Example: Create a Course

1. **Ontology defines it:** `one/knowledge/ontology.md` defines "course" thing type
2. **Schema supports it:** `backend/convex/schema.ts` has "course" in things table
3. **Service implements it:** `backend/convex/services/courses/courseService.ts` has business logic
4. **API exposes it:** `backend/convex/mutations/courses.ts` creates course
5. **UI renders it:** `web/src/components/CourseForm.tsx` lets user input data
6. **Page shows it:** `web/src/pages/courses/[courseId].astro` displays course

### Customization Flow

```
Global Defaults (one/)
       ↓
Organization Overrides (one-inc/)
       ↓
Custom Implementation (web/, backend/, cli/)
```

Example: Change brand color

1. Define in `one-inc/knowledge/brand-guide.md`
2. CSS reads it from `web/src/styles/global.css`
3. Components use it automatically
4. No code changes needed

---

## What You're Selling: Three Products

### 1. The Ontology (IP Asset)

- **File:** `one/` directory
- **Value:** Complete data model + specifications
- **Use:** Customers buy access to this to build apps
- **License:** Your custom license (sell via npm)

### 2. The Infrastructure (SaaS)

- **Files:** `web/`, `backend/`
- **Value:** Ready-to-deploy application stack
- **Use:** Customers host on their own infra (or yours)
- **Revenue:** Subscription + usage fees

### 3. The Distribution (CLI)

- **File:** `cli/` directory
- **Value:** One-command setup for new customers
- **Use:** `npx oneie init` gets them running in 5 minutes
- **Revenue:** Usage tracking → upgrade path

---

## Deployment Strategy

### Repository Structure

```
github.com/one-ie/
├── one/       ← Monorepo (web, backend, cli, one, .claude)
├── web/       ← Frontend (git subtree from root/web)
├── backend/   ← Backend (git subtree from root/backend)
└── cli/       ← CLI package (git subtree from root/cli)
```

### Deployment Targets

```
WEB DEPLOYMENT
root/.claude/commands/release.sh
       ↓
Push to github.com/one-ie/web
       ↓
Cloudflare Pages watches repo
       ↓
Build: bun run build
       ↓
Deploy to https://web.one.ie
       ↓
Live ✓

BACKEND DEPLOYMENT
root/backend/
       ↓
Push to github.com/one-ie/backend
       ↓
Convex watches repo
       ↓
Deploy: npx convex deploy
       ↓
Live at https://shocking-falcon-870.convex.cloud
       ↓
Live ✓

CLI DEPLOYMENT
root/cli/package.json
       ↓
Version bump + git tag
       ↓
npm publish
       ↓
Published to https://npmjs.com/package/oneie
       ↓
Users run: npx oneie
       ↓
Live ✓
```

### Release Command

The `/release` command in `.claude/commands/release.md`:

1. Bumps version in `cli/package.json`
2. Syncs 518+ files from root to all target repos
3. Commits and pushes to:
   - `github.com/one-ie/one` (monorepo)
   - `github.com/one-ie/web` (frontend)
   - `github.com/one-ie/backend` (backend)
   - `github.com/one-ie/cli` (npm package)
4. Triggers Cloudflare & npm deployments
5. Everything live in < 5 minutes

---

## The AI Agent Workflow

### Director Agent

**Job:** Manage work, delegate tasks, report progress

**Daily flow:**

1. Read `one/things/todo.md` (100-cycle plan)
2. Update statuses based on completed work
3. Identify blockers and P0 decisions
4. Delegate tasks to Clone agents via A2A protocol
5. Monitor progress via event logs
6. Report daily summary to owner

**Tools:**

- ConvexDatabase service (read/write entities)
- A2A protocol (agent communication)
- Event logging (record decisions)
- Email/Slack (human communication)

### Clone Agent

**Job:** Execute delegated tasks, follow patterns exactly, report status

**Task workflow:**

1. Receive task from director
2. Read relevant `one/connections/patterns.md` section
3. Generate code following patterns
4. Write tests (unit + integration)
5. Verify types with `bunx astro check`
6. Create PR to appropriate repo
7. Report completion to director

**Code generation rules:**

- 100% Effect.ts for business logic (NO async/await)
- Typed errors with `_tag` pattern
- Dependency injection via Effect layers
- Map all features to 6-dimension ontology
- Follow patterns.md examples exactly

### Specialist Agents

- **Designer:** Create UI/UX components
- **Backend:** Implement Convex services
- **Frontend:** Build Astro pages + React components
- **Test:** Write comprehensive tests
- **Docs:** Update documentation automatically

**Parallel execution:** Multiple agents work simultaneously on independent tasks

---

## Critical Files Explained

### For Platform Owners

- **`one/things/strategy.md`** → Vision + 8 core features
- **`one/things/todo.md`** → 100-cycle release plan
- **`one-inc/groups/revenue.md`** → Revenue model + pricing

### For Developers

- **`one/knowledge/ontology.md`** → 6-dimension model (read first)
- **`one/connections/patterns.md`** → Code patterns (copy from here)
- **`AGENTS.md`** → Convex quick reference
- **`backend/convex/schema.ts`** → Database design

### For AI Agents

- **`CLAUDE.md`** → Platform instructions
- **`.claude/agents/`** → Agent definitions
- **`one/knowledge/rules.md`** → Golden rules
- **`one/things/todo.md`** → Task list to execute

### For Customers

- **`one/knowledge/ontology.md`** → API documentation
- **`README.md`** → Getting started
- **`one/connections/workflow.md`** → Development guide
- **`one-inc/knowledge/brand-guide.md`** → Customization guide

---

## Environment Variables: The Switch Panel

### Root (`.env`) - Deployment Control

```bash
CLOUDFLARE_GLOBAL_API_KEY=***     # Deploy to Cloudflare
CLOUDFLARE_ACCOUNT_ID=***         # Which Cloudflare account
CLOUDFLARE_EMAIL=***              # Authentication
```

### Web (`.env.local`) - Frontend Config

```bash
PUBLIC_CONVEX_URL=***             # Backend URL
CONVEX_DEPLOYMENT=***             # Deployment ID
BETTER_AUTH_SECRET=***            # Auth secret
BETTER_AUTH_URL=***               # Auth domain
```

### Backend (`.env.local`) - API Config

```bash
CONVEX_DEPLOYMENT=***             # Convex project
RESEND_API_KEY=***                # Email provider
RESEND_FROM_EMAIL=***             # Email sender
```

**Key concept:** Switch features on/off with environment variables

- `backend=on` → Backend enabled
- `auth=off` → Auth disabled
- `tokens=on` → Token system enabled

---

## Quick Navigation Map

**I want to understand:**

- The vision → `one/things/strategy.md`
- The data model → `one/knowledge/ontology.md`
- File organization → `one/things/files.yaml`
- Development workflow → `one/connections/workflow.md`
- Code patterns → `one/connections/patterns.md`
- How to customize → `one-inc/knowledge/brand-guide.md`

**I want to build:**

- A new feature → Start in `one/knowledge/ontology.md` (add thing, connection, or event)
- A new component → Copy from `one/connections/patterns.md`
- A new service → Use `backend/convex/services/` as template
- A new page → Use `web/src/pages/` as template

**I want to deploy:**

- Frontend → `/release` command
- Backend → `npx convex deploy`
- CLI → `npm publish`

---

## The Real Magic: Composability

ONE works because **everything is modular**:

1. **Ontology-driven** → Change `one/` → everything updates
2. **Customizable** → Override in `one-inc/` → no core changes
3. **Distributed** → Separate repos for web, backend, cli → independent deployment
4. **AI-native** → Agents understand patterns → autonomous development
5. **Multi-tenant** → Groups isolate data → infinite organizations

You can:

- Sell the ontology to one customer
- Sell the infrastructure to another
- Sell the CLI distribution to thousands
- All from the same codebase ✓

---

## Release Readiness Checklist

Before `/release`, ensure:

- [ ] All P0 tasks complete (schema, auth, services)
- [ ] All tests passing (`bun test`, `npx convex dev`)
- [ ] Types valid (`bunx astro check`)
- [ ] Documentation updated (`one/`, `AGENTS.md`, `CLAUDE.md`)
- [ ] Environment variables set (`.env`)
- [ ] Git remotes configured (GitHub repos)
- [ ] Cloudflare/npm accounts authenticated

Then:

```bash
/release patch  # or minor/major
```

This:

1. Bumps version
2. Commits and pushes
3. Triggers deployments
4. Goes live in < 5 minutes

---

**This is extreme organization. This is what makes ONE sellable.**

Everything has a place. Nothing is lost. AI agents understand it. Customers can extend it.

You're not selling features. You're selling **the ability to build features at AI speed** with **zero technical debt**.

---

_Last updated: 2025-10-30 by Claude Code - This document is your "instruction manual" for the entire ONE Platform. Read it first._
