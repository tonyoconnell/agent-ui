---
title: ONE Protocol Standard Specification
version: 1.0.0
status: Draft
date: 2025-11-25
authors: ONE Protocol Foundation
license: CC BY-SA 4.0
---

# ONE Protocol Standard Specification v1.0

**The Universal Protocol Layer for the Internet**

---

## Abstract

ONE Protocol is an open standard for protocol-agnostic application architecture. It defines a universal data model and registry pattern that enables applications to integrate with infinite protocols without code changes. This specification defines the core ontology, protocol registry mechanism, and interoperability patterns that make ONE Protocol the universal protocol layer for the internet.

**Key Innovation:** Protocols are data, not code.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Core Concepts](#2-core-concepts)
3. [The ONE Ontology](#3-the-one-ontology)
4. [Protocol Registry](#4-protocol-registry)
5. [Data Structures](#5-data-structures)
6. [Protocol Integration](#6-protocol-integration)
7. [Interoperability Patterns](#7-interoperability-patterns)
8. [Security & Compliance](#8-security--compliance)
9. [Implementation Guidelines](#9-implementation-guidelines)
10. [Conformance](#10-conformance)

---

## 1. Introduction

### 1.1 Purpose

ONE Protocol standardizes how applications integrate with multiple protocols (payment systems, blockchains, messaging platforms, storage providers, identity systems, etc.) by treating protocols as data rather than hardcoded integrations.

### 1.2 Goals

- **Protocol Agnosticism:** Applications work with any protocol without code changes
- **Infinite Extensibility:** Support unlimited protocols via registry pattern
- **Interoperability:** Enable cross-protocol workflows and translations
- **Future-Proof:** Work with protocols that don't exist yet

### 1.3 Non-Goals

- Replace existing protocols (ONE Protocol orchestrates, doesn't compete)
- Define protocol-specific implementations (protocols self-describe)
- Mandate specific database technology (implementation-agnostic)

### 1.4 Terminology

- **Protocol:** Any system with a defined interface (e.g., Stripe, Solana, SMTP)
- **Protocol Definition:** Metadata describing a protocol's schema and requirements
- **Protocol Registry:** Database of protocol definitions
- **Protocol Handler:** Implementation that processes protocol-specific logic
- **Ontology:** The 6-dimensional data model (Groups, People, Things, Connections, Events, Knowledge)

---

## 2. Core Concepts

### 2.1 Protocols as Data

**Traditional Approach:**
```typescript
// Hardcoded protocol logic
if (protocol === 'stripe') {
  // Stripe-specific code
} else if (protocol === 'solana') {
  // Solana-specific code
}
```

**ONE Protocol Approach:**
```typescript
// Protocol-agnostic logic
const protocolDef = await registry.get(metadata.protocol);
const handler = getHandler(protocolDef);
return handler.process(metadata);
```

### 2.2 The Universal Data Model

ONE Protocol defines 6 core dimensions that model all digital interactions:

1. **Groups** - Isolation boundaries (multi-tenancy)
2. **People** - Authorization & governance
3. **Things** - Entities (users, products, content, tokens, etc.)
4. **Connections** - Relationships between things
5. **Events** - Actions that happened
6. **Knowledge** - Searchable content (RAG)

**Key Principle:** These 6 dimensions never change. Protocol-specific details live in `metadata`.

### 2.3 Protocol Registry Pattern

Protocols self-register with schema definitions:

```typescript
{
  name: "solana_pay",
  version: "1.0",
  category: "payment",
  schema: {
    required: ["signature", "slot"],
    optional: ["memo"],
    types: {
      signature: "string",
      slot: "number",
      memo: "string"
    }
  },
  examples: [
    { signature: "5J7kMQ...", slot: 123456789 }
  ]
}
```

---

## 3. The ONE Ontology

### 3.1 Groups

**Purpose:** Multi-tenant isolation and hierarchical organization.

**Structure:**
```typescript
interface Group {
  _id: Id<'groups'>;
  slug: string;              // URL identifier
  name: string;              // Display name
  type: 'friend_circle' | 'business' | 'community' | 'dao' | 'government' | 'organization';
  parentGroupId?: Id<'groups'>;  // Hierarchical nesting
  settings: {
    visibility: 'public' | 'private';
    joinPolicy: 'open' | 'invite_only' | 'approval_required';
  };
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}
```

**Rules:**
- Every entity MUST belong to a group (multi-tenant isolation)
- Groups MAY be nested up to 5 levels deep
- System-level entities belong to reserved "system" group

### 3.2 People

**Purpose:** Authorization, governance, and AI agent identity.

**Structure:**
```typescript
interface Person {
  _id: Id<'people'>;
  groupId: Id<'groups'>;
  email?: string;
  role: 'platform_owner' | 'group_owner' | 'group_user' | 'customer';
  permissions: string[];     // Granular permissions
  status: 'active' | 'suspended' | 'deleted';
  createdAt: number;
  updatedAt: number;
}
```

**Rules:**
- Every action MUST have an actor (person or AI agent)
- Roles define authorization scope
- AI agents are people with `type: 'ai_agent'`

### 3.3 Things

**Purpose:** Universal entity representation.

**Structure:**
```typescript
interface Thing {
  _id: Id<'things'>;
  type: ThingType;           // 66 consolidated types
  name: string;
  groupId: Id<'groups'>;     // Multi-tenant isolation
  properties: Record<string, any>;  // Type-specific data (flexible)
  status: 'active' | 'inactive' | 'draft' | 'published' | 'archived';
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;        // Soft delete
}
```

**Thing Types (66 total):**
- Core: `creator`, `ai_clone`, `audience_member`, `organization`
- Business Agents: `strategy_agent`, `marketing_agent`, `sales_agent`, etc. (10 types)
- Content: `blog_post`, `video`, `podcast`, `course`, etc. (7 types)
- Products: `digital_product`, `membership`, `consultation`, `nft` (4 types)
- Community: `community`, `conversation`, `message` (3 types)
- Tokens: `token`, `token_contract` (2 types)
- Knowledge: `knowledge_base`, `document` (2 types)
- Commerce: `product`, `order`, `cart`, `invoice`, `payment_method` (5 types)
- Protocols: `mandate`, `webhook`, `api_key` (3 types)
- Infrastructure: `website`, `page`, `form`, `email_template`, etc. (10 types)
- Analytics: `metric`, `insight`, `report`, `dashboard` (4 types)
- Automation: `workflow`, `trigger`, `action` (3 types)
- Media: `image`, `audio`, `file` (3 types)
- Identity: `credential`, `session`, `oauth_token` (3 types)
- Blockchain: `wallet`, `smart_contract`, `transaction` (3 types)

**Rules:**
- `properties` field is flexible (no schema migrations)
- `properties` MUST be validated at application boundary
- Protocol-specific data goes in `metadata` for connections/events

### 3.4 Connections

**Purpose:** Relationships between things.

**Structure:**
```typescript
interface Connection {
  _id: Id<'connections'>;
  fromThingId: Id<'things'>;
  toThingId: Id<'things'>;
  relationshipType: ConnectionType;  // 25 consolidated types
  metadata?: Record<string, any>;    // Protocol-specific data
  strength?: number;                 // 0.0 to 1.0
  validFrom?: number;
  validTo?: number;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
}
```

**Connection Types (25 total):**
- Ownership: `owns`, `created_by`
- AI: `clone_of`, `trained_on`, `powers`
- Content: `authored`, `generated_by`, `published_to`, `part_of`, `references`
- Community: `member_of`, `following`, `moderates`, `participated_in`
- Business: `manages`, `reports_to`, `collaborates_with`
- Tokens: `holds_tokens`, `staked_in`, `earned_from`
- Products: `purchased`, `enrolled_in`, `completed`, `teaching`
- Consolidated (use metadata): `transacted`, `notified`, `referred`, `communicated`, `delegated`, `approved`, `fulfilled`

**Rules:**
- Consolidated types MUST include `metadata.protocol`
- `metadata` MUST be validated against protocol definition
- Soft deletes preserve audit trail

### 3.5 Events

**Purpose:** Immutable audit log of all actions.

**Structure:**
```typescript
interface Event {
  _id: Id<'events'>;
  type: EventType;           // 52 consolidated types
  actorId: Id<'things'>;     // Who/what caused this
  targetId?: Id<'things'>;   // Optional target
  groupId: Id<'groups'>;     // Multi-tenant isolation
  timestamp: number;
  metadata: Record<string, any>;  // Event-specific data
}
```

**Event Types (52 total):**
- Lifecycle: `thing_created`, `thing_updated`, `thing_deleted`
- User: `user_registered`, `user_verified`, `user_login`, `user_logout`, `profile_updated`
- Auth: `password_reset_requested`, `email_verified`, `two_factor_enabled`, etc.
- Group: `user_invited_to_group`, `user_joined_group`, `user_removed_from_group`
- Dashboard: `dashboard_viewed`, `settings_updated`, `theme_changed`
- AI: `voice_cloned`, `appearance_cloned`
- Agent: `agent_executed`, `agent_completed`, `agent_failed`
- Token: `token_minted`, `token_burned`, `tokens_purchased`, `tokens_staked`, etc.
- Course: `course_enrolled`, `lesson_completed`, `course_completed`, `certificate_earned`
- Analytics: `metric_calculated`, `insight_generated`, `prediction_made`
- Cycle: `cycle_request`, `cycle_completed`, `cycle_revenue_collected`
- Blockchain: `nft_minted`, `nft_transferred`, `contract_deployed`
- Consolidated: `content_event`, `payment_event`, `subscription_event`, `commerce_event`, `livestream_event`, `notification_event`, `referral_event`, `communication_event`, `task_event`, `mandate_event`, `price_event`

**Rules:**
- Events are immutable (never updated or deleted)
- Retention policies define lifecycle
- Consolidated types MUST include `metadata.protocol`

### 3.6 Knowledge

**Purpose:** RAG (Retrieval-Augmented Generation) for semantic search.

**Structure:**
```typescript
interface Knowledge {
  _id: Id<'knowledge'>;
  knowledgeType: 'label' | 'document' | 'chunk' | 'vector_only';
  text?: string;
  embedding?: number[];      // Vector for semantic search
  embeddingModel?: string;   // e.g., "text-embedding-3-large"
  embeddingDim?: number;
  sourceThingId?: Id<'things'>;
  sourceField?: string;      // e.g., "content", "transcript"
  chunk?: {
    index: number;
    tokenCount: number;
    start?: number;
    end?: number;
  };
  labels?: string[];         // Free-form categorization
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
```

**Rules:**
- Only embed content users will semantically search
- Don't embed structured data (use filters instead)
- Update embeddings when source content changes

---

## 4. Protocol Registry

### 4.1 Protocol Definition Structure

```typescript
interface ProtocolDefinition {
  _id: Id<'protocol_definitions'>;
  name: string;              // Unique protocol identifier
  version: string;           // Semantic versioning
  category: 'payment' | 'messaging' | 'commerce' | 'identity' | 'storage' | 'blockchain' | 'other';
  schema: {
    required: string[];      // Required metadata fields
    optional: string[];      // Optional metadata fields
    types: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>;
  };
  examples: any[];           // Valid metadata examples
  documentation?: string;    // Link to protocol spec
  publisher?: string;        // Who published this protocol
  compliance?: {             // Regulatory compliance
    pci_dss?: boolean;
    gdpr?: boolean;
    kyc?: boolean;
    regions?: string[];
  };
  status: 'active' | 'deprecated' | 'experimental';
  createdAt: number;
  updatedAt: number;
}
```

### 4.2 Protocol Registration

**Process:**
1. Developer submits protocol definition
2. Platform owner reviews and approves
3. Protocol becomes available immediately
4. No code deployment required

**Example:**
```typescript
await registerProtocol({
  name: 'solana_pay',
  version: '1.0',
  category: 'payment',
  schema: {
    required: ['signature', 'slot'],
    optional: ['memo', 'reference'],
    types: {
      signature: 'string',
      slot: 'number',
      memo: 'string',
      reference: 'string'
    }
  },
  examples: [
    { signature: '5J7kMQ...', slot: 123456789, memo: 'Coffee payment' }
  ],
  documentation: 'https://docs.solanapay.com',
  status: 'active'
});
```

### 4.3 Protocol Validation

**Generic Validator:**
```typescript
async function validateProtocolMetadata(
  registry: ProtocolRegistry,
  metadata: any
): Promise<ValidationResult> {
  // 1. Check protocol field exists
  if (!metadata.protocol) {
    return { valid: false, errors: ['Missing protocol field'] };
  }

  // 2. Fetch protocol definition
  const protocolDef = await registry.get(metadata.protocol);
  
  // 3. Unknown protocol = warning (forward compatibility)
  if (!protocolDef) {
    return { 
      valid: true, 
      warnings: [`Unknown protocol: ${metadata.protocol}`] 
    };
  }

  // 4. Validate required fields
  const errors: string[] = [];
  for (const field of protocolDef.schema.required) {
    if (!(field in metadata)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 5. Validate types
  for (const [field, expectedType] of Object.entries(protocolDef.schema.types)) {
    if (field in metadata && typeof metadata[field] !== expectedType) {
      errors.push(`Field ${field} should be ${expectedType}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 5. Data Structures

### 5.1 Database Schema

**Required Tables:**
- `groups` - Multi-tenant isolation
- `people` - Authorization
- `things` - Universal entities
- `connections` - Relationships
- `events` - Audit log
- `knowledge` - RAG/search
- `protocol_definitions` - Protocol registry

**Required Indexes:**
- `groups`: `by_slug`
- `people`: `by_email`, `by_group`
- `things`: `by_type`, `by_group`, `by_status`
- `connections`: `by_from`, `by_to`, `by_type`
- `events`: `by_type_time`, `by_actor`, `by_target`, `by_group`
- `knowledge`: `by_source`, `by_embedding` (vector index)
- `protocol_definitions`: `by_name`, `by_category`

### 5.2 Metadata Standards

**Protocol Metadata:**
```typescript
{
  protocol: string;          // REQUIRED: Protocol identifier
  [key: string]: any;        // Protocol-specific fields
}
```

**Example (Solana Pay):**
```typescript
{
  protocol: 'solana_pay',
  signature: '5J7kMQ...',
  slot: 123456789,
  memo: 'Coffee payment'
}
```

**Example (Stripe):**
```typescript
{
  protocol: 'stripe',
  chargeId: 'ch_123',
  amount: 1000,
  currency: 'usd'
}
```

---

## 6. Protocol Integration

### 6.1 Integration Pattern

**Step 1: Register Protocol**
```typescript
await registerProtocol({
  name: 'new_protocol',
  schema: { ... },
  examples: [ ... ]
});
```

**Step 2: Implement Handler**
```typescript
class NewProtocolHandler implements ProtocolHandler {
  async process(metadata: any): Promise<Result> {
    // Protocol-specific logic
  }
}
```

**Step 3: Register Handler**
```typescript
registerHandler('new_protocol', new NewProtocolHandler());
```

**Step 4: Use Protocol**
```typescript
await createConnection({
  fromThingId: userId,
  toThingId: merchantId,
  relationshipType: 'transacted',
  metadata: {
    protocol: 'new_protocol',
    // ... protocol-specific fields
  }
});
```

### 6.2 Handler Interface

```typescript
interface ProtocolHandler {
  // Process protocol-specific logic
  process(metadata: any): Promise<Result>;
  
  // Validate metadata (optional, registry validates by default)
  validate?(metadata: any): Promise<ValidationResult>;
  
  // Translate to another protocol (optional)
  translate?(targetProtocol: string, metadata: any): Promise<any>;
}
```

---

## 7. Interoperability Patterns

### 7.1 Cross-Protocol Workflows

**Pattern:** Chain multiple protocols in sequence.

**Example:**
```typescript
// Pay with Bitcoin → Mint NFT on Ethereum → Email receipt
const payment = await processPayment({
  protocol: 'bitcoin',
  txHash: '0x123...'
});

const nft = await mintNFT({
  protocol: 'ethereum',
  contractAddress: '0xABC...',
  tokenId: '42'
});

await sendNotification({
  protocol: 'smtp',
  to: 'user@example.com',
  subject: 'NFT Minted'
});
```

### 7.2 Protocol Fallback Chains

**Pattern:** Try protocols in priority order.

**Example:**
```typescript
const protocols = [
  { protocol: 'solana_pay', priority: 1 },
  { protocol: 'stripe', priority: 2 },
  { protocol: 'paypal', priority: 3 }
];

for (const { protocol } of protocols) {
  try {
    return await processPayment(protocol, amount);
  } catch (error) {
    console.log(`${protocol} failed, trying next...`);
  }
}
```

### 7.3 Protocol Translation

**Pattern:** Convert metadata from one protocol to another.

**Example:**
```typescript
// Stripe → Solana Pay translation
async function translatePayment(
  stripeMetadata: any,
  targetProtocol: 'solana_pay'
): Promise<any> {
  return {
    protocol: 'solana_pay',
    signature: await convertToSolanaSignature(stripeMetadata.chargeId),
    slot: await getCurrentSlot(),
    amount: stripeMetadata.amount / 100  // Stripe uses cents
  };
}
```

---

## 8. Security & Compliance

### 8.1 Authentication

- All actions MUST have an authenticated actor
- Use standard auth mechanisms (OAuth, JWT, etc.)
- AI agents MUST be authenticated as people

### 8.2 Authorization

- Role-based access control (RBAC)
- Group-level isolation (multi-tenancy)
- Permission checks at application boundary

### 8.3 Data Privacy

- Soft deletes preserve audit trail
- Hard deletes for GDPR compliance
- PII encryption at rest

### 8.4 Protocol Compliance

- Protocols self-declare compliance requirements
- Filter protocols by regulatory needs
- Automatic compliance enforcement

---

## 9. Implementation Guidelines

### 9.1 Minimum Viable Implementation

**Required:**
1. Implement 6 core tables (groups, people, things, connections, events, knowledge)
2. Implement protocol registry table
3. Implement generic protocol validator
4. Support at least 3 protocols

**Recommended:**
1. Vector search for knowledge
2. Soft delete support
3. Event retention policies
4. Protocol marketplace UI

### 9.2 Technology Stack

**Database:**
- Any database with JSON support (PostgreSQL, MongoDB, Convex, etc.)
- Vector search capability for knowledge (optional but recommended)

**Backend:**
- Any language/framework
- Must support async/await for protocol handlers

**Frontend:**
- Any framework
- Must support dynamic protocol selection

### 9.3 Performance Considerations

- Index all foreign keys
- Use connection pooling
- Cache protocol definitions
- Batch protocol validations
- Implement event retention policies

---

## 10. Conformance

### 10.1 Conformance Levels

**Level 1: Basic Conformance**
- Implements 6 core dimensions
- Supports protocol registry
- Validates protocol metadata

**Level 2: Full Conformance**
- Level 1 +
- Implements all 66 thing types
- Implements all 25 connection types
- Implements all 52 event types
- Supports protocol versioning

**Level 3: Advanced Conformance**
- Level 2 +
- Supports protocol translation
- Implements protocol fallback chains
- Supports cross-protocol workflows
- Implements protocol marketplace

### 10.2 Certification

**Process:**
1. Implement ONE Protocol
2. Submit for certification
3. Pass conformance tests
4. Receive certification badge

**Benefits:**
- Listed on one-protocol.org
- Access to protocol marketplace
- Community support

---

## Appendix A: Protocol Examples

### A.1 Payment Protocols

**Stripe:**
```typescript
{
  name: 'stripe',
  category: 'payment',
  schema: {
    required: ['chargeId', 'amount', 'currency'],
    types: { chargeId: 'string', amount: 'number', currency: 'string' }
  }
}
```

**Solana Pay:**
```typescript
{
  name: 'solana_pay',
  category: 'payment',
  schema: {
    required: ['signature', 'slot'],
    types: { signature: 'string', slot: 'number' }
  }
}
```

### A.2 Messaging Protocols

**SMTP:**
```typescript
{
  name: 'smtp',
  category: 'messaging',
  schema: {
    required: ['messageId', 'to', 'subject'],
    types: { messageId: 'string', to: 'string', subject: 'string' }
  }
}
```

**Discord:**
```typescript
{
  name: 'discord',
  category: 'messaging',
  schema: {
    required: ['channelId', 'messageId'],
    types: { channelId: 'string', messageId: 'string' }
  }
}
```

---

## Appendix B: Migration Guide

### B.1 From Hardcoded Integrations

**Step 1:** Identify all protocol integrations
**Step 2:** Create protocol definitions for each
**Step 3:** Refactor code to use protocol handlers
**Step 4:** Migrate data to ONE Protocol schema
**Step 5:** Test and deploy

### B.2 From Other Standards

**From REST APIs:**
- Map endpoints to thing types
- Map HTTP methods to events
- Store API responses in metadata

**From GraphQL:**
- Map types to thing types
- Map mutations to events
- Store query results in knowledge

---

## Appendix C: Governance

### C.1 ONE Protocol Foundation

**Mission:** Maintain and evolve the ONE Protocol standard.

**Responsibilities:**
- Publish specification updates
- Certify implementations
- Maintain protocol registry
- Community support

### C.2 Contribution Process

1. Submit proposal (GitHub issue)
2. Community discussion
3. Technical review
4. Approval/rejection
5. Specification update

---

## Appendix D: Versioning

**Semantic Versioning:**
- MAJOR: Breaking changes to core ontology
- MINOR: New features (backward compatible)
- PATCH: Bug fixes and clarifications

**Current Version:** 1.0.0

**Upgrade Path:**
- Implementations MUST support current version
- Implementations MAY support previous versions
- Deprecation period: 12 months minimum

---

## License

This specification is licensed under Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).

You are free to:
- Share — copy and redistribute the material
- Adapt — remix, transform, and build upon the material

Under the following terms:
- Attribution — You must give appropriate credit
- ShareAlike — You must distribute under the same license

---

## References

1. ONE Platform Implementation: https://github.com/one-platform/one
2. Protocol Registry: https://one-protocol.org/registry
3. Community Forum: https://forum.one-protocol.org
4. Certification: https://one-protocol.org/certification

---

**ONE Protocol v1.0.0**  
**The Universal Protocol Layer for the Internet**

© 2025 ONE Protocol Foundation. Licensed under CC BY-SA 4.0.
