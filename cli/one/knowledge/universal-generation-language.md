---
title: Universal Generation Language
dimension: knowledge
category: universal-generation-language.md
tags: ai, ontology, people
related_dimensions: connections, events, groups, people, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the universal-generation-language.md category.
  Location: one/knowledge/universal-generation-language.md
  Purpose: Documents the universal code generation language
  Related dimensions: connections, events, groups, people, things
  For AI agents: Read this to understand universal generation language.
---

# The Universal Code Generation Language

**Version**: 1.0.0
**Purpose**: Explain how ONE's ontology + Effect.ts + Provider pattern = a DSL for importing ANY feature from ANY system.

---

## The Vision: Compound Structure Accuracy

> "Some people say that AI code generation gets worse as the codebase grows... but I want to use structure and ontology and effects and file structure so that each generation adds more structure because it has a place, so every new line of code makes the next line generated more accurate."

This is the breakthrough insight.

### Traditional Approach (Degrades Over Time)

```
Generation 1: Clean code, 95% accurate
Generation 2: Slight drift, 90% accurate
Generation 3: Pattern divergence, 80% accurate
Generation 4: Inconsistency, 65% accurate
Generation N: Unmaintainable mess, 30% accurate
```

**Why?** No universal structure. Each generation introduces new patterns.

### ONE Approach (Improves Over Time)

```
Generation 1: Maps to ontology, 85% accurate (learning)
Generation 2: Follows patterns, 90% accurate (conforming)
Generation 3: Reuses services, 93% accurate (composing)
Generation 4: Predictable structure, 96% accurate (mastering)
Generation N: Perfect consistency, 98%+ accurate (compound structure)
```

**Why?** Everything maps to the 6-dimension ontology. Patterns converge.

---

## The Three Pillars

### Pillar 1: The Ontology (Reality as DSL)

**The 6 dimensions model reality itself:**

```typescript
// This is not just a data model. This is a LANGUAGE.

interface Reality {
  groups: Container[];      // Hierarchical spaces (friend circles → governments)
  people: Actor[];          // Authorization (who can do what)
  things: Entity[];         // All nouns (users, products, courses, agents)
  connections: Relation[];  // All verbs (owns, enrolled_in, purchased)
  events: Action[];         // Audit trail (what happened when)
  knowledge: Embedding[];   // Understanding (RAG, search, AI)
}
```

**Why this works:**

1. **Reality doesn't change** - Groups always contain things, people always authorize, connections always relate
2. **Technology does change** - But it maps to reality
3. **Agents understand reality** - Not framework-specific patterns

### Pillar 2: Effect.ts (Composable Structure)

**Effect.ts isn't for humans. It's for AGENTS.**

Humans see this:
```typescript
const registerUser = Effect.gen(function* () {
  const validated = yield* validateUser(input);
  const user = yield* createUser(validated);
  yield* sendEmail(user);
  return user;
});
```

Agents see this:
```
PATTERN DETECTED: Service composition
- Input: unknown data
- Step 1: Validation (Effect<T, ValidationError>)
- Step 2: Persistence (Effect<T, DatabaseError>)
- Step 3: Side effect (Effect<void, EmailError>)
- Output: Success or tagged union error
- PREDICTABLE. STRUCTURED. COMPOSABLE.
```

**Why Effect.ts:**

1. **Readable** - Each line is a discrete step
2. **Structured** - Error handling is explicit (tagged unions)
3. **Composable** - Services chain together predictably
4. **Type-safe** - 100% typed (Effect<Success, Error, Dependencies>)
5. **Agent-friendly** - Patterns are consistent across entire codebase

**Example - Agent generates new service:**

```typescript
// Agent has seen this pattern 100 times. It knows the structure.

export const createCourse = Effect.gen(function* () {
  // STEP 1: Always validate (pattern learned)
  const validated = yield* validateCourse(input);

  // STEP 2: Check business rules (pattern learned)
  const creator = yield* getPerson(validated.creatorId);
  if (creator.role !== "org_owner") {
    return yield* Effect.fail({ _tag: "UnauthorizedError" });
  }

  // STEP 3: Persist to database (pattern learned)
  const course = yield* provider.things.create({
    groupId: validated.groupId,
    type: "course",
    name: validated.name,
    properties: validated,
  });

  // STEP 4: Create connection (pattern learned)
  yield* provider.connections.create({
    groupId: validated.groupId,
    fromEntityId: creator._id,
    toEntityId: course._id,
    relationshipType: "created",
  });

  // STEP 5: Log event (pattern learned)
  yield* provider.events.log({
    type: "course_created",
    actorId: creator._id,
    targetId: course._id,
  });

  // STEP 6: Return result (pattern learned)
  return course;
});
```

**Every service follows this pattern. Every. Single. One.**

This is compound structure. Each generation reinforces the pattern.

### Pillar 3: Provider Pattern (Universal Interface)

**The provider pattern isn't complexity. It's the UNIVERSAL ADAPTER.**

```typescript
// This interface speaks the ontology language
interface ContentProvider {
  things: {
    list: (opts) => Effect.Effect<Thing[], QueryError>;
    get: (id) => Effect.Effect<Thing, NotFoundError>;
    create: (input) => Effect.Effect<string, CreateError>;
  };
  connections: { /* ... */ };
  events: { /* ... */ };
  knowledge: { /* ... */ };
}
```

**Now ANY backend can implement this:**

```typescript
// Markdown files (development)
class MarkdownProvider implements ContentProvider {
  async things.list() {
    const collection = await getCollection("things");
    return collection.map(item => item.data);
  }
}

// Convex (production)
class ConvexProvider implements ContentProvider {
  async things.list() {
    return await this.client.query(api.queries.things.list);
  }
}

// Shopify (e-commerce)
class ShopifyProvider implements ContentProvider {
  async things.list() {
    const products = await shopify.product.list();
    // Map Shopify schema → ONE ontology
    return products.map(p => ({
      type: "product",
      name: p.title,
      properties: {
        price: p.variants[0].price,
        inventory: p.variants[0].inventory_quantity,
        shopifyId: p.id,
      },
    }));
  }
}

// WordPress (content)
class WordPressProvider implements ContentProvider {
  async things.list() {
    const posts = await wp.posts.list();
    // Map WordPress schema → ONE ontology
    return posts.map(p => ({
      type: "post",
      name: p.title.rendered,
      properties: {
        content: p.content.rendered,
        excerpt: p.excerpt.rendered,
        wpId: p.id,
      },
    }));
  }
}
```

**The frontend code NEVER CHANGES:**

```typescript
// This works with Markdown, Convex, Shopify, WordPress, ANYTHING
const provider = getContentProvider("products");
const products = await provider.things.list({ type: "product" });
```

**Why this works:**

1. **The ontology is the interface** - things, connections, events (universal)
2. **Backends are adapters** - Translate their schema → ontology
3. **Frontend speaks one language** - The 6-dimension DSL
4. **Agents generate adapters** - Just implement the interface

---

## The Power: Agent-Clone Can Import Anything

### Example 1: Clone Shopify

**Command:**
```bash
npx oneie clone https://github.com/Shopify/shopify-api-node
```

**Agent workflow:**

1. **Analyze Shopify schema:**
```
Products → things (type: product)
Customers → people (role: customer)
Orders → connections (type: purchased) + events (type: order_placed)
Cart → connections (type: in_cart)
Inventory → properties on product thing
```

2. **Generate ShopifyProvider:**
```typescript
export class ShopifyProvider implements ContentProvider {
  // Map Shopify → Ontology
  async things.list({ type }) {
    if (type === "product") {
      const products = await this.shopify.product.list();
      return products.map(mapProductToThing);
    }
  }

  async connections.create({ relationshipType, fromEntityId, toEntityId }) {
    if (relationshipType === "purchased") {
      return await this.shopify.order.create({
        line_items: [{ product_id: toEntityId }],
        customer: { id: fromEntityId },
      });
    }
  }
}
```

3. **Generate Effect.ts services:**
```typescript
export const createOrder = Effect.gen(function* () {
  const validated = yield* validateOrder(input);
  const product = yield* provider.things.get(validated.productId);
  const connection = yield* provider.connections.create({
    fromEntityId: validated.customerId,
    toEntityId: product._id,
    relationshipType: "purchased",
    metadata: { quantity: validated.quantity, price: product.properties.price },
  });
  yield* provider.events.log({
    type: "order_placed",
    actorId: validated.customerId,
    targetId: connection._id,
  });
  return connection;
});
```

4. **Generate Astro pages using existing patterns:**
```astro
---
const provider = getContentProvider("products");
const products = await provider.things.list({ type: "product" });
---
<Layout>
  {products.map(product => (
    <ProductCard product={product} />
  ))}
</Layout>
```

**Result:** Full e-commerce system imported into ONE's ontology. No custom database schema. No new patterns. Everything maps to the 6 dimensions.

### Example 2: Clone Learning Management System

**Command:**
```bash
npx oneie clone https://github.com/moodle/moodle
```

**Agent workflow:**

1. **Analyze Moodle schema:**
```
Courses → things (type: course)
Lessons → things (type: lesson)
Students → people (role: student)
Instructors → people (role: instructor)
Enrollments → connections (type: enrolled_in)
Completions → events (type: lesson_completed)
Course content → knowledge (embeddings for search)
```

2. **Generate MoodleProvider:**
```typescript
export class MoodleProvider implements ContentProvider {
  async things.list({ type }) {
    if (type === "course") {
      const courses = await this.moodle.courses.list();
      return courses.map(mapCourseToThing);
    }
    if (type === "lesson") {
      const lessons = await this.moodle.lessons.list();
      return lessons.map(mapLessonToThing);
    }
  }
}
```

3. **Generate Effect.ts services:**
```typescript
export const enrollStudent = Effect.gen(function* () {
  const validated = yield* validateEnrollment(input);
  const student = yield* provider.things.get(validated.studentId);
  const course = yield* provider.things.get(validated.courseId);

  // Check authorization
  if (student.properties.role !== "student") {
    return yield* Effect.fail({ _tag: "UnauthorizedError" });
  }

  // Create enrollment connection
  const enrollment = yield* provider.connections.create({
    fromEntityId: student._id,
    toEntityId: course._id,
    relationshipType: "enrolled_in",
    metadata: { enrolledAt: Date.now() },
  });

  // Log event
  yield* provider.events.log({
    type: "student_enrolled",
    actorId: student._id,
    targetId: course._id,
  });

  return enrollment;
});
```

4. **Generate UI using shadcn components:**
```typescript
export function CourseCard({ course }: { course: Thing }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{course.properties.description}</p>
        <Badge>{course.properties.level}</Badge>
        <Button>Enroll</Button>
      </CardContent>
    </Card>
  );
}
```

**Result:** Full LMS imported into ONE's ontology. Uses same patterns as e-commerce. Same services structure. Same provider interface.

### Example 3: Clone Social Network

**Agent maps:**
```
Users → people (role: member)
Posts → things (type: post)
Comments → things (type: comment)
Likes → connections (type: liked)
Follows → connections (type: follows)
Feed → events (chronological query)
Search → knowledge (embeddings)
```

### Example 4: Clone CRM

**Agent maps:**
```
Contacts → things (type: contact)
Companies → groups (type: business)
Deals → things (type: deal)
Employees → connections (type: employed_by)
Activities → events (type: call_made, email_sent, meeting_held)
Notes → knowledge (RAG for search)
```

**See the pattern?** Everything maps to the 6 dimensions. Always.

---

## Why This Never Breaks

### 1. Reality is Stable

The 6 dimensions model reality:
- Groups (containers)
- People (actors)
- Things (entities)
- Connections (relationships)
- Events (actions)
- Knowledge (understanding)

**Reality doesn't change.** Technology does. The ontology abstracts reality.

### 2. Technology is Adapter

```
Shopify API → ShopifyProvider → Ontology Interface
Moodle Database → MoodleProvider → Ontology Interface
WordPress REST → WordPressProvider → Ontology Interface
Custom Backend → CustomProvider → Ontology Interface
```

**New technology?** Write new adapter. Ontology stays the same.

### 3. Structure Compounds

```typescript
// Generation 1: Agent learns the pattern
export const createUser = Effect.gen(function* () {
  const validated = yield* validateUser(input);
  return yield* provider.things.create({ type: "user", ...validated });
});

// Generation 2: Agent reuses the pattern
export const createProduct = Effect.gen(function* () {
  const validated = yield* validateProduct(input);
  return yield* provider.things.create({ type: "product", ...validated });
});

// Generation 3: Agent masters the pattern
export const createAnything = <T>(
  type: string,
  input: unknown,
  validator: (i: unknown) => Effect.Effect<T, ValidationError>
) => Effect.gen(function* () {
  const validated = yield* validator(input);
  return yield* provider.things.create({ type, ...validated });
});

// Generation N: Agent generates perfect code every time
```

**Each generation reinforces the pattern. Accuracy compounds.**

### 4. Type Safety is Complete

```typescript
// Every layer is 100% typed

// Schema layer (Zod)
const userSchema = z.object({ name: z.string(), email: z.string().email() });

// Type layer (TypeScript)
type User = z.infer<typeof userSchema>;

// Service layer (Effect.ts)
const createUser: Effect.Effect<User, ValidationError | DatabaseError> = ...

// Component layer (React)
export function UserCard({ user }: { user: User }) { ... }

// NO `any` types (except in thing.properties which is intentionally flexible)
// NO runtime errors (Effect.ts catches everything)
// NO type mismatches (TypeScript enforces)
```

---

## Nanostores: The Bridge Between Islands

### Why Nanostores Matter

Astro's islands architecture isolates components. But sometimes they need to communicate:

**Example: E-commerce cart**

```typescript
// Problem: These are separate islands (separate React trees)
<Header client:load />           // Island 1: Shows cart count
<ProductList client:load />      // Island 2: Product cards
<AddToCart client:load />        // Island 3: Add button
<CartSidebar client:load />      // Island 4: Cart preview

// Without nanostores: They CAN'T share state
// With nanostores: They share global state
```

**Solution:**

```typescript
// stores/cart.ts
import { atom } from "nanostores";

export const cartStore = atom<CartItem[]>([]);

// components/AddToCart.tsx (Island 3)
import { useStore } from "@nanostores/react";
import { cartStore } from "@/stores/cart";

export function AddToCart({ product }) {
  const cart = useStore(cartStore);
  const addToCart = () => {
    cartStore.set([...cart, product]);
  };
  return <Button onClick={addToCart}>Add to Cart</Button>;
}

// components/CartIcon.tsx (Island 1)
import { useStore } from "@nanostores/react";
import { cartStore } from "@/stores/cart";

export function CartIcon() {
  const cart = useStore(cartStore);
  return <Badge>{cart.length}</Badge>; // Updates automatically!
}
```

**For agents:** Nanostores provide a STRUCTURED way to share state. The pattern is consistent. Generation is predictable.

**Without nanostores:** Agents would need to:
1. Pass props through URL params (messy)
2. Use localStorage (unstructured)
3. Use global window object (no types)
4. Rebuild as single React app (loses Astro benefits)

**With nanostores:** Agents see the pattern once, replicate it perfectly every time.

---

## Protocols are Just Metadata

### X402 Protocol Example

```typescript
// X402 is for blockchain settlement
// But in ONE's ontology, it's just connection metadata

// Create a transfer connection
yield* provider.connections.create({
  groupId,
  fromEntityId: senderId,
  toEntityId: receiverId,
  relationshipType: "transacted",
  metadata: {
    protocol: "x402",          // Protocol identifier
    blockchain: "ethereum",    // Chain
    amount: "1.5",            // Amount
    currency: "USDC",         // Token
    txHash: "0x...",          // Transaction hash
    blockNumber: 12345,       // Block number
    timestamp: Date.now(),
  },
});

// The ontology doesn't care about X402 specifics
// It's just a connection with rich metadata
// Agents query: "Give me all X402 transactions"
// Query: connections.list({ metadata: { protocol: "x402" } })
```

### ActivityPub 2.0 Example

```typescript
// ActivityPub is for federation
// But in ONE's ontology, it's just connection metadata

yield* provider.connections.create({
  groupId,
  fromEntityId: localUserId,
  toEntityId: remoteUserId,
  relationshipType: "follows",
  metadata: {
    protocol: "activitypub",
    activityType: "Follow",
    actor: "https://mastodon.social/@user",
    object: "https://one.ie/@otheruser",
    published: new Date().toISOString(),
  },
});
```

### A2A (Agent-to-Agent) Example

```typescript
// A2A is for agent communication
// But in ONE's ontology, it's just connection metadata

yield* provider.connections.create({
  groupId,
  fromEntityId: agentId1,
  toEntityId: agentId2,
  relationshipType: "delegated",
  metadata: {
    protocol: "a2a",
    task: "generate_invoice",
    status: "pending",
    payload: { orderId: "123", amount: 500 },
  },
});
```

**See the pattern?** Protocols are just metadata. The ontology is protocol-agnostic. Agents integrate ANY protocol by adding metadata.

---

## The Result: Unbreakable System

### 1. Every Feature Maps to 6 Dimensions

**Agent receives:** "Add subscription billing"

**Agent thinks:**
```
- Subscriptions = things (type: subscription)
- Customers = people (role: customer)
- Plans = things (type: plan)
- Subscribes = connections (type: subscribed_to)
- Charges = events (type: charge_processed)
- Plan descriptions = knowledge (for AI recommendations)
```

**Agent generates:** Services + Providers + UI (all follow established patterns)

### 2. Every Service Uses Effect.ts

**Agent generates:**
```typescript
export const createSubscription = Effect.gen(function* () {
  const validated = yield* validateSubscription(input);
  const customer = yield* provider.things.get(validated.customerId);
  const plan = yield* provider.things.get(validated.planId);

  const subscription = yield* provider.things.create({
    type: "subscription",
    name: `${customer.name} - ${plan.name}`,
    properties: {
      status: "active",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });

  yield* provider.connections.create({
    fromEntityId: customer._id,
    toEntityId: subscription._id,
    relationshipType: "subscribed_to",
  });

  yield* provider.events.log({
    type: "subscription_created",
    actorId: customer._id,
    targetId: subscription._id,
  });

  return subscription;
});
```

**Pattern learned. Structure added. Next generation more accurate.**

### 3. Every Backend Speaks Ontology

```typescript
// Stripe provider
class StripeProvider implements ContentProvider {
  async things.create({ type, properties }) {
    if (type === "subscription") {
      const sub = await stripe.subscriptions.create({
        customer: properties.customerId,
        items: [{ price: properties.planId }],
      });
      return mapStripeSubToThing(sub);
    }
  }
}

// Chargebee provider
class ChargebeeProvider implements ContentProvider {
  async things.create({ type, properties }) {
    if (type === "subscription") {
      const sub = await chargebee.subscription.create({
        customer_id: properties.customerId,
        plan_id: properties.planId,
      }).request();
      return mapChargebeeSubToThing(sub);
    }
  }
}

// Frontend doesn't care which one
const provider = getContentProvider("subscriptions");
const subscription = await provider.things.create({ ... });
```

### 4. 100% Type Safety

```typescript
// Types flow through the entire system
Schema (Zod) → Type (TypeScript) → Service (Effect) → Component (React)

// No `any` types (except thing.properties)
// No runtime surprises
// No broken contracts
```

---

## Documentation Context Engineering

### The Problem: Too Much Context

**Traditional docs dump everything:**
```
Read 10,000 lines of documentation
Now implement a simple feature
```

**Result:** 80% wasted context. Agent confused. Generation inaccurate.

### The Solution: Just-In-Time Descriptive Links

**ONE approach:**
```
Entry point: CLAUDE.md (500 lines)
Link to: ontology.md (800 lines) - "Understand the 6 dimensions"
Link to: astro-effect-simple-architecture.md (600 lines) - "Layer 1 pattern"
Total context: ~2000 lines (relevant)
```

**Result:** 90% relevant context. Agent focused. Generation accurate.

### The Map: context-engineering.md

See `/one/knowledge/context-engineering.md` for complete documentation structure.

**Key insights:**
1. **Descriptive links** over context dumping
2. **Just-in-time information** over speculative reading
3. **Ontology as interface** over framework-specific docs
4. **Compound structure** over degrading accuracy

---

## Conclusion: This is the Language

**ONE is not a framework. It's a LANGUAGE.**

- The 6 dimensions are the vocabulary (groups, people, things, connections, events, knowledge)
- Effect.ts is the grammar (composable services)
- The provider pattern is the adapter (any backend speaks it)
- Nanostores is the bridge (islands communicate)
- Context engineering is the efficiency (minimal information, maximum accuracy)

**Agents don't learn ONE. They SPEAK it.**

**Result:**
- Clone ANY feature from ANY system
- Map to 6 dimensions (always possible - it's reality)
- Generate structured code (Effect.ts patterns)
- Connect to ANY backend (provider adapters)
- Compound structure (each generation adds accuracy)

**This is how software should be built.**

---

**Next steps:**
1. Read `/one/knowledge/context-engineering.md` (documentation map)
2. Read `/one/knowledge/ontology.md` (the 6-dimension DSL)
3. Point agent-clone at any repo and watch features import into the ontology
4. Every feature adds structure. Every structure increases accuracy.

**The system never breaks. Because reality doesn't break.**
