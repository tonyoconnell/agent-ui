# Vercel AI Elements - Reference Implementation

This directory contains reference implementations from the [Vercel AI Elements](https://github.com/vercel/ai-elements) repository, downloaded for use as reference code when building chat interfaces.

## Directory Structure

```
/web/src/components/ai/
├── elements/          # Core AI UI elements (30 files)
│   ├── message.tsx    # Message display component
│   ├── prompt-input.tsx # User input component
│   ├── conversation.tsx # Conversation container
│   ├── model-selector.tsx # AI model selection
│   └── ...
└── examples/          # Example implementations (24 files)
    ├── chatbot.tsx    # Full chatbot implementation
    ├── demo-claude.tsx # Claude-specific demo
    ├── demo-chatgpt.tsx # ChatGPT-specific demo
    ├── demo-grok.tsx  # Grok-specific demo
    └── ...
```

## Key Files

### Core Elements (`/elements/`)

**Conversation Components:**
- `conversation.tsx` (2.5K) - Container for chat conversations
- `message.tsx` (11K) - Message display with rich formatting
- `prompt-input.tsx` (36K) - Advanced input component with attachments

**AI-Specific Components:**
- `model-selector.tsx` (4.7K) - Switch between AI models
- `reasoning.tsx` (5.0K) - Display AI reasoning process
- `chain-of-thought.tsx` (6.2K) - Show step-by-step thinking

**Enhancement Components:**
- `code-block.tsx` (4.4K) - Syntax-highlighted code display
- `loader.tsx` (2.2K) - Loading states
- `shimmer.tsx` (1.5K) - Skeleton loading animation
- `sources.tsx` (1.8K) - Display source citations
- `inline-citation.tsx` (6.4K) - Inline reference links

**Tool & Task Components:**
- `tool.tsx` (4.7K) - Display tool usage
- `task.tsx` (2.3K) - Task execution display
- `confirmation.tsx` (3.7K) - User confirmations
- `queue.tsx` (6.1K) - Message queue management

**Advanced Features:**
- `artifact.tsx` (3.3K) - Display generated artifacts
- `web-preview.tsx` (6.6K) - Preview web content
- `open-in-chat.tsx` (16K) - Open items in chat
- `plan.tsx` (3.4K) - Display AI plans

### Example Implementations (`/examples/`)

**Complete Demos:**
- `chatbot.tsx` (20K) - Full-featured chatbot with all elements
- `demo-claude.tsx` (24K) - Claude AI implementation
- `demo-chatgpt.tsx` (22K) - ChatGPT implementation
- `demo-grok.tsx` (25K) - Grok AI implementation
- `v0-clone.tsx` (5.6K) - v0.dev-style interface

**Component Examples:**
- `message.tsx` (9.7K) - Message component usage
- `message-flat.tsx` (1.7K) - Flat message layout
- `conversation.tsx` (4.0K) - Conversation component usage
- `prompt-input.tsx` (7.5K) - Input component examples
- `prompt-input-cursor.tsx` (13K) - Cursor-style input
- `queue-prompt-input.tsx` (9.3K) - Queue-based input

**UI Pattern Examples:**
- `model-selector.tsx` (8.3K) - Model selection UI
- `suggestion-input.tsx` (3.7K) - Suggestion chips
- `loader-custom.tsx` (1.8K) - Custom loaders
- `code-block-dark.tsx` (592B) - Dark code blocks
- `reasoning.tsx` (2.2K) - Reasoning display
- `confirmation.tsx` (1.7K) - Confirmation dialogs
- `tool.tsx` (6.8K) - Tool usage display
- `task.tsx` (1.5K) - Task display
- `queue.tsx` (7.2K) - Queue management

**Simple Components:**
- `loader.tsx` (207B) - Basic loader
- `shimmer.tsx` (443B) - Shimmer effect
- `sources.tsx` (752B) - Source citations
- `suggestion.tsx` (842B) - Single suggestion

## Import Structure

All imports have been updated to use the `@/` alias pattern:

```typescript
// Elements (core components)
import { Message, MessageContent } from '@/components/ai/elements/message';
import { PromptInput } from '@/components/ai/elements/prompt-input';
import { Conversation } from '@/components/ai/elements/conversation';

// UI components (shadcn/ui)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

## Usage

These files are **reference implementations** to study when building the `/pages/chat/index` page. Key patterns to observe:

1. **Message Flow** - How messages are structured and displayed
2. **Input Handling** - File attachments, suggestions, multi-line input
3. **Real-time Updates** - Streaming responses, loading states
4. **Model Selection** - Switching between AI providers
5. **Tool Integration** - Displaying tool usage and results
6. **Error Handling** - Connection errors, retry logic
7. **Accessibility** - Keyboard navigation, screen readers

## Integration Notes

When building the chat page:

1. **Start with simple patterns** from `/examples/conversation.tsx`
2. **Add interactivity** using patterns from `/examples/chatbot.tsx`
3. **Customize UI** by modifying the element components
4. **Add features** progressively (file upload, model selection, etc.)

## File Modifications

All files have been modified to:
- Replace `@repo/elements/` imports with `@/components/ai/elements/`
- Replace `@repo/ui/` imports with `@/components/ui/`
- Maintain all original functionality and patterns

## Source

These files were downloaded from:
- **Repository:** https://github.com/vercel/ai-elements
- **Source Path:** `packages/examples/src/` (examples)
- **Source Path:** `packages/elements/src/` (core elements)
- **Downloaded:** 2025-11-12

## Next Steps

1. Review example implementations in `/examples/`
2. Study core element APIs in `/elements/`
3. Build custom chat page using these patterns
4. Customize styling and behavior as needed

---

**Total Files:** 54 (24 examples + 30 elements)
**Total Size:** ~200KB of reference code
