# ONE Platform Chat Architecture - Complete Analysis

## Overview

The ONE Platform has a comprehensive multi-tier chat system supporting both free and premium tiers, with OpenRouter integration for model access and optional backend persistence via Convex.

---

## 1. Chat Pages & Routes

### Free Tier Pages

| Route | File | Component | Features |
|-------|------|-----------|----------|
| `/ai-chat` | `/web/src/pages/ai-chat.astro` | N/A (Marketing page) | Marketing/feature showcase |
| `/chat` | `/web/src/pages/chat/simple.astro` | SimpleChatClient | Basic client-side chat, OpenRouter API key required |
| `/examples/basic-chat` | `/web/src/pages/examples/basic-chat.astro` | SimpleChatClient | Standalone example page |

### Premium Tier Pages

| Route | File | Component | Features |
|-------|------|-----------|----------|
| `/chat/index` | `/web/src/pages/chat/index.astro` | PremiumChatClient | Advanced features (reasoning, tool calls, generative UI) |
| `/chat/premium-demo` | `/web/src/pages/chat/premium-demo.astro` | AgentMessage, Reasoning, ToolCall | Feature demonstration with sample data |
| `/chat/[threadId]` | `/web/src/pages/chat/[threadId].astro` | (Backend TBD) | Persistent thread loading (requires backend) |

---

## 2. Component Structure

### Basic Chat Components
**Location**: `/web/src/components/ai/basic/`

- **SimpleChatClient.tsx** - Main free tier chat component
  - Manages API key in localStorage
  - Handles message state
  - Calls `/api/chat` endpoint
  - Support for model selection
  - Real-time streaming responses
  - Suggestion prompt system

- **FreeChatClient.tsx** - Alternative free tier implementation
  - Uses `@ai-sdk/react` useChat hook
  - Similar functionality to SimpleChatClient

- **MessageList.tsx** - Renders message history
  - Auto-scroll to bottom
  - Supports loading indicator
  - Message formatting

- **PromptInput.tsx** - User input interface
  - Text input with send button
  - Keyboard shortcuts (Enter to send)

- **Suggestions.tsx** - Quick-start prompts
  - Shows curated suggestions when chat empty
  - Clickable buttons

### Premium Chat Components
**Location**: `/web/src/components/ai/premium/`

- **PremiumChatClient.tsx** - Main premium tier component
  - Extends SimpleChatClient functionality
  - Agent reasoning visualization
  - Tool call display
  - Extended message types (text, reasoning, tool_call, ui)
  - Demo response system for feature showcase
  - Client-side fallback for chart rendering

- **AgentMessage.tsx** - Extended message renderer
  - Handles multiple message types: text, reasoning, tool_call, ui
  - Automatic type detection and rendering

- **Reasoning.tsx** - Agent reasoning visualization
  - Step-by-step reasoning display
  - Completion status indicator

- **ToolCall.tsx** - Tool/function call display
  - Shows tool name, arguments, and results
  - Expandable/collapsible UI

---

## 3. Available AI Models

**OpenRouter Integration** - Users provide their own API key

### Pre-configured Models
1. **Google Gemini 2.5 Flash Lite** - Default, fast & free tier
   - ID: `google/gemini-2.5-flash-lite`
2. **GPT-4** (OpenAI)
   - ID: `openai/gpt-4`
3. **GPT-3.5 Turbo** (OpenAI)
   - ID: `openai/gpt-3.5-turbo`
4. **Claude 3 Opus** (Anthropic)
   - ID: `anthropic/claude-3-opus`
5. **Claude 3 Sonnet** (Anthropic)
   - ID: `anthropic/claude-3-sonnet`
6. **Llama 3 70B** (Meta)
   - ID: `meta-llama/llama-3-70b-instruct`
7. **Gemini Pro 1.5** (Google)
   - ID: `google/gemini-pro-1.5`

Users can access 15+ additional models through OpenRouter with their API key.

---

## 4. Authentication & API Key Management

### Current Implementation

**Free Tier:**
- API key stored in browser localStorage
- Key: `openrouter-api-key`
- Only used in browser (not sent to ONE servers)
- User responsible for obtaining OpenRouter key at: https://openrouter.ai/keys
- Security notice displayed to users: "Only use on trusted devices"

**Premium Tier:**
- Same localStorage implementation (for now)
- Future: Backend token/credential storage via Convex

### Key Components
- `STORAGE_KEY = 'openrouter-api-key'` in SimpleChatClient & PremiumChatClient
- `MODEL_KEY = 'openrouter-model'` in SimpleChatClient & PremiumChatClient
- API key cleared with `handleClearKey()` function
- Validation: API key required before starting chat

---

## 5. API Endpoints

### /api/chat (POST)
**Location**: `/web/src/pages/api/chat.ts`

**Purpose**: Unified chat endpoint for OpenRouter integration

**Request Body**:
```typescript
{
  messages: Array<{ role: 'user'|'assistant'|'system', content: string }>,
  apiKey: string,              // User's OpenRouter API key
  model: string,               // Model ID (default: 'openai/gpt-4')
  premium?: boolean            // Enable premium features (chart generation)
}
```

**Response**: Server-sent Events (SSE) stream
- Standard OpenRouter SSE format
- Contains delta content for streaming
- Special handling for UI components (charts, tables, buttons, cards)

**Features**:
1. **System Prompt Enhancement** (premium mode)
   - Adds instructions for generating charts/tables
   - Patterns: ````ui-chart`, ````ui-table`, ````ui-button`, ````ui-card`
   
2. **UI Component Detection**
   - Parses response for UI component blocks
   - Extracts JSON from markdown code blocks
   - Sends UI messages before [DONE] marker
   
3. **Client-Side Fallback**
   - If server-side UI detection fails
   - Client detects chart blocks and creates UI messages
   - Ensures charts render even if stream parsing misses them

4. **Error Handling**
   - Returns error message in JSON response
   - Preserves OpenRouter error details

---

## 6. Environment Variables & Configuration

### Public Variables
**File**: `/web/.env.example`

```
PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Backend Configuration
**File**: `/web/src/config/backend.ts` (referenced, not shown)
- `backendConfig.enabled` - Enables premium features (persistent threads)
- Controls access to `/chat/[threadId]` routes
- Redirects to `/upgrade?feature=persistent-threads` if disabled

---

## 7. Data Flow Architecture

### Free Tier Flow
```
User Input
    ↓
SimpleChatClient (browser)
    ├─ Stores API key in localStorage
    ├─ Stores selected model in localStorage
    └─ Calls /api/chat with user's OpenRouter key
        ↓
    /api/chat endpoint
        ├─ Validates API key exists
        ├─ Calls OpenRouter API directly
        └─ Streams response back via SSE
        ↓
    SimpleChatClient (browser)
        ├─ Parses streaming response
        ├─ Updates message state in real-time
        └─ Renders MessageList
```

### Premium Tier Flow (Current)
```
User Input
    ↓
PremiumChatClient (browser)
    ├─ Stores API key in localStorage
    ├─ Checks for demo requests (contains "(demo)")
    ├─ If demo: Returns sample data (reasoning, tool calls, charts)
    └─ Otherwise: Calls /api/chat with premium=true
        ↓
    /api/chat endpoint
        ├─ Adds chart generation system prompt
        ├─ Calls OpenRouter API
        ├─ Detects UI components in response
        └─ Streams response with UI messages
        ↓
    PremiumChatClient (browser)
        ├─ Parses streaming response
        ├─ Detects extended message types (reasoning, tool_call, ui)
        ├─ Client-side chart detection (fallback)
        └─ Renders AgentMessage for each type
```

### Premium Tier Flow (Future - With Backend)
```
User Authentication
    ↓
Convex Backend
    ├─ Thread persistence (store/retrieve chat history)
    ├─ User quota management
    ├─ Usage analytics
    └─ Optional: Server-side API key storage
        ↓
    /chat/[threadId] page
        ├─ Loads thread from Convex
        ├─ Renders chat UI
        └─ Continues conversation
```

---

## 8. Message Type System

### Free Tier Messages
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### Premium Tier Messages (Extended)
```typescript
interface ExtendedMessage extends Message {
  type?: 'text' | 'reasoning' | 'tool_call' | 'ui';
  payload?: any;
  timestamp?: number;
}
```

### Message Types Detail

**Type: text**
- Standard chat message content
- Rendered by MessageList or as text in AgentMessage

**Type: reasoning**
- Agent's thinking process
- Payload: `{ steps: Array<{ step: number, title, description, completed: boolean }> }`
- Rendered by Reasoning component

**Type: tool_call**
- Function/tool invocation
- Payload: `{ name: string, args: object, result: object, status: 'pending'|'completed'|'failed' }`
- Rendered by ToolCall component

**Type: ui**
- Generative UI component
- Payload: `{ component: 'chart'|'table'|'button'|'card'|'form'|'timeline', data: object }`
- Rendered by GenerativeUIRenderer (in AgentMessage)

---

## 9. Features Matrix

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| **Core Chat** | ✓ | ✓ |
| **Model Selection** | ✓ (15+ models) | ✓ (15+ models) |
| **Real-time Streaming** | ✓ | ✓ |
| **Message Persistence** | ✗ (ephemeral) | ✓ (coming soon) |
| **Agent Reasoning** | ✗ | ✓ (demo available) |
| **Tool Calls** | ✗ | ✓ (demo available) |
| **Generative UI** | ✗ | ✓ (charts, tables, buttons, forms) |
| **Search History** | ✗ | ✓ (planned) |
| **Team Collaboration** | ✗ | ✓ (planned) |
| **Custom Workflows** | ✗ | ✓ (planned) |

---

## 10. UI Component Types (Premium)

The system supports generating interactive UI components from AI responses:

### 1. Charts (ui-chart)
```json
{
  "type": "ui",
  "payload": {
    "component": "chart",
    "data": {
      "title": "Sales Growth",
      "chartType": "line|bar|pie|doughnut|area",
      "labels": ["Jan", "Feb", ...],
      "datasets": [
        { "label": "Revenue", "data": [...], "color": "#3b82f6" }
      ]
    }
  }
}
```

### 2. Tables (ui-table)
```json
{
  "type": "ui",
  "payload": {
    "component": "table",
    "data": {
      "title": "Data Table",
      "columns": ["Name", "Value"],
      "rows": [["Item", "123"]]
    }
  }
}
```

### 3. Buttons (ui-button)
```json
{
  "type": "ui",
  "payload": {
    "component": "button",
    "data": {
      "label": "Click Me",
      "variant": "default|destructive|outline|secondary|ghost|link",
      "size": "default|sm|lg|icon",
      "action": "javascript code"
    }
  }
}
```

### 4. Cards (ui-card)
```json
{
  "type": "ui",
  "payload": {
    "component": "card",
    "data": {
      "title": "Card Title",
      "description": "Description",
      "icon": "rocket",
      "content": "Card content"
    }
  }
}
```

---

## 11. Storage & Persistence

### Client-Side Storage
- **localStorage keys**:
  - `openrouter-api-key` - User's API key
  - `openrouter-model` - Selected model ID
- **Session State**:
  - Messages stored in React component state
  - Lost on page refresh (free tier)

### Server-Side Storage (Premium)
- **Backend**: Convex database (planned)
- **What's stored**:
  - Chat thread history
  - User preferences
  - Usage metrics
  - API quotas

### Future Backend Features
- Persistent threads accessible via `/chat/[threadId]`
- User authentication via Better Auth
- Token/quota management
- Usage analytics

---

## 12. Error Handling

### Free Tier Error Handling
1. **Missing API Key**: Shows setup form with error message
2. **Invalid API Key**: Displays error alert from OpenRouter
3. **Network Error**: Shows error message, allows retry
4. **Stream Error**: Closes stream, removes user message from history

### Premium Tier Error Handling
1. Same as free tier
2. Demo errors show graceful fallback
3. Client-side chart fallback handles missing server UI detection

### Error Messages
- Captured from OpenRouter API response
- Displayed in AlertDescription component
- Error persists until dismissed or cleared

---

## 13. Prompt Suggestions System

### Free Tier Suggestions
```javascript
const PROMPT_SUGGESTIONS = [
  "Write a creative short story about a time traveler",
  "Create a React component for a todo list with TypeScript",
  "Explain how neural networks work in simple terms",
  "Generate 5 unique business ideas for sustainable products",
  "Help me debug this code: function add(a,b) { return a+b }",
  "Analyze the pros and cons of remote work vs office work",
  "Write a professional email requesting a project deadline extension",
  "Create a Python script to analyze CSV data",
];
```

### Premium Tier Suggestions
```javascript
const PROMPT_SUGGESTIONS = [
  "🧠 Show me agent reasoning (demo)",
  "🔧 Demonstrate tool calls (demo)",
  "📊 Generate a sales chart (demo)",
  "📋 Create a data table (demo)",
  "📝 Build a contact form (demo)",
  "⏱️ Show project timeline (demo)",
  "Create a React component for a todo list with TypeScript",
  "Analyze sales data and show insights with charts",
];
```

---

## 14. Configuration & Customization

### Model Selection
- Users can select from 7 pre-configured popular models
- Can use any OpenRouter model by knowing the model ID
- Default model: `google/gemini-2.5-flash-lite`
- Model selection persisted in localStorage

### System Prompts
- **Free tier**: Standard chat behavior
- **Premium tier**: Includes UI component generation instructions
  - Enables chart/table/button/card generation
  - Provides markdown format syntax
  - Includes example responses

### Feature Flags
- Backend integration controlled by `backendConfig.enabled`
- Premium features gated behind this flag
- Thread persistence redirects to `/upgrade` if disabled

---

## 15. Security Considerations

### Current Implementation
- API key stored in browser localStorage
- NOT sent to ONE platform servers
- Only sent to OpenRouter API by client
- Users advised: "Only use on trusted devices"

### Future Security
- Server-side API key storage (Convex backend)
- Better Auth authentication
- Per-user quotas and rate limiting
- Audit logging of all API calls

### Best Practices
1. Users should NOT share their browser localStorage
2. Clear API key before leaving untrusted devices
3. Use separate API keys for development/production
4. Monitor OpenRouter usage and costs

---

## Summary

The ONE Platform chat system provides a flexible, OpenRouter-based AI chat interface with:
- **Free tier**: Basic chat with 15+ models via user's API key
- **Premium tier**: Advanced features (reasoning, tool calls, generative UI)
- **Extensible architecture**: Ready for backend persistence and team features
- **Client-first approach**: Minimal server requirements, user controls API access
- **Progressive enhancement**: Works without backend, enhanced with optional backend

All components use TypeScript, React, and shadcn/ui for consistent, maintainable code.
