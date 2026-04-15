---
title: Ai Sdk Implementation
dimension: knowledge
category: guides
tags: ai, ai-sdk, effect-ts, convex, implementation
related_dimensions: things, connections, events
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
---

# AI SDK Implementation Guide

**Version:** 1.0.0  
**Status:** Implementation Guide  
**Stack:** Vercel AI SDK 5 + AI Elements + Effect.ts + Convex + 6-Dimension Ontology

## Executive Summary

Complete implementation guide for integrating **Vercel AI SDK** and **AI Elements** into ONE Platform following the 6-dimension ontology with Effect.ts service patterns.

**Key Features:**
- Provider-agnostic AI (OpenAI, Anthropic, Google, Azure, DeepSeek)
- Production-ready UI (30+ AI Elements components)
- Effect.ts service layer for business logic
- Convex real-time backend with reactive queries
- Multi-tenant agent system with groupId scoping
- AG-UI protocol for agent-to-frontend communication

## Architecture Overview

```
Frontend (Astro 5 + React 19)
├─ AI Elements Components (30+ pre-built)
├─ Custom Hooks (useAIChat, useTokenUsage, etc.)
└─ Generative UI Renderer

Convex Backend (Real-time DB)
├─ Mutations (generateResponse, streamText, etc.)
└─ Queries (getCallsByGroup, getTokenUsageStats)

Effect.ts Service Layer
├─ LLMService (text generation, streaming, objects)
├─ AgentUIService (AG-UI protocol)
├─ RAGService (retrieval-augmented generation)
└─ AgentOrchestrator (multi-agent coordination)

LLM Providers (OpenAI, Anthropic, Google)
```

## Part 1: Backend Implementation

### Phase 1.1: Dependencies

```bash
cd backend
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google zod effect
```

### Phase 1.2: Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
```

### Phase 1.3: Provider Configuration

**File:** `backend/convex/ai/config.ts`

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export const models = {
  openai: {
    fast: openai("gpt-4o-mini"),
    powerful: openai("gpt-4-turbo"),
  },
  anthropic: {
    fast: anthropic("claude-3-haiku-20240307"),
    powerful: anthropic("claude-3-opus-20240229"),
  },
  google: {
    fast: google("gemini-1.5-flash"),
    powerful: google("gemini-1.5-pro"),
  },
};

export const selectModel = (provider, tier) => {
  return models[provider]?.[tier] || openai("gpt-4-turbo");
};
```

### Phase 1.4: Schema Extension

**File:** `backend/convex/schema.ts`

```typescript
export default defineSchema({
  aiCalls: defineTable({
    groupId: v.id("groups"),
    model: v.string(),
    provider: v.string(),
    prompt: v.string(),
    result: v.string(),
    tokensUsed: v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    }),
    duration: v.number(),
    timestamp: v.number(),
  }).index("by_groupId", ["groupId"]),

  aiThreads: defineTable({
    groupId: v.id("groups"),
    agentId: v.id("things"),
    title: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    context: v.any(),
    createdAt: v.number(),
  }).index("by_groupId", ["groupId"]),
});
```

### Phase 1.5: Effect.ts LLMService

**File:** `backend/convex/services/llm-service.ts`

```typescript
import { Effect, Data, Context, Layer } from "effect";
import { generateText, streamText, generateObject } from "ai";
import { selectModel } from "../ai/config";

export class LLMError extends Data.TaggedError("LLMError")<{
  model: string;
  provider: string;
  cause: unknown;
}> {}

export class LLMService extends Context.Tag("LLMService")<
  LLMService,
  {
    readonly generateText: (prompt: string, options?: any) => Effect.Effect<any, LLMError>;
    readonly streamText: (prompt: string, options?: any) => Effect.Effect<any, LLMError>;
    readonly generateObject: <T>(prompt: string, schema: any) => Effect.Effect<any, LLMError>;
  }
>() {}

export const LLMServiceLive = Layer.effect(
  LLMService,
  Effect.gen(function* () {
    return {
      generateText: (prompt, options = {}) =>
        Effect.gen(function* () {
          const model = selectModel(options.provider || "openai", "powerful");
          const result = yield* Effect.tryPromise({
            try: () => generateText({ model, prompt }),
            catch: (error) => new LLMError({ model: "gpt-4-turbo", provider: "openai", cause: error }),
          });
          return { text: result.text, usage: result.usage };
        }),
      streamText: (prompt, options = {}) => /* ... */,
      generateObject: (prompt, schema) => /* ... */,
    };
  })
);
```

### Phase 1.6: Convex Mutations

**File:** `backend/convex/mutations/ai/generate.ts`

```typescript
import { mutation } from "../../_generated/server";
import { v } from "convex/values";
import { Effect, Runtime } from "effect";
import { LLMService, LLMServiceLive } from "../../services/llm-service";

export const generateResponse = mutation({
  args: {
    groupId: v.id("groups"),
    prompt: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const program = Effect.gen(function* () {
      const llm = yield* LLMService;
      return yield* llm.generateText(args.prompt, { provider: args.provider });
    });

    const result = await Effect.runPromise(program.pipe(Effect.provide(LLMServiceLive)));

    await ctx.db.insert("aiCalls", {
      groupId: args.groupId,
      model: "gpt-4-turbo",
      provider: args.provider || "openai",
      prompt: args.prompt,
      result: result.text,
      tokensUsed: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
        total: result.usage?.totalTokens || 0,
      },
      duration: 0,
      timestamp: Date.now(),
    });

    return { success: true, text: result.text, usage: result.usage };
  },
});
```

## Part 2: Frontend Implementation

### Phase 2.1: Dependencies

```bash
cd web
npm install ai @ai-sdk/react zod recharts react-hook-form
```

### Phase 2.2: useAIChat Hook

**File:** `web/src/hooks/ai/useAIChat.ts`

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function useAIChat(groupId, agentId) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateResponse = useMutation(api.mutations.ai.generate.generateResponse);

  const sendMessage = async (content) => {
    setIsLoading(true);
    try {
      setMessages(prev => [...prev, { role: "user", content }]);
      const response = await generateResponse({ groupId, prompt: content });
      setMessages(prev => [...prev, { role: "assistant", content: response.text }]);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, input, setInput, isLoading, sendMessage };
}
```

### Phase 2.3: Chatbot Component

**File:** `web/src/components/ai/Chatbot.tsx`

```tsx
import { useAIChat } from "@/hooks/ai/useAIChat";

export function Chatbot({ groupId, agentId }) {
  const { messages, input, setInput, isLoading, sendMessage } = useAIChat(groupId, agentId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div>AI is thinking...</div>}
      </div>
      
      <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-lg">
          Send
        </button>
      </form>
    </div>
  );
}
```

## Part 3: 6-Dimension Ontology Mapping

### GROUPS Dimension
- Multi-tenant scoping: All AI calls scoped to `groupId`
- Per-group quotas and rate limits
- Per-group model preferences

### PEOPLE Dimension
- Authorization by role (platform_owner, org_owner, org_user, customer)
- AI access control per role

### THINGS Dimension
- AI agents as `thing` type:
```typescript
{
  type: "agent",
  name: "Customer Support Bot",
  properties: {
    model: "gpt-4-turbo",
    provider: "openai",
    systemPrompt: "...",
    tools: ["searchKB", "createTicket"]
  }
}
```

### CONNECTIONS Dimension
- `agent_owns_tool`
- `agent_trained_on`
- `user_interacts_with_agent`
- `agent_collaborates_with`

### EVENTS Dimension
- `ai_generation_completed`
- `ai_tool_called`
- `ai_error_occurred`
- `ai_thread_created`

### KNOWLEDGE Dimension
- Generate embeddings for AI content
- Vector search for RAG
- Citation tracking

## Part 4: Multi-Tenancy Patterns

**Always include groupId:**

```typescript
// ✅ Good
await generateResponse({ groupId, prompt });

// ❌ Bad
await generateResponse({ prompt });
```

**Quota enforcement:**

```typescript
const checkQuota = async (groupId) => {
  const stats = await ctx.db.query("aiCalls")
    .withIndex("by_groupId", q => q.eq("groupId", groupId))
    .collect();
  
  const totalTokens = stats.reduce((sum, call) => 
    sum + call.tokensUsed.total, 0);
  
  if (totalTokens > 1000000) { // 1M monthly limit
    throw new Error("Quota exceeded");
  }
};
```

## Part 5: Testing

**Unit test:**

```typescript
test("generateText returns text", async () => {
  const program = Effect.gen(function* () {
    const llm = yield* LLMService;
    return yield* llm.generateText("What is 2+2?");
  });

  const result = await Effect.runPromise(
    program.pipe(Effect.provide(LLMServiceLive))
  );

  expect(result.text).toBeDefined();
});
```

## Part 6: Deployment Checklist

**Backend:**
- [ ] Environment variables configured
- [ ] Schema deployed to Convex
- [ ] Services implemented
- [ ] Mutations/queries deployed
- [ ] Error handling in place
- [ ] Rate limiting configured

**Frontend:**
- [ ] AI Elements installed
- [ ] Hooks implemented
- [ ] Components created
- [ ] Error boundaries in place
- [ ] Loading states handled

## Summary

**Implementation Phases:**
1. Backend (35 files, Cycles 1-30)
2. Frontend (48 files, Cycles 31-60)
3. Integration (10 files, Cycles 61-75)
4. Documentation (8 files, Cycles 91-100)

**Success Criteria:**
- Provider-agnostic AI integration
- Effect.ts service layer complete
- Multi-tenant with groupId scoping
- Real-time streaming support
- Comprehensive error handling

**Related Documentation:**
- [AG-UI Protocol](./ag-ui-protocol.md)
- [Generative UI Patterns](./generative-ui-patterns.md)
- [6-Dimension Ontology](./ontology.md)

