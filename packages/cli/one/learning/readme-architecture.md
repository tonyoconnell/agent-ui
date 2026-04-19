---
title: Readme Architecture
dimension: knowledge
category: readme-architecture.md
tags: architecture, backend, system-design
related_dimensions: events, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the readme-architecture.md category.
  Location: one/knowledge/readme-architecture.md
  Purpose: Documents progressive complexity architecture: quick reference
  Related dimensions: events, people, things
  For AI agents: Read this to understand readme architecture.
---

# Progressive Complexity Architecture: Quick Reference

**Philosophy:** Start simple. Add layers only when needed. Every component is optional.

## The 5 Layers (Summary)

| Layer | What It Adds | When to Add | New Folders |
|-------|-------------|-------------|-------------|
| **1. Static** | Schema + Content + Pages | Blog, docs, marketing | `pages/`, `content/`, `components/` |
| **2. Validation** | Effect.ts business logic | Forms, validation | `+ lib/services/` |
| **3. State** | Nanostores + React hooks | Shared component state | `+ stores/`, `+ hooks/` |
| **4. Providers** | Multiple data sources | Offline, API migration, hybrid | `+ lib/providers/` |
| **5. Backend** | Database + Auth + API | User-generated content, real-time | `+ backend/` |

**Golden Rule:** Don't add a layer until you need it.

## Quick Decision Tree

```
Need database/auth? → Layer 5 (Full Stack)
   ↓ No
Need multiple data sources? → Layer 4 (Providers)
   ↓ No
Need shared state? → Layer 3 (State)
   ↓ No
Need validation/logic? → Layer 2 (Validation)
   ↓ No
Just content? → Layer 1 (Static) ✨ Start here
```

## Key Documents (Read in Order)

1. **astro-effect-simple-architecture.md** - Layer 1-2 core patterns (start here)
2. **astro-effect-complete-vision.md** - All 5 layers with real examples
3. **provider-agnostic-content.md** - Layer 4 provider switching in depth

## Code Examples (Minimal)

### Layer 1: Static Content
```typescript
// Define → Create → Query → Render
defineCollection({ schema: z.object({ name: z.string() }) })
const teams = await getCollection("teams");
<TeamCard team={team.data} />
```

### Layer 2: + Validation
```typescript
export const validateTeam = (data) =>
  Effect.gen(function* () {
    if (!data.name) return yield* Effect.fail("Name required");
    return data;
  });
```

### Layer 3: + State
```typescript
export const teams$ = atom<Team[]>([]);
export function useTeams() { return useAtomValue(teams$); }
```

### Layer 4: + Providers
```typescript
const provider = getContentProvider("teams");
const teams = await provider.list(); // Works with Markdown, API, or Hybrid
```

### Layer 5: + Backend
```typescript
// REST API + Database + Auth
// Agent-driven CRUD + Audit trails
```

**See astro-effect-complete-vision.md for full examples.**

## Why This Architecture Wins

| For | Key Benefits |
|-----|-------------|
| **Code Generation** | Each layer independently generatable. No boilerplate. |
| **Enterprises** | Audit trails, compliance modes, data lineage tracking. |
| **AI Agents** | Autonomous CRUD via API. Type-safe error handling. Clear boundaries. |
| **Open Source** | Simple projects stay simple. Complex projects scale up naturally. |

**Details:** See astro-effect-complete-vision.md for enterprise/agent patterns.

## File Structure Evolution

```
Layer 1: src/pages, content, components
Layer 2: + lib/services (validation)
Layer 3: + stores, hooks (state)
Layer 4: + lib/providers (multiple sources)
Layer 5: + backend/ (database + API)
```

**Each layer adds folders only when needed. No premature structure.**

## Real-World Progression Examples

| Project Type | Layers Needed | Why |
|-------------|---------------|-----|
| Blog | 1 | Static content only |
| Blog + Comments | 1-2 | Need validation |
| Blog + Real-time Comments | 1-3 | Need shared state |
| Blog + Offline Reading | 1-4 | Multiple data sources |
| Blog + User Accounts | 1-5 | Database + auth required |

**You never add complexity until you need it.**

## Type Safety Guarantee

Every layer is fully type-safe:
- **Schema:** Zod validates at definition
- **Query:** TypeScript knows exact shape
- **Service:** Effect.ts exhaustive error types
- **Hook:** Precise return types
- **Component:** Fully typed props

**Details:** See astro-effect-simple-architecture.md for type patterns.

## Summary Table

| Layer | Adds | When | Optional? |
|-------|------|------|-----------|
| 1 | Static content | Always | Required |
| 2 | Validation | Forms, logic | Optional |
| 3 | State | Shared state | Optional |
| 4 | Providers | Multiple sources | Optional |
| 5 | Backend | Database, auth | Optional |

**Philosophy:** Maximum simplicity for simple things. Maximum power for complex things. Zero wasted motion.

---

## Next Steps

- **New to architecture?** Read astro-effect-simple-architecture.md
- **Need full examples?** Read astro-effect-complete-vision.md
- **Building Layer 4?** Read provider-agnostic-content.md
