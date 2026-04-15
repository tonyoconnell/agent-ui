---
title: Convex Mutation Pattern
dimension: knowledge
category: patterns
tags: ai, backend, ontology
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the patterns category.
  Location: one/knowledge/patterns/backend/convex-mutation-pattern.md
  Purpose: Documents convex mutation pattern
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand convex mutation pattern.
---

# Convex Mutation Pattern

**Category:** Backend
**Type:** Data Modification
**Used for:** Creating, updating, or deleting entities in the ontology

---

## Pattern Overview

Every mutation in Convex should:
1. Validate inputs against ontology types
2. Perform the operation on the appropriate table
3. Create event record for audit trail
4. Return the result

## Code Template

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    type: v.string(),
    name: v.string(),
    properties: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Get authenticated user (if required)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // 2. Validate against ontology
    // Check that type exists in ontology
    // Validate required fields based on type

    // 3. Validate identity has group
    const person = await ctx.db.query("people")
      .withIndex("by_email", q => q.eq("email", identity.email))
      .first();

    if (!person || !person.groupId) {
      throw new Error("User must belong to a group");
    }

    // 4. Insert into things table
    const thingId = await ctx.db.insert("things", {
      type: args.type,
      name: args.name,
      properties: args.properties,
      groupId: person.groupId,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5. Log creation event
    await ctx.db.insert("events", {
      type: "entity_created",
      actorId: person._id,
      targetId: thingId,
      timestamp: Date.now(),
      metadata: {
        entityType: args.type,
        entityName: args.name,
        groupId: person.groupId,
      },
    });

    // 6. Return result
    return thingId;
  },
});
```

## When to Use

- Creating new things (actors, content, products, tokens, etc.)
- Creating connections between things
- Recording events for the audit trail
- Updating thing state or properties
- Deleting things (soft delete via status = "archived")

## Best Practices

1. **Always authenticate** - Get user identity and validate they belong to a group
2. **Use groupId** - Scope all operations by groupId for multi-tenant isolation
3. **Always log events** - Every mutation should create an event record with actorId and targetId
4. **Use soft deletes** - Change status to "archived" instead of hard deleting
5. **Use canonical types** - Use 66 thing types from ontology, not custom types
6. **Return minimal data** - Return IDs only, let queries fetch full objects
7. **Use transactions** - Convex handles transactions automatically within a mutation

## Common Mistakes

❌ **Don't:** Skip event logging
✅ **Do:** Always create an event record

❌ **Don't:** Hard delete records
✅ **Do:** Use status field for soft deletes

❌ **Don't:** Return full objects with sensitive data
✅ **Do:** Return IDs and let queries fetch data

## Related Patterns

- [Convex Query Pattern](./convex-query-pattern.md)
- [Event Logging Pattern](./event-logging-pattern.md)
- [Ontology Validation Pattern](./ontology-validation-pattern.md)
