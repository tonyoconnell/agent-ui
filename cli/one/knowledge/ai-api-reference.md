---
title: Ai Api Reference
dimension: knowledge
category: api
tags: ai, api, reference, mutations, queries
related_dimensions: things, connections
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
---

# AI API Reference

**Version:** 1.0.0  
**Last Updated:** 2025-11-10  
**Stack:** Vercel AI SDK 5 + Effect.ts + Convex

## Overview

Complete API reference for AI integration including mutations, queries, services, hooks, and components.

## Mutations

### generateResponse

Generate AI text response.

**Location:** `backend/convex/mutations/ai/generate.ts`

**Parameters:**
```typescript
{
  groupId: Id<"groups">;      // REQUIRED: Multi-tenant scope
  prompt: string;              // REQUIRED: User prompt
  model?: string;              // Optional: Specific model (e.g., "gpt-4-turbo")
  provider?: string;           // Optional: "openai" | "anthropic" | "google"
  systemPrompt?: string;       // Optional: System instructions
}
```

**Returns:**
```typescript
{
  success: boolean;
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Example:**
```typescript
const response = await generateResponse({
  groupId: userGroupId,
  prompt: "Explain quantum computing in simple terms",
  provider: "anthropic"
});

console.log(response.text);
// "Quantum computing uses quantum mechanics..."
```

**Events Emitted:**
- `ai_generation_completed` (on success)
- `ai_error_occurred` (on failure)

---

### streamAgentResponse

Stream AI response in real-time.

**Location:** `backend/convex/mutations/ai/stream.ts`

**Parameters:**
```typescript
{
  groupId: Id<"groups">;      // REQUIRED
  threadId: Id<"aiThreads">;  // REQUIRED: Conversation thread
  message: string;             // REQUIRED: User message
  systemPrompt?: string;       // Optional: System instructions
}
```

**Returns:**
```typescript
{
  threadId: Id<"aiThreads">;
  stream: AsyncIterable<string>;  // Streaming text
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Example:**
```typescript
const { stream } = await streamAgentResponse({
  groupId: userGroupId,
  threadId: conversationId,
  message: "Write a blog post about AI"
});

for await (const chunk of stream) {
  console.log(chunk);  // Real-time chunks
}
```

---

### analyzeMessage

Analyze message with structured output.

**Location:** `backend/convex/mutations/ai/analyze.ts`

**Parameters:**
```typescript
{
  groupId: Id<"groups">;  // REQUIRED
  message: string;         // REQUIRED: Message to analyze
}
```

**Returns:**
```typescript
{
  analysis: {
    sentiment: "positive" | "neutral" | "negative";
    topics: string[];
    urgency: number;  // 0-10
    action_items: string[];
    summary: string;
  };
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Example:**
```typescript
const { analysis } = await analyzeMessage({
  groupId: userGroupId,
  message: "Our sales increased 50% this quarter! We need to hire more engineers ASAP."
});

console.log(analysis);
// {
//   sentiment: "positive",
//   topics: ["sales", "hiring", "growth"],
//   urgency: 8,
//   action_items: ["Hire engineers", "Scale team"],
//   summary: "Strong sales growth requiring immediate hiring"
// }
```

---

### generateWithTools

Generate response with function calling.

**Location:** `backend/convex/mutations/ai/tools.ts`

**Parameters:**
```typescript
{
  groupId: Id<"groups">;  // REQUIRED
  prompt: string;          // REQUIRED
  tools: {
    [key: string]: {
      description: string;
      parameters: ZodSchema;
      execute: (args: any) => Promise<any>;
    };
  };
}
```

**Returns:**
```typescript
{
  text: string;
  toolCalls: Array<{
    toolName: string;
    arguments: any;
    result: any;
  }>;
  usage: TokenUsage;
}
```

**Example:**
```typescript
import { z } from "zod";

const result = await generateWithTools({
  groupId: userGroupId,
  prompt: "What's the weather in San Francisco?",
  tools: {
    getWeather: {
      description: "Get current weather",
      parameters: z.object({
        location: z.string()
      }),
      execute: async ({ location }) => {
        return `Weather in ${location}: 72°F, Sunny`;
      }
    }
  }
});

console.log(result.text);
// "The current weather in San Francisco is 72°F and sunny."
```

---

## Queries

### getCallsByGroup

Get AI calls for a group.

**Location:** `backend/convex/queries/ai/calls.ts`

**Parameters:**
```typescript
{
  groupId: Id<"groups">;  // REQUIRED
}
```

**Returns:**
```typescript
Array<{
  _id: Id<"aiCalls">;
  groupId: Id<"groups">;
  model: string;
  provider: string;
  prompt: string;
  result: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  duration: number;
  timestamp: number;
}>
```

**Example:**
```typescript
const calls = await getCallsByGroup({ groupId: userGroupId });

console.log(calls.length);  // 42
console.log(calls[0].provider);  // "anthropic"
console.log(calls[0].tokensUsed.total);  // 1523
```

---

### getTokenUsageStats

Get token usage statistics by provider.

**Location:** `backend/convex/queries/ai/calls.ts`

**Parameters:**
```typescript
{
  groupId: Id<"groups">;  // REQUIRED
}
```

**Returns:**
```typescript
{
  [provider: string]: {
    calls: number;
    tokens: number;
    errors: number;
  };
}
```

**Example:**
```typescript
const stats = await getTokenUsageStats({ groupId: userGroupId });

console.log(stats);
// {
//   openai: { calls: 150, tokens: 250000, errors: 2 },
//   anthropic: { calls: 300, tokens: 500000, errors: 0 },
//   google: { calls: 50, tokens: 75000, errors: 1 }
// }
```

---

## Effect.ts Services

### LLMService

**Location:** `backend/convex/services/llm-service.ts`

#### generateText

```typescript
generateText: (
  prompt: string,
  options?: {
    model?: string;
    provider?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
) => Effect.Effect<{ text: string; usage: any }, LLMError>
```

#### streamText

```typescript
streamText: (
  prompt: string,
  options?: {
    model?: string;
    provider?: string;
    systemPrompt?: string;
  }
) => Effect.Effect<{ stream: any; usage: any }, LLMError>
```

#### generateObject

```typescript
generateObject: <T>(
  prompt: string,
  schema: ZodSchema,
  options?: {
    model?: string;
    provider?: string;
  }
) => Effect.Effect<{ object: T; usage: any }, LLMError>
```

**Example:**
```typescript
import { Effect } from "effect";
import { LLMService, LLMServiceLive } from "./llm-service";

const program = Effect.gen(function* () {
  const llm = yield* LLMService;
  
  const result = yield* llm.generateText("What is 2+2?", {
    provider: "openai",
    temperature: 0.1
  });
  
  return result.text;
});

const answer = await Effect.runPromise(
  program.pipe(Effect.provide(LLMServiceLive))
);

console.log(answer);  // "2+2 equals 4."
```

---

### AgentUIService

**Location:** `backend/convex/services/agent-ui.ts`

#### sendText

```typescript
sendText: (args: {
  agentId: Id<'things'>;
  conversationId: Id<'things'>;
  text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}) => Effect.Effect<Id<'things'>, never>
```

#### sendUI

```typescript
sendUI: (args: {
  agentId: Id<'things'>;
  conversationId: Id<'things'>;
  component: ComponentData;
}) => Effect.Effect<Id<'things'>, never>
```

#### sendActions

```typescript
sendActions: (args: {
  agentId: Id<'things'>;
  conversationId: Id<'things'>;
  actions: Array<{
    id: string;
    label: string;
    description?: string;
    params?: any;
  }>;
}) => Effect.Effect<Id<'things'>, never>
```

**Example:**
```typescript
import { AgentUIService, AgentUIServiceLive } from "./agent-ui";

const program = Effect.gen(function* () {
  const agentUI = yield* AgentUIService;
  
  // Send chart
  yield* agentUI.sendUI({
    agentId: AGENT_ID,
    conversationId: conversationId,
    component: {
      component: 'chart',
      data: {
        title: 'Revenue Trend',
        chartType: 'line',
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{ label: 'Revenue', data: [10, 20, 30] }]
      }
    }
  });
  
  // Send actions
  yield* agentUI.sendActions({
    agentId: AGENT_ID,
    conversationId: conversationId,
    actions: [
      { id: 'export', label: 'Export Report', params: { format: 'pdf' } }
    ]
  });
});

await Effect.runPromise(
  program.pipe(Effect.provide(AgentUIServiceLive))
);
```

---

## React Hooks

### useAIChat

**Location:** `web/src/hooks/ai/useAIChat.ts`

```typescript
function useAIChat(
  groupId: Id<"groups">,
  agentId: Id<"things">
): {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
}
```

**Example:**
```tsx
import { useAIChat } from '@/hooks/ai/useAIChat';

function ChatComponent() {
  const { messages, input, setInput, isLoading, sendMessage } = 
    useAIChat(groupId, agentId);

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)} 
      />
      <button onClick={() => sendMessage(input)}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
```

---

### useTokenUsage

**Location:** `web/src/hooks/ai/useTokenUsage.ts`

```typescript
function useTokenUsage(
  groupId: Id<"groups">
): {
  stats: Record<string, { calls: number; tokens: number; errors: number }>;
  totalTokens: number;
  estimatedCost: number;
  providers: string[];
} | null
```

**Example:**
```tsx
import { useTokenUsage } from '@/hooks/ai/useTokenUsage';

function UsageDisplay() {
  const usage = useTokenUsage(groupId);

  if (!usage) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total Tokens: {usage.totalTokens.toLocaleString()}</h2>
      <p>Estimated Cost: ${usage.estimatedCost.toFixed(2)}</p>
      {usage.providers.map(provider => (
        <div key={provider}>
          {provider}: {usage.stats[provider].calls} calls
        </div>
      ))}
    </div>
  );
}
```

---

## React Components

### Chatbot

**Location:** `web/src/components/ai/Chatbot.tsx`

```typescript
interface ChatbotProps {
  groupId: Id<"groups">;
  agentId: Id<"things">;
  systemPrompt?: string;
}

function Chatbot(props: ChatbotProps): JSX.Element
```

**Example:**
```tsx
import { Chatbot } from '@/components/ai/Chatbot';

<Chatbot
  groupId={userGroupId}
  agentId={agentId}
  systemPrompt="You are a helpful assistant"
  client:load
/>
```

---

### GenerativeUIRenderer

**Location:** `web/src/components/ai/GenerativeUIRenderer.tsx`

```typescript
interface GenerativeUIRendererProps {
  payload: {
    component: 'chart' | 'table' | 'card' | 'form';
    data: ComponentData;
    layout?: {
      width?: 'full' | 'half' | 'third';
      height?: string;
    };
  };
}

function GenerativeUIRenderer(props: GenerativeUIRendererProps): JSX.Element
```

**Example:**
```tsx
import { GenerativeUIRenderer } from '@/components/ai/GenerativeUIRenderer';

<GenerativeUIRenderer
  payload={{
    component: 'chart',
    data: {
      title: 'Revenue',
      chartType: 'line',
      labels: ['Jan', 'Feb'],
      datasets: [{ label: 'Revenue', data: [10, 20] }]
    },
    layout: { width: 'full' }
  }}
/>
```

---

## Error Types

### LLMError

```typescript
class LLMError extends Data.TaggedError("LLMError")<{
  model: string;
  provider: string;
  cause: unknown;
}> {}
```

### RateLimitError

```typescript
class RateLimitError extends Data.TaggedError("RateLimitError")<{
  retryAfter: number;
}> {}
```

### QuotaExceededError

```typescript
class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  quotaLimit: number;
  currentUsage: number;
}> {}
```

---

## Type Definitions

### Message

```typescript
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  metadata?: any;
}
```

### ComponentData

```typescript
type ComponentData =
  | ChartComponentData
  | TableComponentData
  | CardComponentData
  | FormComponentData;
```

### ChartComponentData

```typescript
interface ChartComponentData {
  component: 'chart';
  data: {
    title: string;
    description?: string;
    chartType: 'line' | 'bar' | 'pie' | 'area';
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
      fill?: boolean;
    }>;
  };
}
```

---

## Rate Limits

| Provider | Calls/Minute | Tokens/Minute |
|----------|--------------|---------------|
| OpenAI | 500 | 150,000 |
| Anthropic | 1,000 | 200,000 |
| Google | 300 | 100,000 |

**Quota Enforcement:**
- Per group: 1M tokens/month default
- Configurable per group
- Auto-scaling available

---

## Related Documentation

- [Implementation Guide](./ai-sdk-implementation.md)
- [AG-UI Protocol](./ag-ui-protocol.md)
- [Generative UI Patterns](./generative-ui-patterns.md)
- [Quick Start Guide](./ai-quickstart.md)

