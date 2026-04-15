---
title: Convex Query Pattern
dimension: knowledge
category: patterns
tags: ai, backend, connections, events, ontology, people
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the patterns category.
  Location: one/knowledge/patterns/backend/convex-query-pattern.md
  Purpose: Documents convex query pattern
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand convex query pattern.
---

# Convex Query Pattern

**Category:** Backend
**Type:** Data Retrieval
**Used for:** Reading entities, connections, events from the ontology

---

## Pattern Overview

Every query in Convex should:
1. Accept filtering parameters
2. Use indexes for performance
3. Return only necessary fields
4. Support pagination for large datasets

## Code Template

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    type: v.string(),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // 2. Get user's group
    const person = await ctx.db.query("people")
      .withIndex("by_email", q => q.eq("email", identity.email))
      .first();

    if (!person?.groupId) return [];

    // 3. Build query with compound index (groupId + type)
    let q = ctx.db
      .query("things")
      .withIndex("by_group_type", (q) =>
        q.eq("groupId", person.groupId).eq("type", args.type)
      );

    // 4. Apply status filter
    if (args.status) {
      q = q.filter((thing) => thing.status === args.status);
    }

    // 5. Limit results
    const limit = args.limit || 100;
    const things = await q.take(limit);

    // 6. Return results
    return things;
  },
});

export const getById = query({
  args: { id: v.id("things") },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // 2. Get user's group
    const person = await ctx.db.query("people")
      .withIndex("by_email", q => q.eq("email", identity.email))
      .first();

    if (!person?.groupId) return null;

    // 3. Get thing and verify group ownership
    const thing = await ctx.db.get(args.id);
    if (!thing || thing.groupId !== person.groupId) return null;

    return thing;
  },
});
```

## When to Use

- Listing things of a specific type
- Fetching single things by ID
- Searching for things with filters (status, type)
- Building relationship graphs (querying connections)
- Retrieving event history for audit trails
- Fetching knowledge/labels for RAG

## Best Practices

1. **Always authenticate** - Verify user identity before returning data
2. **Scope by groupId** - Filter by user's groupId for multi-tenant isolation
3. **Use compound indexes** - Use `by_group_type` (groupId + type) for efficient queries
4. **Limit results** - Default to 100 items max, always paginate
5. **Filter server-side** - Apply status/type filters in the query, not client-side
6. **Return scoped data** - Only return things the user can access
7. **Cache-friendly** - Queries are automatically cached by Convex

## Common Mistakes

❌ **Don't:** Skip authentication
✅ **Do:** Always verify `ctx.auth.getUserIdentity()` first

❌ **Don't:** Query without groupId filter
✅ **Do:** Always scope by `groupId` to prevent multi-tenant leaks

❌ **Don't:** Query without indexes
✅ **Do:** Use `.withIndex()` for groupId + type queries

❌ **Don't:** Return unlimited results
✅ **Do:** Always use `.take(limit)`

❌ **Don't:** Fetch then filter client-side
✅ **Do:** Filter status/type in the query

## Related Patterns

- [Convex Mutation Pattern](./convex-mutation-pattern.md)
- [Pagination Pattern](./pagination-pattern.md)
- [Index Strategy Pattern](./index-strategy-pattern.md)
