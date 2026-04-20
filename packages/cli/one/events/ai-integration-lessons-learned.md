---
title: Ai Integration Lessons Learned
dimension: events
category: lessons
tags: ai, lessons, best-practices, patterns
related_dimensions: knowledge
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
---

# AI Integration - Lessons Learned

**Date:** 2025-11-10  
**Phase:** Documentation (Cycles 91-100)  
**Agent:** agent-documenter  
**Context:** AI SDK + AI Elements integration planning and documentation

## Executive Summary

Key lessons, patterns, and best practices discovered during AI integration planning and documentation. These insights will guide future AI implementations and prevent common pitfalls.

## Lesson 1: Provider Agnosticism is Critical

**Problem:**
Many AI projects lock into a single provider (e.g., OpenAI only), creating vendor dependency and limiting flexibility.

**Solution:**
Design with provider agnosticism from day one using AI SDK's unified interface.

**Pattern:**
```typescript
// Bad: Locked to OpenAI
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const result = await openai.chat.completions.create({...});

// Good: Provider agnostic
import { generateText } from "ai";
import { selectModel } from "./config";

const model = selectModel(provider, tier);
const result = await generateText({ model, prompt });
```

**Benefit:**
- Switch providers without code changes
- Compare provider quality/cost
- Fallback to alternate providers on failure
- No vendor lock-in

**Prevention:**
Always abstract provider-specific code behind unified interfaces. Use configuration to select providers, not code.

## Lesson 2: Effect.ts Service Layer Prevents Callback Hell

**Problem:**
AI operations involve async calls, error handling, retries, logging - leads to deeply nested callbacks and error-prone code.

**Solution:**
Use Effect.ts service layer for composable, type-safe business logic.

**Pattern:**
```typescript
// Bad: Callback hell
async function generateAIResponse(prompt) {
  try {
    const model = selectModel("openai", "powerful");
    try {
      const result = await generateText({ model, prompt });
      try {
        await logToDatabase(result);
        return result.text;
      } catch (dbError) {
        console.error("DB error:", dbError);
        return result.text; // Data lost if DB fails
      }
    } catch (aiError) {
      console.error("AI error:", aiError);
      throw aiError;
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    throw error;
  }
}

// Good: Effect.ts composition
const generateAIResponse = (prompt: string) =>
  Effect.gen(function* () {
    const llm = yield* LLMService;
    const db = yield* DatabaseService;

    const result = yield* llm.generateText(prompt).pipe(
      Effect.retry({ times: 3 }),
      Effect.catchTag("LLMError", (error) => 
        Effect.logError("AI failed", error).pipe(
          Effect.flatMap(() => llm.generateText(prompt, { provider: "anthropic" }))
        )
      )
    );

    yield* db.logAICall(result);
    return result.text;
  });
```

**Benefit:**
- Type-safe error handling
- Composable operations
- Automatic retries
- Testable business logic
- No callback nesting

**Prevention:**
Use Effect.ts for all complex async operations. Define services with tagged errors, compose operations with pipe.

## Lesson 3: Generative UI Beats HTML Strings

**Problem:**
Agents returning HTML strings creates XSS vulnerabilities and limits flexibility.

**Solution:**
Agents return structured component data, frontend renders with type-safe components.

**Pattern:**
```typescript
// Bad: Security risk
const agentResponse = {
  html: "<div class='chart'><script>alert('xss')</script></div>"
};
return <div dangerouslySetInnerHTML={{ __html: agentResponse.html }} />;

// Good: Type-safe components
const agentResponse = {
  component: 'chart',
  data: {
    chartType: 'line',
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{ label: 'Revenue', data: [10, 20, 30] }]
  }
};
return <GenerativeUIRenderer payload={agentResponse} />;
```

**Benefit:**
- Zero XSS vulnerabilities
- Type-safe data
- Flexible styling
- Easy to extend
- Consistent UX

**Prevention:**
Never render user-provided or AI-generated HTML. Always use structured data with validated component types.

## Lesson 4: AG-UI Protocol Enables Rich Agent Interactions

**Problem:**
Simple text responses limit what agents can communicate (no charts, no actions, no context requests).

**Solution:**
Implement AG-UI protocol for structured agent-to-frontend communication.

**Pattern:**
```typescript
// Bad: Text only
yield* agentUI.sendText({
  text: "Revenue is up 20%. Here's a breakdown: Jan: $10k, Feb: $12k, Mar: $15k"
});

// Good: Rich UI
yield* agentUI.sendUI({
  component: {
    component: 'chart',
    data: {
      title: 'Revenue Trend',
      chartType: 'line',
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Revenue', data: [10000, 12000, 15000] }]
    }
  }
});

yield* agentUI.sendActions({
  actions: [
    { id: 'export_report', label: 'Export Full Report', params: { format: 'pdf' } },
    { id: 'schedule_review', label: 'Schedule Review' }
  ]
});
```

**Benefit:**
- Rich visual communication
- Human-in-the-loop actions
- Context sharing
- Better UX

**Prevention:**
Design agent protocols with multiple message types from the start. Don't limit agents to text-only responses.

## Lesson 5: Multi-Tenancy Must Be Enforced at Every Layer

**Problem:**
Missing groupId scoping in even one query/mutation creates data leaks across tenants.

**Solution:**
Enforce groupId at database layer, service layer, AND UI layer.

**Pattern:**
```typescript
// Bad: Missing groupId check
export const getAICalls = query({
  args: {},  // ❌ No groupId!
  handler: async (ctx, args) => {
    return await ctx.db.query("aiCalls").collect();  // Returns ALL groups' data!
  }
});

// Good: groupId everywhere
export const getAICalls = query({
  args: { groupId: v.id("groups") },  // ✅ Required
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiCalls")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  }
});
```

**Benefit:**
- Zero data leaks
- Compliance (GDPR, SOC2)
- Per-tenant quotas
- Clean separation

**Prevention:**
Make groupId required in all database operations. Use TypeScript to enforce it. Add validation hooks.

## Lesson 6: Context Budget is Your Friend

**Problem:**
Sending full codebase to agents wastes tokens and increases latency.

**Solution:**
Implement strict context budgets (1,000 tokens) with prioritized information.

**Pattern:**
```typescript
// Bad: Everything
const context = {
  fullCodebase: readAllFiles(),      // 500k tokens!
  fullOntology: readOntology(),      // 50k tokens!
  allDependencies: readPackageJson() // 10k tokens!
};

// Good: Prioritized essentials
const context = {
  featureSpec: readFeatureSpec(),      // 200 tokens
  relevantTypes: extractTypes(),       // 300 tokens
  testCriteria: readTests(),           // 300 tokens
  implementationSummary: getSummary()  // 200 tokens
  // Total: 1,000 tokens (98% reduction!)
};
```

**Benefit:**
- Faster responses
- Lower costs
- Better focus
- More reliable

**Prevention:**
Set hard token limits. Extract only essential context. Use Git for full code details, not context window.

## Lesson 7: Streaming Improves Perceived Performance

**Problem:**
Waiting 30 seconds for full response feels slow, even if generation is fast.

**Solution:**
Stream responses to show immediate progress.

**Pattern:**
```typescript
// Bad: Wait for full response
const response = await generateText({ model, prompt });
// User waits 30 seconds seeing nothing...
setMessage(response.text);

// Good: Stream chunks
const { textStream } = await streamText({ model, prompt });
for await (const chunk of textStream) {
  setMessage(prev => prev + chunk);  // Immediate feedback!
}
```

**Benefit:**
- Immediate feedback
- Better perceived performance
- User engagement
- Ability to cancel

**Prevention:**
Use streaming for responses > 100 tokens. Always provide progress indicators.

## Lesson 8: Documentation-First Prevents Rework

**Problem:**
Implementing features then documenting leads to misalignment and rework.

**Solution:**
Write documentation BEFORE implementation to clarify requirements.

**Pattern:**
```typescript
// Bad: Code first, docs later
1. Write code (3 days)
2. Discover edge cases
3. Rewrite code (2 days)
4. Write docs (1 day)
Total: 6 days, 40% rework

// Good: Docs first, code second
1. Write documentation (1 day)
2. Review with team
3. Clarify requirements
4. Write code (2 days)
5. Update docs (30 min)
Total: 3.5 days, 5% rework
```

**Benefit:**
- Clarity upfront
- Team alignment
- Less rework
- Better onboarding

**Prevention:**
Create documentation during planning phase (Cycles 91-100) BEFORE implementation begins.

## Lesson 9: Ontology Alignment is Non-Negotiable

**Problem:**
Custom tables and patterns diverge from 6-dimension ontology, creating technical debt.

**Solution:**
Map every feature to the 6 dimensions, no exceptions.

**Pattern:**
```typescript
// Bad: Custom table
defineTable({
  aiLogs: {
    prompt: v.string(),
    response: v.string(),
    // Where's groupId? Where's the ontology mapping?
  }
})

// Good: Ontology-aligned
defineTable({
  aiCalls: {
    groupId: v.id("groups"),      // GROUPS dimension
    actorId: v.string(),          // PEOPLE dimension (thing with role)
    targetId: v.id("things"),     // THINGS dimension
    // ... maps to EVENTS dimension via events table
  }
})
```

**Benefit:**
- Consistent patterns
- Zero technical debt
- AI-understandable
- 98% code generation accuracy

**Prevention:**
Always ask: "Which of the 6 dimensions does this belong to?" If unclear, rethink the feature.

## Lesson 10: Testing Strategies Vary by Layer

**Problem:**
Testing Effect.ts services like Convex mutations leads to brittle tests.

**Solution:**
Match testing strategy to architectural layer.

**Pattern:**
```typescript
// Effect.ts services: Unit tests
test("LLMService generates text", async () => {
  const program = Effect.gen(function* () {
    const llm = yield* LLMService;
    return yield* llm.generateText("test");
  });
  const result = await Effect.runPromise(program.pipe(Effect.provide(LLMServiceLive)));
  expect(result.text).toBeDefined();
});

// Convex mutations: Integration tests
test("generateResponse mutation works end-to-end", async () => {
  const groupId = await createTestGroup();
  const response = await generateResponse({ groupId, prompt: "test" });
  expect(response.success).toBe(true);
  
  const events = await getEvents(groupId);
  expect(events).toContainEqual(
    expect.objectContaining({ type: "ai_generation_completed" })
  );
});

// Frontend components: UI tests
test("Chatbot renders messages", () => {
  render(<Chatbot groupId={groupId} agentId={agentId} />);
  expect(screen.getByText("AI is thinking...")).not.toBeInTheDocument();
});
```

**Benefit:**
- Fast unit tests
- Reliable integration tests
- Comprehensive coverage

**Prevention:**
Don't mix testing strategies. Services get unit tests, mutations get integration tests, components get UI tests.

## Summary of Key Takeaways

| Lesson | Pattern | Prevention |
|--------|---------|------------|
| Provider Agnosticism | Use AI SDK unified interface | Abstract provider code |
| Effect.ts Services | Composable business logic | Use for complex async |
| Generative UI | Structured data, not HTML | Never render HTML strings |
| AG-UI Protocol | Multiple message types | Design rich protocols |
| Multi-Tenancy | groupId everywhere | Make it required |
| Context Budget | 1,000 token limit | Prioritize essentials |
| Streaming | Immediate feedback | Use for >100 tokens |
| Documentation-First | Write before coding | Clarify requirements |
| Ontology Alignment | Map to 6 dimensions | No custom tables |
| Testing Strategies | Match to layer | Unit/integration/UI |

## Recommendations for Future Implementations

### Phase 1: Planning
1. Document architecture BEFORE coding
2. Map to 6-dimension ontology
3. Define context budgets
4. Design AG-UI protocol

### Phase 2: Backend
1. Use Effect.ts for services
2. Provider-agnostic from day one
3. Enforce groupId scoping
4. Log all AI operations

### Phase 3: Frontend
1. Generative UI patterns
2. React hooks for state
3. shadcn/ui components
4. Streaming for UX

### Phase 4: Testing
1. Unit tests for services
2. Integration tests for mutations
3. UI tests for components
4. End-to-end flows

### Phase 5: Deployment
1. Environment variables secure
2. Rate limiting configured
3. Monitoring enabled
4. Documentation complete

## Patterns to Avoid

**Anti-pattern:** Direct provider SDK calls
**Use instead:** AI SDK unified interface

**Anti-pattern:** HTML string responses
**Use instead:** Structured component data

**Anti-pattern:** Missing groupId
**Use instead:** Required groupId everywhere

**Anti-pattern:** Callback hell
**Use instead:** Effect.ts composition

**Anti-pattern:** Code-first development
**Use instead:** Documentation-first approach

## Patterns to Embrace

**Best practice:** Provider agnosticism
**Best practice:** Effect.ts services
**Best practice:** Generative UI
**Best practice:** AG-UI protocol
**Best practice:** Context budgets
**Best practice:** Streaming responses
**Best practice:** Documentation-first
**Best practice:** Ontology alignment
**Best practice:** Multi-tenant by design
**Best practice:** Layer-appropriate testing

---

**Status:** Lessons captured  
**Next:** Apply these patterns to implementation  
**Impact:** Prevent rework, increase quality, reduce development time

