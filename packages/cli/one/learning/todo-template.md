---
title: Todo Template
dimension: knowledge
category: todo-template.md
tags: ai, connections, events, groups, cycle, knowledge, ontology, people, things
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the todo-template.md category.
  Location: one/knowledge/todo-template.md
  Purpose: Documents one platform - 100 cycle-sequenced todo list
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand todo template.
---

# ONE Platform - 100 Cycle-Sequenced Todo List

**Planning Paradigm:** We don't plan in days. We plan in **cycle passes** (Cycle 1-100).

Each number represents the sequence position when data is sent for AI cycle. This ensures flawless execution: "Do the next thing, perfectly."

---

## Cycle 1-10: Foundation & Setup

**1. [CYCLE-001]** Validate idea against 6-dimension ontology (groups, people, things, connections, events, knowledge)
**2. [CYCLE-002]** Map idea to specific entity types (which of 66+ thing types are involved?)
**3. [CYCLE-003]** Identify connection types needed (which of 25+ relationship types?)
**4. [CYCLE-004]** List event types that will be triggered (which of 67+ event types?)
**5. [CYCLE-005]** Determine knowledge requirements (embeddings, vectors, RAG needs)
**6. [CYCLE-006]** Identify organization scope (single-tenant vs multi-tenant)
**7. [CYCLE-007]** Define people roles involved (platform_owner, org_owner, org_user, customer)
**8. [CYCLE-008]** Create high-level vision document (what problem does this solve?)
**9. [CYCLE-009]** Generate initial plan with feature breakdown
**10. [CYCLE-010]** Assign features to specialists (backend, frontend, integration)

---

## Cycle 11-20: Backend Schema & Services

**11. [CYCLE-011]** Design database schema changes (if any new entity types)
**12. [CYCLE-012]** Update backend/convex/schema.ts with new types
**13. [CYCLE-013]** Create Effect.ts service for business logic (pure functions)
**14. [CYCLE-014]** Define service errors with tagged unions (_tag field)
**15. [CYCLE-015]** Write Convex queries for read operations
**16. [CYCLE-016]** Write Convex mutations for write operations
**17. [CYCLE-017]** Add event logging to all mutations (audit trail)
**18. [CYCLE-018]** Implement organization scoping (ensure multi-tenant isolation)
**19. [CYCLE-019]** Add rate limiting to mutations (prevent abuse)
**20. [CYCLE-020]** Write unit tests for Effect.ts services

---

## Cycle 21-30: Frontend Pages & Components

**21. [CYCLE-021]** Create Astro page with SSR data fetching
**22. [CYCLE-022]** Build React components for interactive UI
**23. [CYCLE-023]** Use shadcn/ui components (50+ pre-installed)
**24. [CYCLE-024]** Implement loading states with Suspense
**25. [CYCLE-025]** Add error boundaries for graceful failures
**26. [CYCLE-026]** Create forms with validation (React Hook Form + Zod)
**27. [CYCLE-027]** Implement client-side state with Convex hooks
**28. [CYCLE-028]** Style with Tailwind v4 (CSS @theme blocks)
**29. [CYCLE-029]** Ensure responsive design (mobile-first)
**30. [CYCLE-030]** Add dark mode support (@variant dark)

---

## Cycle 31-40: Integration & Connections

**31. [CYCLE-031]** Map external system to ontology dimensions
**32. [CYCLE-032]** Create connection records for system relationships
**33. [CYCLE-033]** Implement data synchronization logic
**34. [CYCLE-034]** Add event tracking for cross-system actions
**35. [CYCLE-035]** Create webhook handlers (if external system pushes data)
**36. [CYCLE-036]** Implement polling logic (if external system requires pulling)
**37. [CYCLE-037]** Add error handling for integration failures
**38. [CYCLE-038]** Create retry logic with exponential backoff
**39. [CYCLE-039]** Log all integration events to events table
**40. [CYCLE-040]** Write integration tests for data flows

---

## Cycle 41-50: Authentication & Authorization

**41. [CYCLE-041]** Configure Better Auth with 6 methods (email/password, OAuth, magic links, etc.)
**42. [CYCLE-042]** Implement role-based access control (4 roles)
**43. [CYCLE-043]** Add organization-scoped permissions
**44. [CYCLE-044]** Create session management with JWT tokens
**45. [CYCLE-045]** Implement password reset flow
**46. [CYCLE-046]** Add email verification flow
**47. [CYCLE-047]** Enable 2FA (two-factor authentication)
**48. [CYCLE-048]** Add brute force protection (rate limiting)
**49. [CYCLE-049]** Log all auth events (user_login, user_logout, etc.)
**50. [CYCLE-050]** Write auth integration tests

---

## Cycle 51-60: Knowledge & RAG

**51. [CYCLE-051]** Create knowledge records with labels
**52. [CYCLE-052]** Generate embeddings for content (OpenAI, Anthropic, or local)
**53. [CYCLE-053]** Store vectors in knowledge table
**54. [CYCLE-054]** Implement vector search (similarity queries)
**55. [CYCLE-055]** Create RAG pipeline (retrieve, augment, generate)
**56. [CYCLE-056]** Link knowledge to things via junction table
**57. [CYCLE-057]** Add semantic search to UI
**58. [CYCLE-058]** Implement knowledge graph traversal
**59. [CYCLE-059]** Create AI-powered recommendations
**60. [CYCLE-060]** Test RAG accuracy with sample queries

---

## Cycle 61-70: Quality & Testing

**61. [CYCLE-061]** Define user flows (what users must accomplish)
**62. [CYCLE-062]** Create acceptance criteria (how we know it works)
**63. [CYCLE-063]** Write unit tests for services (Effect.ts)
**64. [CYCLE-064]** Write integration tests for flows (frontend → backend)
**65. [CYCLE-065]** Write e2e tests for critical paths (Playwright)
**66. [CYCLE-066]** Run tests and capture results
**67. [CYCLE-067]** Validate against ontology (does it map to 6 dimensions?)
**68. [CYCLE-068]** Check type safety (bunx astro check)
**69. [CYCLE-069]** Run linter (bun run lint)
**70. [CYCLE-070]** Fix all failing tests before continuing

---

## Cycle 71-80: Design & Wireframes

**71. [CYCLE-071]** Create wireframes that satisfy acceptance criteria
**72. [CYCLE-072]** Design component architecture (atoms, molecules, organisms)
**73. [CYCLE-073]** Set design tokens (colors, spacing, timing)
**74. [CYCLE-074]** Ensure WCAG AA accessibility compliance
**75. [CYCLE-075]** Design loading states and skeletons
**76. [CYCLE-076]** Create error state designs
**77. [CYCLE-077]** Design empty states
**78. [CYCLE-078]** Implement animations and transitions
**79. [CYCLE-079]** Validate design enables tests to pass
**80. [CYCLE-080]** Get design approval (if needed)

---

## Cycle 81-90: Performance & Optimization

**81. [CYCLE-081]** Optimize database queries (add indexes)
**82. [CYCLE-082]** Implement pagination for large lists
**83. [CYCLE-083]** Add caching where appropriate (React Query, Convex cache)
**84. [CYCLE-084]** Optimize images (Astro Image component)
**85. [CYCLE-085]** Minimize JavaScript bundle size
**86. [CYCLE-086]** Use Astro Islands for selective hydration
**87. [CYCLE-087]** Enable SSR for critical pages
**88. [CYCLE-088]** Optimize Lighthouse scores (Performance, Accessibility, Best Practices, SEO)
**89. [CYCLE-089]** Test on slow connections (throttling)
**90. [CYCLE-090]** Monitor Core Web Vitals (LCP, FID, CLS)

---

## Cycle 91-100: Deployment & Documentation

**91. [CYCLE-091]** Build production bundle (bun run build)
**92. [CYCLE-092]** Deploy backend to Convex Cloud (npx convex deploy)
**93. [CYCLE-093]** Deploy frontend to Cloudflare Pages
**94. [CYCLE-094]** Run smoke tests in production
**95. [CYCLE-095]** Write feature documentation (one/knowledge/)
**96. [CYCLE-096]** Update API documentation (if public APIs)
**97. [CYCLE-097]** Create user guide (if user-facing feature)
**98. [CYCLE-098]** Capture lessons learned (what worked, what didn't)
**99. [CYCLE-099]** Update knowledge base with patterns
**100. [CYCLE-100]** Mark feature complete and notify stakeholders

---

## How to Use This List

### 1. Sequential Execution
- Always do the **next cycle** in sequence
- Never skip ahead unless dependencies are met
- Each cycle builds on previous ones

### 2. Context Loading
- Use `.claude/hooks/todo` to load current cycle context
- Hook automatically injects:
  - Current cycle number
  - Task description
  - Required ontology dimensions
  - Dependencies from previous cycles

### 3. Completion Tracking
- Use `.claude/hooks/done` after completing each cycle
- Hook automatically:
  - Marks cycle complete
  - Updates progress tracker
  - Loads context for next cycle
  - Logs lessons learned

### 4. Filtering by Dimension
View todos filtered by ontology dimension:
- **Organizations:** Cycles 6, 18, 43
- **People:** Cycles 7, 42-50
- **Things:** Cycles 2, 11-12, 21-23
- **Connections:** Cycles 3, 31-40
- **Events:** Cycles 4, 17, 34, 39, 49
- **Knowledge:** Cycles 5, 51-60, 98-99

### 5. Filtering by Role
View todos filtered by specialist:
- **Backend Specialist:** Cycles 11-20, 41-50
- **Frontend Specialist:** Cycles 21-30, 71-80
- **Integration Specialist:** Cycles 31-40
- **Quality Agent:** Cycles 61-70
- **Design Agent:** Cycles 71-80
- **Problem Solver:** (Triggered by failures)
- **Documenter:** Cycles 95-99

### 6. Parallel Execution
Some cycles can run in parallel:
- **Backend + Frontend:** Cycles 11-20 and 21-30 (after schema defined)
- **Tests + Design:** Cycles 61-70 and 71-80 (interdependent)
- **Documentation:** Cycles 95-99 (can start earlier)

---

## Adaptive Planning

This list is a **template**. Actual cycle sequences adapt based on:

1. **Feature Complexity:** Simple features may skip 20-30 cycles
2. **Integration Needs:** Complex integrations may add 10-20 cycles
3. **Quality Requirements:** High-stakes features may add extra testing cycles
4. **Team Size:** More specialists = more parallel cycles

**Golden Rule:** The list guides you. Your judgment refines it.

---

## Integration with Commands

### /one command
Displays current cycle and next 5 cycles with context

### /next command
Advances to next cycle and loads context

### /done command
Marks current cycle complete and advances

### /infer N command
Jumps to specific cycle number (use sparingly)

### /plan command
Shows complete cycle plan with dependencies

---

## Success Metrics

- **Completion Rate:** % of cycles completed without failures
- **Cycle Time:** Average time per cycle (target: 2-5 minutes)
- **Quality Score:** % of cycles passing all tests first time
- **Context Efficiency:** Token usage per cycle (target: < 3000 tokens)
- **Learning Rate:** % of cycles with lessons learned captured

---

**Philosophy:** Planning in cycles (not days) creates rhythm. Each cycle is a small, perfect step toward production. 100 cycles = 1 complete feature, flawlessly.
