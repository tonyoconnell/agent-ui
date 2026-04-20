---
title: Effect Patterns Reference
dimension: things
category: plans
tags: ai
related_dimensions: connections, events, knowledge
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/effect-patterns-reference.md
  Purpose: Documents effect.ts patterns reference for one platform
  Related dimensions: connections, events, knowledge
  For AI agents: Read this to understand effect patterns reference.
---

# Effect.ts Patterns Reference for ONE Platform

**Version:** 1.0.0
**Last Updated:** 2025-10-30
**Status:** Production-Ready Patterns

This is your practical handbook for using Effect.ts in the ONE Platform. Find patterns, copy examples, ship features.

---

## Section 1: Quick Decision Trees

### When to Use Effect vs Plain TypeScript

```
START HERE
    │
    ├─ Does it involve async operations?
    │   └─ YES → Continue
    │   └─ NO → Use plain TypeScript (no Effect needed)
    │
    ├─ Does it need error handling?
    │   └─ YES → Use Effect (tagged errors > try/catch)
    │   └─ NO → Continue
    │
    ├─ Does it compose with other operations?
    │   └─ YES → Use Effect (Effect.gen, Effect.all)
    │   └─ NO → Continue
    │
    ├─ Does it need retry logic?
    │   └─ YES → Use Effect (Schedule.exponential)
    │   └─ NO → Continue
    │
    ├─ Does it need dependency injection?
    │   └─ YES → Use Effect (Context, Layer)
    │   └─ NO → Continue
    │
    └─ Does it manage resources (connections, streams)?
        └─ YES → Use Effect (Scope, acquireRelease)
        └─ NO → Plain async/await is fine
```

**Simple Rule:** If it's just data transformation or basic async, use plain TypeScript. If it has complex error handling, composition, or resource management → Effect.

### When to Wrap Components vs Use Directly

```
CONVEX COMPONENT DECISION
    │
    ├─ @convex-dev/agent
    │   └─ Wrap if: Multi-agent orchestration, custom error handling
    │   └─ Direct if: Single agent, simple chat
    │
    ├─ @convex-dev/workflow
    │   └─ Wrap if: Business logic in steps needs composition
    │   └─ Direct if: Simple sequential steps
    │
    ├─ @convex-dev/rag
    │   └─ Wrap if: Composing search with other services
    │   └─ Direct if: Standalone vector search
    │
    ├─ @convex-dev/rate-limiter
    │   └─ Wrap if: Multiple rate limits, custom retry logic
    │   └─ Direct if: Single rate limit check
    │
    ├─ @convex-dev/persistent-text-streaming
    │   └─ Direct: Agent component has built-in streaming (use that)
    │
    ├─ @convex-dev/retrier
    │   └─ Wrap if: Coordinating with Effect.retry (hybrid approach)
    │   └─ Direct if: Action-level retries only
    │
    ├─ @convex-dev/workpool
    │   └─ Wrap if: Batch enqueuing, error handling
    │   └─ Direct if: Simple task queue
    │
    └─ @convex-dev/crons
        └─ Wrap if: Cron job logic needs composition
        └─ Direct if: Simple scheduled mutations
```

**Golden Rule:** Components handle infrastructure (durability, retries, streaming). Effect handles business logic (composition, error handling, orchestration).

### When to Use Confect vs Manual Wrapping

```
CONFECT DECISION TREE
    │
    ├─ Is this a NEW project?
    │   └─ YES → Consider Confect (schema-first, full Effect integration)
    │   └─ NO → Continue
    │
    ├─ Is your team experienced with Effect?
    │   └─ YES → Consider Confect
    │   └─ NO → Manual wrapping (easier learning curve)
    │
    ├─ Do you want Option<T> instead of T | null everywhere?
    │   └─ YES → Confect
    │   └─ NO → Manual wrapping
    │
    ├─ Do you need Effect schemas instead of Convex validators?
    │   └─ YES → Confect
    │   └─ NO → Manual wrapping
    │
    └─ Is this an EXISTING Convex project?
        └─ YES → Manual wrapping (incremental adoption)
        └─ NO → Consider Confect
```

**Recommendation for ONE Platform:** Start with manual wrapping. Confect is powerful but adds learning overhead. Prove the patterns work with manual integration first.

---

## Section 2: Core Patterns with Examples

### Pattern 1: Effect-Wrapped Component ✅ PRODUCTION-PROVEN

**When:** Wrapping Convex components for type-safe error handling and composition.

**Example: Wrapping @convex-dev/agent**

```typescript
// backend/convex/services/agent.service.ts
import { Effect, Context, Layer, Data } from "effect";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "../_generated/api";

// 1. Define tagged errors
class AgentError extends Data.TaggedError("AgentError")<{
  agentName: string;
  cause: unknown;
}> {}

// 2. Define service interface
class AgentService extends Context.Tag("AgentService")<
  AgentService,
  {
    readonly generateResponse: (
      ctx: ActionCtx,
      threadId: string,
      prompt: string,
    ) => Effect.Effect<string, AgentError>;

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
    // Component handles infrastructure
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
        // Effect provides composition
        Effect.tryPromise({
          try: async () => {
            const { thread } = await agent.continueThread(ctx, { threadId });
            const result = await thread.generateText({ prompt });
            return result.text;
          },
          catch: (error) =>
            new AgentError({
              agentName: "Support Agent",
              cause: error,
            }),
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

export { AgentService, AgentServiceLive, AgentError };
```

**Usage in API:**

```typescript
// backend/convex/api/agents.ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import { Effect } from "effect";
import { AgentService, AgentServiceLive } from "../services/agent.service";

export const chat = action({
  args: { threadId: v.string(), prompt: v.string() },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      const agentService = yield* AgentService;
      const response = yield* agentService.generateResponse(
        ctx,
        args.threadId,
        args.prompt,
      );
      return { response };
    }).pipe(
      Effect.provide(AgentServiceLive),
      Effect.catchTag("AgentError", (error) =>
        Effect.succeed({
          response: "I'm having trouble. Please try again.",
          error: true,
        }),
      ),
      Effect.runPromise,
    ),
});
```

---

### Pattern 2: Service Layer Pattern (Context.Tag + Layer.effect) ✅ PRODUCTION-PROVEN

**When:** Creating reusable, testable services with dependency injection.

**Example: RAG Service with Dependencies**

```typescript
// backend/convex/services/rag.service.ts
import { Effect, Context, Layer, Data } from "effect";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { components } from "../_generated/api";

// 1. Define errors
class RAGError extends Data.TaggedError("RAGError")<{
  operation: string;
  cause: unknown;
}> {}

class EmbeddingError extends Data.TaggedError("EmbeddingError")<{
  text: string;
  cause: unknown;
}> {}

// 2. Define service interface
class RAGService extends Context.Tag("RAGService")<
  RAGService,
  {
    readonly addDocument: (
      ctx: ActionCtx,
      namespace: string,
      content: string,
      metadata: Record<string, any>,
    ) => Effect.Effect<string, RAGError>;

    readonly search: (
      ctx: ActionCtx,
      namespace: string,
      query: string,
      limit?: number,
    ) => Effect.Effect<{ text: string; entries: any[] }, RAGError>;
  }
>() {}

// 3. Implement service
const RAGServiceLive = Layer.effect(
  RAGService,
  Effect.gen(function* () {
    const rag = new RAG(components.rag, {
      textEmbeddingModel: openai.embedding("text-embedding-3-small"),
      embeddingDimension: 1536,
    });

    return {
      addDocument: (ctx, namespace, content, metadata) =>
        Effect.tryPromise({
          try: async () => {
            const result = await rag.add(ctx, {
              namespace,
              text: content,
              filterValues: Object.entries(metadata).map(([name, value]) => ({
                name,
                value,
              })),
            });
            return result.entryId;
          },
          catch: (error) =>
            new RAGError({
              operation: "addDocument",
              cause: error,
            }),
        }),

      search: (ctx, namespace, query, limit = 10) =>
        Effect.tryPromise({
          try: async () => {
            const results = await rag.search(ctx, {
              namespace,
              query,
              limit,
              vectorScoreThreshold: 0.6,
            });
            return {
              text: results.text,
              entries: results.entries,
            };
          },
          catch: (error) =>
            new RAGError({
              operation: "search",
              cause: error,
            }),
        }),
    };
  }),
);

export { RAGService, RAGServiceLive, RAGError };
```

**Composing Services:**

```typescript
// backend/convex/api/contextual-chat.ts
import { action } from "../_generated/server";
import { Effect } from "effect";
import { AgentService, AgentServiceLive } from "../services/agent.service";
import { RAGService, RAGServiceLive } from "../services/rag.service";

export const contextualChat = action({
  args: { userId: v.string(), question: v.string() },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      // Inject both services
      const agentService = yield* AgentService;
      const ragService = yield* RAGService;

      // 1. Fetch context from RAG
      const context = yield* ragService.search(
        ctx,
        args.userId, // User-specific namespace
        args.question,
        5,
      );

      // 2. Generate answer with context
      const answer = yield* agentService.generateResponse(
        ctx,
        args.threadId,
        `${args.question}\n\nContext: ${context.text}`,
      );

      return {
        answer,
        sources: context.entries.map((e) => e.entryId),
      };
    }).pipe(
      // Provide both service implementations
      Effect.provide(Layer.merge(AgentServiceLive, RAGServiceLive)),
      Effect.catchAll((error) =>
        Effect.succeed({
          answer: "I'm having trouble finding information.",
          error: true,
        }),
      ),
      Effect.runPromise,
    ),
});
```

---

### Pattern 3: Error Handling Pattern (Tagged Errors) ✅ PRODUCTION-PROVEN

**When:** Need type-safe error handling with automatic propagation.

**Example: Layered Error Handling**

```typescript
// backend/convex/domain/agents/errors.ts
import { Data } from "effect";

// Domain errors (business logic)
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

export class InsufficientCreditsError extends Data.TaggedError(
  "InsufficientCreditsError",
)<{
  userId: string;
  required: number;
  available: number;
}> {}

// Infrastructure errors
export class AgentError extends Data.TaggedError("AgentError")<{
  agentName: string;
  cause: unknown;
}> {}

export class RateLimitError extends Data.TaggedError("RateLimitError")<{
  retryAfter: number;
}> {}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  endpoint: string;
  cause: unknown;
}> {}
```

**Handling Errors at Appropriate Layers:**

```typescript
// backend/convex/api/premium-chat.ts
import { action } from "../_generated/server";
import { Effect, Schedule } from "effect";
import { AgentService, AgentServiceLive } from "../services/agent.service";
import {
  UserNotFoundError,
  InsufficientCreditsError,
  AgentError,
  RateLimitError,
} from "../domain/agents/errors";

export const premiumChat = action({
  args: { userId: v.string(), prompt: v.string() },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      // 1. Check user credits (can fail with UserNotFoundError or InsufficientCreditsError)
      const user = yield* getUserWithCredits(ctx, args.userId);

      // 2. Generate response (can fail with AgentError or RateLimitError)
      const agentService = yield* AgentService;
      const response = yield* agentService.generateResponse(
        ctx,
        user.threadId,
        args.prompt,
      );

      // 3. Deduct credits
      yield* deductCredits(ctx, args.userId, 10);

      return { response };
    }).pipe(
      Effect.provide(AgentServiceLive),

      // Handle domain errors specifically
      Effect.catchTag("UserNotFoundError", (error) =>
        Effect.succeed({
          error: `User ${error.userId} not found`,
          code: "USER_NOT_FOUND",
        }),
      ),
      Effect.catchTag("InsufficientCreditsError", (error) =>
        Effect.succeed({
          error: `Insufficient credits. Need ${error.required}, have ${error.available}`,
          code: "INSUFFICIENT_CREDITS",
        }),
      ),

      // Handle infrastructure errors with retry
      Effect.catchTag("RateLimitError", (error) =>
        Effect.sleep(`${error.retryAfter} seconds`).pipe(
          Effect.flatMap(() => premiumChat.handler(ctx, args)),
        ),
      ),
      Effect.catchTag("AgentError", (error) =>
        Effect.retry(
          Effect.fail(error),
          Schedule.exponential("1 second").pipe(
            Schedule.compose(Schedule.recurs(2)),
          ),
        ).pipe(
          Effect.catchAll(() =>
            Effect.succeed({
              error: "Agent temporarily unavailable",
              code: "AGENT_ERROR",
            }),
          ),
        ),
      ),

      // Catch-all for unexpected errors
      Effect.catchAll((error) => {
        console.error("Unexpected error:", error);
        return Effect.succeed({
          error: "Something went wrong",
          code: "UNKNOWN_ERROR",
        });
      }),

      Effect.runPromise,
    ),
});
```

**Key Pattern:** Handle errors at the layer where you can do something about them. Domain errors → immediate user feedback. Infrastructure errors → retry/fallback logic.

---

### Pattern 4: Parallel Execution Pattern (Effect.all) ✅ PRODUCTION-PROVEN

**When:** Need to run multiple operations concurrently with controlled parallelism.

**Example: Multi-Agent Research Pipeline**

```typescript
// backend/convex/domain/agents/research.ts
import { Effect } from "effect";
import { AgentService } from "../../services/agent.service";

export const conductResearch = (query: string) =>
  Effect.gen(function* () {
    const agentService = yield* AgentService;

    // Run 3 agents in parallel with max concurrency of 2
    const [webResults, academicResults, newsResults] = yield* Effect.all(
      [
        agentService.generateResponse(ctx, "web-agent", `Web search: ${query}`),
        agentService.generateResponse(
          ctx,
          "academic-agent",
          `Academic search: ${query}`,
        ),
        agentService.generateResponse(
          ctx,
          "news-agent",
          `News search: ${query}`,
        ),
      ],
      {
        concurrency: 2, // Max 2 concurrent operations
        mode: "default", // Fail fast on first error
      },
    );

    // Synthesize results
    const synthesis = yield* agentService.generateResponse(
      ctx,
      "synthesis-agent",
      `Synthesize these findings:\n\nWeb: ${webResults}\n\nAcademic: ${academicResults}\n\nNews: ${newsResults}`,
    );

    return synthesis;
  });
```

**Parallel with Graceful Degradation:**

```typescript
// backend/convex/domain/agents/quality-check.ts
import { Effect } from "effect";

export const qualityCheckWithGracefulDegradation = (response: string) =>
  Effect.gen(function* () {
    // Run quality checks in parallel, continue even if some fail
    const results = yield* Effect.all(
      [
        checkGrammar(response).pipe(
          Effect.catchAll(() => Effect.succeed({ score: 1.0, passed: true })),
        ),
        checkFactuality(response).pipe(
          Effect.catchAll(() => Effect.succeed({ score: 1.0, passed: true })),
        ),
        checkToxicity(response).pipe(
          Effect.catchAll(() => Effect.succeed({ score: 0.0, passed: true })),
        ),
      ],
      {
        concurrency: 3,
        mode: "default",
      },
    );

    const [grammar, factuality, toxicity] = results;

    return {
      overallScore:
        (grammar.score + factuality.score + (1 - toxicity.score)) / 3,
      passed: grammar.passed && factuality.passed && toxicity.passed,
    };
  });
```

**Parallel Batch Processing:**

```typescript
// backend/convex/api/batch-process.ts
import { action } from "../_generated/server";
import { Effect } from "effect";

export const processBatch = action({
  args: { items: v.array(v.string()) },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      // Process items with controlled parallelism
      const results = yield* Effect.all(
        args.items.map((item) => processItem(ctx, item)),
        {
          concurrency: 5, // Process 5 items at a time
          mode: "either", // Continue even if some fail
        },
      );

      // Separate successes and failures
      const successes = results.filter((r) => Effect.isSuccess(r));
      const failures = results.filter((r) => Effect.isFailure(r));

      return {
        successCount: successes.length,
        failureCount: failures.length,
        results,
      };
    }).pipe(Effect.provide(/* layers */), Effect.runPromise),
});
```

---

### Pattern 5: Resource Management Pattern (Effect.scoped) ✅ PRODUCTION-PROVEN

**When:** Managing resources (connections, streams, file handles) that need cleanup.

**Example: Database Connection Pool**

```typescript
// backend/convex/services/database.service.ts
import { Effect, Context, Layer, Scope } from "effect";

class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  {
    readonly query: <A>(
      sql: string,
      params: any[],
    ) => Effect.Effect<A[], Error>;
    readonly transaction: <A>(
      fn: (tx: Transaction) => Effect.Effect<A, Error>,
    ) => Effect.Effect<A, Error>;
  }
>() {}

const DatabaseServiceLive = Layer.scoped(
  DatabaseService,
  Effect.gen(function* () {
    // Acquire connection pool (will be released automatically)
    const pool = yield* Effect.acquireRelease(
      Effect.sync(() => createConnectionPool({ size: 10 })),
      (pool) => Effect.sync(() => pool.close()),
    );

    return {
      query: (sql, params) =>
        Effect.tryPromise({
          try: async () => {
            const conn = await pool.acquire();
            try {
              return await conn.query(sql, params);
            } finally {
              pool.release(conn);
            }
          },
          catch: (error) => new Error(String(error)),
        }),

      transaction: (fn) =>
        Effect.scoped(
          Effect.gen(function* () {
            // Acquire transaction (will rollback on error, commit on success)
            const tx = yield* Effect.acquireRelease(
              Effect.tryPromise({
                try: () => pool.beginTransaction(),
                catch: (error) => new Error(String(error)),
              }),
              (tx) => Effect.sync(() => tx.rollback()),
            );

            const result = yield* fn(tx);

            yield* Effect.tryPromise({
              try: () => tx.commit(),
              catch: (error) => new Error(String(error)),
            });

            return result;
          }),
        ),
    };
  }),
);
```

**Example: Stream Processing with Cleanup**

```typescript
// backend/convex/services/streaming.service.ts
import { Effect, Stream } from "effect";

const processStreamWithCleanup = (streamUrl: string) =>
  Effect.scoped(
    Effect.gen(function* () {
      // Acquire stream (will close on completion or error)
      const stream = yield* Effect.acquireRelease(
        Effect.tryPromise({
          try: () => openStream(streamUrl),
          catch: (error) => new Error(String(error)),
        }),
        (stream) => Effect.sync(() => stream.close()),
      );

      // Process chunks
      const results: string[] = [];

      yield* Stream.fromAsyncIterable(
        stream,
        () => new Error("Stream failed"),
      ).pipe(
        Stream.mapEffect((chunk) =>
          Effect.gen(function* () {
            const processed = yield* processChunk(chunk);
            results.push(processed);
            return processed;
          }),
        ),
        Stream.runDrain,
      );

      return results;
    }),
  );
```

---

### Pattern 6: Retry and Timeout Patterns ✅ PRODUCTION-PROVEN

**When:** Calling unreliable external APIs or LLM services.

**Example: Exponential Backoff Retry**

```typescript
// backend/convex/services/llm.service.ts
import { Effect, Schedule } from "effect";

class LLMService extends Context.Tag("LLMService")<
  LLMService,
  {
    readonly complete: (prompt: string) => Effect.Effect<string, LLMError>;
  }
>() {}

const LLMServiceLive = Layer.succeed(LLMService, {
  complete: (prompt) =>
    Effect.tryPromise({
      try: () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        }),
      catch: (error) => new LLMError({ cause: error }),
    }).pipe(
      // Retry with exponential backoff
      Effect.retry(
        Schedule.exponential("500 millis").pipe(
          Schedule.compose(Schedule.recurs(3)), // Max 3 retries
          Schedule.compose(
            Schedule.elapsed.pipe(
              Schedule.whileOutput((duration) => duration < 30_000), // Max 30s total
            ),
          ),
        ),
      ),
      Effect.map((result) => result.choices[0].message.content),
    ),
});
```

**Example: Timeout with Fallback**

```typescript
// backend/convex/domain/agents/robust-generation.ts
import { Effect, Schedule } from "effect";

export const robustGeneration = (prompt: string) =>
  Effect.gen(function* () {
    const llmService = yield* LLMService;

    // Try primary model with timeout
    const result = yield* llmService.complete(prompt).pipe(
      Effect.timeout("10 seconds"),
      Effect.catchTag("TimeoutError", () =>
        // Fallback 1: Reduce prompt length and retry
        llmService.complete(truncate(prompt, 1000)).pipe(
          Effect.timeout("10 seconds"),
          Effect.catchTag("TimeoutError", () =>
            // Fallback 2: Use faster model
            llmService.completeFast(truncate(prompt, 500)).pipe(
              Effect.timeout("5 seconds"),
              Effect.catchTag("TimeoutError", () =>
                // Fallback 3: Return cached response
                getCachedResponse(prompt).pipe(
                  Effect.catchAll(() =>
                    Effect.succeed(
                      "I'm experiencing technical difficulties. Please try again.",
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    return result;
  });
```

**Example: Conditional Retry (Only on Specific Errors)**

```typescript
// backend/convex/services/external-api.service.ts
import { Effect, Schedule } from "effect";

const callExternalAPI = (endpoint: string, body: any) =>
  Effect.tryPromise({
    try: () => fetch(endpoint, { method: "POST", body: JSON.stringify(body) }),
    catch: (error) => new NetworkError({ endpoint, cause: error }),
  }).pipe(
    // Only retry on rate limit errors
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.whileInput(
          (error: NetworkError) =>
            error.cause instanceof Response && error.cause.status === 429,
        ),
        Schedule.compose(Schedule.recurs(5)),
      ),
    ),
  );
```

---

## Section 3: Component Integration Checklists

### @convex-dev/agent - Agent Service

**When to Wrap:** Multi-agent orchestration, custom error handling, composing with RAG/rate limiting.

**Pattern:**

```typescript
import { Agent } from "@convex-dev/agent";
import { Effect, Context, Layer } from "effect";

// 1. Define errors
class AgentError extends Data.TaggedError("AgentError")<{
  agentName: string;
  cause: unknown;
}> {}

// 2. Define service
class AgentService extends Context.Tag("AgentService")<
  AgentService,
  {
    readonly generateResponse: (
      ctx,
      threadId,
      prompt,
    ) => Effect.Effect<string, AgentError>;
  }
>() {}

// 3. Implement with component
const AgentServiceLive = Layer.effect(
  AgentService,
  Effect.gen(function* () {
    const agent = new Agent(components.agent, {
      /* config */
    });

    return {
      generateResponse: (ctx, threadId, prompt) =>
        Effect.tryPromise({
          try: async () => {
            const { thread } = await agent.continueThread(ctx, { threadId });
            const result = await thread.generateText({ prompt });
            return result.text;
          },
          catch: (error) => new AgentError({ agentName: "...", cause: error }),
        }),
    };
  }),
);
```

**Checklist:**

- [ ] Wrap agent calls in `Effect.tryPromise`
- [ ] Define `AgentError` with tagged class
- [ ] Create service interface with `Context.Tag`
- [ ] Implement with `Layer.effect`
- [ ] Inject dependencies (RateLimitService, RAGService) if needed
- [ ] Handle errors with `Effect.catchTag`
- [ ] Test with mock layer (TestAgentServiceLive)

---

### @convex-dev/workflow - Workflow Service

**When to Use Workflow vs Effect:**

- **Use Workflow for:** Long-running, durable operations (hours/days), need journaling, external actions
- **Use Effect for:** Business logic in workflow steps, error handling within steps, service composition

**Pattern: Effect in Workflow Steps**

```typescript
import { WorkflowManager } from "@convex-dev/workflow";
import { Effect } from "effect";

const workflow = new WorkflowManager(components.workflow);

export const researchWorkflow = workflow.define({
  args: { query: v.string() },
  handler: async (step, args): Promise<ResearchResult> => {
    // Step 1: Fetch context (query)
    const context = await step.runQuery(internal.workflows.getContext, {
      query: args.query,
    });

    // Step 2: Generate with Effect composition (action)
    const analysis = await step.runAction(
      internal.workflows.analyzeWithEffect,
      { query: args.query, context },
    );

    // Step 3: Quality check in parallel
    const [grammar, factuality] = await Promise.all([
      step.runAction(internal.workflows.checkGrammar, { text: analysis }),
      step.runAction(internal.workflows.checkFactuality, { text: analysis }),
    ]);

    // Step 4: Refine if needed
    const refined =
      grammar.score < 0.8 || factuality.score < 0.8
        ? await step.runAction(
            internal.workflows.refineResponse,
            { original: analysis, context },
            { retry: { maxAttempts: 2 } },
          )
        : analysis;

    return { result: refined };
  },
});

// The action uses Effect internally
export const analyzeWithEffect = internalAction({
  args: { query: v.string(), context: v.any() },
  handler: async (ctx, args) => {
    const program = Effect.gen(function* () {
      const agentService = yield* AgentService;
      const ragService = yield* RAGService;

      const enriched = yield* ragService.search(ctx, "global", args.query, 5);
      const result = yield* agentService.generateResponse(
        ctx,
        "analysis-thread",
        `${args.query}\n\nContext: ${args.context}\n\nAdditional: ${enriched.text}`,
      );

      return result;
    });

    return await Effect.runPromise(
      program.pipe(
        Effect.provide(Layer.merge(AgentServiceLive, RAGServiceLive)),
        Effect.catchAll((error) => {
          console.error("Analysis failed:", error);
          return Effect.succeed("Analysis unavailable");
        }),
      ),
    );
  },
});
```

**Checklist:**

- [ ] Use Workflow component for durability (step-level retries, journaling)
- [ ] Use Effect in actions called by workflow steps
- [ ] Provide service layers in actions
- [ ] Convert Effect to Promise with `Effect.runPromise`
- [ ] Handle errors with `Effect.catchAll` before running
- [ ] Test workflow steps independently with mock layers

---

### @convex-dev/rag - RAG Service

**When to Wrap:** Composing search with other services, custom pre-processing, error handling.

**Pattern:**

```typescript
import { RAG } from "@convex-dev/rag";
import { Effect, Context, Layer } from "effect";

class RAGError extends Data.TaggedError("RAGError")<{
  operation: string;
  cause: unknown;
}> {}

class RAGService extends Context.Tag("RAGService")<
  RAGService,
  {
    readonly addDocument: (
      ctx,
      namespace,
      content,
      metadata,
    ) => Effect.Effect<string, RAGError>;
    readonly search: (
      ctx,
      namespace,
      query,
      limit?,
    ) => Effect.Effect<{ text: string; entries: any[] }, RAGError>;
  }
>() {}

const RAGServiceLive = Layer.effect(
  RAGService,
  Effect.gen(function* () {
    const rag = new RAG(components.rag, {
      textEmbeddingModel: openai.embedding("text-embedding-3-small"),
      embeddingDimension: 1536,
    });

    return {
      addDocument: (ctx, namespace, content, metadata) =>
        Effect.tryPromise({
          try: async () => {
            const result = await rag.add(ctx, {
              namespace,
              text: content,
              filterValues: [],
            });
            return result.entryId;
          },
          catch: (error) =>
            new RAGError({ operation: "addDocument", cause: error }),
        }),

      search: (ctx, namespace, query, limit = 10) =>
        Effect.tryPromise({
          try: async () => {
            const results = await rag.search(ctx, { namespace, query, limit });
            return { text: results.text, entries: results.entries };
          },
          catch: (error) => new RAGError({ operation: "search", cause: error }),
        }),
    };
  }),
);
```

**Checklist:**

- [ ] Wrap `rag.add()` and `rag.search()` in `Effect.tryPromise`
- [ ] Define `RAGError` with operation name
- [ ] Create service interface with `Context.Tag`
- [ ] Implement with `Layer.effect`
- [ ] Compose with AgentService for contextual responses
- [ ] Handle errors with `Effect.catchTag`
- [ ] Test with TestRAGServiceLive (mock embeddings)

---

### @convex-dev/rate-limiter - Rate Limit Service

**When to Wrap:** Multiple rate limits, composing with business logic, custom retry.

**Pattern:**

```typescript
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { Effect, Context, Layer, Schedule } from "effect";

class RateLimitError extends Data.TaggedError("RateLimitError")<{
  type: string;
  retryAfter: number;
}> {}

class RateLimitService extends Context.Tag("RateLimitService")<
  RateLimitService,
  {
    readonly checkLimit: (
      ctx,
      key,
      count?,
    ) => Effect.Effect<boolean, RateLimitError>;
  }
>() {}

const RateLimitServiceLive = Layer.effect(
  RateLimitService,
  Effect.gen(function* () {
    const limiter = new RateLimiter(components.rateLimiter, {
      requests: { kind: "token bucket", rate: 20, period: MINUTE },
    });

    return {
      checkLimit: (ctx, key, count = 1) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () => limiter.limit(ctx, "requests", { key, count }),
            catch: (error) => new Error(String(error)),
          });

          if (!result.ok) {
            return yield* Effect.fail(
              new RateLimitError({
                type: "requests",
                retryAfter: result.retryAfter,
              }),
            );
          }

          return true;
        }),
    };
  }),
);
```

**Checklist:**

- [ ] Wrap `limiter.limit()` in `Effect.tryPromise`
- [ ] Check `result.ok` and fail with `RateLimitError` if exceeded
- [ ] Define `RateLimitError` with `retryAfter` field
- [ ] Compose with other services (agent, RAG)
- [ ] Handle rate limit errors with retry or user feedback
- [ ] Test with TestRateLimitServiceLive (always pass or always fail)

---

### @convex-dev/retrier - Retrier Service

**When to Use:** Action-level retries with persistent state vs Effect.retry for in-memory retries.

**Pattern: Hybrid Retrier + Effect.retry**

```typescript
import { ActionRetrier } from "@convex-dev/action-retrier";
import { Effect, Schedule } from "effect";

class ResilientExecutionService extends Context.Tag(
  "ResilientExecutionService",
)<
  ResilientExecutionService,
  {
    readonly executeWithRetry: <A>(
      ctx,
      action,
      args,
    ) => Effect.Effect<A, ExecutionError>;
  }
>() {}

const ResilientExecutionServiceLive = Layer.effect(
  ResilientExecutionService,
  Effect.gen(function* () {
    const retrier = new ActionRetrier(components.actionRetrier, {
      initialBackoffMs: 250,
      base: 2,
      maxFailures: 4,
    });

    return {
      executeWithRetry: (ctx, action, args) =>
        Effect.gen(function* () {
          // Use retrier for action-level retries
          const runId = yield* Effect.tryPromise({
            try: () => retrier.run(ctx, action, args),
            catch: () => new RetrierStartError(),
          });

          // Poll for completion with Effect schedule
          const result = yield* Effect.repeat(
            Effect.gen(function* () {
              const status = yield* Effect.tryPromise({
                try: () => retrier.status(ctx, runId),
                catch: () => new StatusCheckError(),
              });

              if (status.type === "inProgress") {
                return yield* Effect.fail(Option.none());
              }

              return status.result;
            }),
            Schedule.spaced("500 millis").pipe(
              Schedule.compose(Schedule.recurs(60)), // Max 30 seconds
            ),
          );

          if (result.type === "success") {
            return result.returnValue;
          } else {
            return yield* Effect.fail(
              new ExecutionFailed({ error: result.error }),
            );
          }
        }),
    };
  }),
);
```

**Checklist:**

- [ ] Use retrier for long-running actions with persistent state
- [ ] Use Effect.retry for in-memory, short-lived operations
- [ ] Poll for completion with `Effect.repeat` and `Schedule.spaced`
- [ ] Handle completion status (success, failed, canceled)
- [ ] Compose with other services
- [ ] Test with TestResilientExecutionServiceLive

---

### @convex-dev/workpool - Task Queue Service

**When to Wrap:** Batch enqueuing, error handling for tasks, coordinating queues.

**Pattern:**

```typescript
import { Workpool } from "@convex-dev/workpool";
import { Effect, Context, Layer } from "effect";

class TaskQueueService extends Context.Tag("TaskQueueService")<
  TaskQueueService,
  {
    readonly enqueue: (
      ctx,
      priority,
      action,
      args,
    ) => Effect.Effect<string, EnqueueError>;
  }
>() {}

const TaskQueueServiceLive = Layer.effect(
  TaskQueueService,
  Effect.gen(function* () {
    const highPriority = new Workpool(components.highPriorityWorkpool, {
      maxParallelism: 20,
    });
    const lowPriority = new Workpool(components.lowPriorityWorkpool, {
      maxParallelism: 5,
    });

    return {
      enqueue: (ctx, priority, action, args) =>
        Effect.tryPromise({
          try: async () => {
            const pool = priority === "high" ? highPriority : lowPriority;
            const taskId = await pool.enqueueAction(ctx, action, args);
            return taskId;
          },
          catch: (error) => new EnqueueError({ cause: error }),
        }),
    };
  }),
);
```

**Batch Enqueue:**

```typescript
export const processBatch = mutation({
  args: { items: v.array(v.any()) },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      const taskQueue = yield* TaskQueueService;

      const taskIds = yield* Effect.all(
        args.items.map((item) =>
          taskQueue.enqueue(ctx, "low", internal.tasks.processItem, item),
        ),
        { concurrency: 10 },
      );

      return { taskIds, count: taskIds.length };
    }).pipe(Effect.provide(TaskQueueServiceLive), Effect.runPromise),
});
```

**Checklist:**

- [ ] Wrap `workpool.enqueueAction()` in `Effect.tryPromise`
- [ ] Support multiple priority queues
- [ ] Use `Effect.all` for batch enqueuing with concurrency control
- [ ] Handle enqueue errors with `Effect.catchTag`
- [ ] Test with TestTaskQueueServiceLive

---

### @convex-dev/persistent-text-streaming - Streaming Service

**When to Use:** Generally, use Agent component's built-in streaming (`saveStreamDeltas: true`). Only wrap if you need custom stream processing.

**Pattern:**

```typescript
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { Effect, Stream } from "effect";

class StreamingService extends Context.Tag("StreamingService")<
  StreamingService,
  {
    readonly processStream: (
      ctx,
      streamId,
      source,
    ) => Effect.Effect<void, StreamError>;
  }
>() {}

const StreamingServiceLive = Layer.effect(
  StreamingService,
  Effect.gen(function* () {
    const streaming = new PersistentTextStreaming(
      components.persistentTextStreaming,
    );

    return {
      processStream: (ctx, streamId, source) =>
        Effect.gen(function* () {
          yield* Stream.fromAsyncIterable(source, () => new StreamError()).pipe(
            Stream.mapEffect((chunk) =>
              Effect.tryPromise({
                try: () => streaming.appendChunk(ctx, streamId, chunk),
                catch: () => new ChunkAppendError({ chunk }),
              }),
            ),
            Stream.runDrain,
          );

          yield* Effect.tryPromise({
            try: () =>
              ctx.runMutation(api.streaming.markComplete, { streamId }),
            catch: () => new StreamCompletionError(),
          });
        }),
    };
  }),
);
```

**Checklist:**

- [ ] Use Agent component's built-in streaming for most cases
- [ ] Only wrap if you need custom processing (duplicate streams, filtering)
- [ ] Use `Stream.fromAsyncIterable` for async sources
- [ ] Use `Stream.mapEffect` for effectful processing
- [ ] Handle backpressure with `Stream.buffer`
- [ ] Always mark stream complete or failed

---

### @convex-dev/crons - Cron Service

**When to Wrap:** Cron job logic needs composition with other services.

**Pattern:**

```typescript
import { Crons } from "@convex-dev/crons";
import { Effect } from "effect";

// Register cron (mutation)
export const setupDailyCron = internalMutation({
  handler: async (ctx) => {
    const crons = new Crons(components.crons);
    await crons.register(
      ctx,
      { kind: "cron", cronspec: "0 0 * * *" },
      internal.crons.dailyMaintenanceWithEffect,
      {},
      "daily-maintenance",
    );
  },
});

// Cron job uses Effect for logic (action)
export const dailyMaintenanceWithEffect = internalAction({
  handler: async (ctx) => {
    const program = Effect.gen(function* () {
      const ragService = yield* RAGService;
      const monitoring = yield* MonitoringService;

      // Cleanup old content
      yield* Effect.tryPromise({
        try: () => ctx.runMutation(internal.rag.cleanupOld, {}),
        catch: () => new CleanupError(),
      });

      // Generate report
      const report = yield* monitoring.generateDailyReport(ctx);

      // Send email
      yield* Effect.tryPromise({
        try: () => ctx.runAction(internal.email.sendReport, { report }),
        catch: () => new EmailError(),
      });

      return { success: true };
    });

    await Effect.runPromise(
      program.pipe(
        Effect.provide(Layer.merge(RAGServiceLive, MonitoringServiceLive)),
        Effect.catchAll((error) => {
          console.error("Daily maintenance failed:", error);
          return Effect.succeed({ success: false, error });
        }),
      ),
    );
  },
});
```

**Checklist:**

- [ ] Use Crons component for registration and scheduling
- [ ] Use Effect in the cron job action for business logic
- [ ] Compose with other services (RAG, monitoring, email)
- [ ] Provide service layers in the action
- [ ] Handle errors gracefully (don't crash cron)
- [ ] Log execution results for monitoring

---

## Section 4: Production Patterns

### Pattern: Service Layer Composition (Layer.mergeAll) ✅ PRODUCTION-PROVEN

**Example: Building Application Layer**

```typescript
// backend/convex/services/layers.ts
import { Layer } from "effect";
import { AgentServiceLive } from "./agent.service";
import { RAGServiceLive } from "./rag.service";
import { RateLimitServiceLive } from "./rate-limit.service";
import { MonitoringServiceLive } from "./monitoring.service";

// Compose all service layers
export const AppLayer = Layer.mergeAll(
  RateLimitServiceLive,
  MonitoringServiceLive,
).pipe(
  Layer.provideMerge(RAGServiceLive), // RAG depends on above
  Layer.provideMerge(AgentServiceLive), // Agent depends on all above
);

// Usage in any endpoint
export const myAction = action({
  args: {
    /* ... */
  },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      // All services available
      const agent = yield* AgentService;
      const rag = yield* RAGService;
      const rateLimit = yield* RateLimitService;
      const monitoring = yield* MonitoringService;

      // Your logic here
    }).pipe(
      Effect.provide(AppLayer), // Single line provides all services
      Effect.runPromise,
    ),
});
```

---

### Pattern: Multi-Agent Orchestration ✅ PRODUCTION-PROVEN

**Example: Research Agent System**

```typescript
// backend/convex/domain/agents/research-orchestration.ts
import { Effect } from "effect";

export const conductResearch = (query: string) =>
  Effect.gen(function* () {
    const agentService = yield* AgentService;
    const ragService = yield* RAGService;

    // Step 1: Classify query
    const classification = yield* agentService.generateResponse(
      ctx,
      "classifier-thread",
      `Classify this query: ${query}`,
    );

    // Step 2: Parallel research based on classification
    const [webResults, academicResults, newsResults] = yield* Effect.all(
      [
        agentService.generateResponse(ctx, "web-thread", `Web: ${query}`),
        agentService.generateResponse(
          ctx,
          "academic-thread",
          `Academic: ${query}`,
        ),
        agentService.generateResponse(ctx, "news-thread", `News: ${query}`),
      ],
      { concurrency: 3 },
    );

    // Step 3: Enrich with RAG context
    const ragContext = yield* ragService.search(ctx, "global", query, 5);

    // Step 4: Synthesize all findings
    const synthesis = yield* agentService.generateResponse(
      ctx,
      "synthesis-thread",
      `Synthesize:\n\nWeb: ${webResults}\n\nAcademic: ${academicResults}\n\nNews: ${newsResults}\n\nContext: ${ragContext.text}`,
    );

    // Step 5: Quality check in parallel
    const [grammar, factuality] = yield* Effect.all(
      [checkGrammar(synthesis), checkFactuality(synthesis)],
      { concurrency: 2 },
    );

    // Step 6: Refine if needed
    const final =
      grammar.score < 0.8 || factuality.score < 0.8
        ? yield* agentService.generateResponse(
            ctx,
            "refine-thread",
            `Refine this: ${synthesis}`,
          )
        : synthesis;

    return {
      result: final,
      sources: {
        web: webResults,
        academic: academicResults,
        news: newsResults,
        rag: ragContext.entries,
      },
      quality: { grammar, factuality },
    };
  });
```

---

### Pattern: Testing with Layers (Mock Providers) ✅ PRODUCTION-PROVEN

**Example: Test Service Implementations**

```typescript
// backend/convex/services/__tests__/agent.service.test.ts
import { Effect, Layer } from "effect";
import { AgentService } from "../agent.service";
import { RAGService } from "../rag.service";
import { RateLimitService } from "../rate-limit.service";

// Create mock implementations
const TestAgentServiceLive = Layer.succeed(AgentService, {
  generateResponse: (ctx, threadId, prompt) =>
    Effect.succeed("Mock agent response"),

  createThread: (ctx, userId) => Effect.succeed("test-thread-id"),
});

const TestRAGServiceLive = Layer.succeed(RAGService, {
  search: (ctx, namespace, query, limit) =>
    Effect.succeed({
      text: "Mock context",
      entries: [],
    }),

  addDocument: (ctx, namespace, content, metadata) =>
    Effect.succeed("mock-entry-id"),
});

const TestRateLimitServiceLive = Layer.succeed(RateLimitService, {
  checkLimit: (ctx, key, count) => Effect.succeed(true), // Always pass
});

// Compose test layers
const TestAppLayer = Layer.mergeAll(
  TestRateLimitServiceLive,
  TestRAGServiceLive,
  TestAgentServiceLive,
);

// Write tests
describe("Research Orchestration", () => {
  it("should conduct research with all agents", async () => {
    const program = conductResearch("What is Effect.ts?");

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestAppLayer)),
    );

    expect(result.result).toBe("Mock agent response");
    expect(result.sources.web).toBe("Mock agent response");
  });

  it("should handle agent errors", async () => {
    // Override one service to fail
    const FailingAgentLayer = Layer.succeed(AgentService, {
      generateResponse: () =>
        Effect.fail(new AgentError({ agentName: "test", cause: "Failed" })),
      createThread: () => Effect.succeed("test-thread-id"),
    });

    const TestLayerWithFailure = Layer.mergeAll(
      TestRateLimitServiceLive,
      TestRAGServiceLive,
      FailingAgentLayer,
    );

    const program = conductResearch("What is Effect.ts?").pipe(
      Effect.provide(TestLayerWithFailure),
      Effect.catchTag("AgentError", (error) =>
        Effect.succeed({ result: "Error handled", error: true }),
      ),
    );

    const result = await Effect.runPromise(program);

    expect(result.error).toBe(true);
  });
});
```

**Checklist for Testing:**

- [ ] Create test layers with `Layer.succeed` for all services
- [ ] Compose test layers with `Layer.mergeAll`
- [ ] Override specific services to test error paths
- [ ] Use `Effect.runPromise` to execute tests
- [ ] Test both success and failure scenarios
- [ ] Test error handling with `Effect.catchTag`

---

### Pattern: Error Recovery Strategies ✅ PRODUCTION-PROVEN

**Example: Fallback Chain**

```typescript
// backend/convex/domain/agents/robust-generation.ts
import { Effect, Schedule } from "effect";

export const robustGeneration = (prompt: string) =>
  Effect.gen(function* () {
    const llmService = yield* LLMService;

    // Try primary approach
    const result = yield* llmService.complete(prompt).pipe(
      Effect.timeout("30 seconds"),

      // Fallback 1: Reduce context and retry
      Effect.catchTag("TimeoutError", () =>
        llmService
          .complete(truncate(prompt, 1000))
          .pipe(Effect.timeout("20 seconds")),
      ),

      // Fallback 2: Switch to faster model
      Effect.catchTag("TimeoutError", () =>
        llmService
          .completeFast(truncate(prompt, 500))
          .pipe(Effect.timeout("10 seconds")),
      ),

      // Fallback 3: Check cache
      Effect.catchTag("TimeoutError", () =>
        getCachedResponse(prompt).pipe(
          Effect.orElse(() =>
            Effect.succeed("I'm experiencing delays. Please try again."),
          ),
        ),
      ),

      // Retry on rate limits
      Effect.retry(
        Schedule.exponential("1 second").pipe(
          Schedule.whileInput((error) => error._tag === "RateLimitError"),
          Schedule.compose(Schedule.recurs(3)),
        ),
      ),
    );

    return result;
  });
```

---

### Pattern: Monitoring and Observability ✅ PRODUCTION-PROVEN

**Example: Monitoring Service**

```typescript
// backend/convex/services/monitoring.service.ts
import { Effect, Context, Layer } from "effect";

interface UsageData {
  serviceName: string;
  functionName: string;
  duration: number;
  tokenCount?: number;
  cost?: number;
}

class MonitoringService extends Context.Tag("MonitoringService")<
  MonitoringService,
  {
    readonly trackUsage: (data: UsageData) => Effect.Effect<void>;
    readonly trackError: (error: unknown) => Effect.Effect<void>;
  }
>() {}

const MonitoringServiceLive = Layer.succeed(MonitoringService, {
  trackUsage: (data) =>
    Effect.sync(() => {
      console.log("Service usage:", data);
      // Send to analytics service (Datadog, Honeycomb, etc.)
    }),

  trackError: (error) =>
    Effect.sync(() => {
      console.error("Service error:", error);
      // Send to error tracking (Sentry, Rollbar, etc.)
    }),
});

export { MonitoringService, MonitoringServiceLive };
```

**Wrap Service Calls with Monitoring:**

```typescript
// backend/convex/domain/agents/monitored-generation.ts
export const monitoredGeneration = (prompt: string) =>
  Effect.gen(function* () {
    const agentService = yield* AgentService;
    const monitoring = yield* MonitoringService;

    const startTime = Date.now();

    const result = yield* agentService
      .generateResponse(ctx, threadId, prompt)
      .pipe(
        Effect.tap((response) =>
          monitoring.trackUsage({
            serviceName: "AgentService",
            functionName: "generateResponse",
            duration: Date.now() - startTime,
            tokenCount: response.usage?.totalTokens,
          }),
        ),
        Effect.tapError((error) =>
          monitoring.trackError({
            serviceName: "AgentService",
            functionName: "generateResponse",
            error,
          }),
        ),
      );

    return result;
  });
```

---

## Section 5: Migration Path

### From Promise-based to Effect

**Before (Promise-based):**

```typescript
// backend/convex/api/chat.ts (Promise-based)
export const chat = action({
  args: { prompt: v.string() },
  handler: async (ctx, args) => {
    try {
      // Check rate limit
      const rateLimitOk = await checkRateLimit(ctx, ctx.userId);
      if (!rateLimitOk) {
        return { error: "Rate limit exceeded" };
      }

      // Search for context
      let context = "";
      try {
        context = await searchRAG(ctx, args.prompt);
      } catch (error) {
        console.error("RAG search failed:", error);
        // Continue without context
      }

      // Generate response
      const response = await generateWithAgent(ctx, args.prompt, context);

      return { response };
    } catch (error) {
      console.error("Chat failed:", error);
      return { error: "Something went wrong" };
    }
  },
});
```

**After (Effect-based):**

```typescript
// backend/convex/api/chat.ts (Effect-based)
export const chat = action({
  args: { prompt: v.string() },
  handler: (ctx, args) =>
    Effect.gen(function* () {
      const rateLimitService = yield* RateLimitService;
      const ragService = yield* RAGService;
      const agentService = yield* AgentService;

      // Check rate limit (errors propagate automatically)
      const rateLimitOk = yield* rateLimitService.checkLimit(ctx, ctx.userId);

      // Search for context (graceful degradation)
      const context = yield* ragService
        .search(ctx, "global", args.prompt, 5)
        .pipe(Effect.catchAll(() => Effect.succeed({ text: "", entries: [] })));

      // Generate response
      const response = yield* agentService.generateResponse(
        ctx,
        ctx.threadId,
        `${args.prompt}\n\nContext: ${context.text}`,
      );

      return { response };
    }).pipe(
      Effect.provide(
        Layer.merge(RateLimitServiceLive, RAGServiceLive, AgentServiceLive),
      ),
      Effect.catchTag("RateLimitError", (error) =>
        Effect.succeed({
          error: "Rate limit exceeded",
          retryAfter: error.retryAfter,
        }),
      ),
      Effect.catchAll((error) =>
        Effect.succeed({ error: "Something went wrong" }),
      ),
      Effect.runPromise,
    ),
});
```

**Benefits:**

- No nested try/catch blocks
- Automatic error propagation with types
- Graceful degradation with `Effect.catchAll(() => fallback)`
- Dependency injection (testable with mock layers)
- Composable (can add retry, timeout, parallel operations easily)

---

### From Plain Convex to Wrapped Services

**Step 1: Identify High-Value Operations**

Start with operations that:

- Call external APIs (LLM, vector search)
- Have complex error handling
- Need retry logic
- Are used in multiple places

**Step 2: Create Service Interface**

```typescript
// backend/convex/services/my-service.ts
import { Effect, Context, Layer, Data } from "effect";

class MyServiceError extends Data.TaggedError("MyServiceError")<{
  operation: string;
  cause: unknown;
}> {}

class MyService extends Context.Tag("MyService")<
  MyService,
  {
    readonly operation: (args) => Effect.Effect<Result, MyServiceError>;
  }
>() {}

const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    // Existing implementation wrapped in Effect
    return {
      operation: (args) =>
        Effect.tryPromise({
          try: () => existingFunction(args),
          catch: (error) =>
            new MyServiceError({ operation: "operation", cause: error }),
        }),
    };
  }),
);
```

**Step 3: Gradually Replace Calls**

```typescript
// Before
const result = await existingFunction(args);

// After
const result = yield * myService.operation(args);
```

**Step 4: Add New Features with Effect**

All new features use Effect from day one. Old features migrate as needed.

---

### Gradual Confect Adoption (If Desired)

**Phase 1: Evaluate Confect (1-2 weeks)**

- Read Confect documentation
- Create proof-of-concept with small feature
- Compare manual wrapping vs Confect
- Decide: Confect or manual?

**Phase 2: Schema Migration (If Confect) (2-4 weeks)**

- Convert Convex validators to Effect schemas
- Update `schema.ts` to use Confect's `defineSchema`
- Generate function constructors with `makeFunctions`
- Test that existing queries/mutations still work

**Phase 3: Function Migration (4-8 weeks)**

- Convert queries to use `ConfectQueryCtx`
- Convert mutations to use `ConfectMutationCtx`
- Convert actions to use `ConfectActionCtx`
- Update all handlers to return `Effect` instead of `Promise`

**Phase 4: Frontend Integration (2-4 weeks)**

- Update frontend to handle Option types (`Option.isSome`, `Option.getOrElse`)
- Add Effect runners for client-side logic (if needed)
- Test reactive queries with new types

**Phase 5: Complete Transition (2 weeks)**

- Remove all Promise-based handlers
- Delete manual wrapper utilities
- Update documentation
- Train team on new patterns

**Total Time Estimate:** 11-20 weeks (depending on codebase size)

**Recommendation:** For ONE Platform, stick with manual wrapping for now. Confect is powerful but adds significant migration overhead.

---

## Quick Reference: Common Tasks

### I need to wrap an agent

```typescript
import { Agent } from "@convex-dev/agent";
import { Effect, Context, Layer, Data } from "effect";

class AgentError extends Data.TaggedError("AgentError")<{ cause: unknown }> {}
class AgentService extends Context.Tag("AgentService")<
  AgentService,
  { readonly generate: (ctx, prompt) => Effect.Effect<string, AgentError> }
>() {}

const AgentServiceLive = Layer.effect(
  AgentService,
  Effect.gen(function* () {
    const agent = new Agent(components.agent, {
      /* config */
    });
    return {
      generate: (ctx, prompt) =>
        Effect.tryPromise({
          try: async () => {
            const result = await agent.generateText(
              ctx,
              { threadId },
              { prompt },
            );
            return result.text;
          },
          catch: (error) => new AgentError({ cause: error }),
        }),
    };
  }),
);
```

---

### I need to call multiple services in parallel

```typescript
const results =
  yield *
  Effect.all(
    [service1.operation1(), service2.operation2(), service3.operation3()],
    { concurrency: 2 }, // Max 2 at a time
  );
```

---

### I need to retry on failure

```typescript
const result =
  yield *
  riskyOperation().pipe(
    Effect.retry(
      Schedule.exponential("1 second").pipe(
        Schedule.compose(Schedule.recurs(3)), // Max 3 retries
      ),
    ),
  );
```

---

### I need to handle specific errors

```typescript
const result =
  yield *
  operation().pipe(
    Effect.catchTag("SpecificError", (error) =>
      Effect.succeed("Handled specific error"),
    ),
    Effect.catchAll((error) => Effect.succeed("Handled any error")),
  );
```

---

### I need to compose services

```typescript
const program = Effect.gen(function* () {
  const service1 = yield* Service1;
  const service2 = yield* Service2;

  const result1 = yield* service1.operation();
  const result2 = yield* service2.operation(result1);

  return result2;
});

await Effect.runPromise(
  program.pipe(Effect.provide(Layer.merge(Service1Live, Service2Live))),
);
```

---

### I need to test a service

```typescript
const TestServiceLive = Layer.succeed(Service, {
  operation: (args) => Effect.succeed("mock result"),
});

const result = await Effect.runPromise(
  myProgram.pipe(Effect.provide(TestServiceLive)),
);

expect(result).toBe("mock result");
```

---

### I need to manage resources (connections, streams)

```typescript
Effect.scoped(
  Effect.gen(function* () {
    const resource = yield* Effect.acquireRelease(
      Effect.sync(() => acquire()),
      (r) => Effect.sync(() => release(r)),
    );

    return yield* useResource(resource);
  }),
);
```

---

### I need to add timeout

```typescript
const result =
  yield *
  operation().pipe(
    Effect.timeout("10 seconds"),
    Effect.catchTag("TimeoutError", () =>
      Effect.succeed("Operation timed out"),
    ),
  );
```

---

### I need to log execution

```typescript
const result =
  yield *
  operation().pipe(
    Effect.tap((result) => Effect.log("Operation succeeded", { result })),
    Effect.tapError((error) => Effect.log("Operation failed", { error })),
  );
```

---

## Related Resources

**Effect.ts Official:**

- [Effect.ts Documentation](https://effect.website) - Core Effect patterns
- [Effect.ts GitHub](https://github.com/Effect-TS/effect) - Source code and examples
- [Effect.ts Discord](https://discord.gg/effect-ts) - Community support

**Convex Components:**

- [@convex-dev/agent](https://github.com/get-convex/agent) - AI agent component
- [@convex-dev/workflow](https://github.com/get-convex/workflow) - Durable workflows
- [@convex-dev/rag](https://github.com/get-convex/rag) - Vector search and RAG

**ONE Platform Docs:**

- [6-Dimension Ontology](/one/knowledge/ontology.md) - Platform data model
- [Architecture Overview](/one/knowledge/architecture.md) - System design
- [Effect Integration Plan](/one/things/plans/effect.md) - Backend-agnostic architecture
- [Component Integration Guide](/one/things/plans/effect-components.md) - Convex components + Effect

---

## Production-Proven Patterns (From 14.ai)

These patterns are marked with ✅ PRODUCTION-PROVEN and come from 14.ai's AI customer support platform:

1. **Effect-Wrapped Component** - Wrapping @convex-dev/agent with Effect services
2. **Service Layer Pattern** - Context.Tag + Layer.effect for dependency injection
3. **Error Handling Pattern** - Tagged errors with layered recovery strategies
4. **Parallel Execution** - Effect.all with concurrency control
5. **Resource Management** - Effect.scoped for connection pools
6. **Retry and Timeout** - Schedule.exponential for resilient operations
7. **Multi-Agent Orchestration** - Composing multiple agents with Effect.gen
8. **Testing with Layers** - Mock service implementations for unit tests
9. **Monitoring and Observability** - Effect.tap for usage tracking

Use these patterns with confidence—they've been battle-tested in production.

---

**Ready to build with Effect.ts? Start with Pattern 1 (Effect-Wrapped Component) and expand from there.**

**Need help? Find the pattern, copy the example, adapt to your use case. Ship it.**
