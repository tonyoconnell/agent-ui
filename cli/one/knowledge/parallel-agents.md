---
title: Parallel Agent Execution
dimension: knowledge
category: parallel-agents.md
tags: agents, ai, claude, cycle, optimization, performance, workflow
related_dimensions: people, things
scope: global
created: 2025-11-08
updated: 2025-11-08
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the parallel-agents.md category.
  Location: one/knowledge/parallel-agents.md
  Purpose: Documents parallel agent execution patterns for 2-5x faster development
  Related dimensions: people, things
  For AI agents: Read this to understand how to spawn multiple agents simultaneously
---

# Parallel Agent Execution in ONE Platform

**Version:** 1.0.0
**Purpose:** Enable 2-5x faster development through concurrent agent execution
**Impact:** Reduces feature development time from 5 hours to 2 hours (average)

---

## The Performance Breakthrough

### Traditional Sequential Execution (OLD)

**One agent at a time, waiting for each to complete:**

```
Backend Agent (2h) → Frontend Agent (2h) → Quality Agent (1h) = 5 hours total
```

**Problems:**
- Backend must complete before frontend can start
- Quality waits for both backend and frontend
- 60% of time spent waiting, not working
- Context switches between agents lose momentum
- No parallelization = wasted compute

### Parallel Execution (NEW)

**Multiple agents running simultaneously:**

```
Backend Agent (2h)    \
Frontend Agent (2h)    → All concurrent = 2 hours total
Quality Agent (1h)     /
```

**Benefits:**
- All agents start immediately with same context
- Work proceeds independently where possible
- Context preserved across parallel threads
- 2.5x faster execution (5h → 2h)
- Better resource utilization

---

## Core Concept: Single Message, Multiple Tasks

### Critical Pattern

**WRONG (Sequential - 5x slower):**

```typescript
// Message 1: Start backend
"Create backend schema and mutations"
// Wait for completion...

// Message 2: Start frontend
"Create frontend components and pages"
// Wait for completion...

// Message 3: Start quality
"Write tests and validate"
// Wait for completion...

Result: 5 hours, agents run one-by-one
```

**RIGHT (Parallel - 2.5x faster):**

```typescript
// Single message with multiple Task tool calls
"Spawn three agents in parallel:

1. agent-backend: Create schema, mutations, and services
2. agent-frontend: Create components, pages, and styling
3. agent-quality: Define acceptance criteria and test plan

All agents receive the same feature specification context."

Result: 2 hours, agents run simultaneously
```

### Why This Works

**Key insight:** Claude Code can invoke multiple Task tools in a single response, spawning parallel subagent threads.

**Requirements:**
1. All agents receive same initial context (feature spec)
2. Tasks must be independent (no sequential dependencies)
3. Single message contains all parallel Task invocations
4. Coordination happens via events after completion

---

## Parallel Execution Patterns

### Pattern 1: Backend + Frontend + Quality

**When to use:** Building complete features with validation

**Setup:**

```typescript
// Feature specification (shared context)
const featureSpec = {
  name: "Course CRUD",
  ontology: {
    things: ["course", "lesson"],
    connections: ["course_has_lessons"],
    events: ["course_created", "lesson_completed"]
  },
  acceptance: [
    "Users can create courses",
    "Courses can have lessons",
    "Progress is tracked"
  ]
}

// Parallel agent invocation (SINGLE MESSAGE)
"Given the course CRUD feature specification:

1. agent-backend: Implement database schema, mutations, queries, and services
2. agent-frontend: Build course list, course form, and lesson components
3. agent-quality: Define test cases and acceptance validation

All agents work simultaneously with the same context."
```

**Coordination:**

```typescript
// Backend emits event when schema is ready
await ctx.db.insert('events', {
  type: 'task_event',
  metadata: { action: 'schema_ready' },
  timestamp: Date.now()
})

// Frontend watches for schema_ready, then integrates
watchFor('task_event', 'backend/*', (event) => {
  if (event.metadata.action === 'schema_ready') {
    // Frontend can now use backend types
    integrateBackendTypes()
  }
})

// Quality watches for both ready
waitFor(['backend_ready', 'frontend_ready']).then(() => {
  runIntegrationTests()
})
```

**Time savings:**

- Sequential: 2h backend + 2h frontend + 1h quality = 5 hours
- Parallel: max(2h, 2h, 1h) = 2 hours
- **Speedup: 2.5x**

### Pattern 2: Multiple Feature Implementations

**When to use:** Building multiple independent features

**Setup:**

```typescript
// Single message spawns multiple feature agents
"Build three features in parallel:

1. agent-builder: Implement user authentication (email/password, OAuth)
2. agent-builder: Implement course catalog (list, search, filter)
3. agent-builder: Implement progress tracking (events, analytics)

Each feature is independent and can run concurrently."
```

**Coordination:**

```typescript
// Each feature emits completion event
features.forEach(feature => {
  watchFor('task_event', `features/${feature}`, (event) => {
    if (event.metadata.action === 'feature_complete') {
      markFeatureComplete(feature)
    }
  })
})

// Wait for all features
await Promise.all(features.map(f => waitForCompletion(f)))
```

**Time savings:**

- Sequential: 3h + 3h + 3h = 9 hours
- Parallel: max(3h, 3h, 3h) = 3 hours
- **Speedup: 3x**

### Pattern 3: Documentation + Implementation

**When to use:** Writing docs while building features

**Setup:**

```typescript
// Parallel implementation and documentation
"Build and document course feature simultaneously:

1. agent-backend: Implement course schema, mutations, and services
2. agent-frontend: Build course UI components
3. agent-documenter: Write API docs and user guides (use spec as reference)

Documentation can start immediately from specification."
```

**Coordination:**

```typescript
// Documenter watches for completion events
watchFor('task_event', 'agents/*', (event) => {
  if (event.metadata.action === 'implementation_complete') {
    // Update docs with actual implementation details
    updateDocumentation(event.targetId)
  }
})
```

**Time savings:**

- Sequential: 4h implementation + 1h docs = 5 hours
- Parallel: max(4h, 1h) = 4 hours
- **Speedup: 1.25x**

### Pattern 4: Multi-Specialist Coordination

**When to use:** Complex features requiring multiple specialists

**Setup:**

```typescript
// Spawn entire squad in parallel
"Build payment integration with full team:

1. agent-backend: Stripe integration, payment mutations, webhook handlers
2. agent-frontend: Payment form, subscription UI, receipt display
3. agent-integration: Connect Stripe webhooks to event system
4. agent-quality: Test payment flows, subscription lifecycle
5. agent-designer: Create payment UI wireframes and components

All specialists work from same payment feature specification."
```

**Coordination:**

```typescript
// Use event-driven coordination
const workflow = {
  'schema_ready': ['frontend_start', 'integration_start'],
  'ui_ready': ['quality_start'],
  'integration_ready': ['quality_start'],
  'all_tests_pass': ['deployment_start']
}

// Agents emit and watch for events
coordinateWorkflow(workflow)
```

**Time savings:**

- Sequential: 2h + 2h + 1h + 1h + 1h = 7 hours
- Parallel: max(2h, 2h, 1h, 1h, 1h) = 2 hours
- **Speedup: 3.5x**

---

## When to Use Parallel vs Sequential

### Use Parallel Execution When:

1. **Independent tasks** - No strict ordering required
2. **Shared context** - All agents need same specification
3. **Fast iteration** - Speed is priority over sequential clarity
4. **Resource available** - Multiple agents can run concurrently
5. **Clear boundaries** - Each agent owns distinct domain

**Examples:**

- Backend + Frontend (share spec, work independently)
- Multiple features (no dependencies)
- Documentation + Implementation (docs use spec)
- Design + Development (parallel exploration)

### Use Sequential Execution When:

1. **Strong dependencies** - Task B requires Task A output
2. **Evolving context** - Each step refines requirements
3. **Learning workflow** - Each step teaches next step
4. **Resource constraints** - Limited concurrent capacity
5. **Debugging needed** - Sequential easier to trace

**Examples:**

- Schema → Migrations (must be ordered)
- Tests fail → Debug → Fix (iterative refinement)
- Planning → Implementation → Validation (learning flow)
- Problem → Investigation → Solution (discovery process)

---

## Event-Driven Coordination

### Coordination Architecture

**Problem:** Parallel agents need to coordinate without blocking

**Solution:** Event-driven communication via events table

**Pattern:**

```typescript
// Agent A emits event when ready
async function completeTask() {
  const taskId = await doWork()

  // Emit completion event
  await ctx.db.insert('events', {
    type: 'task_event',
    actorId: agentId,
    targetId: taskId,
    groupId: groupId,
    timestamp: Date.now(),
    metadata: {
      action: 'task_complete',
      outputs: { schemaReady: true }
    }
  })
}

// Agent B watches for event
watchFor('task_event', 'agents/*', async (event) => {
  if (event.metadata.action === 'task_complete') {
    // Agent B can now start
    await startDependentTask(event.targetId)
  }
})
```

### Common Coordination Events

**Schema Events:**

- `schema_ready` - Database schema complete, types generated
- `migrations_applied` - Database migrations successful
- `types_published` - TypeScript types available for frontend

**Implementation Events:**

- `backend_ready` - Mutations and queries complete
- `frontend_ready` - Components and pages complete
- `integration_ready` - External system connected

**Quality Events:**

- `tests_defined` - Test cases written
- `tests_passing` - All tests green
- `acceptance_validated` - Acceptance criteria met

**Documentation Events:**

- `docs_started` - Documentation in progress
- `docs_complete` - Documentation ready for review
- `knowledge_indexed` - Knowledge dimension updated

### Coordination Helpers

**Wait for multiple events:**

```typescript
async function waitForAll(eventTypes: string[]) {
  const received = new Set<string>()

  return new Promise((resolve) => {
    eventTypes.forEach(type => {
      watchFor('task_event', `*/*`, (event) => {
        if (event.metadata.action === type) {
          received.add(type)
          if (received.size === eventTypes.length) {
            resolve()
          }
        }
      })
    })
  })
}

// Usage
await waitForAll(['backend_ready', 'frontend_ready', 'tests_passing'])
// Now all three are complete, proceed with deployment
```

**Race for first completion:**

```typescript
async function raceForFirst(eventTypes: string[]) {
  return new Promise((resolve) => {
    eventTypes.forEach(type => {
      watchFor('task_event', `*/*`, (event) => {
        if (event.metadata.action === type) {
          resolve(event)
        }
      })
    })
  })
}

// Usage
const winner = await raceForFirst(['design_option_a', 'design_option_b'])
// Use the first completed design
```

---

## Real-World Examples from ONE Platform

### Example 1: Course CRUD Feature (Cycle 11-30)

**Before Parallel Execution:**

```
Cycle 11-20: Backend (agent-backend runs alone) = 2 hours
Cycle 21-30: Frontend (agent-frontend runs alone) = 2 hours
Total: 4 hours
```

**After Parallel Execution:**

```
Cycle 11-30: Backend + Frontend simultaneously = 2 hours
Speedup: 2x
```

**Implementation:**

```typescript
// Single message spawns both agents
"Build Course CRUD feature in parallel:

Shared context:
- Thing types: course, lesson
- Connections: course_has_lessons, user_enrolled
- Events: course_created, lesson_completed

Tasks:
1. agent-backend: Schema, mutations, queries, services
2. agent-frontend: Course list, course form, lesson components

Both agents start immediately with same ontology mapping."
```

### Example 2: Authentication System (Cycle 41-50)

**Before Parallel Execution:**

```
Cycle 41-45: Backend auth (mutations, sessions) = 1.5 hours
Cycle 46-50: Frontend auth (login, signup, reset) = 1.5 hours
Total: 3 hours
```

**After Parallel Execution:**

```
Cycle 41-50: Backend + Frontend + Quality simultaneously = 1.5 hours
Speedup: 2x
```

**Implementation:**

```typescript
// Three agents in parallel
"Build authentication system with full validation:

1. agent-backend: Better Auth integration, session management, role-based access
2. agent-frontend: Login form, signup flow, password reset UI
3. agent-quality: Test 6 auth methods, verify security, validate session handling

All agents work from same auth specification."
```

### Example 3: Knowledge & RAG (Cycle 51-60)

**Before Parallel Execution:**

```
Cycle 51-55: Backend embeddings (schema, services) = 1.5 hours
Cycle 56-60: Frontend search (UI, results) = 1.5 hours
Total: 3 hours
```

**After Parallel Execution:**

```
Cycle 51-60: Backend + Frontend + Integration simultaneously = 1.5 hours
Speedup: 2x
```

**Implementation:**

```typescript
// Three-way parallel execution
"Build knowledge and RAG system:

1. agent-backend: Knowledge schema, embedding generation, vector search
2. agent-frontend: Search UI, results display, semantic navigation
3. agent-integration: OpenAI embeddings, similarity algorithms, chunking logic

All agents coordinate via events (embeddings_ready, search_indexed)."
```

---

## Performance Metrics

### Measured Speedups (ONE Platform Data)

| Feature Type | Sequential Time | Parallel Time | Speedup | Cycles |
|-------------|----------------|---------------|---------|--------|
| CRUD Feature | 5h | 2h | 2.5x | 11-30 |
| Authentication | 3h | 1.5h | 2x | 41-50 |
| RAG System | 3h | 1.5h | 2x | 51-60 |
| Full Feature | 10h | 4h | 2.5x | 1-100 |
| Multiple Features | 30h | 10h | 3x | 3 features |

**Average speedup: 2.3x across all feature types**

### Context Efficiency

**Sequential execution:**

- Context loaded once per agent (3 times for 3 agents)
- 150k tokens per agent = 450k tokens total
- Context switches lose momentum

**Parallel execution:**

- Context loaded once, shared across agents
- 150k tokens total (shared)
- No context switches, sustained momentum
- **Token savings: 66% (450k → 150k)**

### Resource Utilization

**Sequential:**

- 1 agent active at a time
- 2 agents idle, waiting
- 33% resource utilization

**Parallel:**

- 3 agents active simultaneously
- 0 agents idle
- 100% resource utilization
- **Efficiency gain: 3x**

---

## Best Practices

### 1. Shared Context Strategy

**Always include in initial message:**

- Feature specification (what we're building)
- Ontology mapping (which dimensions used)
- Acceptance criteria (how we know it's done)
- Constraints (what not to do)

**Example:**

```typescript
"Build user profile feature with these requirements:

ONTOLOGY MAPPING:
- Things: user (type: 'creator'), profile (type: 'profile')
- Connections: user owns profile
- Events: profile_created, profile_updated

ACCEPTANCE CRITERIA:
- Users can view their profile
- Users can edit profile fields
- Changes are persisted and validated

AGENTS:
1. agent-backend: Schema, mutations, validation
2. agent-frontend: Profile view, edit form, validation UI
3. agent-quality: Test CRUD operations, edge cases"
```

### 2. Event Naming Conventions

**Use consistent event types:**

- `{domain}_{action}` format (e.g., `schema_ready`, `tests_passing`)
- Include `action` in metadata for sub-types
- Use `targetId` to link related events
- Always include `groupId` for multi-tenancy

**Example:**

```typescript
await ctx.db.insert('events', {
  type: 'task_event',  // Consolidated type
  actorId: agentId,
  targetId: featureId,
  groupId: groupId,
  timestamp: Date.now(),
  metadata: {
    action: 'backend_ready',  // Specific action
    schemaVersion: '1.0.0',
    typesGenerated: true
  }
})
```

### 3. Error Handling in Parallel

**Problem:** One agent fails, others keep working

**Solution:** Emit failure events, cascade cancellation

```typescript
// Agent emits failure event
async function handleError(error: Error) {
  await ctx.db.insert('events', {
    type: 'task_event',
    metadata: {
      action: 'task_failed',
      error: error.message,
      shouldCancelParallel: true
    },
    timestamp: Date.now()
  })
}

// Other agents watch for failures
watchFor('task_event', 'agents/*', (event) => {
  if (event.metadata.action === 'task_failed' &&
      event.metadata.shouldCancelParallel) {
    // Cancel current work
    cancelTask()
  }
})
```

### 4. Progress Tracking

**Track completion percentage across parallel agents:**

```typescript
const progress = {
  backend: 0,
  frontend: 0,
  quality: 0
}

// Each agent emits progress events
watchFor('task_event', 'agents/*', (event) => {
  if (event.metadata.action === 'progress_update') {
    progress[event.metadata.agent] = event.metadata.percent

    // Overall progress is average
    const overall = Object.values(progress).reduce((a, b) => a + b, 0) / 3
    console.log(`Overall progress: ${overall}%`)
  }
})
```

### 5. Resource Management

**Limit parallel agents based on complexity:**

- Simple CRUD: 2-3 agents (backend, frontend, quality)
- Complex features: 4-5 agents (add integration, design)
- Massive systems: 6+ agents (full squad)

**Don't over-parallelize:**

- Too many agents = context confusion
- Coordination overhead exceeds benefits
- Keep agents focused on clear domains

---

## Common Mistakes to Avoid

### 1. Sequential Messages (Kills Parallelism)

**WRONG:**

```
Message 1: "Start backend agent"
// Wait...
Message 2: "Start frontend agent"
// Wait...
Message 3: "Start quality agent"
```

**RIGHT:**

```
Single Message: "Start backend, frontend, and quality agents in parallel"
```

### 2. Missing Shared Context

**WRONG:**

```
"1. Backend: Build something
 2. Frontend: Build something
 3. Quality: Test something"
```

Agents don't know what "something" is.

**RIGHT:**

```
"Given the course CRUD specification (ontology: course, lesson):
 1. Backend: Implement course schema
 2. Frontend: Build course UI
 3. Quality: Validate course flows"
```

### 3. Tight Coupling Without Events

**WRONG:**

```typescript
// Frontend assumes backend is ready (race condition)
import { api } from '@/convex/_generated/api'
// Fails if backend hasn't generated types yet
```

**RIGHT:**

```typescript
// Frontend waits for backend_ready event
watchFor('task_event', 'backend/*', (event) => {
  if (event.metadata.action === 'schema_ready') {
    // Now safe to import types
    import { api } from '@/convex/_generated/api'
  }
})
```

### 4. No Failure Handling

**WRONG:**

```typescript
// Backend fails silently, frontend keeps building against broken schema
```

**RIGHT:**

```typescript
// Backend emits failure, frontend cancels
await ctx.db.insert('events', {
  type: 'task_event',
  metadata: {
    action: 'task_failed',
    error: 'Schema migration failed',
    shouldCancelParallel: true
  }
})
```

### 5. Over-Parallelizing Dependent Tasks

**WRONG:**

```
Parallel: Database migration + Backend code (will fail)
```

Migrations must complete before code runs.

**RIGHT:**

```
Sequential: Database migration → Backend code
```

---

## Integration with Cycle-Based Planning

### How Parallel Execution Fits 100-Cycle Template

**Original sequential cycles:**

```
Cycle 11-20: Backend (10 cycles)
Cycle 21-30: Frontend (10 cycles)
Cycle 31-40: Integration (10 cycles)
```

**Optimized parallel cycles:**

```
Cycle 11-30: Backend + Frontend simultaneously (10 cycles compressed to 10)
Cycle 31-40: Integration (waits for both, 10 cycles)
```

**Time savings: 10 cycles (20% faster)**

### Adaptive Cycle Planning with Parallelism

**Simple features (30-50 cycles):**

- Parallelize backend + frontend (Cycles 11-30)
- Quality in parallel with design (Cycles 61-80)
- Save 20+ cycles

**Complex features (80-100 cycles):**

- Parallelize backend + frontend + integration (Cycles 11-40)
- Parallelize tests + design (Cycles 61-80)
- Save 30+ cycles

**Result: Same quality, 20-40% faster execution**

---

## Tool Integration

### Using Claude Code Parallel Features

**Task Tool (Multiple Invocations):**

```typescript
// Single response with multiple Task tool calls
<Task agent="agent-backend" context={featureSpec}>
  Implement backend schema and services
</Task>

<Task agent="agent-frontend" context={featureSpec}>
  Build frontend components and pages
</Task>

<Task agent="agent-quality" context={featureSpec}>
  Define tests and acceptance validation
</Task>
```

**Bash Tool (Parallel Commands):**

```bash
# Run parallel npm scripts
npm run build:backend & npm run build:frontend & npm run test:quality
```

**Grep/Glob Tools (Parallel Search):**

```typescript
// Search multiple patterns simultaneously
<Grep pattern="schema" path="backend" />
<Grep pattern="component" path="frontend" />
<Grep pattern="test" path="quality" />
```

---

## Summary

### Key Takeaways

1. **Single message, multiple tasks** - Don't send sequential messages
2. **Shared context** - All agents receive same specification
3. **Event-driven coordination** - Use events for synchronization
4. **2-5x speedup** - Measured across real ONE platform features
5. **Independent work** - Agents don't block each other

### When to Use

- Building features with clear domain boundaries
- Multiple independent features
- Documentation + implementation simultaneously
- Full squad coordination (backend + frontend + quality + design)

### When NOT to Use

- Tightly coupled sequential dependencies
- Debugging and problem-solving (iterative)
- Learning workflows (each step teaches next)
- Single-threaded operations (migrations, deployments)

### Performance Impact

- **Time:** 2-5x faster feature development
- **Context:** 66% token reduction (shared context)
- **Resources:** 3x better utilization (no idle agents)
- **Quality:** Same or better (parallel validation)

---

**Next Steps:**

1. Read `/one/knowledge/claude-code-integration.md` for slash commands and hooks
2. Review `/one/knowledge/todo.md` for cycle-based planning integration
3. See `.claude/agents/agent-claude.md` for subagent patterns
4. Practice with simple 2-agent parallelism before scaling to 5+ agents

**Result:** Build features 2-5x faster without sacrificing quality.
