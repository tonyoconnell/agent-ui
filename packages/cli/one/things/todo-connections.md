---
title: Todo Connections
dimension: things
primary_dimension: connections
category: todo-connections.md
tags: ai, connections, ontology, protocol, relationships
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-connections.md category.
  Location: one/things/todo-connections.md
  Purpose: Documents connections content collection & protocol documentation
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand todo connections.
---

# Connections Content Collection & Protocol Documentation

## Overview

The **Connections content collection** organizes documentation and specifications for the six core protocols that enable universal AI interoperability. Instead of scattered protocol specs, connections are structured as a unified content collection that maps each protocol to the **6-dimension ontology**.

**Location:** `web/src/content/connections/`

## Schema Structure

```typescript
ConnectionSchema {
  title: string                           // Protocol name
  description: string                     // Brief description
  protocol: string                        // Protocol ID (acp, mcp, a2a, ap2, x402, agui)
  category: string                        // Protocol category (communication, context, coordination, payments, interface)
  organization?: string                   // Organization behind protocol
  personRole?: enum                       // User's role
  ontologyDimensions?: string[]          // Mapped to 6-dimension ontology
  assignedSpecialist?: string            // Agent/specialist assigned

  // Protocol specification
  specification?: {
    version: string                      // Protocol version
    status: "draft" | "active" | "stable" | "deprecated"
    standards?: string[]                 // Standards (RFC, Linux Foundation, etc)
  }

  // Ontology mapping
  ontologyMapping?: {
    groups?: string                      // How groups are handled
    people?: string                      // Authorization model
    things?: string                      // Entity types
    connections?: string                 // Relationship types
    events?: string                      // Event types
    knowledge?: string                   // Knowledge/RAG aspects
  }

  // Use cases
  useCases?: {
    title: string
    description: string
    protocols?: string[]                 // Protocols used in this use case
  }[]

  // Code examples
  examples?: {
    title: string
    language: string
    code: string
  }[]

  // Features
  features?: {
    name: string
    description: string
  }[]

  // Standards & organizations
  standards?: string[]
  organizations?: string[]

  // Integration
  integrationLevel?: "basic" | "advanced" | "enterprise"
  prerequisites?: string[]

  // Timestamps
  createdAt?: date
  updatedAt?: date
  draft?: boolean
}
```

## The Six Core Protocols

### 1. **ACP - Agent Communication Protocol**

- **Category:** Communication
- **Purpose:** REST-based protocol for AI agent communication
- **Features:** Multimodal, Async-First, Message Delegation
- **Standards:** Linux Foundation
- **Use Cases:** Inter-agent messaging, task delegation, workflow coordination
- **Ontology Mapping:** Events (communication_event), Things (agents)

### 2. **MCP - Model Context Protocol**

- **Category:** Context
- **Purpose:** Universal connectivity for AI systems
- **Features:** RAG-Ready, Vector Search, Semantic Access
- **Standards:** Anthropic
- **Use Cases:** Resource access, semantic search, knowledge retrieval
- **Ontology Mapping:** Knowledge (embeddings, vectors), Things (resources)

### 3. **A2A - Agent-to-Agent Protocol**

- **Category:** Coordination
- **Purpose:** Universal language for AI agent collaboration
- **Features:** Framework-agnostic, Multi-agent coordination, Task tracking
- **Standards:** Google, Linux Foundation
- **Use Cases:** Multi-agent workflows, task delegation, state synchronization
- **Ontology Mapping:** Connections (delegated_to), Events (task_events)

### 4. **AP2 - Agent Payments Protocol**

- **Category:** Payments
- **Purpose:** Secure agent-led payments with cryptographic trust
- **Features:** Verifiable credentials, Autonomous transactions, Multi-platform
- **Standards:** Google + 60 Organizations
- **Use Cases:** Agent-executed payments, intent mandates, payment authorization
- **Ontology Mapping:** Things (intent_mandate), Events (payment_event), Knowledge (credentials)

### 5. **X402 - HTTP-Native Payments**

- **Category:** Payments (Micropayments)
- **Purpose:** Instant digital payments via HTTP 402
- **Features:** Zero fees, ~2 second settlement, Blockchain-agnostic
- **Standards:** Coinbase, Multi-Chain
- **Use Cases:** Pay-per-API-call, pay-per-GB, micropayments ($0.001+)
- **Ontology Mapping:** Events (payment_verified), Things (payment_ledger)

### 6. **AG-UI - Agent-Generated UI**

- **Category:** Interface
- **Purpose:** Dynamic interfaces from structured JSON
- **Features:** Type-Safe, Real-Time, Composable
- **Standards:** ONE Platform
- **Use Cases:** Agent-rendered dashboards, interactive tables, forms, charts
- **Ontology Mapping:** Things (message, ui_component), Knowledge (component_specs)

## Usage

### Creating a New Protocol Document

1. **Create markdown file** in `web/src/content/connections/`

```markdown
---
title: "Protocol Name"
description: "Brief description"
protocol: "protocol-id"
category: "communication|context|coordination|payments|interface"
organization: "Org Name"
personRole: "platform_owner"
ontologyDimensions: ["Things", "Events", "Knowledge"]
assignedSpecialist: "Agent Name"
createdAt: 2025-10-30
draft: false
---

# Protocol Documentation

Content here...
```

2. **Specify ontology mapping:**

```yaml
ontologyMapping:
  groups: "How this protocol relates to group isolation"
  people: "Authorization and role-based access"
  things: "Entity types involved"
  connections: "Relationship types tracked"
  events: "Event types logged"
  knowledge: "Knowledge/embedding aspects"
```

3. **Add use cases:**

```yaml
useCases:
  - title: "Use Case Title"
    description: "Description of the use case"
    protocols: ["protocol-id-1", "protocol-id-2"]
```

4. **Include code examples:**

```yaml
examples:
  - title: "Example Title"
    language: "typescript|python|javascript"
    code: |
      // Your code here
```

### Viewing Protocols

Connections are available in the web application:

- **Collection:** `/connections` - List all protocols
- **Individual:** `/connections/[slug]` - View specific protocol
- **Landing:** `/connections-landing` - Protocol overview and benefits

### Integration with Ontology

Each protocol maps to the 6-dimension ontology:

| Dimension       | Protocol Mapping                                         |
| --------------- | -------------------------------------------------------- |
| **Groups**      | Data isolation per group (all protocols inherit)         |
| **People**      | Role-based access control per protocol                   |
| **Things**      | Entity types: agents, mandates, resources, UI components |
| **Connections** | Relationships: delegated_to, transacted, communicated    |
| **Events**      | Protocol-specific events with metadata.protocol          |
| **Knowledge**   | Embeddings, vectors, semantic search across protocols    |

## Key Features

✅ **Protocol Specifications** - Full specification for each protocol
✅ **Ontology Mapping** - How each protocol maps to 6 dimensions
✅ **Use Cases** - Real-world scenarios showing protocol combinations
✅ **Code Examples** - TypeScript, Python, JavaScript examples
✅ **Standards & Organizations** - Who maintains each protocol
✅ **Integration Level** - Beginner to Enterprise complexity
✅ **Cross-Protocol Workflows** - How protocols work together

## Multi-Protocol Workflows

Protocols are most powerful when combined:

### Example: Multi-Agent E-Commerce Pipeline

1. **MCP** - Agent discovers products via semantic search
2. **ACP** - Queries multiple merchants in parallel
3. **A2A** - Coordinates flight, hotel, car rental agents
4. **AG-UI** - Displays booking options as interactive cards
5. **AP2** - User approves payment with verifiable credential
6. **X402** - Micropayments for each booking API call

Result: Six protocols orchestrated through one ontology. Zero schema changes.

## Benefits

| Aspect          | Traditional                         | ONE Platform                 |
| --------------- | ----------------------------------- | ---------------------------- |
| **Protocols**   | Separate tables & APIs per protocol | Same 6 tables for all        |
| **Integration** | 6x cost and complexity              | Zero integration cost        |
| **Maintenance** | Schema changes per protocol         | Metadata-based configuration |
| **Scalability** | Vendor lock-in                      | Open standards               |
| **Type Safety** | Protocol-specific types             | Unified ontology types       |

## Related Files

- **Schema:** `web/src/content/config.ts` - ConnectionSchema definition
- **Pages:** `web/src/pages/connections/` - Collection pages and routes
- **Protocol Specs:** `one/connections/` - Full protocol documentation
- **Ontology:** `one/knowledge/ontology.md` - 6-dimension reference
- **Landing:** `web/src/pages/connections-landing.astro` - Protocol overview

## Future Enhancements

- [ ] Real-time protocol version tracking
- [ ] Protocol compatibility matrix
- [ ] SDK generation from protocol specs
- [ ] Protocol testnet environments
- [ ] Performance benchmarks per protocol
- [ ] Migration guides between protocols
- [ ] Community protocol proposals
- [ ] Integration with GitHub releases
