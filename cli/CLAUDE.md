# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL RULES - NEVER BREAK THESE

**THESE RULES ARE NON-NEGOTIABLE:**

1. **NEVER run `git rebase`** - ever, under any circumstances
2. **NEVER run `git push --force`** - always ask first
3. **NEVER run commands that delete files** - always ask first
4. **ALWAYS ask before any potentially destructive operation** - staged deletion, force push, rewriting history, etc.

If you are about to run a command that could lose work, destroy commits, or overwrite history, STOP and ask the user for explicit approval first.

---

## Cascading Context System

**You are reading the ROOT context file.** As you navigate deeper into the codebase, read directory-specific CLAUDE.md files:

```
/CLAUDE.md (this file - global orchestration)
  ↓ Navigate to subdirectory
/web/CLAUDE.md (frontend-specific, higher precedence in web/)
  ↓ Navigate deeper
/web/src/components/CLAUDE.md (component-specific, highest precedence)
  ↓ Or navigate to backend
/backend/CLAUDE.md (backend-specific, higher precedence in backend/)
  ↓ Navigate deeper
/backend/convex/CLAUDE.md (database-specific, highest precedence in backend/)
```

**Precedence rule:** Closer to the file you're editing = higher precedence.

**Parallel Agent Execution:** When tasks can be done independently, spawn agents in PARALLEL (not sequentially). Send a SINGLE message with multiple Task tool calls to execute agents concurrently for 2-5x faster execution.

---

## Architecture Overview

**ONE Platform** is a multi-tenant AI-native platform built on a **6-dimension ontology** that models reality itself.

```
Web (Astro + React) → Backend (Convex) → 6-Dimension Ontology
```

**Key Repositories:**
- `/web` - Frontend (Astro 5, React 19, Tailwind v4) - see `web/CLAUDE.md`
- `/backend` - Backend (Convex, Effect.ts, Better Auth) - see `backend/CLAUDE.md`
- `/one` - Documentation (41 files, 8 layers organized by 6 dimensions)
- `/.claude` - Agent definitions & commands
- `/apps` - Example applications

**Read full architecture:** `/one/knowledge/architecture.md`

---

## The 6-Dimension Ontology

**Read canonical specification:** `/one/knowledge/ontology.md` (Version 1.0.0)

**Quick Reference:**
1. **GROUPS** → Multi-tenant containers (groupId scoping, infinite nesting)
2. **PEOPLE** → Authorization & roles (4 roles: platform_owner, org_owner, org_user, customer)
3. **THINGS** → All entities (66+ types: users, agents, content, tokens, courses)
4. **CONNECTIONS** → All relationships (25+ types: owns, follows, purchased, holds_tokens)
5. **EVENTS** → Complete audit trail (67+ types: created, updated, purchased, completed)
6. **KNOWLEDGE** → Labels + vectors (RAG, search, categorization)

**Golden Rule:** If you can't map a feature to these 6 dimensions, you're thinking about it wrong.

**Implementation:** 5 database tables (groups, things, connections, events, knowledge) implement the 6 dimensions. People are represented as things with `type: 'creator'`.

---

## Cycle-Based Planning

**We plan in cycles (1-100), not days.** Each cycle = concrete step, < 3k tokens.

**Commands:**
- `/now` - Display current cycle
- `/next` - Advance to next cycle
- `/todo` - View 100-cycle sequence
- `/done` - Mark complete and advance
- `/build` - Build features with AI specialists
- `/design` - Create wireframes & UI components
- `/deploy` - Ship to production

**Benefits:** 98% context reduction (150k → 3k tokens), 5x faster execution, flawless execution through "do the next thing, perfectly."

**Read full system:** `/one/knowledge/todo.md`

---

## Development Workflow (6-Phase Process)

**Before implementing ANY feature, follow this workflow:**

1. **UNDERSTAND** → Read `/one/knowledge/ontology.md`, `/one/knowledge/rules.md`, identify category
2. **MAP TO ONTOLOGY** → Identify groups, people, things, connections, events, knowledge
3. **DESIGN SERVICES** → Design Effect.ts services (pure business logic)
4. **IMPLEMENT BACKEND** → Create Convex mutations/queries (thin wrappers)
5. **BUILD FRONTEND** → Create React components (render the 6 dimensions)
6. **TEST & DOCUMENT** → Write tests, update documentation

**Read full workflow:** `/one/connections/workflow.md`

---

## Template-First Development

**CRITICAL PRINCIPLE:** Always reuse existing templates and components. NEVER build from scratch when a template exists.

### Template Discovery Process
1. **User requests feature** → Parse intent and identify feature type
2. **Search existing templates** → Check pages/components for similar patterns
3. **Propose template** → Show user the template being used
4. **Copy and customize** → Modify template for specific needs
5. **Offer enhancements** → Suggest Stripe, features, etc.

### Template Registry
- **Product landing pages:** `/web/src/pages/shop/product-landing.astro` (includes Stripe)
- **Template guide:** `/web/src/pages/shop/TEMPLATE-README.md`
- **Components library:** `/web/src/components/` (50+ shadcn/ui components)
- **Page patterns:** Search `/web/src/pages/**/*.astro` for similar routes

### Development Speed
- Template-driven: **Minutes**
- From-scratch: **Hours**

**Golden Rule:** If someone wants to sell a product → use product-landing template. If someone wants any feature → search first, build second.

---

## Technology Stack

**Frontend:** Astro 5, React 19, Tailwind v4, shadcn/ui (50+ components), Better Auth
**Backend:** Convex (real-time database), Effect.ts (business logic), Better Auth + Convex Adapter
**Deployment:** Cloudflare Pages (frontend), Convex Cloud (backend at `shocking-falcon-870.convex.cloud`)

**Read full stack details:** `/one/knowledge/architecture.md#technology-stack`

---

## Root Directory File Policy

**CRITICAL:** Only these markdown files belong in the root directory:
- **README.md** - Platform overview and quick start
- **LICENSE.md** - Legal terms and conditions
- **SECURITY.md** - Security policy and vulnerability reporting
- **CLAUDE.md** - Claude Code instructions (this file)
- **AGENTS.md** - AI agent coordination and rules

All other documentation belongs in `/one/` following the 6-dimension ontology:
- **one/events/** - Deployment plans, release notes, test results, agent summaries
- **one/knowledge/** - Architecture, patterns, rules, guides
- **one/connections/** - Protocols, workflows, integrations
- **one/things/** - Specifications, plans, agent definitions
- **one/people/** - Roles, governance, organization

---

## File Structure

```
ONE/
├── web/                    # Frontend (see web/CLAUDE.md)
│   ├── src/
│   │   ├── pages/         # File-based routing (see web/src/pages/CLAUDE.md)
│   │   ├── components/    # React components (see web/src/components/CLAUDE.md)
│   │   ├── layouts/       # Page layouts
│   │   ├── content/       # Content collections
│   │   └── lib/           # Utilities
│   └── test/              # Test suites
├── backend/                # Backend (see backend/CLAUDE.md)
│   └── convex/            # Convex schema and functions (see backend/convex/CLAUDE.md)
│       ├── schema.ts      # 6-dimension ontology (5 tables)
│       ├── queries/       # Read operations
│       └── mutations/     # Write operations
├── one/                    # Platform documentation (41 files, 8 layers)
│   ├── connections/       # Ontology, protocols, patterns
│   ├── things/            # Architecture, specifications
│   ├── events/            # Event specs, deployment history
│   ├── knowledge/         # RAG, AI, implementation guides
│   └── people/            # Roles, governance, organization
├── .claude/                # Claude Code configuration
│   ├── agents/            # AI agent definitions
│   └── commands/          # Slash commands (/deploy, /commit, etc.)
└── apps/                   # Example applications
```

---

## Critical Reading Before Coding

**For ANY feature implementation:**
1. `/one/knowledge/ontology.md` - 6-dimension model (Version 1.0.0)
2. `/one/connections/workflow.md` - 6-phase development process
3. `/one/knowledge/rules.md` - Golden rules for AI development
4. Subdirectory CLAUDE.md (web/, backend/, etc.) - Layer-specific patterns

**For specific feature types:**
- **Protocol integration:** `/one/connections/protocols.md` + specific protocol doc
- **External integration:** `/one/connections/communications.md`
- **Blockchain features:** `/one/connections/cryptonetworks.md`
- **Agent features:** `/one/things/agentkit.md`, `/one/things/copilotkit.md`
- **Frontend patterns:** `/one/knowledge/patterns/frontend/`
- **Backend patterns:** `/one/knowledge/patterns/backend/`

---

## Installation Folders

Each ONE installation can have a top-level folder for organization-specific customization:

```
/<installation-name>/       # Customer-specific overrides
├── knowledge/
│   ├── brand-guide.md     # Custom branding
│   ├── features.md        # Organization features
│   └── rules.md           # Org-specific rules
└── groups/                # Hierarchical group docs
```

**Key Principle:** Data isolation happens via `groupId` in the database, NOT via schema customization. The 6-dimension ontology is universal.

**Read full guide:** `/one/knowledge/installation-folders.md`

---

## Deployment

### Automated Release (v3.0.0+)

Use `/release` command for complete deployment:

```bash
/release patch   # Bug fixes
/release minor   # New features
/release major   # Breaking changes
/release sync    # Sync files without version bump
```

**The release process automatically:**
1. Bumps version in `cli/package.json`
2. Syncs 518+ files to `cli/` and `apps/one/`
3. Commits and pushes to GitHub repositories
4. Publishes to npm: `oneie@<version>`
5. Builds and deploys web to Cloudflare Pages

**Live URLs:**
- npm: https://www.npmjs.com/package/oneie
- Web: https://web.one.ie

**Read release process:** `.claude/commands/release.md`, `.claude/agents/agent-ops.md`

### Manual Deployment

**Frontend:**
```bash
cd web/ && bun run build && wrangler pages deploy dist
```

**Backend:**
```bash
cd backend/ && npx convex deploy
```

---

## Development Commands

**Frontend:**
```bash
cd web/
bun run dev      # Development server (localhost:4321)
bun run build    # Build for production
bunx astro check # Type checking
```

**Backend:**
```bash
cd backend/
npx convex dev   # Start Convex dev server
npx convex deploy # Deploy to production
```

**Testing:**
```bash
cd web/
bun test         # Run all tests
bun test --watch # Watch mode
```

**Read full commands:** `/one/knowledge/development-commands.md`

---

## Getting Help

**Documentation:**
- 6-Dimension Ontology: `/one/knowledge/ontology.md`
- Architecture: `/one/knowledge/architecture.md`
- Workflows: `/one/connections/workflow.md`
- Patterns: `/one/connections/patterns.md`
- Rules: `/one/knowledge/rules.md`
- Troubleshooting: `/one/knowledge/troubleshooting.md`

**Agent Coordination:**
- Director: `/.claude/agents/agent-director.md`
- Builder Squad: `/.claude/agents/agent-builder.md`, `agent-frontend.md`, `agent-backend.md`
- Quality Loop: `/.claude/agents/agent-quality.md`, `agent-clean.md`, `agent-problem-solver.md`
- Integration: `/.claude/agents/agent-integrator.md`

**Claude Code Documentation:**
For questions about Claude Code itself, read: https://docs.claude.com/en/docs/claude-code/

---

**Built with clarity, simplicity, and infinite scale in mind.**
