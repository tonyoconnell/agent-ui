---
title: DSL Integration - Claude Code Ecosystem
dimension: things
category: plans
tags: dsl, claude-code, ontology, agents, commands
related_dimensions: knowledge, connections, events
scope: platform
created: 2025-11-08
updated: 2025-11-08
version: 1.0.0
status: ready
ai_context: |
  This plan integrates the Plain English DSL and Technical DSL from one/knowledge/dsl.md
  into the .claude/* ecosystem (agents, commands, skills, docs).
  Purpose: Enable 98% AI code generation accuracy through DSL-driven development.
  Execution: 18 cycles, 6 quick wins by Cycle 6, parallel execution possible.
---

# DSL Integration Plan - Claude Code Ecosystem

**Transform .claude/* files to understand and generate DSL-driven code**

## Executive Summary

**Objective:** Integrate the ONE Platform DSL (both Plain English and Technical syntax) into the Claude Code ecosystem (.claude/* files) to enable seamless idea → DSL → code workflow.

**Why:** The DSL is the universal language that maps reality to code. By teaching all agents and commands to "speak DSL," we achieve pattern convergence and 98% code generation accuracy.

**Scope:** 25-30 high-impact files across agents, commands, skills, and reference docs.

**Timeline:** 18 cycles (10 days with parallelization)

**Quick Win:** Cycle 6 - Core agents understand DSL and can guide users

---

## The Vision: English → DSL → Code → Reality

```
┌─────────────────────────────────────────────────────────────┐
│  User Vision (Plain English)                                │
│  "CREATE ai clone WITH voice cloning"                       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  DSL Validation (agent-director)                            │
│  ✓ Maps to entities (ai_clone)                             │
│  ✓ Uses valid services (elevenlabs)                        │
│  ✓ Logs events (clone_created)                             │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Code Generation (agent-backend)                            │
│  DSL → Effect.ts + Plain Convex mutations                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  Reality (Production)                                       │
│  Working AI clone deployed to edge                          │
└─────────────────────────────────────────────────────────────┘
```

**Current State:** DSL defined in `one/knowledge/dsl.md` but not integrated into .claude/* workflow

**Target State:** All agents, commands, and skills speak DSL natively

---

## Architecture: 18-Cycle Implementation

### Phase 1: Foundation (Cycles 1-2)

**Goal:** Audit and map DSL integration opportunities

**Cycles:**
- **Cycle 1:** Audit all .claude/* files (95+ files)
  - Categorize by DSL relevance (high/medium/low)
  - Identify integration points (where to add DSL examples)
  - Map DSL primitives to agent capabilities
  - **Output:** DSL integration map (.claude/state/dsl-integration-map.json)

- **Cycle 2:** Define DSL integration patterns
  - Create DSL snippet library (common patterns)
  - Define integration templates (agents vs commands vs skills)
  - Establish consistency rules
  - **Output:** DSL pattern library (.claude/DSL_PATTERNS.md)

**Agent:** agent-documenter (audit & analysis)

---

### Phase 2: Core Agents (Cycles 3-6) ⚡ QUICK WINS

**Goal:** Core agents understand and generate DSL

**Cycles:**
- **Cycle 3:** agent-director.md - Orchestration DSL
  - Add "Plain English → DSL Validation" section
  - Include DSL validation flow examples
  - Map user intent to DSL declarations
  - **Example:**
    ```
    User: "I want AI tutors for my courses"
    Director validates:
    ✓ Entity: ai_clone (type exists)
    ✓ Connection: teaching (valid relationship)
    ✓ Event: tutor_interaction (valid event type)
    ```

- **Cycle 4:** agent-backend.md - Compilation DSL
  - Add "DSL → Convex Compilation" section
  - Show DSL → Effect.ts examples
  - Explain Plain Convex (NO Convex Ents) output
  - **Example:**
    ```typescript
    // DSL Input
    { entity: { type: "ai_clone", name: "My Clone" } }

    // Compiled Output (Plain Convex)
    const cloneId = await ctx.db.insert("entities", {
      type: "ai_clone",
      name: "My Clone",
      properties: {},
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    ```

- **Cycle 5:** agent-quality.md - Validation DSL
  - Add "DSL Validation Patterns" section
  - Define ontology compliance checks
  - Add metadata pattern validation
  - **Example:**
    ```
    Validate DSL against ontology:
    1. Entity types (66 valid types)
    2. Connection types (25 valid types)
    3. Event types (67 valid types)
    4. Metadata patterns (consolidated types)
    ```

- **Cycle 6:** agent-frontend.md - Frontend-Only DSL
  - Add "Frontend-Only DSL Patterns" section
  - Show no-backend DSL examples
  - localStorage/nanostores patterns
  - **Example:**
    ```typescript
    // Frontend-only DSL (no backend entities)
    {
      flow: [
        { validate: { localStorage: "products" } },
        { query: { from: "localStorage", key: "cart" } },
        { service: { provider: "stripe", method: "checkout" } }
      ]
    }
    ```

**🎯 Milestone (Cycle 6):** Core agents can guide users from Plain English → DSL → Code

**Agent:** agent-documenter (documentation updates)

---

### Phase 3: Commands (Cycles 7-10)

**Goal:** Commands use DSL for feature generation

**Cycles:**
- **Cycle 7:** /chat.md - Vision Capture DSL
  - Add "Capture Vision in Plain English DSL" section
  - Map conversation → DSL primitives
  - Save DSL declarations to onboarding.json
  - **Example:**
    ```json
    {
      "vision": "Course platform with AI tutors",
      "dsl": {
        "entities": ["course", "lesson", "ai_clone"],
        "connections": ["enrolled_in", "taught_by"],
        "events": ["lesson_completed", "tutor_interaction"]
      }
    }
    ```

- **Cycle 8:** /plan.md - DSL Feature Templates
  - Add "DSL Feature Declaration" section
  - Generate plans with DSL snippets
  - Include DSL validation in planning
  - **Example:**
    ```
    Cycle 10: Implement AI tutor feature
    DSL Template:
    - Entity: ai_clone (voice + personality)
    - Service: elevenlabs.cloneVoice()
    - Connection: teaching (clone → course)
    - Event: tutor_interaction (log conversations)
    ```

- **Cycle 9:** /create.md - DSL-Based Generation
  - Add "Generate from DSL Template" section
  - Map feature requests to DSL patterns
  - Auto-generate DSL declarations
  - **Example:**
    ```
    /create ai-tutor

    Generates DSL:
    {
      feature: "AITutor",
      flow: [
        { entity: { type: "ai_clone" } },
        { service: { provider: "openai" } },
        { event: { type: "tutor_interaction" } }
      ]
    }
    ```

- **Cycle 10:** /fast.md - Rapid DSL Compilation
  - Add "DSL → Code (Fast)" section
  - Show instant DSL → TypeScript flow
  - Minimal cycle DSL patterns
  - **Example:**
    ```
    /fast payment-checkout

    DSL → Code in 1 cycle:
    1. Validate DSL (payment service available)
    2. Compile to Convex mutation
    3. Generate frontend component
    4. Deploy
    ```

**Agent:** agent-documenter (command updates)

---

### Phase 4: Skills (Cycles 11-14)

**Goal:** Skills use DSL for specialized operations

**Cycles:**
- **Cycle 11:** Skills/convex/* - DSL → Convex Patterns
  - create-mutation.md: Add DSL input examples
  - create-query.md: Add DSL query patterns
  - test-function.md: Add DSL test generation
  - **Files:** 5 skill files

- **Cycle 12:** Skills/ontology/* - DSL Validation Skills
  - validate-schema.md: Add DSL → schema validation
  - check-dimension.md: Add DSL dimension mapping
  - verify-relationships.md: Add DSL connection validation
  - **Files:** 5 skill files

- **Cycle 13:** Skills/testing/* - DSL Test Generation
  - generate-tests.md: Add DSL → test case generation
  - run-tests.md: Add DSL validation tests
  - analyze-coverage.md: Add DSL coverage metrics
  - **Files:** 4 skill files

- **Cycle 14:** Skills/documentation/* - DSL Documentation
  - generate-api-docs.md: Add DSL API doc generation
  - update-knowledge.md: Add DSL knowledge capture
  - create-migration-guide.md: Add DSL migration patterns
  - **Files:** 4 skill files

**Agent:** agent-documenter (skill updates)

---

### Phase 5: Cross-References (Cycles 15-17)

**Goal:** Centralized DSL references accessible everywhere

**Cycles:**
- **Cycle 15:** CLAUDE.md (Root) - DSL Overview
  - Add "Plain English DSL" section (300 tokens)
  - Link to one/knowledge/dsl.md (full spec)
  - Quick examples (CREATE, CONNECT, RECORD, CALL, CHECK)
  - **Location:** /CLAUDE.md

- **Cycle 16:** web/AGENTS.md - DSL Quick Reference
  - Add "DSL Quick Reference" section
  - Common DSL patterns for agents
  - Frontend-only DSL examples
  - **Location:** /web/AGENTS.md

- **Cycle 17:** .claude/DSL_QUICK_REFERENCE.md - Comprehensive Guide
  - Create new reference doc (2K tokens)
  - All DSL primitives explained
  - Full examples library
  - Validation rules
  - **Location:** /.claude/DSL_QUICK_REFERENCE.md (new file)

**Agent:** agent-documenter (reference docs)

---

### Phase 6: Validation (Cycle 18)

**Goal:** Verify DSL integration accuracy

**Cycle:**
- **Cycle 18:** Integration Validation
  - Test DSL examples in all updated files
  - Verify ontology compliance
  - Check cross-references consistency
  - Run validation hooks
  - **Output:** Validation report

**Agent:** agent-quality (validation & testing)

---

## File Impact Analysis

### High Priority (Full DSL Integration) - 6 Files

**Core Agents:**
1. `.claude/agents/agent-director.md` - Plain English → DSL validation
2. `.claude/agents/agent-backend.md` - DSL → Convex compilation
3. `.claude/agents/agent-quality.md` - DSL validation patterns
4. `.claude/agents/agent-frontend.md` - Frontend-only DSL
5. `.claude/agents/agent-ontology.md` - DSL ↔ Ontology mapping

**Core Commands:**
6. `.claude/commands/chat.md` - Vision → DSL capture

**Impact:** These 6 files enable the complete DSL workflow

---

### Medium Priority (DSL Examples) - 10 Files

**Commands:**
- `.claude/commands/plan.md` - DSL feature templates
- `.claude/commands/create.md` - DSL-based generation
- `.claude/commands/fast.md` - Rapid DSL compilation

**Skills (Convex):**
- `.claude/skills/convex/create-mutation.md`
- `.claude/skills/convex/create-query.md`
- `.claude/skills/convex/test-function.md`

**Skills (Ontology):**
- `.claude/skills/ontology/validate-schema.md`
- `.claude/skills/ontology/check-dimension.md`
- `.claude/skills/ontology/verify-relationships.md`

**Skills (Testing):**
- `.claude/skills/testing/generate-tests.md`

**Impact:** Add DSL examples and patterns to specialized operations

---

### Low Priority (DSL References) - 12 Files

**Reference Docs:**
- `/CLAUDE.md` - High-level DSL overview
- `/web/AGENTS.md` - DSL quick reference
- `/.claude/DSL_QUICK_REFERENCE.md` - Comprehensive guide (NEW)

**Skills (Documentation):**
- `.claude/skills/documentation/generate-api-docs.md`
- `.claude/skills/documentation/update-knowledge.md`
- `.claude/skills/documentation/create-migration-guide.md`

**Other Agents:**
- `.claude/agents/agent-documenter.md` - How to document DSL
- `.claude/agents/agent-integrator.md` - DSL protocol integration
- `.claude/agents/agent-designer.md` - DSL → UI specs
- `.claude/agents/agent-builder.md` - DSL rapid building
- `.claude/agents/agent-sales.md` - DSL for demos
- `.claude/agents/agent-clone.md` - DSL migration patterns

**Impact:** Context and references for comprehensive DSL understanding

---

### Not Needed (No DSL) - ~65 Files

**Excluded Categories:**
- Deployment scripts (push.md, release.md, deploy.md)
- Server management (server.md, mcp-on.md)
- Git workflows (commit.md)
- Hooks (validation scripts, formatters)
- MCP configuration
- Most specialized skills (Astro, design, sales KPIs)

**Reason:** These files are operational/infrastructure, not feature development

---

## DSL Integration Patterns

### Pattern 1: Plain English DSL (User-Facing)

**Used in:** /chat.md, agent-director.md

**Example:**
```
User: "CREATE ai clone WITH voice from my videos"

Maps to DSL:
- CREATE → Entity declaration
- ai clone → type: "ai_clone"
- WITH voice → Service: elevenlabs.cloneVoice()
- from my videos → Input: videoUrls
```

**Implementation:**
```markdown
## Plain English DSL Capture

When user describes features in natural language, map to DSL primitives:

| User Says | DSL Primitive | Example |
|-----------|---------------|---------|
| "CREATE X" | entity | `{ type: "ai_clone" }` |
| "CONNECT X to Y" | connect | `{ from: X, to: Y, type: "owns" }` |
| "RECORD X event" | event | `{ type: "clone_created" }` |
| "CALL X service" | service | `{ provider: "elevenlabs" }` |
| "CHECK X condition" | validate | `{ exists: true, type: "creator" }` |
```

---

### Pattern 2: Technical DSL (Agent-Facing)

**Used in:** agent-backend.md, agent-quality.md

**Example:**
```typescript
// Feature: Create AI Clone
const createAICloneDSL = {
  feature: "CreateAIClone",
  input: {
    creatorId: "Id<entities>",
    videoUrls: "string[]"
  },
  flow: [
    {
      service: {
        provider: "elevenlabs",
        method: "cloneVoice",
        params: { samples: "$audioSamples" },
        output: "voiceId"
      }
    },
    {
      entity: {
        type: "ai_clone",
        name: "$creator.name + ' Clone'",
        properties: { voiceId: "$voiceId" }
      }
    }
  ]
};
```

**Implementation:**
```markdown
## DSL → Convex Compilation

The ONE DSL compiles to Plain Convex (NO Convex Ents):

### DSL Input
\`\`\`typescript
{ entity: { type: "ai_clone", properties: { voiceId } } }
\`\`\`

### Compiled Output
\`\`\`typescript
const cloneId = await ctx.db.insert("entities", {
  type: "ai_clone",
  properties: { voiceId },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
\`\`\`
```

---

### Pattern 3: DSL Validation (Quality Assurance)

**Used in:** agent-quality.md, skills/ontology/*

**Example:**
```typescript
// Validate DSL against ontology
const validator = new ONEValidator(FULL_ONTOLOGY);
const result = validator.validate(myFeatureDSL);

if (!result.valid) {
  console.error("DSL validation failed:", result.errors);
  // Invalid entity type: "ai_tutor" (should be "ai_clone")
  // Invalid connection type: "teaches" (should be "teaching")
}
```

**Implementation:**
```markdown
## DSL Validation Patterns

Before code generation, validate DSL against ontology:

**Entity Types (66 valid):**
- creator, ai_clone, token, course, lesson, etc.

**Connection Types (25 valid):**
- owns, teaching, enrolled_in, holds_tokens, etc.

**Event Types (67 valid):**
- clone_created, tokens_purchased, lesson_completed, etc.

**Metadata Patterns (consolidated types):**
- payment: metadata.paymentType (subscription|purchase|tip)
- livestream: metadata.livestreamType (hosted|attended)
- notification: metadata.notificationType (sent|received)
```

---

### Pattern 4: Frontend-Only DSL

**Used in:** agent-frontend.md, /fast.md

**Example:**
```typescript
// No backend entities, pure frontend
const checkoutFlowDSL = {
  feature: "ProductCheckout",
  frontend_only: true,
  flow: [
    { query: { from: "localStorage", key: "cart" } },
    { service: { provider: "stripe", method: "createCheckout" } },
    { navigate: "/success" }
  ]
};
```

**Implementation:**
```markdown
## Frontend-Only DSL Patterns

When backend is not needed, use client-side DSL:

**Storage:**
\`\`\`typescript
{ query: { from: "localStorage", key: "cart" } }
{ update: { target: "localStorage", key: "user", value: "$user" } }
\`\`\`

**Third-Party Services:**
\`\`\`typescript
{ service: { provider: "stripe", method: "createCheckout" } }
{ service: { provider: "openai", method: "chat", client: true } }
\`\`\`

**State Management (nanostores):**
\`\`\`typescript
{ atom: { name: "cartItems", initial: [] } }
{ computed: { name: "cartTotal", from: "$cartItems" } }
\`\`\`
```

---

## Key DSL Concepts (Reference)

From `one/knowledge/dsl.md`:

### 5 Core Primitives

1. **CREATE** - Add typed entities
   ```
   entity: { type: "ai_clone", name: "My Clone", properties: {...} }
   ```

2. **CONNECT** - Define relationships
   ```
   connect: { from: "$creatorId", to: "$cloneId", type: "owns" }
   ```

3. **RECORD** - Log events
   ```
   event: { type: "clone_created", actor: "$creatorId", metadata: {...} }
   ```

4. **CALL** - Invoke services
   ```
   service: { provider: "elevenlabs", method: "cloneVoice", params: {...} }
   ```

5. **CHECK** - Validate conditions
   ```
   validate: { creatorId: { exists: true, type: "creator" } }
   ```

### Ontology Types

**66 Entity Types** (things)
**25 Connection Types** (18 specific + 7 consolidated)
**67 Event Types** (24 specific + 11 consolidated)

### Compilation Target

**Plain Convex (NO Convex Ents):**
- Uses `ctx.db.insert()`, `ctx.db.query()`, `ctx.db.patch()`
- No `ent()` or `edge()` definitions
- Metadata field stores type-specific data
- Simpler, more explicit, better for AI

---

## Parallel Execution Strategy

### Stream 1: Agents (Cycles 3-6) + Commands (Cycles 7-10)

**Why parallel:** Independent documentation updates

**Agent 1:** agent-documenter updates agents
**Agent 2:** agent-documenter updates commands

**Duration:** 4 cycles instead of 8

---

### Stream 2: Skills (Cycles 11-14) + Cross-Refs (Cycles 15-17)

**Why parallel:** Different file types

**Agent 1:** agent-documenter updates skills
**Agent 2:** agent-documenter creates reference docs

**Duration:** 4 cycles instead of 7

---

### Total Timeline

**Sequential:** 18 cycles (18 days)
**Parallel:** 10 cycles (10 days)
**Savings:** 44% faster with 2 parallel streams

---

## Expected Outcomes

### Immediate (Cycle 6)

✅ Core agents speak DSL natively
✅ /chat captures vision in DSL format
✅ agent-director validates DSL against ontology
✅ agent-backend compiles DSL → TypeScript

### Medium-Term (Cycle 12)

✅ All commands use DSL templates
✅ Skills generate DSL-compliant code
✅ Quality validates DSL automatically

### Long-Term (Cycle 18)

✅ Complete DSL integration across .claude/*
✅ Pattern convergence (98% accuracy)
✅ Unified language: English → DSL → Code → Reality

---

## Success Metrics

**Accuracy:**
- Before: 85% code generation accuracy (learning patterns)
- After: 98% code generation accuracy (DSL convergence)

**Efficiency:**
- Before: 150K tokens per feature (full context)
- After: 3K tokens per feature (DSL-driven)

**Consistency:**
- Before: 100 framework-specific patterns
- After: 1 universal DSL language

**Developer Experience:**
- Before: "Learn React, Convex, Effect.ts, Astro..."
- After: "Speak Plain English, system validates & generates"

---

## Risk Mitigation

### Risk 1: Over-Abstraction

**Risk:** DSL becomes too abstract, loses expressiveness

**Mitigation:**
- Keep Plain English DSL simple (5 commands)
- Technical DSL stays explicit (TypeScript-like)
- Always show compiled output examples
- Provide escape hatch (write raw Convex code)

### Risk 2: Learning Curve

**Risk:** Users confused by DSL syntax

**Mitigation:**
- /chat captures intent in natural language
- System translates to DSL automatically
- Show DSL → Code mapping transparently
- Provide visual DSL builder (future)

### Risk 3: Documentation Drift

**Risk:** DSL examples get out of sync with implementation

**Mitigation:**
- agent-quality validates DSL in docs
- Automated tests check DSL compilation
- Version DSL spec (currently 1.0.0)
- Track breaking changes explicitly

---

## Maintenance Plan

### After Launch

**Monthly:**
- Review DSL usage analytics
- Update examples based on common patterns
- Refine Plain English DSL vocabulary

**Quarterly:**
- Audit DSL integration completeness
- Add new DSL primitives if needed
- Update ontology type counts

**Yearly:**
- Major DSL version update (1.0 → 2.0)
- Platform-wide DSL migration
- Publish DSL evolution insights

---

## References

**Primary Source:**
- `one/knowledge/dsl.md` - Complete DSL specification (1600+ lines)

**Related Plans:**
- `one/things/plans/ontology-6-dimensions.md` - 6D ontology migration
- `one/knowledge/architecture.md` - Platform architecture
- `one/connections/workflow.md` - Development workflow

**Agent Definitions:**
- `.claude/agents/agent-director.md` - Orchestration
- `.claude/agents/agent-backend.md` - Code generation
- `.claude/agents/agent-quality.md` - Validation

---

## Execution Checklist

### Pre-Flight
- [ ] Read `one/knowledge/dsl.md` completely
- [ ] Understand 6-dimension ontology
- [ ] Review .claude/* file structure
- [ ] Identify high-priority targets

### Phase 1 (Cycles 1-2)
- [ ] Audit all 95+ .claude/* files
- [ ] Create DSL integration map
- [ ] Define DSL snippet library
- [ ] Establish consistency rules

### Phase 2 (Cycles 3-6) ⚡ QUICK WINS
- [ ] Update agent-director.md
- [ ] Update agent-backend.md
- [ ] Update agent-quality.md
- [ ] Update agent-frontend.md
- [ ] **Milestone:** Core agents speak DSL

### Phase 3 (Cycles 7-10)
- [ ] Update /chat.md
- [ ] Update /plan.md
- [ ] Update /create.md
- [ ] Update /fast.md

### Phase 4 (Cycles 11-14)
- [ ] Update skills/convex/* (5 files)
- [ ] Update skills/ontology/* (5 files)
- [ ] Update skills/testing/* (4 files)
- [ ] Update skills/documentation/* (4 files)

### Phase 5 (Cycles 15-17)
- [ ] Update CLAUDE.md
- [ ] Update web/AGENTS.md
- [ ] Create .claude/DSL_QUICK_REFERENCE.md

### Phase 6 (Cycle 18)
- [ ] Validate all DSL examples
- [ ] Test DSL compilation
- [ ] Check cross-references
- [ ] Generate validation report

### Post-Launch
- [ ] Monitor DSL usage
- [ ] Collect feedback
- [ ] Document lessons learned
- [ ] Plan DSL v2.0 features

---

## Appendix A: DSL Snippet Library

### Common Entity Declarations

```typescript
// AI Clone
{ entity: { type: "ai_clone", properties: { voiceId, systemPrompt } } }

// Token
{ entity: { type: "token", properties: { symbol, supply, price } } }

// Course
{ entity: { type: "course", properties: { title, description, lessons } } }

// User
{ entity: { type: "creator", properties: { email, name, role: "org_owner" } } }
```

### Common Connections

```typescript
// Ownership
{ connect: { from: "$userId", to: "$assetId", type: "owns" } }

// Enrollment
{ connect: { from: "$userId", to: "$courseId", type: "enrolled_in" } }

// Teaching
{ connect: { from: "$cloneId", to: "$courseId", type: "teaching" } }

// Token Holding
{ connect: { from: "$userId", to: "$tokenId", type: "holds_tokens",
  metadata: { balance: 1000 } } }
```

### Common Events

```typescript
// Creation
{ event: { type: "entity_created", actor: "$userId", entity: "$entityId" } }

// Purchase
{ event: { type: "tokens_purchased", actor: "$userId",
  metadata: { amount: 1000, usdAmount: 100 } } }

// Completion
{ event: { type: "lesson_completed", actor: "$studentId",
  metadata: { courseId, lessonId, score: 95 } } }
```

### Common Services

```typescript
// OpenAI
{ service: { provider: "openai", method: "chat",
  params: { model: "gpt-4", messages: [] } } }

// ElevenLabs
{ service: { provider: "elevenlabs", method: "cloneVoice",
  params: { samples: [] } } }

// Stripe
{ service: { provider: "stripe", method: "charge",
  params: { amount: 10000, currency: "usd" } } }

// Blockchain
{ service: { provider: "blockchain", method: "mint",
  params: { contractAddress, amount } } }
```

---

## Appendix B: File-by-File Breakdown

### Agents (6 files)

1. **agent-director.md** (High Priority)
   - Add: Plain English → DSL validation flow
   - Add: DSL orchestration examples
   - Add: Ontology mapping table

2. **agent-backend.md** (High Priority)
   - Add: DSL → Convex compilation section
   - Add: Plain Convex examples (NO Ents)
   - Add: Effect.ts integration patterns

3. **agent-quality.md** (High Priority)
   - Add: DSL validation patterns
   - Add: Ontology compliance checks
   - Add: Metadata validation rules

4. **agent-frontend.md** (High Priority)
   - Add: Frontend-only DSL patterns
   - Add: No-backend examples
   - Add: Client-side state management DSL

5. **agent-ontology.md** (Medium Priority)
   - Add: DSL ↔ Ontology mapping
   - Add: Type definitions reference
   - Add: Metadata patterns guide

6. **agent-documenter.md** (Low Priority)
   - Add: How to document DSL features
   - Add: DSL example formatting
   - Add: Knowledge capture for DSL

### Commands (4 files)

7. **chat.md** (High Priority)
   - Add: Vision → DSL capture section
   - Add: Plain English DSL examples
   - Add: Save DSL to onboarding.json

8. **plan.md** (Medium Priority)
   - Add: DSL feature declaration templates
   - Add: DSL validation in planning
   - Add: DSL snippet generation

9. **create.md** (Medium Priority)
   - Add: DSL-based feature generation
   - Add: Template selection by DSL pattern
   - Add: Auto-generate DSL from request

10. **fast.md** (Medium Priority)
    - Add: Rapid DSL → code flow
    - Add: Minimal cycle DSL patterns
    - Add: Quick compilation examples

### Skills (18 files)

**Convex (5 files):**
11. create-mutation.md
12. create-query.md
13. test-function.md
14. read-schema.md
15. check-deployment.md

**Ontology (5 files):**
16. validate-schema.md
17. check-dimension.md
18. verify-relationships.md
19. generate-entity-type.md
20. README.md

**Testing (4 files):**
21. generate-tests.md
22. run-tests.md
23. validate-e2e.md
24. analyze-coverage.md

**Documentation (4 files):**
25. generate-api-docs.md
26. update-knowledge.md
27. create-migration-guide.md
28. generate-readme.md

### Reference Docs (3 files)

29. **CLAUDE.md** (Root)
    - Add: Plain English DSL overview (300 tokens)
    - Add: Link to full spec
    - Add: Quick examples

30. **web/AGENTS.md**
    - Add: DSL quick reference for agents
    - Add: Common DSL patterns
    - Add: Frontend-only DSL examples

31. **.claude/DSL_QUICK_REFERENCE.md** (NEW)
    - Create: Comprehensive DSL guide
    - Include: All primitives explained
    - Include: Full examples library
    - Include: Validation rules

---

## Version History

**v1.0.0** (2025-11-08)
- Initial plan created
- 18-cycle implementation defined
- File impact analysis complete
- Integration patterns documented

---

## Next Actions

1. **Review this plan:** Validate approach with team
2. **Execute Cycle 1:** Audit .claude/* files
3. **Create integration map:** Define specific changes per file
4. **Begin Phase 2:** Start agent updates (quick wins)

**Ready to execute?** Type `/now` to begin Cycle 1.
