---
title: Groups
dimension: connections
category: groups.md
tags: groups, multi-tenancy, hierarchical, ontology
related_dimensions: people, things, connections, events, knowledge
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the connections dimension in the groups.md category.
  Location: one/connections/groups.md
  Purpose: Documents the groups dimension - multi-tenant isolation and hierarchical containers
  Related dimensions: people, things, connections, events, knowledge
  For AI agents: Read this to understand groups, multi-tenancy, and hierarchical nesting.
---

# Groups Dimension - Multi-Tenant Isolation & Hierarchical Containers

**Version:** 1.0.0
**Status:** Complete - Production Ready
**Purpose:** The foundation dimension that enables multi-tenancy and hierarchical organization

---

## Why Groups Are Dimension #1

**Groups are the FIRST dimension because they partition ALL other dimensions.**

Without groups, you have a single-tenant system. With groups, you have:

- **Multi-tenancy:** Each group has isolated data, billing, quotas, and customization
- **Hierarchical organization:** Groups can contain groups (friend circle → team → company → government)
- **Data scoping:** Every entity, connection, event, and knowledge item belongs to a group
- **Access control:** Group membership determines what users can see and do
- **Infinite scale:** From 2-person friend circles to billion-person governments

**Key principle:** `groupId` is the FIRST field in every dimension's scoping logic.

---

## Conceptual Model

### Groups as Containers

```
┌─────────────────────────────────────────────────────────────────┐
│                         GROUPS (Dimension 1)                     │
│                    The Container Dimension                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │ Group: "Acme Corp" (type: organization)          │          │
│  │ ├─ People: [Alice (owner), Bob (user), ...]      │          │
│  │ ├─ Things: [Products, Courses, Agents, ...]      │          │
│  │ ├─ Connections: [Alice owns Product X, ...]      │          │
│  │ ├─ Events: [Product created, User joined, ...]   │          │
│  │ └─ Knowledge: [Embeddings, Labels, ...]          │          │
│  │                                                   │          │
│  │ ┌─────────────────────────────────────────┐     │          │
│  │ │ Child Group: "Engineering Team"         │     │          │
│  │ │ (parentGroupId: Acme Corp)               │     │          │
│  │ │ ├─ People: [Carol, Dave, ...]            │     │          │
│  │ │ ├─ Things: [Projects, Tasks, ...]        │     │          │
│  │ │ └─ ...                                   │     │          │
│  │ └─────────────────────────────────────────┘     │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
│  Groups partition EVERYTHING. All data lives inside a group.    │
└─────────────────────────────────────────────────────────────────┘
```

**Visual hierarchy:**

```
Government (billions of people)
 ↓
State (millions)
 ↓
City (thousands)
 ↓
Business (hundreds)
 ↓
Team (tens)
 ↓
Friend Circle (2-10)
```

**Every level uses the SAME schema.** That's the power of the ontology.

---

## Schema Definition

### Group Table

```typescript
interface Group {
  _id: Id<"groups">;
  slug: string;                    // Unique identifier (URL-friendly)
  name: string;                    // Display name
  type: GroupType;                 // 6 types: friend_circle, business, community, dao, government, organization
  parentGroupId?: Id<"groups">;    // CRITICAL: Enables hierarchical nesting
  description?: string;            // Optional description
  metadata: any;                   // Flexible additional data
  settings: {
    visibility: "public" | "private";
    joinPolicy: "open" | "invite_only" | "approval_required";
    plan?: "starter" | "pro" | "enterprise";
    limits?: {
      users: number;
      storage: number;
      apiCalls: number;
    };
  };
  status: "active" | "archived";
  createdAt: number;
  updatedAt: number;
}
```

### 6 Group Types

**1. friend_circle**
- **Scale:** 2-10 people
- **Use case:** Personal networks, small collaborations
- **Example:** "Running Club", "Book Club", "Family"

**2. business**
- **Scale:** 10-1000 people
- **Use case:** Companies, startups, agencies
- **Example:** "Acme Inc", "Marketing Agency", "Consulting Firm"

**3. community**
- **Scale:** 100-100,000 people
- **Use case:** Online communities, forums, fan clubs
- **Example:** "React Developers", "Fitness Enthusiasts", "Crypto Traders"

**4. dao**
- **Scale:** 100-1,000,000 people
- **Use case:** Decentralized organizations, blockchain governance
- **Example:** "DeFi DAO", "NFT Community DAO", "Protocol Governance"

**5. government**
- **Scale:** 1,000-1,000,000,000 people
- **Use case:** Cities, states, nations
- **Example:** "City of San Francisco", "State of California", "United States"

**6. organization**
- **Scale:** 1,000-100,000 people (deprecated - use business instead)
- **Use case:** Large enterprises, institutions
- **Example:** "Fortune 500 Company", "University", "Hospital Network"

---

## Hierarchical Nesting

### The Power of `parentGroupId`

**Groups can contain groups infinitely.** This enables:

1. **Organizational structure:** Company → Department → Team → Project
2. **Geographic hierarchy:** Country → State → City → Neighborhood
3. **Product hierarchy:** Platform → Feature → Component → Subcomponent
4. **Access inheritance:** Parent group owners can access child groups (configurable)

### Example: Corporate Hierarchy

```typescript
// Top-level organization
const acmeCorpId = await db.insert("groups", {
  slug: "acme-corp",
  name: "Acme Corporation",
  type: "business",
  parentGroupId: undefined,  // Top level (no parent)
  settings: {
    visibility: "public",
    joinPolicy: "invite_only",
    plan: "enterprise"
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Child group: Engineering department
const engineeringId = await db.insert("groups", {
  slug: "acme-corp-engineering",
  name: "Engineering",
  type: "business",
  parentGroupId: acmeCorpId,  // Nested under Acme Corp
  settings: {
    visibility: "private",
    joinPolicy: "invite_only"
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Grandchild group: Frontend team
const frontendId = await db.insert("groups", {
  slug: "acme-corp-frontend",
  name: "Frontend Team",
  type: "business",
  parentGroupId: engineeringId,  // Nested under Engineering
  settings: {
    visibility: "private",
    joinPolicy: "approval_required"
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

**Visual hierarchy:**

```
Acme Corporation (parentGroupId: undefined)
 │
 ├─ Engineering (parentGroupId: acmeCorpId)
 │   ├─ Frontend Team (parentGroupId: engineeringId)
 │   ├─ Backend Team (parentGroupId: engineeringId)
 │   └─ DevOps Team (parentGroupId: engineeringId)
 │
 ├─ Marketing (parentGroupId: acmeCorpId)
 │   ├─ Content Team (parentGroupId: marketingId)
 │   └─ Growth Team (parentGroupId: marketingId)
 │
 └─ Sales (parentGroupId: acmeCorpId)
     └─ Enterprise Sales (parentGroupId: salesId)
```

### Querying Hierarchies

**Get all child groups:**

```typescript
const childGroups = await db
  .query("groups")
  .withIndex("by_parent", q => q.eq("parentGroupId", parentGroupId))
  .collect();
```

**Get all descendants (recursive):**

```typescript
async function getAllDescendants(db, groupId, descendants = []) {
  const children = await db
    .query("groups")
    .withIndex("by_parent", q => q.eq("parentGroupId", groupId))
    .collect();

  for (const child of children) {
    descendants.push(child);
    await getAllDescendants(db, child._id, descendants);
  }

  return descendants;
}
```

**Get all ancestors (path to root):**

```typescript
async function getAncestors(db, groupId, ancestors = []) {
  const group = await db.get(groupId);
  if (!group) return ancestors;

  if (group.parentGroupId) {
    const parent = await db.get(group.parentGroupId);
    if (parent) {
      ancestors.push(parent);
      await getAncestors(db, parent._id, ancestors);
    }
  }

  return ancestors;
}
```

---

## Multi-Tenancy via `groupId`

### Universal Scoping Pattern

**CRITICAL:** Every dimension MUST be scoped to a `groupId`.

**Schema pattern (ALL dimensions follow this):**

```typescript
// Dimension 3: Things
entities: defineTable({
  groupId: v.id("groups"),  // REQUIRED: Multi-tenant scope
  type: v.string(),
  name: v.string(),
  properties: v.any(),
  // ...
})
  .index("by_group", ["groupId"])
  .index("group_type", ["groupId", "type"]);

// Dimension 4: Connections
connections: defineTable({
  groupId: v.id("groups"),  // REQUIRED: Multi-tenant scope
  fromEntityId: v.id("entities"),
  toEntityId: v.id("entities"),
  relationshipType: v.string(),
  // ...
})
  .index("by_group", ["groupId"])
  .index("group_type", ["groupId", "relationshipType"]);

// Dimension 5: Events
events: defineTable({
  groupId: v.id("groups"),  // REQUIRED: Multi-tenant scope
  type: v.string(),
  actorId: v.optional(v.id("entities")),
  targetId: v.optional(v.id("entities")),
  // ...
})
  .index("by_group", ["groupId"])
  .index("group_type", ["groupId", "type"]);

// Dimension 6: Knowledge
knowledge: defineTable({
  groupId: v.id("groups"),  // REQUIRED: Multi-tenant scope
  knowledgeType: v.string(),
  text: v.optional(v.string()),
  // ...
})
  .index("by_group", ["groupId"])
  .index("group_type", ["groupId", "knowledgeType"]);
```

**Query pattern (ALWAYS filter by groupId first):**

```typescript
// ✅ CORRECT: Group-scoped query
const entities = await db
  .query("entities")
  .withIndex("group_type", q =>
    q.eq("groupId", groupId).eq("type", "user")
  )
  .collect();

// ❌ WRONG: Unscoped query (cross-tenant data leak!)
const entities = await db
  .query("entities")
  .withIndex("by_type", q => q.eq("type", "user"))
  .collect();
```

### Data Isolation Guarantees

**What multi-tenancy provides:**

1. **Data isolation:** Group A cannot see Group B's data (unless explicitly shared)
2. **Billing isolation:** Each group has independent quotas and usage tracking
3. **Feature isolation:** Groups can enable/disable features independently
4. **Customization isolation:** Groups can customize branding, settings, workflows
5. **Performance isolation:** Heavy usage in Group A doesn't slow Group B

**Security rules:**

- Every mutation MUST validate `groupId` exists and is active
- Every query MUST filter by `groupId` first (use compound indexes)
- Cross-group references MUST be validated explicitly
- Access control MUST check group membership before operations

---

## Group Lifecycle

### Creating a Group

```typescript
export const createGroup = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    type: v.string(),
    parentGroupId: v.optional(v.id("groups"))
  },
  handler: async (ctx, args) => {
    // 1. Validate slug uniqueness
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Slug already taken");
    }

    // 2. Validate parent group (if nesting)
    if (args.parentGroupId) {
      const parent = await ctx.db.get(args.parentGroupId);
      if (!parent || parent.status !== "active") {
        throw new Error("Invalid parent group");
      }
    }

    // 3. Create group
    const groupId = await ctx.db.insert("groups", {
      slug: args.slug,
      name: args.name,
      type: args.type,
      parentGroupId: args.parentGroupId,
      metadata: {},
      settings: {
        visibility: "public",
        joinPolicy: "invite_only",
        plan: "starter"
      },
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return groupId;
  }
});
```

### Updating a Group

```typescript
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    settings: v.optional(v.any())
  },
  handler: async (ctx, args) => {
    // 1. Get existing group
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // 2. Update fields
    const updates: any = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.settings) {
      updates.settings = { ...group.settings, ...args.settings };
    }

    await ctx.db.patch(args.groupId, updates);

    return args.groupId;
  }
});
```

### Archiving a Group

```typescript
export const archiveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    // 1. Get group
    const group = await ctx.db.get(args.groupId);
    if (!group) {
      throw new Error("Group not found");
    }

    // 2. Archive all child groups first
    const children = await ctx.db
      .query("groups")
      .withIndex("by_parent", q => q.eq("parentGroupId", args.groupId))
      .collect();

    for (const child of children) {
      await ctx.db.patch(child._id, {
        status: "archived",
        updatedAt: Date.now()
      });
    }

    // 3. Archive parent group
    await ctx.db.patch(args.groupId, {
      status: "archived",
      updatedAt: Date.now()
    });

    return args.groupId;
  }
});
```

---

## Access Control Patterns

### Group Membership

**People belong to groups via entity type and groupId:**

```typescript
// User entity in a group
const user = await db.insert("entities", {
  groupId: groupId,
  type: "creator",
  name: "Alice",
  properties: {
    email: "alice@example.com",
    role: "org_owner",  // Authorization level
    groups: [groupId]   // Can belong to multiple groups
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

### Role-Based Access

**4 roles with different permissions:**

1. **platform_owner**
   - Full access to ALL groups
   - Can create/delete any group
   - Can modify platform settings

2. **org_owner**
   - Admin access to their group + child groups
   - Can invite users, manage settings
   - Can create child groups

3. **org_user**
   - Standard access to their group
   - Can create content, use features
   - Cannot modify group settings

4. **customer**
   - Read-only access (for purchased content)
   - Can view products, courses, content
   - Cannot create or modify

### Access Validation Pattern

```typescript
export const validateGroupAccess = async (
  db,
  groupId: Id<"groups">,
  userId: string,
  requiredRole?: string
) => {
  // 1. Get group
  const group = await db.get(groupId);
  if (!group || group.status !== "active") {
    throw new Error("Group not found or inactive");
  }

  // 2. Get user in group
  const user = await db
    .query("entities")
    .withIndex("group_type", q =>
      q.eq("groupId", groupId).eq("type", "creator")
    )
    .filter(q => q.eq(q.field("properties.userId"), userId))
    .first();

  if (!user) {
    throw new Error("User not in group");
  }

  // 3. Check role (if required)
  if (requiredRole) {
    const userRole = user.properties.role;
    if (userRole === "platform_owner") {
      return true; // Platform owners have access to everything
    }
    if (userRole !== requiredRole) {
      throw new Error("Insufficient permissions");
    }
  }

  return true;
};
```

---

## Usage Tracking & Quotas

### Per-Group Usage

```typescript
// Track usage per group per metric
usage: defineTable({
  groupId: v.id("groups"),
  metric: v.string(),    // "users", "storage_gb", "api_calls", "entities_total"
  period: v.string(),    // "daily", "monthly", "annual"
  value: v.number(),     // Current usage
  limit: v.number(),     // Quota limit
  timestamp: v.number(),
  periodStart: v.optional(v.number()),
  periodEnd: v.optional(v.number()),
  metadata: v.optional(v.any())
})
  .index("by_group_period", ["groupId", "period"])
  .index("by_group_metric", ["groupId", "metric"])
```

### Quota Enforcement

```typescript
export const checkQuota = async (
  db,
  groupId: Id<"groups">,
  metric: string
) => {
  const usage = await db
    .query("usage")
    .withIndex("by_group_metric", q =>
      q.eq("groupId", groupId).eq("metric", metric)
    )
    .first();

  if (!usage) {
    throw new Error("Usage metric not found");
  }

  if (usage.value >= usage.limit) {
    throw new Error(`Quota exceeded for ${metric}`);
  }

  return usage;
};
```

---

## Key Patterns for AI Agents

### Pattern 1: Always Validate Group First

```typescript
// ALWAYS start with group validation
const group = await ctx.db.get(args.groupId);
if (!group || group.status !== "active") {
  throw new Error("Invalid group");
}
```

### Pattern 2: Always Scope Queries by groupId

```typescript
// ALWAYS use compound index with groupId first
const entities = await ctx.db
  .query("entities")
  .withIndex("group_type", q =>
    q.eq("groupId", args.groupId).eq("type", args.type)
  )
  .collect();
```

### Pattern 3: Always Include groupId in Inserts

```typescript
// ALWAYS include groupId when creating entities
const entityId = await ctx.db.insert("entities", {
  groupId: args.groupId,  // REQUIRED
  type: args.type,
  name: args.name,
  properties: args.properties || {},
  status: "draft",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

### Pattern 4: Respect Hierarchical Access

```typescript
// Check if user has access to group or parent groups
const hasAccess = await checkHierarchicalAccess(
  db,
  groupId,
  userId
);
```

---

## Examples

### Example 1: Lemonade Stand (friend_circle)

```typescript
const lemonadeStandId = await db.insert("groups", {
  slug: "toms-lemonade",
  name: "Tom's Lemonade Stand",
  type: "friend_circle",
  parentGroupId: undefined,
  settings: {
    visibility: "public",
    joinPolicy: "open",
    plan: "starter"
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Add products
await db.insert("entities", {
  groupId: lemonadeStandId,
  type: "product",
  name: "Lemonade Cup",
  properties: { price: 2.00, inventory: 50 },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

### Example 2: Enterprise Corporation (business with hierarchy)

```typescript
// Parent: Acme Corp
const acmeId = await db.insert("groups", {
  slug: "acme-corp",
  name: "Acme Corporation",
  type: "business",
  parentGroupId: undefined,
  settings: {
    visibility: "public",
    joinPolicy: "invite_only",
    plan: "enterprise",
    limits: { users: 10000, storage: 10000, apiCalls: 1000000 }
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});

// Child: Engineering team
const engineeringId = await db.insert("groups", {
  slug: "acme-engineering",
  name: "Engineering",
  type: "business",
  parentGroupId: acmeId,
  settings: {
    visibility: "private",
    joinPolicy: "approval_required"
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

### Example 3: DAO (decentralized community)

```typescript
const daoId = await db.insert("groups", {
  slug: "defi-protocol-dao",
  name: "DeFi Protocol DAO",
  type: "dao",
  parentGroupId: undefined,
  settings: {
    visibility: "public",
    joinPolicy: "open",  // Token holders can join
    plan: "pro"
  },
  metadata: {
    tokenAddress: "0x...",
    governanceContract: "0x...",
    votingThreshold: 1000
  },
  status: "active",
  createdAt: Date.now(),
  updatedAt: Date.now()
});
```

---

## Summary

### The Groups Dimension Enables

1. **Multi-tenancy:** Complete data isolation per group
2. **Hierarchical organization:** Infinite nesting via `parentGroupId`
3. **Universal scoping:** All dimensions filtered by `groupId`
4. **Flexible access:** Role-based permissions per group
5. **Independent billing:** Quotas and usage tracking per group
6. **Infinite scale:** From friend circles (2 people) to governments (billions)

### Critical Rules for AI Agents

1. **Always validate groupId first** - Check exists and active
2. **Always scope queries by groupId** - Use compound indexes
3. **Always include groupId in inserts** - Multi-tenant isolation
4. **Never skip group validation** - Security critical
5. **Respect hierarchical access** - Parent groups can access children

### Key Files to Reference

- `/backend/convex/schema.ts` - Groups table definition
- `/one/knowledge/ontology.md` - Complete 6-dimension specification
- `/one/knowledge/architecture.md` - Architecture overview

---

**Groups are the foundation. Master this dimension, and everything else follows.**
