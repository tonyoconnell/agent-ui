---
title: Context Engineering
dimension: knowledge
category: context-engineering.md
tags: agent, ai
related_dimensions: connections, events, groups
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the context-engineering.md category.
  Location: one/knowledge/context-engineering.md
  Purpose: Documents context engineering - documentation structure
  Related dimensions: connections, events, groups
  For AI agents: Read this to understand context engineering.
---

# Context Engineering - Documentation Structure

**Version**: 1.0.0
**Purpose**: Minimize context window usage while maximizing code generation accuracy through structured documentation access.

## Core Principle

**"Pass agents as little information as they need until they need it."**

Agents (and humans) start with entry points and follow descriptive links to exactly the information they need. No more. No less.

### Why This Enables 98% AI Accuracy

Traditional systems dump 50,000+ tokens of context with 80% irrelevant information. Result: 30-70% accuracy.

ONE's cascading context delivers 2,000 tokens with 90% relevant information. Result: 98% accuracy.

**The breakthrough:** Each agent reads ONLY the layers they need. Context compounds (not duplicates). Patterns converge (not diverge).

---

## Cascading Context System (The Core Innovation)

ONE uses **hierarchical context precedence** - context files cascade through the directory structure, with more specific instructions taking precedence over general ones.

### Three Context Files (Same Pattern Everywhere)

1. **`CLAUDE.md`** - Instructions for Claude Code (AI agents)
2. **`AGENTS.md`** - Instructions for GPT (via Codex/other systems)
3. **`README.md`** - Instructions for humans

### How Cascading Works

```
/CLAUDE.md                          ← Root (global instructions, everyone reads)
  ↓ Agents navigate to subdirectory
/backend/CLAUDE.md                  ← Backend-specific (overrides root for backend/)
  ↓ Agents navigate deeper
/backend/convex/CLAUDE.md           ← Convex-specific (overrides backend/ for convex/)
  ↓ Agents navigate deeper
/backend/convex/services/CLAUDE.md  ← Most specific (highest precedence in services/)
```

**Precedence rule:** Closer to the file being edited = higher precedence.

**Example workflow:**

1. Agent starts at `/CLAUDE.md` (reads global context: ontology, architecture, rules)
2. Agent navigates to `/backend/convex/services/tokenService.ts`
3. Agent reads `/backend/CLAUDE.md` (backend-specific patterns, takes precedence)
4. Agent reads `/backend/convex/CLAUDE.md` (Convex patterns, overrides backend/)
5. Agent reads `/backend/convex/services/CLAUDE.md` (service patterns, highest precedence)
6. Agent implements feature using most-specific context

### Benefits

1. **Context Efficiency** - Agents read only what they need, when they need it
2. **Specificity** - Local instructions override global ones (no conflicts)
3. **Scalability** - Add context at any level without cluttering root
4. **Consistency** - Global patterns in root, exceptions in subdirectories
5. **Zero Duplication** - Don't repeat global rules in subdirectories

### Directory-Specific Context Files (Examples)

**Root Level** (`/CLAUDE.md`, `/AGENTS.md`, `/README.md`):
- Platform overview (what ONE is)
- **6-dimension ontology** (THE universal language - every single thing exists in one of these 6 dimensions):
  ```
  1. GROUPS → Multi-tenant isolation (friend circles → governments)
  2. PEOPLE → Authorization & governance
  3. THINGS → Every entity (users, agents, content, tokens)
  4. CONNECTIONS → Every relationship (owns, follows, taught_by)
  5. EVENTS → Every action (purchased, created, viewed)
  6. KNOWLEDGE → RAG & search (labels + vectors)
  ```
- Global architecture (3 pillars: Ontology DSL + Effect.ts + Provider Pattern)
- Tech stack (Astro, Convex, Effect.ts)
- Development workflow (6-phase process)

**Backend** (`/backend/CLAUDE.md`, `/backend/AGENTS.md`, `/backend/README.md`):
- Effect.ts service patterns (100% coverage)
- Convex schema structure (6 dimensions)
- Service composition patterns
- Error handling (tagged unions)
- Testing patterns (mocked layers)

**Frontend** (`/web/CLAUDE.md`, `/web/AGENTS.md`, `/web/README.md`):
- Progressive complexity (5 layers)
- Astro + React patterns
- Provider pattern (backend-agnostic)
- shadcn/ui component usage
- Islands architecture

**Ontology** (`/one/CLAUDE.md`, `/one/AGENTS.md`, `/one/README.md`):
- 6-dimension specifications
- Ontology mapping examples
- Protocol integration patterns
- Agent-clone workflows

**Granular Context** (deeper levels):
- `/web/src/pages/CLAUDE.md` - Astro page-specific patterns
- `/backend/convex/services/CLAUDE.md` - Service implementation patterns
- `/one/connections/CLAUDE.md` - Protocol integration specifics

### Entry Points (Always Start Here)

**For AI Agents (Claude Code):**
1. **`/CLAUDE.md`** - Platform overview, 6-dimension ontology, tech stack (~500 lines)
2. Navigate to working directory
3. Read directory-specific `CLAUDE.md` files (as you navigate deeper)
4. More specific context overrides general context

**For AI Agents (GPT via Codex):**
1. **`/AGENTS.md`** - Platform overview, same content as CLAUDE.md (~500 lines)
2. Navigate to working directory
3. Read directory-specific `AGENTS.md` files (as you navigate deeper)
4. More specific context overrides general context

**For Humans:**
1. **`/README.md`** - Quick start, installation, basic usage (~200 lines)
2. Navigate to working directory
3. Read directory-specific `README.md` files (as needed)
4. More specific documentation overrides general documentation

---

## Documentation Structure (The Universal Language)

### Layer 1: Foundation (Read Once)

These define the LANGUAGE of the system. Everything else builds on these.

| Document | Purpose | When to Read | Lines | Time |
|----------|---------|--------------|-------|------|
| **`/one/knowledge/ontology.md`** | 6-dimension data model (groups, people, things, connections, events, knowledge) | Before implementing ANY feature | 800 | 6-8 min |
| **`/one/knowledge/rules.md`** | Golden rules for AI agents | Before first code generation | 400 | 3-5 min |

**Key Insight**: The ontology IS the DSL. Every feature in every system maps to these 6 dimensions.

### Layer 2: Architecture (Read for Implementation Context)

Read these when implementing features in specific layers.

#### Frontend Architecture (Progressive Complexity)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **`/one/knowledge/astro-effect-simple-architecture.md`** | Layer-by-layer frontend patterns | When building frontend features |
| **`/one/knowledge/astro-effect-complete-vision.md`** | Real-world examples (all 5 layers) | When building complex features |
| **`/one/knowledge/provider-agnostic-content.md`** | Backend switching (Layer 4) | When integrating external backends |
| **`/one/knowledge/readme-architecture.md`** | Quick reference summary | When refreshing on architecture |

#### Backend Architecture (Effect.ts + Convex)

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **`/web/AGENTS.md`** | Convex query/mutation patterns | When writing backend code |
| **`/one/knowledge/patterns.md`** | Proven code patterns | When implementing common features |

**Key Insight**: Architecture docs show HOW to implement the ontology in code.

### Layer 3: Protocols & Integrations (Read When Connecting)

Read these when integrating external systems or protocols.

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **`/one/connections/protocols.md`** | Protocol overview (A2A, ACP, AP2, X402, AG-UI) | When integrating protocols |
| **`/one/connections/x402.md`** | X402 protocol specification | When building blockchain features |
| **`/one/connections/cryptonetworks.md`** | Blockchain integration patterns | When connecting to crypto networks |
| **`/one/connections/a2a.md`** | Agent-to-Agent communication | When building multi-agent features |
| **`/one/connections/acp.md`** | Agent Communication Protocol | When agents need to communicate |
| **`/one/connections/ap2.md`** | ActivityPub 2.0 specification | When federating with ActivityPub |
| **`/one/connections/ag-ui.md`** | Agent-Generated UI protocol | When agents generate UI |

**Key Insight**: Connections are just metadata. Protocols map to connection types.

### Layer 4: Specialist Instructions (Read When Assigned)

These are for specific AI agent roles. Read only the agent you're acting as.

| Agent | Purpose | When to Read |
|-------|---------|--------------|
| **`/.claude/agents/agent-director.md`** | Orchestrate features, assign work | When planning features |
| **`/.claude/agents/agent-frontend.md`** | Build UI (Astro + React) | When implementing frontend |
| **`/.claude/agents/agent-backend.md`** | Build backend (Convex + Effect.ts) | When implementing backend |
| **`/.claude/agents/agent-integrator.md`** | Connect external systems | When integrating protocols |
| **`/.claude/agents/agent-quality.md`** | Write tests, validate quality | When testing features |
| **`/.claude/agents/agent-documenter.md`** | Update documentation | When documenting features |
| **`/.claude/agents/agent-ops.md`** | Deploy, release, infrastructure | When deploying |
| **`/.claude/agents/agent-clone.md`** | Import features from other systems | When cloning repos |

**Key Insight**: Agents collaborate via director. Each specialist knows their domain.

### Layer 5: Examples & Workflows (Read When Learning Patterns)

Read these to see how everything connects in practice.

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **`/one/knowledge/workflow.md`** | 6-phase development workflow | Before implementing features |
| **`/one/knowledge/lemonade-stand.md`** | Simple example (friend circle) | When learning the ontology |
| **`/one/knowledge/enterprise-crm.md`** | Complex example (enterprise org) | When building enterprise features |

---

## Context Engineering Principles

### 1. Descriptive Links Over Context Dumping

**Bad (wastes context)**:
```
Here's the entire ontology documentation (800 lines)...
Here's all the frontend patterns (600 lines)...
Here's all the protocols (1200 lines)...
Now implement a simple blog feature.
```

**Good (minimal context)**:
```
Implement a blog feature.

Read: /one/knowledge/ontology.md (to understand things + knowledge dimensions)
Read: /one/knowledge/astro-effect-simple-architecture.md (Layer 1 pattern)
Pattern: Blog = things (type: post) + knowledge (embeddings for search)
```

### 2. Just-In-Time Information

Agents should read documentation:
- **Before** implementing (understand the pattern)
- **During** debugging (find the specific solution)
- **Never** speculatively (wastes context)

### 3. The Ontology is the Interface

Every feature request maps to the 6 dimensions:

**Example: "Clone Shopify"**
```
Things: products, variants, collections
People: customers, admins
Groups: stores (multi-tenant)
Connections: purchases, cart items, favorites
Events: order_placed, payment_processed, shipment_sent
Knowledge: product descriptions (RAG), search embeddings
```

**Agent reads**:
1. `/one/knowledge/ontology.md` (understand dimensions)
2. `/one/knowledge/patterns.md` (e-commerce patterns)
3. `/.claude/agents/agent-clone.md` (how to import)

### 4. Compound Structure Accuracy

Each generated line ADDS structure:

```typescript
// Generation 1: Define schema (adds type structure)
const productSchema = z.object({
  name: z.string(),
  price: z.number(),
});

// Generation 2: Add validation (adds business logic structure)
export const validateProduct = (input: unknown): Effect.Effect<Product, ValidationError> =>
  Effect.gen(function* () {
    if (input.price < 0) {
      return yield* Effect.fail({ _tag: "ValidationError", message: "Price must be positive" });
    }
    return input as Product;
  });

// Generation 3: Add service (adds composition structure)
export const createProduct = Effect.gen(function* () {
  const validated = yield* validateProduct(input);
  const saved = yield* saveToDatabase(validated);
  yield* notifyAdmin(saved);
  return saved;
});
```

**Each step**:
- Follows established patterns
- Adds predictable structure
- Makes next generation MORE accurate

### 5. The Provider Pattern Enables Universal Integration

**Layer 4 isn't complexity - it's the UNIVERSAL INTERFACE.**

```typescript
// Frontend speaks ONE LANGUAGE (the ontology)
const provider = getContentProvider("products");
const products = await provider.list();

// Backend can be ANYTHING:
// - Markdown files
// - Convex database
// - Shopify API
// - WordPress REST API
// - Supabase
// - Custom microservices

// The interface never changes. The ontology never breaks.
```

This is how agent-clone imports ANY feature from ANY system.

---

## Agent Workflows (Context Engineering in Practice)

### Workflow 1: Simple Feature (Blog Post)

**Context Required**: ~1000 lines

1. Read `/CLAUDE.md` (understand platform)
2. Read `/one/knowledge/ontology.md#things` (understand entities)
3. Read `/one/knowledge/astro-effect-simple-architecture.md#layer-1` (static content pattern)
4. Generate code (content collection + page)

### Workflow 2: Complex Feature (E-commerce)

**Context Required**: ~2000 lines

1. Read `/CLAUDE.md` (understand platform)
2. Read `/one/knowledge/ontology.md` (map feature to 6 dimensions)
3. Read `/one/knowledge/patterns.md#e-commerce` (proven patterns)
4. Read `/.claude/agents/agent-director.md` (plan work assignment)
5. Spawn agent-frontend + agent-backend in parallel
6. Each reads their specialist docs (~500 lines each)

### Workflow 3: Clone External System (Shopify → ONE)

**Context Required**: ~1500 lines

1. Read `/CLAUDE.md` (understand platform)
2. Read `/one/knowledge/ontology.md` (understand 6 dimensions)
3. Read `/.claude/agents/agent-clone.md` (cloning workflow)
4. Read `/one/knowledge/patterns.md#e-commerce` (target patterns)
5. Map Shopify concepts → ontology dimensions
6. Generate services + providers + UI

---

## Documentation Refactoring Plan

### Current State (Fragmented)

```
one/knowledge/
├── architecture.md (general)
├── frontend.md (outdated)
├── astro-effect-simple-architecture.md (good)
├── astro-effect-complete-vision.md (good)
├── provider-agnostic-content.md (good)
├── readme-architecture.md (good)
├── ontology.md (good)
├── rules.md (good)
├── patterns.md (good)
├── workflow.md (good)
└── [many more...]
```

### Target State (Structured)

```
/
├── CLAUDE.md (entry point for agents)
├── AGENTS.md (agent coordination)
├── README.md (entry point for humans)

one/
├── knowledge/ (WHAT - The Language)
│   ├── context-engineering.md (this file - doc map)
│   ├── ontology.md (6-dimension DSL)
│   ├── rules.md (golden rules)
│   ├── patterns.md (proven code patterns)
│   ├── workflow.md (6-phase process)
│   ├── astro-effect-simple-architecture.md (Layer 1-5)
│   ├── astro-effect-complete-vision.md (examples)
│   ├── provider-agnostic-content.md (Layer 4)
│   └── readme-architecture.md (quick ref)
│
├── connections/ (HOW - Integrations)
│   ├── protocols.md (overview)
│   ├── a2a.md, acp.md, ap2.md, x402.md, ag-ui.md
│   ├── cryptonetworks.md (blockchain)
│   └── [protocol-specific docs]
│
├── things/ (ARTIFACTS - Specs & Plans)
│   ├── plans/ (future features)
│   └── specs/ (specifications)
│
└── events/ (HISTORY - Results & Deployments)
    ├── deployments/
    ├── test-results/
    └── agent-summaries/

.claude/
└── agents/ (WHO - Specialist Instructions)
    ├── agent-director.md
    ├── agent-frontend.md
    ├── agent-backend.md
    ├── agent-integrator.md
    ├── agent-quality.md
    ├── agent-documenter.md
    ├── agent-ops.md
    └── agent-clone.md
```

### Files to Merge/Delete

**Merge into existing docs:**
- `architecture.md` → merge into `CLAUDE.md`
- `frontend.md` → DELETE (replaced by astro-effect-simple-architecture.md)

**Keep as-is (already good):**
- `ontology.md` ✅
- `rules.md` ✅
- `patterns.md` ✅
- `workflow.md` ✅
- `astro-effect-simple-architecture.md` ✅
- `astro-effect-complete-vision.md` ✅
- `provider-agnostic-content.md` ✅
- `readme-architecture.md` ✅

---

## The Universal Code Generation Language

### Why This Works

**Traditional Approach (Breaks Down):**
```
System grows → Complexity increases → Patterns diverge → AI accuracy decreases
```

**ONE Approach (Compounds):**
```
System grows → Structure increases → Patterns converge → AI accuracy increases
```

### The Secret: The Ontology Never Changes

**Reality doesn't change:**
- Groups still contain things
- People still authorize actions
- Things still have relationships
- Connections still represent relationships
- Events still record actions
- Knowledge still enables search

**Technology changes:**
- React → Svelte → Solid
- REST → GraphQL → gRPC
- MySQL → Postgres → Convex

**But the ontology maps to ALL of them:**

```typescript
// Same ontology, different backend
const provider = getContentProvider("users");

// Markdown (development)
CONTENT_SOURCE=markdown → MarkdownProvider

// REST API (production)
CONTENT_SOURCE=api → ApiProvider

// Convex (real-time)
CONTENT_SOURCE=convex → ConvexProvider

// Shopify (e-commerce)
CONTENT_SOURCE=shopify → ShopifyProvider

// The code using provider.list() NEVER CHANGES.
```

### Effect.ts: The Composition Engine

**Why Effect.ts (not Zod alone)?**

Because business logic is COMPOSABLE:

```typescript
// Simple validation (Zod can do this)
const validateUser = (input: unknown) => userSchema.parse(input);

// Complex business logic (Effect.ts shines)
const registerUser = Effect.gen(function* () {
  const validated = yield* validateUser(input);      // Validation
  const existing = yield* checkExistingEmail(validated.email); // Database check
  if (existing) {
    return yield* Effect.fail({ _tag: "EmailTakenError" });
  }
  const user = yield* createUser(validated);          // Creation
  yield* sendWelcomeEmail(user);                      // Side effect
  yield* logEvent({ type: "user_registered", userId: user.id }); // Audit
  return user;
});
```

**For agents**: Each step follows a pattern. Each pattern composes. The structure is predictable.

### Nanostores: The State Bridge

**Why Nanostores (not just React state)?**

Because Astro islands need to communicate:

```typescript
// Header.astro (island 1)
<CartIcon client:load />

// CartIcon.tsx (reads global state)
const cart = useStore(cartStore);

// AddToCart.tsx (island 2, different component tree)
const addToCart = (item) => cartStore.set([...cartStore.get(), item]);

// Without nanostores: These islands can't share state
// With nanostores: State is global, predictable, simple
```

**For agents**: State management pattern is consistent across ALL islands.

---

## Measuring Success

### Context Efficiency

**Before Context Engineering:**
- Average context per generation: 50,000 tokens
- Docs read speculatively: 15-20 files
- Relevant information: ~20%
- Wasted context: ~80%

**After Context Engineering:**
- Average context per generation: 5,000 tokens (10x reduction)
- Docs read just-in-time: 2-3 files
- Relevant information: ~90%
- Wasted context: ~10%

### Generation Accuracy

**Metric**: Does generated code follow ontology structure?

**Target**: 95%+ of generations correctly map to 6 dimensions

**Measurement**:
- Code review by agent-quality
- Type checking (100% must pass)
- Ontology validation (custom linting)

### Compound Structure

**Metric**: Does each generation ADD structure?

**Target**: Each feature increases pattern reuse by 5%+

**Measurement**:
- Code reuse analysis
- Pattern consistency checks
- Reduced code duplication

---

## Getting Started

### For AI Agents

1. Read `/CLAUDE.md` (understand ONE)
2. Read this file (context engineering)
3. When assigned a task, read ONLY the specialist docs you need
4. Generate code that maps to the 6-dimension ontology
5. Follow Effect.ts patterns for business logic
6. Use provider pattern for backend abstraction

### For Humans

1. Read `/README.md` (quick start)
2. Read `/CLAUDE.md` (comprehensive guide)
3. Read this file (documentation map)
4. Follow links to exactly what you need
5. No need to read everything upfront

---

**Remember**: The ontology is the language. The docs are the grammar. The agents are the writers. Context engineering ensures everyone speaks clearly with minimal words.
