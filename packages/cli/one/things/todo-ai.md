---
title: Todo Ai
dimension: things
primary_dimension: things
category: todo-ai.md
tags: ai, artificial-intelligence, backend, connections, events, cycle, knowledge, ontology, things
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-ai.md category.
  Location: one/things/todo-ai.md
  Purpose: Documents ai implementation: 100-cycle roadmap
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo ai.
---

# AI Implementation: 100-Cycle Roadmap

**Feature:** AI Chat with Vercel AI SDK + Prompt Kit
**Version:** 1.0.0
**Status:** Planning Ready
**Stack:** Astro 5 + React 19 + Vercel AI SDK + Prompt Kit + Convex Backend
**Target:** Production-ready multi-tenant AI applications with 6-dimension ontology

---

## Overview

This roadmap sequences the complete implementation of AI capabilities using **Vercel AI SDK** (provider-agnostic LLM toolkit) + **Prompt Kit** (production-ready UI components), mapped to the 6-dimension ontology.

### Why This Approach

- **Provider Agnostic**: Swap LLM providers (OpenAI, Anthropic, Google) without code changes
- **Production UI**: Pre-built, accessible chat components (Prompt Kit)
- **Ontology Aligned**: Every AI interaction maps to 6 dimensions (Things, Connections, Events, Knowledge)
- **Streaming Support**: Real-time responses with token tracking
- **Multi-Tenant**: Each group has isolated AI quotas and configurations
- **Type Safe**: Full TypeScript with automatic cycle

---

## Cycle 1-10: Foundation & Setup

**1. [CYCLE-001]** Validate AI feature against 6-dimension ontology

- Things: agents (type="agent")
- Connections: agent_owns, user_interacted_with_agent
- Events: ai_generation_completed, ai_error_occurred
- Knowledge: embeddings of generated content
- Groups: multi-tenant AI quotas
- People: role-based access to AI features

**2. [CYCLE-002]** Map entity types

- Agent entity (type="agent" in things)
- Thread entity (aiThreads table - conversation container)
- Message entity (aiMessages table - individual messages)
- AI Call entity (aiCalls table - audit trail of API calls)

**3. [CYCLE-003]** Identify connection types

- user_interacted_with_agent (bidirectional, temporal)
- agent_owns (tools/resources)
- agent_trained_on (knowledge sources)

**4. [CYCLE-004]** List event types

- ai_generation_completed (success)
- ai_error_occurred (failures)
- ai_tool_called (function invocation)
- ai_thread_created (conversation started)
- ai_message_added (message logged)

**5. [CYCLE-005]** Determine knowledge requirements

- Vector embeddings for generated responses (RAG)
- Semantic search of conversation history
- Knowledge graph linking agents to training data
- Citation and source tracking

**6. [CYCLE-006]** Identify organization scope

- Multi-tenant: each group has separate AI quotas
- Each group can configure preferred models/providers
- Organization-level rate limiting
- Sub-group inheritance of parent settings

**7. [CYCLE-007]** Define people roles

- platform_owner: access to global AI settings
- org_owner: manage AI quotas for organization
- org_user: use AI features within org quota
- customer: limited access (if applicable)

**8. [CYCLE-008]** Create high-level vision document

- Enable organizations to add AI chat to any feature
- Track AI usage and costs transparently
- Provide flexibility to use any LLM provider
- Support advanced features (tools, streaming, reasoning)

**9. [CYCLE-009]** Generate initial plan with feature breakdown

- Phase 1 (Cycle 1-10): Setup and dependencies
- Phase 2 (Cycle 11-20): Backend schema and services
- Phase 3 (Cycle 21-30): Frontend components and pages
- Phase 4 (Cycle 41-50): Advanced features (tools, reasoning, streaming)
- Phase 5 (Cycle 61-70): Monitoring and analytics
- Phase 6 (Cycle 71-80): Design and polish
- Phase 7 (Cycle 81-90): Performance optimization
- Phase 8 (Cycle 91-100): Deployment and documentation

**10. [CYCLE-010]** Assign features to specialists

- Backend specialist: schema, mutations, queries, services
- Frontend specialist: components, pages, hooks, styling
- Integration specialist: Prompt Kit component installation
- Quality specialist: testing, ontology validation
- Documenter: guides, API docs, patterns

---

## Cycle 11-20: Backend Schema & Services

**11. [CYCLE-011]** Design database schema changes

- aiCalls table: track all LLM API calls with tokens and costs
- aiThreads table: conversation containers
- aiMessages table: individual messages in threads
- Index by groupId for multi-tenant isolation
- Index by timestamp for analytics

**12. [CYCLE-012]** Update backend/convex/schema.ts with new types

```typescript
aiCalls: {
  (groupId,
    actorId,
    model,
    provider,
    prompt,
    result,
    tokensUsed,
    duration,
    error,
    metadata,
    timestamp);
}
aiThreads: {
  (groupId, agentId, title, status, metadata, createdAt, updatedAt);
}
aiMessages: {
  (groupId, threadId, role, content, metadata, createdAt);
}
```

**13. [CYCLE-013]** Create Effect.ts service for business logic

- LLMService with generateText, streamText, generateObject
- ThreadService with createThread, addMessage, getHistory
- AnalyticsService with tokenUsage, costCalculation
- Provider agnostic (support OpenAI, Anthropic, Google)

**14. [CYCLE-014]** Define service errors with tagged unions

- LLMError (provider error, rate limit)
- RateLimitError (group quota exceeded)
- ValidationError (invalid prompt/schema)
- AuthorizationError (user doesn't have access)

**15. [CYCLE-015]** Write Convex queries for read operations

- getCallsByGroup (pagination, sorting)
- getTokenUsageStats (by provider, by period)
- getThreads (by group, with metadata)
- getThreadMessages (conversation history)
- getAgents (available agents for group)

**16. [CYCLE-016]** Write Convex mutations for write operations

- generateResponse (one-shot completion)
- createThread (new conversation)
- addMessage (append to thread)
- streamThreadResponse (streaming chat)
- analyzeMessage (structured output)
- generateWithTools (function calling)

**17. [CYCLE-017]** Add event logging to all mutations

- Log every AI call to events table
- Include actor (user), target (agent), metadata (tokens, provider)
- Log errors with context
- Create audit trail for compliance

**18. [CYCLE-018]** Implement organization scoping

- All queries filtered by groupId
- Enforce quotas per group
- Inherit parent group settings
- Validate user belongs to group

**19. [CYCLE-019]** Add rate limiting to mutations

- Convex Rate Limiter integration
- Per-group rate limits (calls/minute)
- Per-group token limits (tokens/month)
- Graceful error messages when limits exceeded

**20. [CYCLE-020]** Write unit tests for Effect.ts services

- Test generateText with mocked provider
- Test error handling for invalid inputs
- Test rate limit detection
- Test provider switching

---

## Cycle 21-30: Frontend Pages & Components

**21. [CYCLE-021]** Create Astro chat page with SSR data fetching

- `/chat` route with layout
- Load initial threads on server
- Pass groupId and userId as props
- Add authentication guard

**22. [CYCLE-022]** Build React AIChat component

- useAIChat hook with messages state
- Form handling for user input
- Loading state during generation
- Error boundary for failures

**23. [CYCLE-023]** Use Prompt Kit components for UI

- PromptInput for message input
- Message component for chat bubbles
- ChatContainerRoot for scrollable list
- Loader component for loading state

**24. [CYCLE-024]** Implement loading states with Suspense

- Skeleton loaders for initial threads
- Loading indicator during generation
- Disable input while loading
- Smooth transitions

**25. [CYCLE-025]** Add error boundaries for graceful failures

- Try-catch in mutations
- User-friendly error messages
- Retry buttons for failed requests
- Log errors to Sentry/monitoring

**26. [CYCLE-026]** Create forms with validation

- Validate prompt before sending (not empty)
- Validate model selection
- Validate thread creation inputs
- Use Zod for schema validation

**27. [CYCLE-027]** Implement client-side state with Convex hooks

- useQuery for threads list
- useQuery for messages
- useMutation for sendMessage
- useMutation for createThread
- Optimistic updates

**28. [CYCLE-028]** Style with Tailwind v4

- CSS @theme blocks for colors
- Chat bubble styling (user vs assistant)
- Input styling with auto-resize
- Dark mode support

**29. [CYCLE-029]** Ensure responsive design

- Mobile-first approach
- Stack layout on small screens
- Responsive font sizes
- Touch-friendly button sizing

**30. [CYCLE-030]** Add dark mode support

- @variant dark for color overrides
- Test in dark mode
- Respect system preference

---

## Cycle 31-40: Integration & Connections

**31. [CYCLE-031]** Map Prompt Kit to ontology

- UI components = presentation layer
- Convex mutations = business logic layer
- AI SDK = external system layer
- Events/Knowledge = logging layer

**32. [CYCLE-032]** Create connection records for system relationships

- user → agent (user_interacted_with_agent)
- agent → tools (agent_owns)
- agent → knowledge (agent_trained_on)

**33. [CYCLE-033]** Implement data synchronization logic

- Sync thread creation with events table
- Sync messages with aiMessages table
- Sync API calls with aiCalls table
- Keep audit trail current

**34. [CYCLE-034]** Add event tracking for cross-system actions

- Track when user starts chat (ai_thread_created)
- Track when AI generates (ai_generation_completed)
- Track when tools are called (ai_tool_called)
- Track errors (ai_error_occurred)

**35. [CYCLE-035]** Create webhook handlers

- Handle provider API callbacks (if needed)
- Validate webhook signatures
- Update thread status

**36. [CYCLE-036]** Implement polling logic

- Not needed for AI SDK (synchronous)
- Ready for future async operations

**37. [CYCLE-037]** Add error handling for integration failures

- Provider API timeout
- Rate limit exceeded
- Invalid API key
- Network failures

**38. [CYCLE-038]** Create retry logic with exponential backoff

- Retry failed API calls
- Exponential backoff (100ms, 200ms, 400ms...)
- Max 3 retries
- Log retry attempts

**39. [CYCLE-039]** Log all integration events to events table

- Log every AI call
- Log errors with full context
- Log token usage
- Timestamp all events

**40. [CYCLE-040]** Write integration tests for data flows

- User sends message → event created
- Message is logged to aiMessages
- Response is generated → event created
- Tokens tracked in aiCalls

---

## Cycle 41-50: Advanced Features

**41. [CYCLE-041]** Implement structured output (objects)

- Use generateObject from AI SDK
- Define Zod schemas for output
- Parse and validate responses
- Store structured data in metadata

**42. [CYCLE-042]** Implement tool calling (function calling)

- Define tools with parameters
- AI decides which tools to call
- Execute tools (database queries, API calls)
- Return results to AI

**43. [CYCLE-043]** Implement streaming responses

- Use streamText from AI SDK
- Stream chunks to frontend
- Update messages in real-time
- Handle stream completion

**44. [CYCLE-044]** Add vision support (images)

- Accept image uploads
- Send images to vision models
- Display images in messages
- Cache processed images

**45. [CYCLE-045]** Implement reasoning/thinking display

- Extract thinking process from response
- Display in collapsible reasoning component
- Show thinking step-by-step
- Measure reasoning time

**46. [CYCLE-046]** Add multi-turn conversation context

- Maintain full message history
- Include context in system prompt
- Summarize long conversations
- Clean up old threads

**47. [CYCLE-047]** Implement RAG (retrieval-augmented generation)

- Embed user prompts
- Search knowledge base
- Augment prompt with relevant documents
- Cite sources in responses

**48. [CYCLE-048]** Add template/prompt management

- Create saved prompts
- Create system prompt templates
- Apply templates to new threads
- Version control prompts

**49. [CYCLE-049]** Implement model selection UI

- Allow switching models per conversation
- Show model costs
- Save model preference
- Compare models side-by-side

**50. [CYCLE-050]** Write integration tests for advanced features

- Test structured output parsing
- Test tool calling execution
- Test streaming delivery
- Test RAG retrieval

---

## Cycle 51-60: Knowledge & RAG

**51. [CYCLE-051]** Create knowledge records with labels

- Extract topics from AI responses
- Create knowledge entities
- Tag with relevance score
- Link to conversations

**52. [CYCLE-052]** Generate embeddings for content

- Use OpenAI embeddings API
- Cache embeddings
- Batch embedding generation
- Store in knowledge table

**53. [CYCLE-053]** Store vectors in knowledge table

- Add embedding field to knowledge
- Index embeddings for search
- Version embeddings
- Track embedding model used

**54. [CYCLE-054]** Implement vector search

- Similarity search queries
- Configurable similarity threshold
- Ranked results
- Caching for hot queries

**55. [CYCLE-055]** Create RAG pipeline

- 1.  User asks question
- 2.  Embed question
- 3.  Search knowledge base
- 4.  Augment prompt with context
- 5.  Generate response
- 6.  Track source documents

**56. [CYCLE-056]** Link knowledge to things via junction table

- knowledge_thing junction table
- Many-to-many relationships
- Track relevance scores
- Enable graph traversal

**57. [CYCLE-057]** Add semantic search to UI

- Search endpoint
- Search results component
- Relevance highlighting
- Click to use in chat

**58. [CYCLE-058]** Implement knowledge graph traversal

- Graph queries (neighbor things)
- Multi-hop traversal
- Circular reference detection
- Performance optimization

**59. [CYCLE-059]** Create AI-powered recommendations

- Suggest related documents
- Suggest follow-up questions
- Suggest similar conversations
- Personalize recommendations

**60. [CYCLE-060]** Test RAG accuracy with sample queries

- Benchmark retrieval quality
- Measure relevance
- Test edge cases
- Optimize thresholds

---

## Cycle 61-70: Quality & Testing

**61. [CYCLE-061]** Define user flows

- Start conversation
- Send message
- Receive response
- View token usage
- Search knowledge
- Switch models

**62. [CYCLE-062]** Create acceptance criteria

- Response generated within 30 seconds
- Tokens tracked accurately
- Errors handled gracefully
- Dark mode renders correctly
- Mobile layout responsive

**63. [CYCLE-063]** Write unit tests for services

- Test selectModel function
- Test error classes
- Test token calculation
- Test rate limiter

**64. [CYCLE-064]** Write integration tests for flows

- Test full chat flow
- Test thread creation
- Test message persistence
- Test event logging

**65. [CYCLE-065]** Write e2e tests for critical paths

- User sends message
- AI responds
- Response appears in UI
- Tokens tracked

**66. [CYCLE-066]** Run tests and capture results

- Unit test pass rate
- Integration test pass rate
- E2E test pass rate
- Coverage metrics

**67. [CYCLE-067]** Validate against ontology

- Events table has entries
- Connections created
- Things updated
- Knowledge enhanced
- Groups isolated

**68. [CYCLE-068]** Check type safety

- Run bunx astro check
- No TypeScript errors
- All API responses typed
- All props typed

**69. [CYCLE-069]** Run linter

- bun run lint
- Fix eslint errors
- Format code
- Check for dead code

**70. [CYCLE-070]** Fix all failing tests before continuing

- Debug test failures
- Fix implementation bugs
- Update test expectations
- Ensure all tests pass

---

## Cycle 71-80: Design & Wireframes

**71. [CYCLE-071]** Create wireframes for chat interface

- Message list layout
- Input area positioning
- Loading states
- Error messages
- Token usage display

**72. [CYCLE-072]** Design component architecture

- AIChat (main container)
- MessageList (scrollable)
- MessageItem (single message)
- PromptInput (user input)
- LoadingIndicator (state)

**73. [CYCLE-073]** Set design tokens

- Colors: background, text, primary, secondary
- Spacing: 4px base unit
- Typography: sizes, weights, line-heights
- Timing: transitions, animations

**74. [CYCLE-074]** Ensure WCAG AA accessibility

- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Form labels
- Focus indicators

**75. [CYCLE-075]** Design loading states and skeletons

- Skeleton messages while loading
- Loading indicator animation
- Placeholder text
- Disable input while loading

**76. [CYCLE-076]** Create error state designs

- Error message banner
- Retry button
- Error icon
- Clear error message

**77. [CYCLE-077]** Design empty states

- "Start a conversation" message
- Suggested prompts
- Example questions
- Call-to-action

**78. [CYCLE-078]** Implement animations and transitions

- Message fade-in
- Smooth scroll to new messages
- Typing indicator
- Button hover states

**79. [CYCLE-079]** Validate design enables tests to pass

- All interactive elements focusable
- Loading states clear
- Error states distinct
- Mobile layout works

**80. [CYCLE-080]** Get design approval

- Review with team
- Accessibility audit
- Mobile testing
- Finalize design system

---

## Cycle 81-90: Performance & Optimization

**81. [CYCLE-081]** Optimize database queries

- Add indexes on frequently queried fields
- Use query pagination
- Batch message fetches
- Cache thread metadata

**82. [CYCLE-082]** Implement pagination for large lists

- Paginate threads list
- Paginate messages per thread
- Load more on scroll
- Virtual scrolling for performance

**83. [CYCLE-083]** Add caching where appropriate

- Cache thread list
- Cache recent messages
- Cache user preferences
- Set cache TTL

**84. [CYCLE-084]** Optimize images

- Use Astro Image component
- Lazy load images
- Responsive images
- WebP format

**85. [CYCLE-085]** Minimize JavaScript bundle size

- Code split AI components
- Lazy load Prompt Kit
- Tree-shake unused code
- Minify CSS

**86. [CYCLE-086]** Use Astro Islands for selective hydration

- AIChat as island (client:load)
- Static content non-hydrated
- Only hydrate interactive parts
- Reduce JS payload

**87. [CYCLE-087]** Enable SSR for critical pages

- Fetch initial threads on server
- Render initial state
- Progressive enhancement
- Faster first paint

**88. [CYCLE-088]** Optimize Lighthouse scores

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 95

**89. [CYCLE-089]** Test on slow connections

- Use DevTools throttling
- Test on 3G connection
- Measure time to interactive
- Optimize critical path

**90. [CYCLE-090]** Monitor Core Web Vitals

- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- Set up monitoring

---

## Cycle 91-100: Deployment & Documentation

**91. [CYCLE-091]** Build production bundle

- bun run build
- Check bundle size
- Verify no build errors
- Generate type declarations

**92. [CYCLE-092]** Deploy backend to Convex Cloud

- npx convex deploy
- Verify schema changes
- Test mutations in production
- Monitor error rates

**93. [CYCLE-093]** Deploy frontend to Cloudflare Pages

- wrangler pages deploy dist
- Set environment variables
- Configure redirects
- Test all routes

**94. [CYCLE-094]** Run smoke tests in production

- Test chat flow end-to-end
- Verify API responses
- Check database records
- Monitor performance

**95. [CYCLE-095]** Write feature documentation

- Add to `/one/knowledge/ai-sdk.md`
- Document architecture
- Provide code examples
- Explain design decisions

**96. [CYCLE-096]** Update API documentation

- Document all mutations
- Document all queries
- Provide curl examples
- Explain rate limiting

**97. [CYCLE-097]** Create user guide

- How to start a chat
- How to select models
- How to view token usage
- How to search knowledge

**98. [CYCLE-098]** Capture lessons learned

- What worked well
- What was difficult
- What would be different
- Patterns discovered

**99. [CYCLE-099]** Update knowledge base with patterns

- Document AI SDK patterns
- Document Prompt Kit usage
- Document ontology mapping
- Document rate limiting strategy

**100. [CYCLE-100]** Mark feature complete and notify stakeholders

- Update feature status to "production"
- Notify team of launch
- Share analytics/metrics
- Plan next features

---

## How to Use This Roadmap

### Sequential Execution

- Always do the **next cycle** in sequence
- Each cycle builds on previous work
- Dependencies are implicit in ordering

### Context Loading

- Use hooks to load current cycle
- Hooks provide:
  - Cycle number and task
  - Required ontology dimensions
  - Specialist assignments
  - Dependencies

### Completion Tracking

- Mark cycle complete when done
- Update progress tracker
- Load context for next cycle
- Capture lessons learned

### Parallel Execution

After schema is defined (Cycle 12):

- **Backend + Frontend:** Cycle 11-20 and 21-30 in parallel
- **Tests + Design:** Cycle 61-70 and 71-80 interdependent
- **Documentation:** Cycle 95-99 can start earlier

### Adaptive Planning

- Adjust based on complexity
- Skip cycles if not applicable
- Add cycles for special needs
- Let judgment refine the list

---

## Ontology Mapping Reference

**Things Dimension:**

- Agent entities (type="agent")
- Thread entities (aiThreads table)
- Message entities (aiMessages table)

**Connections Dimension:**

- user_interacted_with_agent
- agent_owns (tools)
- agent_trained_on (knowledge)

**Events Dimension:**

- ai_generation_completed
- ai_error_occurred
- ai_tool_called
- ai_thread_created

**Knowledge Dimension:**

- Embeddings of responses
- Vector search
- RAG augmentation
- Citation tracking

**Groups Dimension:**

- Isolated AI quotas
- Model preferences
- Rate limiting per group

**People Dimension:**

- Role-based access
- User-specific preferences
- Activity tracking

---

## Specialist Assignments

| Cycle Range | Specialist | Focus                       |
| --------------- | ---------- | --------------------------- |
| 1-10            | Director   | Planning and architecture   |
| 11-20           | Backend    | Schema, services, mutations |
| 21-30           | Frontend   | Components, pages, styling  |
| 31-40           | Integrator | Ontology mapping, events    |
| 41-50           | Backend    | Advanced features, tools    |
| 51-60           | Backend    | Knowledge, RAG, embeddings  |
| 61-70           | Quality    | Testing, validation         |
| 71-80           | Designer   | Wireframes, accessibility   |
| 81-90           | Engineer   | Performance, optimization   |
| 91-100          | Documenter | Deployment, docs, guides    |

---

## Success Metrics

- **Completion Rate:** 100% of cycles completed
- **Test Coverage:** > 85% code coverage
- **Performance:** Lighthouse > 90 across metrics
- **Accessibility:** WCAG AA compliance
- **Ontology:** All 6 dimensions properly mapped
- **Deployment:** Zero production errors in first week

---

**Philosophy:** Plan in cycles (not days). 100 cycles = 1 complete feature, flawlessly executed.

**Golden Rule:** Do the next thing, perfectly.

_— ONE Platform Team_
