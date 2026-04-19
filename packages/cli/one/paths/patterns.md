---
title: Patterns
dimension: connections
category: patterns.md
tags: 
related_dimensions: events, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the connections dimension in the patterns.md category.
  Location: one/connections/patterns.md
  Purpose: Documents patterns (canonical)
  Related dimensions: events, people, things
  For AI agents: Read this to understand patterns.
---

# Patterns (Canonical)

Canonical connection patterns for common platform behaviors.

## Ownership

```typescript
// Creator owns an asset
{
  fromEntityId: creatorId,
  toEntityId: assetId,
  relationshipType: 'owns',
  metadata: { revenueShare: 1.0 },
  createdAt: Date.now(),
}
```

## Membership (Org)

```typescript
// User is member of org with role
{
  fromEntityId: userId,
  toEntityId: orgId,
  relationshipType: 'member_of',
  metadata: { role: 'org_user', permissions: ['read', 'write'] },
  createdAt: Date.now(),
}
```

## Content Graph

```typescript
// Author → Post
{ fromEntityId: authorId, toEntityId: postId, relationshipType: 'authored', createdAt: now }

// Post ↔ Resource
{ fromEntityId: postId, toEntityId: videoId, relationshipType: 'references', createdAt: now }

// Course → Lesson
{ fromEntityId: courseId, toEntityId: lessonId, relationshipType: 'part_of', createdAt: now }
```

## Commerce (Consolidated)

```typescript
// Buyer transacted with product
{
  fromEntityId: buyerId,
  toEntityId: productId,
  relationshipType: 'transacted',
  metadata: { protocol: 'acp', transactionType: 'payment', amount: 49, currency: 'USD', status: 'completed' },
  createdAt: now,
}
```

## Delegation & Communication

```typescript
// Delegate a task to external workflow
{
  fromEntityId: agentId,
  toEntityId: workflowId,
  relationshipType: 'delegated',
  metadata: { protocol: 'n8n', taskType: 'generate_thumbnails' },
  createdAt: now,
}

// Communicate with external agent
{
  fromEntityId: agentId,
  toEntityId: externalAgentId,
  relationshipType: 'communicated',
  metadata: { protocol: 'a2a', messageType: 'request' },
  createdAt: now,
}
```

## Token Holdings

```typescript
{
  fromEntityId: userId,
  toEntityId: tokenId,
  relationshipType: 'holds_tokens',
  metadata: { balance: 1000, network: 'base' },
  createdAt: now,
}
```
