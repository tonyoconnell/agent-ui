---
title: Components
dimension: things
category: plans
tags: agent, ai, architecture
related_dimensions: events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/components.md
  Purpose: Documents convex components integration with effect.ts implementation plan
  Related dimensions: events, groups, knowledge, people
  For AI agents: Read this to understand components.
---

# Convex Components Integration with Effect.ts Implementation Plan

**Feature:** Effect.ts + Convex Components Service Layer Architecture
**Version:** 1.0.0
**Status:** Planning
**Created:** 2025-10-30

## Executive Summary

Implement a production-ready service layer architecture that combines Effect.ts functional programming patterns with Convex components (@convex-dev/agent, workflow, RAG, rate-limiter, etc.) to build sophisticated multi-agent AI systems with type-safe error handling, dependency injection, and testability.

## Vision

**"Effect Wraps Components, Not Replaces"**

Convex components provide battle-tested infrastructure (durability, retries, rate limiting, vector search), while Effect.ts enhances business logic composition with:

- Type-safe error handling (no `try/catch` soup)
- Powerful composition primitives (`Effect.gen`, `Effect.all`, `Effect.retry`)
- Dependency injection (Context, Layer)
- Resource management (Scope, acquireRelease)
- Testability (swap real services for test implementations)

## 6-Dimension Ontology Mapping

### 1. Groups (Service Organization)

- **Service Boundaries:** Each service layer scoped to organizational groups
- **Multi-Tenant Services:** AgentService, RAGService, WorkflowService respect groupId
- **Hierarchical Access:** Parent groups can access child group services (configurable)
- **Service Discovery:** Services registered per group for isolation

### 2. People (Service Authorization)

- **Role-Based Services:** Service access controlled by people roles (org_owner, org_user, customer)
- **Service Accounts:** Non-human actors represented as people with service permissions
- **Actor Attribution:** All Effect service calls attributed to authenticated person
- **Permission Layers:** Services check permissions via Effect Context

### 3. Things (Service Entities)

New entity types:

- `service_definition` - Effect service layer definitions
- `service_layer` - Deployed service layer instances
- `effect_program` - Reusable Effect programs
- `service_dependency` - Service dependencies graph

Existing entity types enhanced:

- All 66+ entity types accessible via Effect-wrapped Convex operations

### 4. Connections (Service Dependencies)

New connection types:

- `depends_on_service` - Service → Service dependency
- `implements_interface` - Service → Interface definition
- `provides_service` - Layer → Service
- `consumes_service` - Program → Service

### 5. Events (Service Observability)

New event types:

- `service_initialized` - Service layer started
- `service_call_started` - Effect program execution began
- `service_call_completed` - Effect program finished successfully
- `service_call_failed` - Effect program failed with error
- `service_retried` - Effect retry policy triggered
- `layer_composed` - Multiple layers merged

Metadata tracked:

- Service name, function name, arguments
- Duration, token usage (for AI services)
- Error type, retry count
- Dependency chain

### 6. Knowledge (Service Documentation)

- **Effect Patterns:** Searchable pattern library via RAG
- **Error Messages:** Semantic error type documentation
- **Service Examples:** Code examples embedded and searchable
- **Troubleshooting:** Effect error traces indexed for debugging

## Technical Architecture

### Service Layer Structure

```
backend/convex/
├── services/                      # Effect service layers
│   ├── agent.service.ts          # @convex-dev/agent wrapper
│   ├── rag.service.ts            # @convex-dev/rag wrapper
│   ├── rate-limit.service.ts     # @convex-dev/rate-limiter wrapper
│   ├── workflow.service.ts       # @convex-dev/workflow wrapper
│   ├── streaming.service.ts      # @convex-dev/persistent-text-streaming wrapper
│   ├── workpool.service.ts       # @convex-dev/workpool wrapper
│   ├── retrier.service.ts        # @convex-dev/retrier wrapper
│   ├── crons.service.ts          # @convex-dev/crons wrapper
│   └── layers.ts                 # Layer composition
│
├── domain/                        # Business logic with Effect
│   ├── agents/
│   │   ├── types.ts              # Domain types
│   │   ├── errors.ts             # Tagged error classes
│   │   ├── orchestration.ts      # Multi-agent flows
│   │   └── tools.ts              # Agent tool definitions
│   │
│   ├── workflows/
│   │   ├── types.ts
│   │   ├── research.ts           # Research workflow
│   │   └── support.ts            # Support ticket workflow
│   │
│   └── users/
│       ├── types.ts
│       ├── errors.ts
│       └── logic.ts
│
├── api/                           # Public endpoints
│   ├── agents.ts                 # Agent actions/queries
│   ├── workflows.ts              # Workflow triggers
│   └── users.ts                  # User operations
│
└── lib/
    ├── effect-utils.ts           # Effect helper functions
    ├── convex-effect.ts          # Convex → Effect converters
    └── monitoring.ts             # Observability layer
```

### Effect Service Pattern

```typescript
// services/agent.service.ts
import { Effect, Context, Layer, Data } from "effect";
import { Agent } from "@convex-dev/agent";
import { components } from "./_generated/api";

// 1. Define errors as tagged classes
class AgentError extends Data.TaggedError("AgentError")<{
  agentName: string;
  cause: unknown;
}> {}

class RateLimitError extends Data.TaggedError("RateLimitError")<{
  retryAfter: number;
}> {}

// 2. Define service interface
class AgentService extends Context.Tag("AgentService")<
  AgentService,
  {
    readonly generateResponse: (
      ctx: ActionCtx,
      threadId: string,
      prompt: string,
    ) => Effect.Effect<string, AgentError | RateLimitError>;

    readonly createThread: (
      ctx: ActionCtx,
      userId: string,
    ) => Effect.Effect<string, AgentError>;
  }
>() {}

// 3. Implement service layer
const AgentServiceLive = Layer.effect(
  AgentService,
  Effect.gen(function* () {
    const rateLimitService = yield* RateLimitService;

    const agent = new Agent(components.agent, {
      name: "Support Agent",
      chat: openai.chat("gpt-4o-mini"),
      instructions: "You are a helpful assistant.",
      tools: {
        /* ... */
      },
    });

    return {
      generateResponse: (ctx, threadId, prompt) =>
        Effect.gen(function* () {
          // Check rate limit first
          const rateLimitOk = yield* rateLimitService.checkLimit(ctx, threadId);

          if (!rateLimitOk) {
            return yield* Effect.fail(new RateLimitError({ retryAfter: 60 }));
          }

          // Call agent component (wrapped in Effect)
          const result = yield* Effect.tryPromise({
            try: async () => {
              const { thread } = await agent.continueThread(ctx, { threadId });
              const response = await thread.generateText({ prompt });
              return response.text;
            },
            catch: (error) =>
              new AgentError({
                agentName: "Support Agent",
                cause: error,
              }),
          });

          return result;
        }),

      createThread: (ctx, userId) =>
        Effect.tryPromise({
          try: async () => {
            const { threadId } = await agent.createThread(ctx, { userId });
            return threadId;
          },
          catch: (error) =>
            new AgentError({
              agentName: "Support Agent",
              cause: error,
            }),
        }),
    };
  }),
);

export { AgentService, AgentServiceLive };
```

### Using Services in API Endpoints

```typescript
// api/agents.ts
import { Effect } from "effect";
import { AgentService, AgentServiceLive } from "../services/agent.service";
import { RAGService, RAGServiceLive } from "../services/rag.service";

export const generateAgentResponse = action({
  args: { threadId: v.string(), prompt: v.string() },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      // Services injected via Effect Context
      const agentService = yield* AgentService;
      const ragService = yield* RAGService;

      // Fetch context with RAG
      const context = yield* ragService.search(ctx, "docs", args.prompt, 5);

      // Generate response with agent
      const response = yield* agentService.generateResponse(
        ctx,
        args.threadId,
        `${args.prompt}\n\nContext: ${context.text}`,
      );

      return { response };
    }).pipe(
      // Provide service implementations
      Effect.provide(Layer.merge(AgentServiceLive, RAGServiceLive)),

      // Handle errors gracefully
      Effect.catchTag("RateLimitError", (error) =>
        Effect.succeed({
          response: "You've reached your limit. Please try again later.",
          retryAfter: error.retryAfter,
        }),
      ),
      Effect.catchTag("AgentError", (error) =>
        Effect.succeed({
          response: "I'm having trouble processing that request.",
          error: true,
        }),
      ),

      // Convert Effect to Promise for Convex
      Effect.runPromise,
    ),
});
```

## Implementation Phases

### Phase 1: Foundation (Cycle 1-10)

**Agent:** agent-director

**Deliverables:**

1. Validate Effect + Convex Components architecture
2. Map 8 Convex components to Effect services
3. Define service layer structure
4. Identify error types and patterns
5. Plan dependency injection strategy
6. Define observability requirements
7. Create integration patterns document
8. Break down into 100 cycles
9. Assign agents to phases
10. Create complete implementation plan

### Phase 2: Core Service Layers (Cycle 11-30)

**Agent:** agent-backend

**Cycle 11-15: Agent Service Layer**

- Wrap @convex-dev/agent with Effect
- Define AgentService interface
- Implement AgentServiceLive layer
- Add error types (AgentError, ThreadNotFoundError)
- Create agent tool definitions using Effect

**Cycle 16-20: RAG Service Layer**

- Wrap @convex-dev/rag with Effect
- Define RAGService interface
- Implement RAGServiceLive layer
- Add error types (RAGError, EmbeddingError, SearchError)
- Compose with Agent service

**Cycle 21-25: Rate Limiting Service Layer**

- Wrap @convex-dev/rate-limiter with Effect
- Define RateLimitService interface
- Implement RateLimitServiceLive layer
- Add error types (RateLimitError, QuotaExceededError)
- Integrate with Agent/RAG services

**Cycle 26-30: Workflow Service Layer**

- Wrap @convex-dev/workflow with Effect
- Define WorkflowService interface
- Implement WorkflowServiceLive layer
- Create Effect programs for workflow steps
- Add error handling and retry logic

### Phase 3: Supporting Services (Cycle 31-50)

**Agent:** agent-backend

**Cycle 31-35: Streaming Service Layer**

- Wrap @convex-dev/persistent-text-streaming with Effect
- Define StreamingService interface
- Implement StreamingServiceLive layer
- Handle backpressure with Effect.Stream
- Add error recovery

**Cycle 36-40: Workpool Service Layer**

- Wrap @convex-dev/workpool with Effect
- Define TaskQueueService interface
- Implement TaskQueueServiceLive layer
- Batch enqueuing with Effect.all
- Add priority queuing

**Cycle 41-45: Retrier Service Layer**

- Wrap @convex-dev/retrier with Effect
- Define ResilientExecutionService interface
- Implement ResilientExecutionServiceLive layer
- Combine with Effect.retry for hybrid approach
- Poll for completion with Effect schedules

**Cycle 46-50: Crons Service Layer**

- Wrap @convex-dev/crons with Effect
- Define CronService interface
- Implement CronServiceLive layer
- Use Effect for cron job logic
- Add monitoring and error handling

### Phase 4: Domain Logic (Cycle 51-70)

**Agents:** agent-backend, agent-builder

**Cycle 51-55: Multi-Agent Orchestration**

- Define multi-agent workflows with Effect
- Parallel agent execution (Effect.all)
- Sequential agent pipelines (Effect.gen)
- Conditional routing based on classification
- Error propagation across agents

**Cycle 56-60: Research Workflow**

- Implement research workflow using Workflow component
- Use Effect in workflow steps
- Parallel research (web, academic, news agents)
- Synthesis agent with RAG context
- Report generation

**Cycle 61-65: Support Ticket Workflow**

- Implement support agent workflow
- Use Effect for business logic
- RAG-powered context retrieval
- Automatic ticket creation
- Response quality checks

**Cycle 66-70: Tool Definitions with Effect**

- Create agent tools using Effect services
- Email tool (Effect-based)
- Database query tool (Effect-based)
- External API tool (Effect-based)
- Error handling in tools

### Phase 5: Observability & Testing (Cycle 71-90)

**Agents:** agent-quality, agent-ops

**Cycle 71-75: Monitoring Service**

- Create MonitoringService with Effect
- Track service calls (start, complete, fail)
- Token usage tracking for AI services
- Error tracking (Sentry integration)
- Performance metrics

**Cycle 76-80: Testing Strategies**

- Create test layers (mock implementations)
- Test AgentService with TestAgentServiceLive
- Test RAGService with TestRAGServiceLive
- Test error handling (Effect.catchTag)
- Integration tests with real components

**Cycle 81-85: Effect-Based Error Handling**

- Layered error handling pattern
- Domain errors vs infrastructure errors
- Retry strategies (Schedule.exponential)
- Circuit breaker pattern (Effect)
- Graceful degradation

**Cycle 86-90: Resource Management**

- Scoped resources (Effect.Scope)
- Connection pooling
- Agent pool lifecycle
- Cleanup on failure
- Resource acquisition/release patterns

### Phase 6: Advanced Patterns & Documentation (Cycle 91-100)

**Agents:** agent-documenter, agent-ops

**Cycle 91-93: Confect Integration (Optional)**

- Evaluate Confect for full Effect integration
- Compare manual vs Confect approach
- Create migration guide (if applicable)
- Test Confect + Components together
- Document decision

**Cycle 94-96: Documentation**

- Write service layer guide
- Document all Effect patterns
- Create example programs
- Troubleshooting guide for Effect errors
- Migration guide from Promise-based to Effect

**Cycle 97-98: Performance Optimization**

- Parallel execution with concurrency control (Effect.all)
- Caching layer for service calls
- Connection reuse
- Batch operations
- Benchmarking

**Cycle 99-100: Deployment & Launch**

- Deploy to Convex production
- Monitor service performance
- Create runbook for Effect errors
- Train team on Effect patterns
- Mark feature complete

## Success Metrics

### Technical Metrics

- **Type Safety:** 100% type-safe error handling (no untyped errors)
- **Test Coverage:** >90% for service layers
- **Performance:** No latency regression vs Promise-based approach
- **Composability:** All services composable via Effect.gen
- **Resource Safety:** Zero memory leaks with Effect.Scope

### Developer Experience Metrics

- **Error Clarity:** Effect error traces clearly show failure path
- **Testability:** Services swappable via test layers
- **Composition:** Business logic readable as sequential code (Effect.gen)
- **Retry Logic:** Automatic retries with no manual try/catch
- **Dependency Injection:** No global singletons, all via Context

## Risk Analysis

### High-Risk Areas

1. **Learning Curve:** Effect.ts has steep learning curve
   - Mitigation: Provide examples, pair programming, incremental adoption

2. **Performance Overhead:** Effect abstractions add runtime cost
   - Mitigation: Benchmark critical paths, optimize hot spots

3. **Component Compatibility:** Convex components return Promises
   - Mitigation: Use Effect.tryPromise wrapper pattern consistently

### Medium-Risk Areas

1. **Debugging:** Effect stack traces can be deep
   - Mitigation: Use Effect.annotateCurrentSpan for clarity

2. **Team Adoption:** Not all developers familiar with Effect
   - Mitigation: Start with manual integration, not Confect

3. **Testing Complexity:** Effect programs require Layer setup
   - Mitigation: Create test utility functions, reusable layers

## Dependencies

### External Libraries

- **effect:** ^3.0.0 (Effect, Context, Layer, Schedule, Stream)
- **@effect/schema:** ^0.67.0 (Optional, for Confect)
- **@rjdellecese/confect:** ^0.8.0 (Optional, full Effect integration)

### Convex Components

- **@convex-dev/agent:** ^0.0.30 (AI agent component)
- **@convex-dev/workflow:** ^0.0.18 (Durable workflows)
- **@convex-dev/rag:** ^0.0.11 (Vector search, RAG)
- **@convex-dev/rate-limiter:** ^0.0.7 (Rate limiting)
- **@convex-dev/persistent-text-streaming:** ^0.0.11 (Streaming)
- **@convex-dev/workpool:** ^0.0.11 (Task queues)
- **@convex-dev/retrier:** ^0.0.3 (Action retries)
- **@convex-dev/crons:** ^0.1.0 (Dynamic crons)

### Internal Systems

- **6-Dimension Ontology:** Core data model
- **Better Auth:** Authentication for user context
- **Groups System:** Multi-tenant isolation

## Timeline Estimate

**Total Duration:** 45-60 days (with parallelization)

**Critical Path:**

1. Foundation (7 days) →
2. Core Services (10 days) →
3. Supporting Services (10 days) →
4. Domain Logic (10 days) →
5. Testing (10 days) →
6. Documentation (7 days)

**Parallel Tracks:**

- Core Services + Domain Logic (can overlap after initial services ready)
- Testing (continuous throughout)
- Documentation (continuous throughout)

## Agent Assignments

| Phase               | Cycles | Agent                        | Role                           |
| ------------------- | ---------- | ---------------------------- | ------------------------------ |
| Foundation          | 1-10       | agent-director               | Validation, mapping, planning  |
| Core Services       | 11-30      | agent-backend                | Service layer implementation   |
| Supporting Services | 31-50      | agent-backend                | Additional service layers      |
| Domain Logic        | 51-70      | agent-backend, agent-builder | Business logic with Effect     |
| Observability       | 71-80      | agent-ops                    | Monitoring, error tracking     |
| Testing             | 76-90      | agent-quality                | Test layers, integration tests |
| Advanced Patterns   | 91-93      | agent-backend                | Confect evaluation             |
| Documentation       | 94-96      | agent-documenter             | Guides, examples               |
| Performance         | 97-98      | agent-backend                | Optimization                   |
| Launch              | 99-100     | agent-director               | Deployment coordination        |

## Quality Loop Integration

**Test → Design → Implement → Validate**

1. **Tests First (Cycle 76-90):** Define test layers for all services
2. **Design to Satisfy Tests (Cycle 11-50):** Create services that pass tests
3. **Implement Against Tests (Cycle 51-70):** Write domain logic that validates
4. **Fix Failures (Throughout):** agent-problem-solver analyzes, delegates fixes

**Quality Gates:**

- ✅ All service tests pass (unit + integration)
- ✅ No unhandled errors (all errors tagged)
- ✅ Performance benchmarks pass (no regression)
- ✅ Documentation complete (all patterns documented)
- ✅ Team trained (pairing sessions complete)

## Key Patterns

### 1. Effect-Wrapped Component Pattern

```typescript
// Component provides infrastructure
const agent = new Agent(components.agent, {
  /* config */
});

// Effect provides composition
const program = Effect.gen(function* () {
  const result = yield* Effect.tryPromise({
    try: () => agent.generateText(ctx, { threadId }, { prompt }),
    catch: (error) => new AgentError({ cause: error }),
  });
  return result;
});
```

### 2. Service Layer Pattern

```typescript
// Define service interface
class MyService extends Context.Tag("MyService")<
  MyService,
  {
    readonly operation: (args) => Effect.Effect<Result, Error>;
  }
>() {}

// Implement service
const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    // Dependencies
    const dep = yield* DependencyService;

    return {
      operation: (args) =>
        Effect.gen(function* () {
          // Implementation
        }),
    };
  }),
);
```

### 3. Error Handling Pattern

```typescript
Effect.gen(function* () {
  const result = yield* riskyOperation();
  return result;
}).pipe(
  Effect.catchTag("SpecificError", (error) => handleSpecific(error)),
  Effect.catchAll((error) => handleAny(error)),
  Effect.retry(Schedule.exponential("1 second").pipe(Schedule.recurs(3))),
);
```

### 4. Parallel Execution Pattern

```typescript
const results =
  yield *
  Effect.all([operation1(), operation2(), operation3()], {
    concurrency: 2,
    mode: "default",
  });
```

### 5. Resource Management Pattern

```typescript
Effect.scoped(
  Effect.gen(function* () {
    const resource = yield* Effect.acquireRelease(acquire, (r) => release(r));
    return yield* useResource(resource);
  }),
);
```

## Related Documentation

- [Effect.ts Official Docs](https://effect.website) - Core Effect documentation
- [Confect Repository](https://github.com/rjdellecese/confect) - Full Convex integration
- [@convex-dev/agent](https://github.com/get-convex/agent) - Agent component
- [@convex-dev/workflow](https://github.com/get-convex/workflow) - Workflow component
- [ONE Platform Architecture](/one/knowledge/architecture.md) - Platform overview
- [6-Dimension Ontology](/one/knowledge/ontology.md) - Data model

---

**Status:** Ready for Execution
**Next Step:** Begin Cycle 1 with agent-director for architecture validation
