---
title: Ai Quickstart
dimension: knowledge
category: guides
tags: ai, quickstart, tutorial, getting-started
related_dimensions: things
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
---

# AI Integration - Quick Start Guide

**Time:** 5 minutes  
**Difficulty:** Beginner  
**Stack:** Vercel AI SDK 5 + Convex + React

## Prerequisites

- Node.js 18+
- Bun or npm
- Convex account
- OpenAI or Anthropic API key

## Step 1: Install Dependencies (1 minute)

```bash
# Backend
cd backend
npm install ai @ai-sdk/openai @ai-sdk/anthropic zod effect

# Frontend
cd web
npm install ai @ai-sdk/react zod recharts
```

## Step 2: Configure Environment (1 minute)

**Create `backend/.env.local`:**

```bash
# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Or use Anthropic: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-...

# Convex deployment
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
```

## Step 3: Deploy Schema (1 minute)

**Add to `backend/convex/schema.ts`:**

```typescript
export default defineSchema({
  // ... existing tables ...

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
});
```

**Deploy:**

```bash
cd backend
npx convex deploy
```

## Step 4: Create AI Mutation (1 minute)

**Create `backend/convex/mutations/ai-simple.ts`:**

```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const chat = mutation({
  args: {
    groupId: v.id("groups"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const model = openai("gpt-4-turbo");
    
    const { text, usage } = await generateText({
      model,
      prompt: args.prompt,
    });

    await ctx.db.insert("aiCalls", {
      groupId: args.groupId,
      model: "gpt-4-turbo",
      provider: "openai",
      prompt: args.prompt,
      result: text,
      tokensUsed: {
        input: usage?.promptTokens || 0,
        output: usage?.completionTokens || 0,
        total: usage?.totalTokens || 0,
      },
      duration: 0,
      timestamp: Date.now(),
    });

    return { text, usage };
  },
});
```

## Step 5: Create React Component (1 minute)

**Create `web/src/components/SimpleChat.tsx`:**

```tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function SimpleChat({ groupId }: { groupId: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const chat = useMutation(api.mutations['ai-simple'].chat);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: input }]);

    try {
      const response = await chat({ groupId, prompt: input });
      setMessages(prev => [...prev, { role: "assistant", content: response.text }]);
      setInput("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 max-w-2xl mx-auto p-4 border rounded-lg">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">AI is thinking...</div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isLoading}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
```

## Step 6: Use in Your Page (30 seconds)

**Add to `web/src/pages/chat.astro`:**

```astro
---
import Layout from '@/layouts/Layout.astro';
import SimpleChat from '@/components/SimpleChat';

const groupId = 'your-group-id';  // Get from Convex dashboard
---

<Layout title="AI Chat">
  <h1>Chat with AI</h1>
  <SimpleChat groupId={groupId} client:load />
</Layout>
```

## Step 7: Test! (30 seconds)

```bash
cd web
bun run dev
```

Visit `http://localhost:4321/chat` and start chatting!

## Next Steps

### Add Streaming

```typescript
import { streamText } from "ai";

export const chatStream = mutation({
  args: { groupId: v.id("groups"), prompt: v.string() },
  handler: async (ctx, args) => {
    const model = openai("gpt-4-turbo");
    const { textStream } = await streamText({ model, prompt: args.prompt });
    
    // Return stream for client
    return textStream;
  }
});
```

### Add Structured Output

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  topics: z.array(z.string()),
  summary: z.string(),
});

export const analyze = mutation({
  args: { groupId: v.id("groups"), message: v.string() },
  handler: async (ctx, args) => {
    const model = openai("gpt-4-turbo");
    const { object } = await generateObject({
      model,
      schema,
      prompt: `Analyze: ${args.message}`
    });
    
    return object;
  }
});
```

### Add Function Calling

```typescript
import { tool } from "ai";

const tools = {
  getWeather: tool({
    description: "Get current weather",
    parameters: z.object({ location: z.string() }),
    execute: async ({ location }) => {
      return `Weather in ${location}: 72°F, Sunny`;
    }
  })
};

export const chatWithTools = mutation({
  args: { groupId: v.id("groups"), prompt: v.string() },
  handler: async (ctx, args) => {
    const model = openai("gpt-4-turbo");
    const result = await generateText({
      model,
      tools,
      prompt: args.prompt
    });
    
    return result;
  }
});
```

### Switch Providers

```typescript
// Use Anthropic instead of OpenAI
import { anthropic } from "@ai-sdk/anthropic";

const model = anthropic("claude-3-5-sonnet-20241022");

// Or Google
import { google } from "@ai-sdk/google";

const model = google("gemini-1.5-pro");

// Same code, different provider!
```

## Common Issues

**Q: "TypeError: Cannot read property 'text' of undefined"**
A: Check that your API key is set correctly in `.env.local`

**Q: "Rate limit exceeded"**
A: Wait a moment or upgrade your API plan

**Q: "groupId is not defined"**
A: Get your groupId from Convex dashboard → Data → groups table

**Q: "Module not found: ai"**
A: Run `npm install ai` in the correct directory

## Related Documentation

- [Complete Implementation Guide](/one/knowledge/ai-sdk-implementation.md)
- [AG-UI Protocol](/one/knowledge/ag-ui-protocol.md)
- [Generative UI Patterns](/one/knowledge/generative-ui-patterns.md)
- [API Reference](/one/knowledge/ai-api-reference.md)
- [AI SDK Docs](https://ai-sdk.dev/)

## Support

- **Discord**: Join our community
- **Email**: support@one.ie
- **GitHub**: Report issues

---

**Congratulations!** You now have AI chat working in 5 minutes. 🎉

