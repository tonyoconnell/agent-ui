---
title: Todo Acp Integration
dimension: things
primary_dimension: connections
category: todo-acp-integration.md
tags: agent, ai, cycle, protocol
related_dimensions: events, groups, people, connections, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-acp-integration.md category.
  Location: one/things/todo-acp-integration.md
  Purpose: Documents one platform: acp (agent communication protocol) integration v1.0.0
  Related dimensions: events, groups, people
  For AI agents: Read this to understand todo acp integration.
---

# ONE Platform: ACP (Agent Communication Protocol) Integration v1.0.0

**Focus:** Enable agents to discover, communicate, and collaborate via ACP standard
**Process:** `Cycle 1-100 cycle sequence`
**Timeline:** 8-12 cycles per specialist per day
**Target:** Foundation for multi-agent orchestration (Wave 2 - CRITICAL PATH EXTENSION)
**Spec:** https://agentcommunicationprotocol.dev/

---

## CRITICAL CONTEXT

ACP is the **lingua franca** for inter-agent communication. Integration enables:

1. **Agent Discovery:** Find agents by capability (image gen, text analysis, payment processing)
2. **Agent Communication:** Send sync/async messages between agents
3. **Task Delegation:** One agent assigns work to another (e.g., content creator agent → payment processor agent)
4. **Multi-Agent Workflows:** Chain agents together (user request → analysis agent → recommendation agent → checkout agent)
5. **Marketplace Effects:** Agents can offer services to other agents (monetized)

**This is how agents become an economy.**

---

## PHASE 1: FOUNDATION & SETUP (Cycle 1-10)

**Purpose:** Understand ACP, map to ONE ontology, plan integration

### Cycle 1: Understand ACP Protocol Deeply

- [ ] Read ACP spec: https://agentcommunicationprotocol.dev/
- [ ] Key concepts:
  - [ ] REST-based (not proprietary)
  - [ ] Framework agnostic (Python, TypeScript, Go, etc)
  - [ ] Multimodal (text, images, audio, video, binary)
  - [ ] Sync mode: Request → immediate response
  - [ ] Async mode: Task → callback when done
  - [ ] Streaming: Real-time data chunks
  - [ ] Discovery: Find agents by capability
- [ ] Core endpoints:
  - [ ] POST /agents/{id}/messages (send message)
  - [ ] GET /agents/{id}/messages (inbox)
  - [ ] POST /agents/{id}/tasks (assign task)
  - [ ] GET /agents/{id}/tasks/{tid} (status)
  - [ ] GET /agents/{id}/capabilities (what can it do?)
  - [ ] GET /agents (discover agents)

### Cycle 2: Map ACP to 6-Dimension Ontology

- [ ] **Groups:** Agent network (group of agents that can communicate)
- [ ] **People:** Agent metadata (provider, version, support contact)
- [ ] **Things:**
  - [ ] agent (new thing type with ACP endpoint)
  - [ ] acp_message (sent/received between agents)
  - [ ] acp_task (delegated work)
  - [ ] acp_capability (what agent can do)
  - [ ] acp_service_offering (agent offers service)
- [ ] **Connections:**
  - [ ] agent → agent: `communicates_via_acp`
  - [ ] agent → capability: `has_capability`
  - [ ] agent → service: `offers_service`
  - [ ] task → agent: `assigned_to`
  - [ ] message → agent: `routed_to`
- [ ] **Events:**
  - [ ] acp_message_sent
  - [ ] acp_message_received
  - [ ] acp_task_created
  - [ ] acp_task_started
  - [ ] acp_task_completed
  - [ ] acp_task_failed
  - [ ] agent_discovery_queried
  - [ ] agent_status_changed
- [ ] **Knowledge:**
  - [ ] agent_capability (labels: "image_generation", "payment_processing")
  - [ ] agent_embedding (for semantic capability search)
  - [ ] agent_performance (rating, reliability, speed)

### Cycle 3: Define ACP Integration Scope

- [ ] **MVP (this todo file):**
  - [ ] ACP server implementation in /web + /backend
  - [ ] Agent registry (discover agents)
  - [ ] Message routing (sync messages)
  - [ ] Task delegation (async work)
  - [ ] Basic capability matching
  - [ ] Integration with todo-buy-chatgpt (chat agent)
  - [ ] Integration with todo-agents (agent deployment)
- [ ] **Extensions (future):**
  - [ ] Streaming support (real-time responses)
  - [ ] Agent coalitions (temp groups of agents)
  - [ ] Payment settlement between agents
  - [ ] Reputation/rating system
  - [ ] Advanced scheduling (cron-like tasks)
  - [ ] Rollback/retry logic
  - [ ] Multi-agent conversation (3+ agents)

### Cycle 4: Identify Integration Points

- [ ] **Chat agent** (from todo-buy-chatgpt):
  - [ ] Can delegate recommendations to expert agents
  - [ ] Example: "Padel expert agent" → recommends products
  - [ ] Example: "Payment agent" → processes checkout
  - [ ] Example: "Analytics agent" → tracks metrics
- [ ] **Marketplace creators:**
  - [ ] Creator publishes "product description agent"
  - [ ] Other agents can call it for detailed info
  - [ ] Creator earns per API call
- [ ] **Workflow automation:**
  - [ ] N8N agent triggers multiple ONE agents
  - [ ] Example: "New product" → Content agent + Recommendation agent + Email agent
- [ ] **Multi-creator collaboration:**
  - [ ] Agent from creator A talks to agent from creator B
  - [ ] Share customer insights, co-create products
- [ ] **Payment processing:**
  - [ ] Any agent can request payment from chat via ACP
  - [ ] Payment agent settles transaction (X402)
  - [ ] Revenue flows to service provider (creator)

### Cycle 5: Define Agent Types on ONE Platform

- [ ] **System Agents** (built by ONE):
  - [ ] Chat advisor agent (conversational commerce)
  - [ ] Product search agent (semantic search)
  - [ ] Payment processor agent (X402 settlement)
  - [ ] Analytics agent (metrics + insights)
  - [ ] Email agent (transactional emails)
  - [ ] Image generation agent (DALL-E, Stable Diffusion)
  - [ ] Content moderation agent (safety checks)
- [ ] **Creator Agents** (built by marketplace creators):
  - [ ] Domain expert agents (padel racket advisor, yoga instructor, etc)
  - [ ] Content generation agents (write blog posts, product descriptions)
  - [ ] Sales agents (upsell, retention)
  - [ ] Support agents (customer service)
  - [ ] Data analysis agents (understand customer behavior)
- [ ] **External Agents** (from partner platforms):
  - [ ] ElizaOS agents
  - [ ] AutoGen agents
  - [ ] LangChain agents
  - [ ] n8n workflows
- [ ] **Hybrid Agents** (human + AI):
  - [ ] Human reviews AI recommendation before publishing
  - [ ] Human approves large transactions
  - [ ] Human escalation for complex issues

### Cycle 6: Plan Agent Registry

- [ ] Central registry of all agents:
  - [ ] Endpoint URL
  - [ ] Capabilities (what it can do)
  - [ ] Status (online, offline, busy)
  - [ ] Metadata (version, provider, pricing)
  - [ ] Performance metrics (uptime, avg response time, success rate)
  - [ ] Rating (user satisfaction)
  - [ ] Cost (if agent charges)
- [ ] Discovery methods:
  - [ ] Online: Query /agents?capability=image_generation
  - [ ] Offline: Agent registry stored in Convex (fallback)
  - [ ] Semantic: Find agents by meaning ("product advisor" ≈ "shopping expert")
- [ ] Registry features:
  - [ ] Auto-register on first message (or manual registration)
  - [ ] Health checks (ping agents every 5 minutes)
  - [ ] Auto-remove if offline > 1 hour
  - [ ] Rate limiting per agent (prevent abuse)
  - [ ] Reputation scoring (track success/failure)

### Cycle 7: Define Message Routing

- [ ] How messages get from Agent A → Agent B:
  1. Agent A sends POST to ONE /api/acp/agents/agent-b/messages
  2. ONE validates message (authentication, format)
  3. ONE logs message to events table
  4. ONE routes message to Agent B's endpoint
  5. Agent B processes and returns response
  6. ONE logs response
  7. ONE returns to Agent A
- [ ] Capabilities:
  - [ ] Sync (immediate response)
  - [ ] Async (callback URL)
  - [ ] Streaming (chunks over time)
  - [ ] Broadcast (to multiple agents)
- [ ] Reliability:
  - [ ] Retry logic (3 attempts with exponential backoff)
  - [ ] Timeout handling (default 30s)
  - [ ] Dead letter queue (failed messages stored)
  - [ ] Message idempotency (same message twice = same result)

### Cycle 8: Plan Task Delegation

- [ ] Task = async work assigned to agent
- [ ] Lifecycle:
  1. Agent A creates task: POST /agents/agent-b/tasks
  2. Agent B accepts immediately (returns taskId)
  3. Agent B works on task in background
  4. Agent B completes task
  5. Agent B calls callback URL (Agent A is notified)
  6. Agent A retrieves result: GET /agents/agent-b/tasks/{taskId}
- [ ] Task properties:
  - [ ] Type: What kind of work? (e.g., "analyze_dataset")
  - [ ] Parameters: Input data
  - [ ] Priority: Low, medium, high, critical
  - [ ] Timeout: Max time to complete
  - [ ] Callback: Where to send result
  - [ ] Streaming: Send chunks in real-time?
- [ ] Execution:
  - [ ] Queue system (process tasks in order)
  - [ ] Monitoring (track progress)
  - [ ] Timeout enforcement (kill if exceeds deadline)
  - [ ] Error handling (retry or fail gracefully)

### Cycle 9: Define Security & Authentication

- [ ] Authentication:
  - [ ] API keys (simple: one per agent)
  - [ ] JWT tokens (scalable: signed tokens)
  - [ ] OAuth2 (enterprise: federated identity)
  - [ ] mTLS (advanced: mutual certificate verification)
- [ ] Authorization:
  - [ ] Which agents can talk to which agents?
  - [ ] Default: All agents can talk (open network)
  - [ ] Optional: Allow-lists for private networks
  - [ ] Role-based: System agents vs creator agents
- [ ] Privacy:
  - [ ] End-to-end encryption (TLS)
  - [ ] Message logging (who said what, when)
  - [ ] Data retention (archive old messages)
  - [ ] PII handling (don't log customer data)
- [ ] Abuse prevention:
  - [ ] Rate limiting (max messages per minute)
  - [ ] Spam detection (identical messages flagged)
  - [ ] Timeout enforcement (prevent infinite loops)
  - [ ] Resource limits (max message size, task timeout)

### Cycle 10: Define Success Metrics

- [ ] ACP integration complete when:
  - [ ] [ ] ACP server endpoint live (/api/acp/\*)
  - [ ] [ ] Agent can register + discovery works
  - [ ] [ ] Message routing functional (sync + async)
  - [ ] [ ] Task delegation working
  - [ ] [ ] Agent registry searchable
  - [ ] [ ] First 5 agents successfully communicating
  - [ ] [ ] Chat agent delegates to expert agents
  - [ ] [ ] Payment flows between agents
  - [ ] [ ] Full audit trail (all ACP events logged)
  - [ ] [ ] 99.9% message delivery rate
  - [ ] [ ] < 500ms average message latency
  - [ ] [ ] Dashboard shows agent health + metrics

---

## PHASE 2: BACKEND SCHEMA & SERVICES (Cycle 11-20)

**Purpose:** Extend Convex schema for ACP agents + messages

### Cycle 11: Create Agent Thing Type

- [ ] New thing type: `agent`

  ```typescript
  {
    type: 'agent',
    properties: {
      // Identification
      agentId: string,  // Unique: "chat-advisor", "payment-processor"
      name: string,  // "Chat Advisor"
      description: string,  // What this agent does
      provider: string,  // "ONE", "ElizaOS", "LangChain"
      version: string,  // "1.0.0"

      // ACP Endpoint
      endpoint: string,  // https://agents.one.ie/chat-advisor
      acpVersion: string,  // "1.0.0"
      supportedMimeTypes: string[],  // ["text/plain", "image/*"]

      // Capabilities
      capabilities: string[],  // ["product_search", "recommendation", "payment"]
      capabilityDescriptions: Record<string, string>,  // Detailed descriptions

      // Status
      status: 'online' | 'offline' | 'busy' | 'maintenance',
      lastSeen: number,  // Timestamp
      uptime: number,  // Percentage 0-100
      isHealthy: boolean,  // Passes health check?

      // Performance
      averageResponseTime: number,  // Milliseconds
      successRate: number,  // 0-100%
      failureCount: number,
      totalRequests: number,

      // Configuration
      maxConcurrentTasks: number,  // How many tasks at once?
      timeout: number,  // Default timeout (milliseconds)
      retryPolicy: {
        maxRetries: number,
        backoffMultiplier: number,
      },

      // Pricing (if agent charges)
      pricing: {
        enabled: boolean,
        model: 'per_request' | 'per_minute' | 'subscription',
        rate: number,  // Cost per unit
        currency: string,  // "USD"
      },

      // Ratings
      rating: number,  // 1-5 stars
      reviewCount: number,
      trustScore: number,  // 0-100, based on reliability

      // Metadata
      owner: Id<'things'>,  // Creator who built this agent
      tags: string[],  // ["domain:padel", "type:advisor"]
      createdAt: number,
      updatedAt: number,
    }
  }
  ```

### Cycle 12: Create ACP Message Thing Type

- [ ] New thing type: `acp_message`

  ```typescript
  {
    type: 'acp_message',
    properties: {
      // Message ID
      messageId: string,  // UUID
      correlationId: string,  // For related messages

      // Routing
      from: Id<'things'>,  // Sender agent
      to: Id<'things'>,  // Recipient agent
      conversationId: string,  // Group related messages

      // Content
      messageType: string,  // "query", "response", "notification"
      content: any,  // Actual message payload
      mimeType: string,  // "text/plain", "image/png"

      // Mode
      mode: 'sync' | 'async',  // Sync: wait for response. Async: callback
      callbackUrl: string,  // If async, where to send response

      // Status
      status: 'sent' | 'delivered' | 'processing' | 'completed' | 'failed',
      error: {
        code: string,
        message: string,
      },

      // Metadata
      priority: 'low' | 'medium' | 'high' | 'critical',
      timeout: number,  // Milliseconds
      retries: number,  // How many retries so far?
      createdAt: number,
      sentAt: number,
      deliveredAt: number,
      completedAt: number,

      // Tracking
      duration: number,  // Total time (ms)
      responseTime: number,  // Agent processing time (ms)
      cost: number,  // If agent charges
    }
  }
  ```

### Cycle 13: Create ACP Task Thing Type

- [ ] New thing type: `acp_task`

  ```typescript
  {
    type: 'acp_task',
    properties: {
      // Task ID
      taskId: string,  // UUID
      correlationId: string,  // Related messages/tasks

      // Assignment
      from: Id<'things'>,  // Agent requesting task
      to: Id<'things'>,  // Agent assigned to task
      creatorId: Id<'things'>,  // Original creator (if delegated multiple times)

      // Task Definition
      taskType: string,  // "analyze_data", "generate_content"
      parameters: any,  // Input data
      description: string,  // Human-readable description

      // Execution
      status: 'pending' | 'accepted' | 'processing' | 'completed' | 'failed' | 'cancelled',
      priority: 'low' | 'medium' | 'high' | 'critical',
      timeout: number,  // Max execution time (ms)
      estimatedCompletion: number,  // Expected time to finish
      actualCompletion: number,  // When it actually finished

      // Result
      result: any,  // Output data
      resultMimeType: string,
      error: {
        code: string,
        message: string,
        retryable: boolean,
      },

      // Streaming
      streaming: boolean,  // Send chunks in real-time?
      streamEndpoint: string,  // Where to send chunks
      chunks: [{
        position: number,
        content: any,
        timestamp: number,
      }],

      // Callback
      callbackUrl: string,  // Where to notify when done
      callbackStatus: 'pending' | 'sent' | 'delivered' | 'failed',

      // Tracking
      createdAt: number,
      startedAt: number,
      completedAt: number,
      duration: number,  // Total time (ms)
      cost: number,  // If agent charges
      metrics: {
        progress: number,  // 0-100%
        itemsProcessed: number,
        itemsFailed: number,
      }
    }
  }
  ```

### Cycle 14: Create Agent Capability Relationship

- [ ] New connection type: `has_capability`
  - [ ] Agent → Capability
  - [ ] Metadata:
    - [ ] reliability (how often works?)
    - [ ] averageExecutionTime
    - [ ] costPerUse
    - [ ] successRate
- [ ] New connection type: `communicates_via_acp`
  - [ ] Agent → Agent (when they've communicated)
  - [ ] Metadata:
    - [ ] lastCommunication
    - [ ] totalMessages
    - [ ] successRate

### Cycle 15: Create ACP Service (Effect.ts)

- [ ] Service: `backend/convex/services/acp.ts`
- [ ] Methods:
  - [ ] `registerAgent(agentId, endpoint, capabilities)` → registered
  - [ ] `sendMessage(from, to, message, mode)` → messageId
  - [ ] `createTask(from, to, task, callback)` → taskId
  - [ ] `getTaskStatus(taskId)` → status + result
  - [ ] `discoverAgents(capability)` → agents[]
  - [ ] `getAgentCapabilities(agentId)` → capabilities
  - [ ] `routeMessage(messageId)` → forwarded to agent
  - [ ] `handleTaskCallback(taskId, result)` → stored
  - [ ] `healthCheckAgents()` → mark online/offline
  - [ ] `logACPEvent(type, data)` → event recorded

### Cycle 16: Implement Message Routing

- [ ] Algorithm:
  1. Receive message for Agent B
  2. Validate sender (Agent A authenticated?)
  3. Validate recipient (Agent B exists + online?)
  4. Store message in Convex
  5. Log outbound event
  6. Call Agent B's endpoint (POST /agents/agent-b/messages)
  7. Agent B responds
  8. Log delivered event
  9. If async: Store callback URL, return immediately
  10. If sync: Return response to Agent A
- [ ] Error handling:
  - [ ] Agent offline → Queue message, retry later
  - [ ] Network error → Retry with backoff
  - [ ] Timeout → Return error to sender
  - [ ] Invalid format → Reject with error

### Cycle 17: Implement Agent Discovery

- [ ] Endpoints:
  - [ ] `GET /api/acp/agents` - List all agents
  - [ ] `GET /api/acp/agents?capability=image_generation` - Filter by capability
  - [ ] `GET /api/acp/agents?status=online` - Filter by status
  - [ ] `GET /api/acp/agents/search?q=recommendation` - Full-text search
- [ ] Discovery algorithm:
  1. Query agents table with filters
  2. Filter by capability (exact match)
  3. Filter by status (only online unless specified)
  4. Sort by rating (highest first)
  5. Paginate results (20 per page)
  6. Return with metadata
- [ ] Caching:
  - [ ] Cache agent list (1 minute)
  - [ ] Invalidate on agent registration/deletion
  - [ ] Use Redis for speed

### Cycle 18: Implement Task Queue

- [ ] Queue system for async tasks:
  - [ ] Tasks table ordered by priority + created time
  - [ ] Worker process pulls tasks from queue
  - [ ] Executes task on assigned agent
  - [ ] Waits for completion or timeout
  - [ ] Sends callback to requester
  - [ ] Updates task status
- [ ] Scalability:
  - [ ] Multiple workers (one per CPU core)
  - [ ] Distributed queue (if needed later)
  - [ ] Dead letter queue (failed tasks)
- [ ] Monitoring:
  - [ ] Queue depth (how many waiting?)
  - [ ] Processing rate (tasks per minute)
  - [ ] Average latency

### Cycle 19: Implement Health Checks

- [ ] Background job (every 5 minutes):
  - [ ] Ping all registered agents
  - [ ] POST /agents/{id}/capabilities (lightweight)
  - [ ] Mark online if responds in < 5 seconds
  - [ ] Mark offline if no response
  - [ ] Update last_seen timestamp
  - [ ] Decrease uptime score if offline
  - [ ] Remove if offline > 1 hour
- [ ] Health check strategy:
  - [ ] Lightweight ping (fast)
  - [ ] Exponential backoff (don't spam offline agents)
  - [ ] Parallel pings (don't block on one agent)

### Cycle 20: Create Convex Queries for ACP

- [ ] `queries/acp.ts`:
  - [ ] `getAgent(agentId)` → agent details
  - [ ] `getAgentsByCapability(capability)` → agents[]
  - [ ] `searchAgents(query)` → semantic search
  - [ ] `getAgentMessages(agentId)` → inbox
  - [ ] `getTaskStatus(taskId)` → status + result
  - [ ] `getConversation(correlationId)` → all related messages
  - [ ] `getAgentMetrics(agentId)` → performance stats
  - [ ] `getSystemMetrics()` → overall health

---

## PHASE 3-10: CONTINUATION

[Abbreviated for full plan - structure follows standard 10-phase model]

### Summary of Remaining Phases:

**Phase 3 (Cycle 21-30):** Frontend dashboard + admin UI

- Agent registry browser
- Message/task monitoring
- Agent health dashboard
- Test console (send messages manually)

**Phase 4 (Cycle 31-40):** API routes + middleware

- `/api/acp/agents` - REST endpoints
- `/api/acp/messages` - Message routing
- `/api/acp/tasks` - Task delegation
- Authentication + rate limiting

**Phase 5 (Cycle 41-50):** Integration points

- Chat agent ↔ Expert agents
- Payment agent ↔ Checkout system
- Content agents ↔ Product descriptions
- Analytics agent ↔ Dashboard

**Phase 6 (Cycle 51-60):** Testing

- Unit tests (message routing, discovery)
- Integration tests (multi-agent workflows)
- E2E tests (chat → expert → payment)
- Load tests (1000 concurrent agents)

**Phase 7 (Cycle 61-70):** Design + UX

- Agent registry UI (search, filter, details)
- Message monitoring dashboard
- Task execution tracker
- Performance metrics charts

**Phase 8 (Cycle 71-80):** Performance

- Message batching
- Agent caching
- Connection pooling
- Database query optimization

**Phase 9 (Cycle 81-90):** Deployment

- Deploy ACP server
- Load testing
- Monitoring + alerts
- Documentation

**Phase 10 (Cycle 91-100):** Knowledge capture

- Lessons learned
- Common patterns
- Best practices guide
- Roadmap for v2

---

## KEY INTEGRATION POINTS

### 1. Chat Agent (from todo-buy-chatgpt)

```
User: "What padel racket should I buy?"
   ↓
Chat Agent (Claude)
   ↓
[Async message via ACP]
   ↓
Padel Expert Agent (Creator-built)
   ↓
Returns: "Based on your needs, try X racket"
   ↓
Chat Agent
   ↓
User sees recommendation
```

### 2. Payment Settlement

```
Creator Agent needs to charge customer
   ↓
[ACP task to Payment Processor Agent]
   ↓
Payment Agent calls X402 checkout
   ↓
Returns: Payment receipt + settlement info
   ↓
Creator Agent completes transaction
```

### 3. Multi-Creator Collaboration

```
Creator A's Agent (Product Catalog)
   ↓
[Request to Creator B's Agent (Bundling)]
   ↓
Creator B's Agent bundles products
   ↓
Returns: Bundle pricing + shipping
   ↓
Creator A's Agent shows customer
   ↓
Shared revenue split
```

### 4. Content Generation

```
Creator needs product descriptions
   ↓
[Task to Content Generation Agent]
   ↓
Agent generates via LLM
   ↓
Returns: 10 product descriptions
   ↓
Creator reviews + publishes
   ↓
Creator pays per task
```

---

## SUCCESS CRITERIA

ACP integration complete when:

- ✅ ACP server endpoint live (/api/acp/\*)
- ✅ Agent registration working
- ✅ Agent discovery functional
- ✅ Sync message routing < 500ms
- ✅ Async task delegation working
- ✅ Health checks running (all agents tracked)
- ✅ 5+ agents successfully communicating
- ✅ Chat agent delegates to expert agents
- ✅ Payment flows between agents
- ✅ Creator can build + publish custom agents
- ✅ Full audit trail of all ACP events
- ✅ Dashboard shows agent network health
- ✅ 99.9% message delivery rate
- ✅ < 100ms message latency (p95)
- ✅ Handles 1000+ concurrent agents
- ✅ Complete documentation + examples

---

## STRATEGIC IMPORTANCE

ACP integration is the **unlocking mechanism** for:

1. **Agent Economy:** Agents can hire other agents (create marketplaces)
2. **Creator Revenue:** Create + sell agents as services
3. **Platform Effects:** More agents = more valuable network
4. **Automation:** Complex workflows via agent chains
5. **Interoperability:** ANY framework agent can join ONE network

**This is not just a feature. This is the foundation of a multi-agent economy.**

---

**Status:** Wave 2 Extension - CRITICAL (enable todo-agents, todo-skills, todo-sell)
**Timeline:** Can start in parallel with Wave 1 (low dependency on onboarding)
**Priority:** MAXIMUM (enables all subsequent features)
**Revenue Impact:** HIGH (agent marketplaces, creator monetization, API fees)
