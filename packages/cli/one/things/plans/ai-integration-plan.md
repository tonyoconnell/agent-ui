---
title: AI SDK Integration Plan  
dimension: things
category: plans
tags: ai, ai-sdk, agent, architecture, integration
related_dimensions: connections, events, knowledge
scope: global
created: 2025-11-10
updated: 2025-11-10
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/ai-integration-plan.md
  Purpose: Master integration plan for AI SDK + AI Elements  
  Related dimensions: connections, events, knowledge
  For AI agents: Read this to understand the AI integration strategy
---

# AI SDK Integration Plan: Complete Codebase Integration Map

**Version:** 1.0.0  
**Status:** Planning  
**Created:** 2025-11-10  
**Stack:** Vercel AI SDK 5 + AI Elements + Effect.ts + Convex + 6-Dimension Ontology

---

## Executive Summary

This document maps the complete integration of **Vercel AI SDK** and **AI Elements** across the ONE Platform codebase. It provides a comprehensive file-by-file integration map for implementing AI capabilities with the 6-dimension ontology.

**Integration Goals:**
1. Provider-agnostic AI (OpenAI, Anthropic, Google, etc.)
2. Production-ready UI (AI Elements)
3. Effect.ts service layer  
4. Convex real-time backend
5. 6-dimension ontology alignment
6. Multi-tenant agent system
7. AG-UI protocol (CopilotKit-inspired)

---

## Part 1: Codebase Analysis Summary

### Search Results Overview

**Todo Files (216):** Including one/things/todo-ai.md with 100-cycle roadmap
**Project Files (423):** Including web/src/pages/projects/ and templates  
**Agent Files (50+):** Complete agent system with specifications
**Services (15):** All following ontology patterns
**AI Documentation:** Comprehensive plans for AI SDK, Elements, Tools, CopilotKit

---

## Part 2: File Integration Map (96 Total Files)

### Backend Files (35 files)

**New Files to Create:**
```
backend/convex/schema.ts (modify - add AI tables)
backend/convex/ai/config.ts
backend/convex/ai/models.ts  
backend/convex/ai/tools.ts
backend/convex/services/llm-service.ts
backend/convex/services/agent-ui-service.ts
backend/convex/services/rag-service.ts
backend/convex/services/agent-orchestrator.ts
backend/convex/protocols/agent-ui.ts
backend/convex/mutations/ai/generate.ts
backend/convex/mutations/ai/stream.ts
backend/convex/mutations/ai/threads.ts
backend/convex/mutations/ai/agents.ts
backend/convex/queries/ai/calls.ts
backend/convex/queries/ai/threads.ts  
backend/convex/queries/ai/agents.ts
+ 10 test files
+ 5 tool files
```

### Frontend Files (48 files)

**New Files to Create:**
```
web/src/components/ai/Chatbot.tsx
web/src/components/ai/Message.tsx
web/src/components/ai/PromptInput.tsx
web/src/components/ai/MessageList.tsx
web/src/components/ai/AgentMessage.tsx
web/src/components/ai/CodeBlock.tsx
web/src/components/ai/Reasoning.tsx
web/src/components/ai/ToolCall.tsx
web/src/components/ai/LoadingIndicator.tsx
web/src/components/ai/Suggestions.tsx

web/src/components/generative-ui/GenerativeUIRenderer.tsx
web/src/components/generative-ui/DynamicChart.tsx
web/src/components/generative-ui/DynamicTable.tsx
web/src/components/generative-ui/DynamicCard.tsx
web/src/components/generative-ui/DynamicForm.tsx
web/src/components/generative-ui/DynamicList.tsx
web/src/components/generative-ui/DynamicTimeline.tsx

web/src/hooks/ai/useAIChat.ts
web/src/hooks/ai/useCompleteChatFlow.ts
web/src/hooks/ai/useAgentContext.ts
web/src/hooks/ai/useTokenUsage.ts
web/src/hooks/ai/useAgentActions.ts
web/src/hooks/ai/useGenerativeUI.ts

web/src/pages/chat/index.astro
web/src/pages/chat/[threadId].astro
web/src/pages/agents/index.astro
web/src/pages/agents/[agentId].astro
web/src/pages/dashboard/ai-usage.astro

+ 15 test files
```

**Files to Modify:**
```
web/src/services/ThingService.ts (add agent methods)
web/src/services/EventService.ts (add AI events)
web/src/services/KnowledgeService.ts (add RAG search)
```

### Configuration Files (5 files)

```
web/package.json (add: ai, @ai-sdk/*, zod, recharts)
backend/convex/package.json (add: ai, @ai-sdk/*, effect)
web/.env.local (PUBLIC_CONVEX_URL)
backend/.env.local (AI API keys)
.github/workflows/ai-tests.yml (CI/CD)
```

### Documentation Files (8 files)

```
one/knowledge/ai-sdk-implementation.md
one/knowledge/ag-ui-protocol.md
one/knowledge/generative-ui-patterns.md
one/events/ai-integration-complete.md  
one/events/ai-integration-lessons-learned.md
README-AI.md
docs/AI-QUICKSTART.md
docs/AI-API-REFERENCE.md
```

---

## Part 3: Integration Roadmap

### Phase 1: Backend (Cycles 1-30) - agent-backend
- Install AI SDK dependencies  
- Extend schema with AI tables
- Implement Effect.ts services (LLM, AgentUI, RAG)
- Create AG-UI protocol types
- Build mutations and queries
- Write backend tests

### Phase 2: Frontend (Cycles 31-60) - agent-frontend  
- Install AI Elements
- Create AI component library (10 components)
- Build generative UI components (7 components)
- Implement React hooks (6 hooks)
- Build Astro pages (5 pages)
- Style with Tailwind v4
- Write frontend tests

### Phase 3: Integration (Cycles 61-90) - agent-integrator + agent-quality
- Integrate existing services
- Test end-to-end flows  
- Performance optimization
- Security audit
- Integration tests

### Phase 4: Deployment (Cycles 91-100) - agent-documenter + agent-ops
- Complete documentation
- Configure CI/CD
- Production deployment
- Monitoring setup

---

## Part 4: Ontology Mapping

### Things Dimension
- `ai_agent` - Agent entities with model config
- `ai_thread` - Conversation containers
- `ai_message` - Individual messages

### Connections Dimension
- `user_interacts_with_agent`
- `agent_owns_tool`
- `agent_trained_on_knowledge`
- `agent_collaborates_with_agent`

### Events Dimension
- `ai_generation_completed`
- `ai_error_occurred`
- `ai_tool_called`
- `ai_thread_created`
- `ai_message_added`

### Knowledge Dimension
- Vector embeddings for RAG
- Similarity search
- Citation tracking

### Groups Dimension
- Per-group quotas
- Per-group model preferences
- Per-group rate limits

### People Dimension  
- platform_owner: Full AI access
- org_owner: Org AI management
- org_user: Use org agents
- customer: Limited access

---

## Part 5: Success Metrics

**Technical:**
- 96 files created/modified
- 100% type safety
- >85% test coverage
- <3s response latency

**Functional:**
- End-to-end chat works
- Generative UI renders correctly
- Multi-agent orchestration functional
- Context sharing bidirectional

**Ontology:**
- All 6 dimensions mapped
- Events logged for all operations
- Connections tracked correctly
- Multi-tenancy enforced

---

## Appendix: Agent Responsibilities

| Specialist | Phase | Files | Cycles |
|------------|-------|-------|--------|
| agent-backend | 1 | 35 | 1-30 |
| agent-frontend | 2 | 48 | 31-60 |
| agent-integrator | 3 | 10 | 61-75 |
| agent-quality | 3 | 20 | 61-90 |
| agent-documenter | 4 | 8 | 91-100 |
| agent-ops | 4 | 5 | 91-100 |
| agent-director | All | - | 1-100 |

---

**Status:** Ready for execution  
**Next Action:** Agent director assigns specialists and kicks off Phase 1

_Master integration plan for AI SDK + AI Elements across ONE Platform_
