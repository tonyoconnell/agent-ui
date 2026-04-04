# Tool System Infrastructure

**Status:** Phase 2 Complete - Tool Registry and Execution System
**Version:** 1.0.0
**Created:** 2025-12-12

## Overview

The Tool System Infrastructure provides a complete framework for registering, executing, and managing AI tools with enterprise-grade features:

- **Type-safe tool registration** with Zod schemas
- **Execution engine** with retry logic and timeout handling
- **Approval gates** for sensitive operations
- **Result caching** with configurable TTL
- **Execution tracking** with statistics and logging
- **Batch and sequential execution** support
- **Event-driven architecture** for UI integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Tool System                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Registry   │    │   Executor   │    │  Approval    │ │
│  │              │    │              │    │    Gate      │ │
│  │ - Register   │───▶│ - Execute    │───▶│ - Request    │ │
│  │ - Search     │    │ - Retry      │    │ - Approve    │ │
│  │ - Validate   │    │ - Cache      │    │ - Reject     │ │
│  └──────────────┘    │ - Track      │    └──────────────┘ │
│                      └──────────────┘                       │
│                            │                                │
│                            ▼                                │
│                   ┌──────────────┐                         │
│                   │   Tools      │                         │
│                   ├──────────────┤                         │
│                   │ Integration  │ (Google Sheets, API)    │
│                   │ Data         │ (Charts, Tables)        │
│                   │ Utility      │ (Math, Date)            │
│                   └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Create a New Tool

```typescript
// web/src/lib/tools/integrations/myTool.ts
import { z } from 'zod';
import { toolRegistry, type Tool } from '../registry';

const myToolParams = z.object({
  input: z.string().describe('Input parameter'),
  options: z.object({
    format: z.enum(['json', 'text']).default('json'),
  }).optional(),
});

async function executeMyTool(params: z.infer<typeof myToolParams>) {
  // Your tool logic here
  return {
    result: 'Success',
    data: params.input,
  };
}

export const myTool: Tool = {
  name: 'my_tool',
  description: 'Does something useful',
  category: 'integration',
  parameters: myToolParams,
  execute: executeMyTool,

  // Optional metadata
  requiresApproval: false,
  version: '1.0.0',
  tags: ['api', 'external'],
  cacheable: true,
  cacheTTL: 300000, // 5 minutes
  timeout: 10000, // 10 seconds
  retryable: true,
  maxRetries: 2,
};

// Auto-register
toolRegistry.register(myTool);
```

### 2. Execute a Tool

```typescript
import { executeTool } from '@/lib/tools';

// Basic execution
const result = await executeTool('my_tool', {
  input: 'Hello, world!',
});

if (result.success) {
  console.log('Result:', result.result);
} else {
  console.error('Error:', result.error);
}

// With context (timeout, caching, etc.)
const result = await executeTool('my_tool', {
  input: 'Hello',
}, {
  userId: 'user_123',
  sessionId: 'session_456',
  timeout: 5000,
  enableCache: true,
  retryCount: 3,
});
```

### 3. Use in React Components

```typescript
import { executeTool, getToolStatistics } from '@/lib/tools';
import { useState } from 'react';

export function ToolExecutor({ toolName }: { toolName: string }) {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (params: any) => {
    setIsLoading(true);
    setError(null);

    const result = await executeTool(toolName, params);

    if (result.success) {
      setResult(result.result);
    } else {
      setError(result.error || 'Execution failed');
    }

    setIsLoading(false);
  };

  return (
    <div>
      {/* Tool UI */}
    </div>
  );
}
```

## Core Features

### 1. Tool Registry

The registry stores all available tools with validation and discovery features.

**Features:**
- Type-safe tool registration with validation
- Search tools by name, category, or tags
- Get tool metadata for AI SDK integration
- Track registry statistics

**API:**

```typescript
import { toolRegistry } from '@/lib/tools';

// Register a tool
toolRegistry.register(myTool);

// Register multiple tools
toolRegistry.registerMany([tool1, tool2, tool3]);

// Get a tool
const tool = toolRegistry.get('my_tool');

// Get all tools
const allTools = toolRegistry.getAll();

// Get tools by category
const integrations = toolRegistry.getByCategory('integration');
const dataTools = toolRegistry.getByCategory('data');

// Get tools by tag
const apiTools = toolRegistry.getByTag('api');

// Search tools
const results = toolRegistry.search('google');

// Get tool metadata (for AI SDK)
const metadata = toolRegistry.getMetadata('my_tool');
const allMetadata = toolRegistry.getAllMetadata();

// Get sensitive tools (require approval)
const sensitiveTools = toolRegistry.getSensitiveTools();

// Statistics
const stats = toolRegistry.getStats();
// {
//   total: 10,
//   byCategory: { integration: 3, data: 5, utility: 2 },
//   sensitive: 2,
//   cacheable: 8,
//   retryable: 9
// }
```

### 2. Tool Executor

The executor handles tool execution with comprehensive error handling, retry logic, and tracking.

**Features:**
- Timeout handling (default 30s)
- Automatic retry with exponential backoff
- Result caching with configurable TTL
- Approval gates for sensitive operations
- Execution logging and statistics
- Batch and sequential execution

**API:**

```typescript
import {
  executeTool,
  executeToolsBatch,
  executeToolsSequence,
} from '@/lib/tools';

// Execute single tool
const result = await executeTool('my_tool', { input: 'test' }, {
  userId: 'user_123',
  timeout: 10000,
  enableCache: true,
  retryCount: 3,
});

// Execute multiple tools in parallel
const results = await executeToolsBatch([
  { toolName: 'tool1', params: { a: 1 } },
  { toolName: 'tool2', params: { b: 2 } },
  { toolName: 'tool3', params: { c: 3 } },
]);

// Execute tools in sequence (stops on first failure)
const results = await executeToolsSequence([
  { toolName: 'step1', params: {} },
  { toolName: 'step2', params: {} },
  { toolName: 'step3', params: {} },
]);
```

**Execution Result:**

```typescript
interface ToolExecutionResult {
  success: boolean;
  state: 'pending' | 'executing' | 'completed' | 'failed' | 'cached' | ...;
  result?: any;
  error?: string;
  errorCode?: string;
  executionTime?: number;
  fromCache?: boolean;
  toolName: string;
  timestamp: number;
}
```

### 3. Approval Gate

Protect sensitive operations with user approval flow.

**Features:**
- Configurable approval requirements
- Pending approval queue
- Timeout handling (60s default)
- Event-driven UI integration

**Usage:**

```typescript
// Mark tool as requiring approval
export const deleteTool: Tool = {
  name: 'delete_data',
  description: 'Delete sensitive data',
  category: 'utility',
  requiresApproval: true, // ← Requires approval
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }) => {
    // Delete logic
  },
};

// Listen for approval requests in UI
import { approvalGate } from '@/lib/tools';

useEffect(() => {
  const handleApprovalRequest = (event: CustomEvent) => {
    const { requestId, request } = event.detail;

    // Show approval dialog
    showApprovalDialog({
      toolName: request.toolName,
      params: request.params,
      onApprove: () => approvalGate.approveRequest(requestId),
      onReject: () => approvalGate.rejectApproval(requestId, 'User declined'),
    });
  };

  window.addEventListener('tool-approval-request', handleApprovalRequest);

  return () => {
    window.removeEventListener('tool-approval-request', handleApprovalRequest);
  };
}, []);
```

### 4. Result Caching

Automatic caching of tool results with TTL-based expiration.

**Features:**
- Configurable cache TTL (default 5 minutes)
- Automatic cache key generation
- LRU eviction (max 100 entries)
- Per-tool cache clearing

**Usage:**

```typescript
// Enable caching for a tool
export const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get weather data',
  category: 'integration',
  cacheable: true, // ← Enable caching
  cacheTTL: 600000, // 10 minutes
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    // Fetch weather
  },
};

// Clear cache
import { clearToolCache } from '@/lib/tools';

// Clear all cached results
clearToolCache();

// Clear cache for specific tool
clearToolCache('get_weather');
```

### 5. Execution Tracking

Track tool executions with detailed logging and statistics.

**Features:**
- Execution logs with timestamps
- Success/failure tracking
- Execution time measurement
- Error categorization
- Statistics aggregation

**API:**

```typescript
import {
  getExecutionLogs,
  getToolStatistics,
  clearExecutionLogs,
} from '@/lib/tools';

// Get all execution logs
const logs = getExecutionLogs();

// Get logs for specific tool
const weatherLogs = getExecutionLogs('get_weather');

// Get statistics
const stats = getToolStatistics(); // All tools
const weatherStats = getToolStatistics('get_weather'); // Specific tool

// Statistics structure
interface ToolStatistics {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number; // milliseconds
  cacheHitRate: number; // 0-1
  errorsByCode: Record<string, number>;
}

// Clear logs
clearExecutionLogs();
```

### 6. Event System

All tool operations emit events for UI integration.

**Events:**

```typescript
// Tool registered
window.addEventListener('tool-registered', (event: CustomEvent) => {
  console.log('Tool registered:', event.detail.tool);
});

// Approval request
window.addEventListener('tool-approval-request', (event: CustomEvent) => {
  const { requestId, request } = event.detail;
  // Show approval UI
});

// Tool execution
window.addEventListener('tool-execution', (event: CustomEvent) => {
  const log = event.detail;
  console.log('Tool executed:', log);
});
```

## Tool Categories

### Integration Tools
External API integrations (Google Sheets, Weather, etc.)

```typescript
// web/src/lib/tools/integrations/
- googleSheets.ts
- weather.ts
- webSearch.ts
```

### Data Tools
Data processing and visualization (Charts, Tables, etc.)

```typescript
// web/src/lib/tools/data/
- createChart.ts
- createTable.ts
- dataAnalyzer.ts
```

### Utility Tools
General utilities (Math, Date, etc.)

```typescript
// web/src/lib/tools/utilities/
- calculator.ts
- dateFormatter.ts
```

## Best Practices

### 1. Tool Design

✅ **DO:**
- Use descriptive tool names (lowercase, underscores)
- Provide clear descriptions (tell AI when to use)
- Use Zod schemas for validation
- Handle errors gracefully (return error objects)
- Keep outputs concise (for context efficiency)
- Make tools idempotent (safe to call multiple times)

❌ **DON'T:**
- Use special characters in tool names
- Throw errors (return error objects instead)
- Return large outputs (summarize data)
- Make tools stateful (side effects should be explicit)
- Skip parameter validation

### 2. Error Handling

Always return structured error responses:

```typescript
async function executeTool(params: any) {
  try {
    const data = await fetchData(params);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'FETCH_FAILED',
    };
  }
}
```

### 3. Approval Requirements

Mark tools as requiring approval if they:
- Delete or modify data
- Send external communications (email, SMS)
- Make financial transactions
- Access sensitive information
- Perform destructive operations

```typescript
export const deleteTool: Tool = {
  name: 'delete_records',
  requiresApproval: true, // ← Always true for destructive ops
  // ...
};
```

### 4. Caching Strategy

Enable caching for tools that:
- Fetch external data that changes infrequently
- Perform expensive computations
- Query read-only data sources

Disable caching for tools that:
- Return real-time data
- Modify state
- Have user-specific results

```typescript
export const weatherTool: Tool = {
  name: 'get_weather',
  cacheable: true, // Weather changes slowly
  cacheTTL: 600000, // 10 minutes
  // ...
};

export const stockPriceTool: Tool = {
  name: 'get_stock_price',
  cacheable: false, // Real-time data
  // ...
};
```

## Integration with AI SDK

The tool system is designed to integrate seamlessly with the Vercel AI SDK.

### Convert to AI SDK Tools

```typescript
import { tool } from 'ai';
import { toolRegistry } from '@/lib/tools';

// Convert registered tools to AI SDK format
const aiTools = toolRegistry.getAll().reduce((acc, t) => {
  acc[t.name] = tool({
    description: t.description,
    parameters: t.parameters,
    execute: t.execute,
  });
  return acc;
}, {} as Record<string, any>);

// Use with AI SDK
import { generateText } from 'ai';

const result = await generateText({
  model: 'anthropic:claude-3-5-sonnet-20241022',
  prompt: 'Analyze the weather in Tokyo',
  tools: aiTools,
  maxSteps: 5,
});
```

### Generate System Prompt

```typescript
import { getToolSystemPrompt } from '@/lib/tools';

const systemPrompt = getToolSystemPrompt('google_sheets');
// Returns formatted prompt with tool descriptions and usage instructions
```

## Ontology Mapping

The tool system maps to the 6-dimension ontology:

**Things:**
- Tool = Thing (type: 'tool')
- Tool result = Thing (type: 'tool_result')

**Connections:**
- Tool → Chat = Connection (type: 'uses_tool')
- Tool → User = Connection (type: 'executed_by')

**Events:**
- Tool execution = Event (type: 'tool_executed')
- Tool registration = Event (type: 'tool_registered')
- Approval request = Event (type: 'approval_requested')
- Approval granted = Event (type: 'approval_granted')

**Knowledge:**
- Tool metadata (capabilities, parameters)
- Execution logs (analytics, patterns)
- Usage statistics (performance, errors)

## Testing

Example test for a tool:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { executeTool } from '@/lib/tools';

describe('Weather Tool', () => {
  it('should return weather data', async () => {
    const result = await executeTool('get_weather', {
      city: 'San Francisco',
    });

    expect(result.success).toBe(true);
    expect(result.result).toHaveProperty('temperature');
    expect(result.result).toHaveProperty('condition');
  });

  it('should handle invalid city', async () => {
    const result = await executeTool('get_weather', {
      city: 'InvalidCity123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should cache results', async () => {
    // First call
    const result1 = await executeTool('get_weather', {
      city: 'Tokyo',
    }, { enableCache: true });

    expect(result1.fromCache).toBeFalsy();

    // Second call (should be cached)
    const result2 = await executeTool('get_weather', {
      city: 'Tokyo',
    }, { enableCache: true });

    expect(result2.fromCache).toBe(true);
  });
});
```

## File Structure

```
web/src/lib/tools/
├── README.md                   # This file
├── index.ts                    # Main exports
├── registry.ts                 # Tool registry
├── executor.ts                 # Execution engine
├── integrations/               # External API tools
│   ├── index.ts
│   ├── googleSheets.ts
│   ├── weather.ts
│   └── webSearch.ts
├── data/                       # Data processing tools
│   ├── index.ts
│   ├── createChart.ts
│   ├── createTable.ts
│   └── dataAnalyzer.ts
└── utilities/                  # Utility tools
    ├── index.ts
    ├── calculator.ts
    └── dateFormatter.ts
```

## Next Steps

**Phase 3: UI Components**
- ToolSelector component (dropdown for tool selection)
- ToolCallDisplay component (show tool execution state)
- ToolApprovalDialog component (approval UI)
- ToolStatsDashboard component (analytics)

**Phase 4: Advanced Features**
- Tool chaining (output of one tool → input of another)
- Streaming tool results (for long-running operations)
- Tool middleware (logging, auth, rate limiting)
- Tool versioning (v1, v2, etc.)

## References

- **AI SDK Tools Guide:** `.claude/skills/ai-sdk-tools/SKILL.md`
- **Implementation Plan:** `one/things/plans/ai.md`
- **Tool Registry Pattern:** Plan section "Pattern 9"
- **6-Dimension Ontology:** `one/knowledge/ontology.md`

---

**Version:** 1.0.0
**Last Updated:** 2025-12-12
**Status:** Production Ready
