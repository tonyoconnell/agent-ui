---
title: Ag Ui Protocol
dimension: knowledge
category: protocols
tags: ai, ag-ui, protocol, generative-ui, agents
related_dimensions: connections, events
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
---

# AG-UI Protocol Specification

**Version:** 1.0.0  
**Purpose:** Agent-Generated User Interface communication protocol  
**Inspired by:** CopilotKit's AG-UI concept  
**Stack:** Effect.ts + Convex + React

## Overview

**AG-UI (Agent-Generated User Interface)** is a communication protocol that allows AI agents to dynamically render UI components, request context from applications, and suggest actions for user approval.

**Key Capabilities:**
- Send structured UI data to frontend (not HTML strings)
- Request application context bidirectionally
- Suggest actions with human-in-the-loop approval
- Stream reasoning/thinking process
- Coordinate multiple agents

## Protocol Architecture

```
AI Agent (Backend)
    ↓
AgentUIService (Effect.ts)
    ↓
AG-UI Protocol Message
    ↓
Convex Real-time Events
    ↓
React Frontend
    ↓
GenerativeUIRenderer
    ↓
shadcn/ui Components
```

## Message Types

### 1. TEXT - Plain Text Message

```typescript
{
  type: 'text',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'text',
    text: "Here's your analysis...",
    sentiment?: 'positive' | 'neutral' | 'negative',
    formatting?: {
      bold?: boolean,
      italic?: boolean,
      code?: boolean
    }
  }
}
```

### 2. UI - Structured UI Component

```typescript
{
  type: 'ui',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'ui',
    component: 'chart' | 'table' | 'card' | 'form',
    data: ComponentData,
    layout?: {
      width?: 'full' | 'half' | 'third',
      height?: string,
      position?: 'inline' | 'modal' | 'sidebar'
    }
  }
}
```

### 3. ACTION - Action Suggestions

```typescript
{
  type: 'action',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'action',
    actions: [
      {
        id: 'export_report',
        label: 'Export Full Report',
        description: 'Download PDF with detailed analysis',
        icon?: string,
        params?: Record<string, any>,
        confirmationRequired?: boolean,
        confirmationMessage?: string
      }
    ]
  }
}
```

### 4. CONTEXT_REQUEST - Request App Context

```typescript
{
  type: 'context_request',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'context_request',
    fields: ['user.cart', 'user.preferences', 'app.currentPage'],
    reason: 'Need to personalize recommendations',
    optional?: boolean
  }
}
```

### 5. REASONING - Agent Thinking Steps

```typescript
{
  type: 'reasoning',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'reasoning',
    steps: [
      {
        step: 1,
        title: 'Understanding the question',
        description: 'Parsing user intent',
        completed: true,
        result?: any
      }
    ],
    currentStep?: number,
    streaming?: boolean
  }
}
```

### 6. TOOL_CALL - Function Execution

```typescript
{
  type: 'tool_call',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'tool_call',
    toolName: 'searchKnowledge',
    arguments: { query: 'AI agents' },
    result?: any,
    status: 'pending' | 'running' | 'completed' | 'failed',
    error?: string
  }
}
```

### 7. ERROR - Error Message

```typescript
{
  type: 'error',
  agentId: Id<'things'>,
  conversationId: Id<'things'>,
  timestamp: number,
  payload: {
    type: 'error',
    message: 'AI service unavailable',
    code?: 'RATE_LIMIT' | 'QUOTA_EXCEEDED',
    recoverable?: boolean,
    retryable?: boolean,
    details?: any
  }
}
```

## Component Data Structures

### ChartComponentData

```typescript
{
  component: 'chart',
  data: {
    title: 'Revenue Trend',
    description: '20% growth month-over-month',
    chartType: 'line' | 'bar' | 'pie' | 'area',
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [
      {
        label: 'Revenue',
        data: [10000, 12000, 15000],
        color?: 'hsl(var(--chart-1))',
        fill?: boolean
      }
    ],
    options?: any  // Recharts options
  }
}
```

### TableComponentData

```typescript
{
  component: 'table',
  data: {
    title: 'Performance Summary',
    description?: string,
    headers: ['Month', 'Revenue', 'Users'],
    rows: [
      ['Jan', '$10,000', 100],
      ['Feb', '$12,000', 120]
    ],
    sortable?: boolean,
    filterable?: boolean,
    pagination?: {
      pageSize: 10,
      currentPage: 1,
      totalPages: 5
    }
  }
}
```

### CardComponentData

```typescript
{
  component: 'card',
  data: {
    title: 'Quick Stats',
    description?: string,
    content: string | any,
    footer?: string,
    actions?: [
      {
        label: 'View Details',
        actionId: 'view_details',
        variant?: 'default' | 'destructive' | 'outline'
      }
    ]
  }
}
```

### FormComponentData

```typescript
{
  component: 'form',
  data: {
    title: 'Update Profile',
    description?: string,
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        defaultValue?: string,
        validation?: any
      }
    ],
    submitLabel?: 'Submit',
    onSubmitActionId: 'update_profile'
  }
}
```

## AgentUIService Implementation

**File:** `backend/convex/services/agent-ui.ts`

```typescript
import { Effect, Context, Layer } from "effect";
import type { AgentUIMessage } from "../protocols/agent-ui";

export class AgentUIService extends Context.Tag("AgentUIService")<
  AgentUIService,
  {
    readonly sendText: (args: {
      agentId: Id<'things'>;
      conversationId: Id<'things'>;
      text: string;
      sentiment?: 'positive' | 'neutral' | 'negative';
    }) => Effect.Effect<Id<'things'>, never>;

    readonly sendUI: (args: {
      agentId: Id<'things'>;
      conversationId: Id<'things'>;
      component: ComponentData;
    }) => Effect.Effect<Id<'things'>, never>;

    readonly sendActions: (args: {
      agentId: Id<'things'>;
      conversationId: Id<'things'>;
      actions: Action[];
    }) => Effect.Effect<Id<'things'>, never>;

    readonly requestContext: (args: {
      agentId: Id<'things'>;
      conversationId: Id<'things'>;
      fields: string[];
      reason: string;
    }) => Effect.Effect<Id<'things'>, never>;

    readonly sendReasoning: (args: {
      agentId: Id<'things'>;
      conversationId: Id<'things'>;
      steps: ReasoningStep[];
    }) => Effect.Effect<Id<'things'>, never>;
  }
>() {}

export const AgentUIServiceLive = Layer.effect(
  AgentUIService,
  Effect.gen(function* () {
    const db = yield* ConvexDatabase;

    return {
      sendText: (args) =>
        Effect.gen(function* () {
          const messageId = yield* db.insert('things', {
            type: 'message',
            groupId: args.conversationId,
            name: 'AG-UI Text',
            properties: {
              protocol: 'ag-ui',
              messageType: 'text',
              agentId: args.agentId,
              text: args.text,
              sentiment: args.sentiment
            },
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          yield* db.insert('events', {
            type: 'agent_executed',
            groupId: args.conversationId,
            actorId: args.agentId,
            targetId: messageId,
            timestamp: Date.now(),
            metadata: { action: 'ag_ui_message_sent', messageType: 'text' }
          });

          return messageId;
        }),

      sendUI: (args) =>
        Effect.gen(function* () {
          const messageId = yield* db.insert('things', {
            type: 'message',
            groupId: args.conversationId,
            name: `AG-UI ${args.component.component}`,
            properties: {
              protocol: 'ag-ui',
              messageType: 'ui',
              agentId: args.agentId,
              component: args.component
            },
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          yield* db.insert('events', {
            type: 'agent_executed',
            groupId: args.conversationId,
            actorId: args.agentId,
            targetId: messageId,
            timestamp: Date.now(),
            metadata: { action: 'ag_ui_message_sent', messageType: 'ui' }
          });

          return messageId;
        }),

      // Other methods...
    };
  })
);
```

## Frontend Rendering

**GenerativeUIRenderer Component:**

```tsx
import { ChartComponentData, TableComponentData } from '@/convex/protocols/agent-ui';
import { Card } from '@/components/ui/card';
import { LineChart, BarChart } from 'recharts';
import { Table } from '@/components/ui/table';

export function GenerativeUIRenderer({ payload }) {
  const { component, data, layout } = payload;

  switch (component) {
    case 'chart':
      return <DynamicChart data={data} layout={layout} />;
    case 'table':
      return <DynamicTable data={data} layout={layout} />;
    case 'card':
      return <DynamicCard data={data} layout={layout} />;
    case 'form':
      return <DynamicForm data={data} layout={layout} />;
    default:
      return <div>Unknown component: {component}</div>;
  }
}

function DynamicChart({ data, layout }) {
  // Transform data for Recharts
  const chartData = data.labels.map((label, i) => ({
    name: label,
    ...data.datasets.reduce((acc, dataset) => ({
      ...acc,
      [dataset.label]: dataset.data[i]
    }), {})
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart data={chartData} width={600} height={300}>
          {/* Recharts configuration */}
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

## Context Sharing Pattern

**useAgentContext Hook:**

```typescript
import { useMutation } from 'convex/react';
import { useState, useEffect } from 'react';

export function useAgentContext(conversationId) {
  const [context, setContext] = useState({});
  const updateContext = useMutation(api.conversations.updateContext);

  useEffect(() => {
    updateContext({ conversationId, context });
  }, [context, conversationId]);

  return {
    shareContext: (key, value) => {
      setContext(prev => ({ ...prev, [key]: value }));
    },
    removeContext: (key) => {
      setContext(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    },
    getContext: () => context
  };
}
```

**Usage:**

```tsx
function MyComponent() {
  const { shareContext } = useAgentContext(conversationId);

  // Share cart with agent
  shareContext('cart', cart);

  // Share current page
  shareContext('currentPage', location.pathname);

  // Share user preferences
  shareContext('userPreferences', preferences);
}
```

## Agent Example

**Intelligence Agent with AG-UI:**

```typescript
export class IntelligenceAgent {
  analyzePerformance: (args) =>
    Effect.gen(function* () {
      const agentUI = yield* AgentUIService;

      // Send reasoning steps
      yield* agentUI.sendReasoning({
        agentId: AGENT_ID,
        conversationId: args.conversationId,
        steps: [
          { step: 1, title: 'Fetching metrics', description: '...', completed: true },
          { step: 2, title: 'Analyzing trends', description: '...', completed: true }
        ]
      });

      // Send chart
      yield* agentUI.sendUI({
        agentId: AGENT_ID,
        conversationId: args.conversationId,
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

      // Send action suggestions
      yield* agentUI.sendActions({
        agentId: AGENT_ID,
        conversationId: args.conversationId,
        actions: [
          {
            id: 'export_report',
            label: 'Export Full Report',
            params: { format: 'pdf' }
          }
        ]
      });
    })
}
```

## Security Considerations

**Input Validation:**
- Sanitize all component data before rendering
- Validate action parameters before execution
- Limit component complexity (max rows, max datasets)

**Authorization:**
- Check user permissions before executing actions
- Validate groupId on all operations
- Rate limit AG-UI message creation

**Sandboxing:**
- Never render user-provided HTML
- Use structured component data only
- Validate all data against schemas

## Performance Optimization

**Message Batching:**
- Batch multiple UI updates into single message
- Debounce rapid reasoning updates
- Use streaming for long sequences

**Component Rendering:**
- Lazy load heavy components (charts, tables)
- Virtualize large lists and tables
- Memoize component renderers

**Context Sharing:**
- Throttle context updates
- Only share necessary fields
- Use delta updates when possible

## Summary

**AG-UI Protocol provides:**
- Structured UI communication (not HTML)
- Type-safe component data
- Bidirectional context sharing
- Human-in-the-loop actions
- Multi-agent coordination

**Key Benefits:**
- Security (no XSS via HTML strings)
- Type safety (TypeScript throughout)
- Flexibility (any UI component)
- Real-time (Convex subscriptions)
- Multi-tenant (groupId scoping)

**Related Documentation:**
- [AI SDK Implementation](./ai-sdk-implementation.md)
- [Generative UI Patterns](./generative-ui-patterns.md)
- [CopilotKit Protocol](../connections/copilotkit.md)

