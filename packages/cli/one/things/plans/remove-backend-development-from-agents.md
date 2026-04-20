# Plan: Frontend-First Development Strategy

**Status:** Draft
**Version:** 1.0.0
**Created:** 2025-11-07
**Owner:** Platform Team

---

## TL;DR

**🚨 CRITICAL: ALL AGENTS DEFAULT TO FRONTEND-ONLY 🚨**

**DEFAULT BEHAVIOR:**
- ✅ Build frontend with nanostores (NO backend code)
- ✅ Use Stripe.js for payments (client-side)
- ✅ Use Astro + React for UI
- ✅ Deploy to Vercel/Netlify
- ❌ NEVER import Convex
- ❌ NEVER write backend code
- ❌ NEVER create mutations/queries

**UNLESS user explicitly says:**
- "Use the backend"
- "Add groups/multi-tenant"
- "Integrate with ONE Platform"
- "Use services from /web/src/services"

**Then** help integrate existing services (don't build new backend code).

---

**Production apps with NO backend:**
- 🛒 **Ecommerce:** nanostores + Stripe.js
- 🎓 **LMS:** nanostores + local state
- 💼 **SaaS:** nanostores + localStorage

**Optional ONE Platform backend:**
- 👥 Groups (multi-tenant)
- 🔐 Multi-user (auth + roles)
- 📊 Events (tracking)
- 🔗 Connections (relationships)
- 🧠 Knowledge (RAG)

**Integration:** Import `/web/src/services` + `/web/src/providers` when explicitly requested.

---

## Problem Statement

When users request features like "build an ecommerce store," agents currently default to building both backend and frontend, even though:

1. **Users can build PRODUCTION-READY apps** with NO backend code
2. **Everything works in the browser** - payments (Stripe), storage (nanostores), business logic
3. **Backend is ONLY needed for** authentication and multi-device sync
4. **Frontend agents should build first** - focus on pure frontend development

**Current behavior:**
- User: "Build an ecommerce store with Stripe"
- Agent: Creates Convex backend, mutations, queries, schema, AND frontend
- Result: User forced to deploy backend, manage database, configure Convex

**Desired behavior:**
- User: "Build an ecommerce store with Stripe"
- Agent: Creates pure frontend with nanostores + Stripe.js client-side
- Result: **COMPLETE, WORKING ECOMMERCE STORE** with NO backend code
- User: "Add auth so users can access from multiple devices" (explicit need)
- Agent: Then adds backend for auth + multi-device sync

## Real-World Examples (NO Backend Needed)

### ✅ Full Ecommerce Store
- Product catalog (nanostores)
- Shopping cart (persistent in browser)
- Stripe checkout (client-side Stripe.js)
- Order history (localStorage)
- **NO backend required**

### ✅ Learning Management System
- Course catalog with videos, lessons, quizzes (nanostores)
- Lesson content and resources (local data)
- Progress tracking per course (persistent in browser)
- Certificates generated client-side (canvas/PDF)
- Quiz results and scoring (nanostores)
- **NO backend required**
- **Add backend later** for multi-user authentication

### ✅ Project Management Tool
- Projects, tasks, kanban boards (nanostores)
- Drag-and-drop (local state)
- Filters, search (client-side)
- **NO backend required** (except real-time collaboration)

### 🚀 When to Add ONE Platform Backend
- **Groups/Communities** - Multi-tenant organizations, teams
- **Multi-user** - Multiple users per group with roles
- **Activity tracking** - Events, analytics, audit logs
- **Connections** - Rich relationships between entities
- **Knowledge/RAG** - Semantic search, embeddings, AI
- **Real-time sync** - Live updates across devices
- **6-Dimension Ontology** - Full platform capabilities

**Integration: Import services from `/web/src/services` + providers from `/web/src/providers`**

## Goals

1. **ALWAYS build frontend-only by default** - NO backend code unless explicitly requested
2. **Frontend agents ONLY build UI** - nanostores + React + Astro
3. **Backend integration is OPTIONAL** - Only when user says "use backend" or "add groups/multi-user"
4. **All agents updated** - Every agent defaults to frontend-only
5. **Users ship TODAY** - No backend setup, no database config, just pure frontend

## Strategy

### 1. Mindset Shift: Production Apps Need No Backend

**EVERYTHING works client-side: Payments, business logic, data storage, user flows.**

```
❌ OLD: "Build ecommerce" → Backend + database + API + frontend
✅ NEW: "Build ecommerce" → Pure frontend + Stripe.js (DONE!)

❌ OLD: "Build LMS" → Convex schema + mutations + queries + frontend
✅ NEW: "Build LMS" → Pure frontend + nanostores (DONE!)
```

**What Works Without Backend (Production-Ready):**
- ✅ **Payments** - Stripe.js, PayPal SDK (client-side checkout)
- ✅ **Storage** - nanostores + localStorage (up to 10MB per domain)
- ✅ **Business logic** - All in TypeScript client-side
- ✅ **User flows** - Cart, checkout, courses, progress tracking
- ✅ **Offline-first** - Progressive Web Apps with service workers
- ✅ **Analytics** - Google Analytics, Plausible (client-side tracking)
- ✅ **Email** - EmailJS, FormSubmit (client-side email services)

**ONE Platform Backend Provides:**
1. **Groups** - Multi-tenant organizations (friend circles → businesses → governments)
2. **People** - Multi-user with roles (platform_owner, org_owner, org_user, customer)
3. **Things** - 66+ entity types (users, content, courses, products, tokens, NFTs, etc.)
4. **Connections** - 25+ relationship types (owns, follows, enrolled_in, etc.)
5. **Events** - 67+ event types (activity tracking, analytics, audit logs)
6. **Knowledge** - RAG, embeddings, semantic search

**But users should build FRONTEND FIRST, then add backend via `/web/src/services` + `/web/src/providers`**

### 2. Two Development Modes

| Mode | When | What Gets Built |
|------|------|-----------------|
| **Pure Frontend** (default) | "Build ecommerce store"<br/>"Build LMS"<br/>"Build SaaS tool" | ✅ Complete, production-ready app<br/>✅ nanostores for state<br/>✅ Stripe.js for payments<br/>✅ NO backend code<br/>✅ Deploy to Vercel/Netlify |
| **Add ONE Platform** (explicit) | "Add groups/multi-user"<br/>"Add activity tracking"<br/>"Add connections/events"<br/>"Add knowledge/RAG" | ✅ Keep frontend mostly as-is<br/>✅ Import from `/web/src/services`<br/>✅ Add providers from `/web/src/providers`<br/>✅ Get full 6-dimension ontology |

### 3. Detection Keywords

**Frontend-Only Indicators** (default):
- "Build a [feature]" (no backend mentioned)
- "Create a page for..."
- "Add a component that..."
- "Design a UI for..."
- "Show users..."
- "Display..."
- "Make it look like..."

**ONE Platform Integration** (explicit request):
- "Add groups/multi-tenant"
- "Add multi-user with roles"
- "Add activity tracking/events"
- "Add connections between entities"
- "Add knowledge/RAG"
- "Integrate with ONE Platform"
- "Add the backend"

**How users integrate:**
```typescript
// Look at /web/src/services and /web/src/providers
import { GroupProvider } from '@/providers/GroupProvider';
import { useGroups } from '@/services/groups';

// Drop in providers
<GroupProvider>
  <App />
</GroupProvider>

// Use services (replaces nanostores)
const groups = useGroups();
```

## Implementation Plan

### Phase 1: Update Agent Instructions

#### A. Update `agent-director.md`

```markdown
## Routing Logic (UPDATED)

**🚨 CRITICAL: ALWAYS ROUTE TO FRONTEND-ONLY BY DEFAULT 🚨**

**DEFAULT BEHAVIOR (99% of requests):**
Route to `agent-frontend` ONLY. Build pure frontend with nanostores.

Examples:
- "Build an ecommerce store" → `agent-frontend` ONLY (nanostores + Stripe.js)
- "Build an LMS" → `agent-frontend` ONLY (nanostores)
- "Build a SaaS tool" → `agent-frontend` ONLY (nanostores)
- "Add payment processing" → `agent-frontend` ONLY (Stripe.js client-side)
- "Add user dashboard" → `agent-frontend` ONLY (nanostores)

**EXCEPTION: User Explicitly Requests Backend Integration (1% of requests)**

Only route to `agent-backend` when user explicitly says:
- "Use the backend"
- "Add groups/multi-tenant"
- "Add multi-user"
- "Integrate with ONE Platform"
- "Add activity tracking with backend"
- "Use services from /web/src/services"

Then `agent-backend` helps integrate existing services/providers (NOT build new backend code).

**KEY RULE: If user doesn't say "backend" or "use services", route to frontend-only.**
```

#### B. Update `agent-frontend.md`

```markdown
## Core Principle: ALWAYS Build Frontend-Only

**🚨 CRITICAL: YOU ONLY BUILD FRONTEND. NEVER TOUCH BACKEND. 🚨**

**Your ONLY job:**
1. Build UI with React components
2. Manage state with nanostores
3. Create Astro pages
4. Style with Tailwind + shadcn/ui
5. Deploy to Vercel/Netlify

**You NEVER:**
- ❌ Import from Convex
- ❌ Write backend code
- ❌ Create mutations/queries
- ❌ Touch database
- ❌ Use API calls (except client-side like Stripe.js)

**Default tools:**
- ✅ nanostores (state + persistence)
- ✅ React 19 components
- ✅ Astro 5 pages
- ✅ shadcn/ui components
- ✅ Tailwind CSS v4
- ✅ TypeScript

**If user wants backend integration, tell them to explicitly request "use backend" - then agent-backend will help integrate services from /web/src/services.**

## State Management with Nanostores

### Option 1: Atoms (Simple Values) - Recommended

```typescript
// src/stores/cart.ts
import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

// Simple atom (in-memory only)
export const cartCount = atom(0);

// Persistent atom (saved to localStorage)
export const cart = persistentAtom('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Actions
export function addToCart(item) {
  cart.set([...cart.get(), item]);
  cartCount.set(cart.get().length);
}

export function clearCart() {
  cart.set([]);
  cartCount.set(0);
}
```

**Usage in React:**
```typescript
import { useStore } from '@nanostores/react';
import { cart, addToCart } from '@/stores/cart';

export function Cart() {
  const $cart = useStore(cart);

  return (
    <div>
      {$cart.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

**Usage in Astro:**
```astro
---
import { cart } from '@/stores/cart';
const items = cart.get();
---

<div>
  {items.map(item => (
    <div>{item.name}</div>
  ))}
</div>
```

### Option 2: Maps (Complex Objects)

```typescript
// src/stores/products.ts
import { map } from 'nanostores';
import { persistentMap } from '@nanostores/persistent';

export const products = persistentMap('products:', {
  items: [],
  loading: false,
  error: null,
});

// Actions
export function setProducts(items) {
  products.setKey('items', items);
}

export function setLoading(loading) {
  products.setKey('loading', loading);
}
```

### Option 3: IndexedDB for Large Data

```typescript
import { openDB } from 'idb';

const db = await openDB('my-database', 1, {
  upgrade(db) {
    db.createObjectStore('items');
  },
});

// Store data
await db.put('items', item, id);

// Retrieve data
const item = await db.get('items', id);

// List all
const allItems = await db.getAll('items');
```

## Storage Guidelines

**Use nanostores for everything:**

- **persistentAtom**: Most use cases - auto-syncs to localStorage (< 5MB)
- **atom**: In-memory only state (when persistence not needed)
- **map**: Complex objects with multiple properties
- **computed**: Derived values from other stores

**Only use IndexedDB if:**
- Need to store > 5MB of data
- Need complex queries on large datasets
- Building offline-first with sync capabilities

**Default choice: persistentAtom** (334 bytes, works everywhere, auto-persists)

## Frontend-Only Development Pattern

**Example: Build an Ecommerce Store**

```typescript
// ✅ PURE FRONTEND - NO BACKEND CODE

// 1. Define your data types
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  inventory: number;
  image: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// 2. Create nanostores for state management
// src/stores/ecommerce.ts
import { persistentAtom } from '@nanostores/persistent';

// Persistent stores (saved to localStorage)
export const products = persistentAtom<Product[]>('products', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cart = persistentAtom<CartItem[]>('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const orders = persistentAtom<Order[]>('orders', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Actions
export function addToCart(product: Product) {
  const currentCart = cart.get();
  const existing = currentCart.find(item => item.product.id === product.id);

  if (existing) {
    cart.set(
      currentCart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  } else {
    cart.set([...currentCart, { product, quantity: 1 }]);
  }
}

export function checkout() {
  const currentCart = cart.get();
  const order = {
    id: crypto.randomUUID(),
    items: currentCart,
    total: currentCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    date: new Date().toISOString()
  };

  orders.set([...orders.get(), order]);
  cart.set([]);
}

// 3. Build UI components
import { useStore } from '@nanostores/react';

export function ProductList() {
  const $products = useStore(products);

  return (
    <div className="grid grid-cols-3 gap-4">
      {$products.map(product => (
        <div key={product.id} className="border rounded p-4">
          <img src={product.image} alt={product.name} />
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          <button onClick={() => addToCart(product)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

export function Cart() {
  const $cart = useStore(cart);

  return (
    <div>
      {$cart.map(item => (
        <div key={item.product.id}>
          {item.product.name} x {item.quantity} = ${item.product.price * item.quantity}
        </div>
      ))}
      <button onClick={checkout}>Checkout</button>
    </div>
  );
}
```

// 4. Stripe Integration (Client-Side Checkout)
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

export async function handleCheckout() {
  const $cart = cart.get();

  // Create Stripe checkout session (client-side)
  const { error } = await stripe.redirectToCheckout({
    lineItems: $cart.map(item => ({
      price: item.product.stripePriceId,
      quantity: item.quantity,
    })),
    mode: 'payment',
    successUrl: `${window.location.origin}/success`,
    cancelUrl: `${window.location.origin}/cart`,
  });

  if (error) {
    console.error('Stripe error:', error);
  }
}

// 5. Success page - record order
// src/pages/success.astro
---
import { orders, cart } from '@/stores/ecommerce';

// On successful payment, save order
const order = {
  id: crypto.randomUUID(),
  items: cart.get(),
  total: cart.get().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  date: new Date().toISOString(),
  status: 'paid'
};

orders.set([...orders.get(), order]);
cart.set([]); // Clear cart
---

<h1>Order Confirmed!</h1>
<p>Order ID: {order.id}</p>
```

**What you build (PRODUCTION-READY):**
- ✅ Product catalog with images, prices, descriptions
- ✅ Shopping cart with add/remove/quantity
- ✅ **Stripe checkout (real payments!)**
- ✅ Order confirmation page
- ✅ Order history
- ✅ ALL state in nanostores
- ✅ Deploy to Vercel/Netlify
- ✅ **ZERO backend code**

**What you DON'T build:**
- ❌ ANY backend code
- ❌ NO Convex imports
- ❌ NO API calls
- ❌ NO database
- ❌ NO server

## When to Add ONE Platform Backend

**⚠️ BUILD FRONTEND FIRST. Default answer: "Use nanostores."**

**Integrate ONE Platform when user explicitly requests:**

1. **"Add groups/multi-tenant"** → Import `/web/src/services/groups` + `GroupProvider`
2. **"Add multi-user with roles"** → Import `/web/src/providers/AuthProvider`
3. **"Add activity tracking"** → Import `/web/src/services/events`
4. **"Add connections/relationships"** → Import `/web/src/services/connections`
5. **"Add knowledge/RAG"** → Import `/web/src/services/knowledge`
6. **"Integrate with ONE Platform"** → Show user how to import services/providers

**DON'T build new backend code. Just show users how to integrate existing services:**
- ✅ Point them to `/web/src/services` (available services)
- ✅ Point them to `/web/src/providers` (available providers)
- ✅ Show integration examples
- ❌ Don't create new Convex mutations/queries
- ❌ Don't extend backend schema

**Remember: Frontend agents build UI. Backend integration is a drop-in via services/providers.**
```

#### C. Update `agent-backend.md`

```markdown
## When to Use This Agent

**⚠️ IMPORTANT: Don't build new backend code. Show users how to integrate existing services.**

The ONE Platform backend is COMPLETE with:
- Groups (multi-tenant)
- People (multi-user + roles)
- Things (66+ entity types)
- Connections (25+ relationship types)
- Events (67+ event types)
- Knowledge (RAG/embeddings)

**Your job: Help users integrate existing services/providers, not build new backend code.**

**When user requests backend integration:**

1. **Point them to `/web/src/services`**
   - `services/groups` - Multi-tenant organizations
   - `services/events` - Activity tracking
   - `services/connections` - Relationships
   - `services/knowledge` - RAG/embeddings
   - `services/auth` - Authentication

2. **Point them to `/web/src/providers`**
   - `GroupProvider` - Wrap app for multi-tenant
   - `AuthProvider` - User authentication
   - `EventProvider` - Activity tracking

3. **Show integration example:**
   ```typescript
   // Replace nanostores with services
   // Before: const groups = persistentAtom('groups', []);
   // After: const groups = useGroups(); // from /web/src/services/groups

   // Wrap app with providers
   <GroupProvider>
     <EventProvider>
       <App />
     </EventProvider>
   </GroupProvider>
   ```

**DON'T:**
- ❌ Create new Convex mutations/queries
- ❌ Extend backend schema
- ❌ Build custom backend logic

**DO:**
- ✅ Show available services in `/web/src/services`
- ✅ Show available providers in `/web/src/providers`
- ✅ Provide integration examples
- ✅ Help migrate nanostores → services

**Default answer: "Use existing services from /web/src/services"**
```

#### D. Update `CLAUDE.md`

Add new section:

```markdown
## Pure Frontend Development (Default Mode)

**CRITICAL: Default to pure frontend development with NO backend code.**

### Build Complete Apps Without Backend

Users can build fully-functional applications using ONLY frontend code:
- ✅ nanostores (state + persistence in 334 bytes)
- ✅ React components and hooks
- ✅ Astro pages (SSR or static)
- ✅ TypeScript for type safety
- ✅ shadcn/ui components
- ✅ Tailwind CSS styling

**NO backend code required. NO database. NO server. NO API calls.**

### What This Means for Feature Development

**When user says: "Build [feature]"**
1. ✅ Build pure frontend with nanostores
2. ✅ Use persistentAtom (auto-syncs to localStorage)
3. ✅ Create beautiful, functional UI
4. ❌ DON'T write ANY backend code
5. ❌ DON'T import from Convex
6. ❌ DON'T make API calls

**When user says: "Add backend to [feature]"**
1. ✅ Now integrate with backend
2. ✅ Replace nanostores with API calls
3. ✅ Add real-time sync if needed

### Quick Reference

**Pure Frontend (default):**
```typescript
// ✅ User: "Build an ecommerce store"
import { persistentAtom } from '@nanostores/persistent';

export const cart = persistentAtom('cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export function addToCart(product) {
  cart.set([...cart.get(), product]);
}
```

**With Backend Integration (explicit request):**
```typescript
// ✅ User: "Add backend to sync cart across devices"
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

const cart = useQuery(api.queries.cart.get);
const addToCart = useMutation(api.mutations.cart.add);
```

### Why Nanostores

- **Tiny**: 334 bytes (smallest state library)
- **Persistent**: `persistentAtom` auto-syncs localStorage
- **Universal**: Works in Astro, React, Vue, Svelte, vanilla JS
- **Type-safe**: Full TypeScript support
- **Simple**: `.get()` to read, `.set()` to write
```

### Phase 2: Create Frontend-Only Examples

Create `one/knowledge/frontend-patterns.md`:

```markdown
# Frontend-Only Development Patterns

## Pattern 1: Social Media App (Pure Frontend)

**Example: Twitter/X Clone**

```typescript
// ✅ PURE FRONTEND - NO BACKEND CODE

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaUrl?: string;
  tags: string[];
  likes: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  following: string[]; // User IDs
  followers: string[]; // User IDs
}

// State management with nanostores
// src/stores/social.ts
import { persistentAtom } from '@nanostores/persistent';

export const currentUser = persistentAtom<User | null>('currentUser', null, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const users = persistentAtom<User[]>('users', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const posts = persistentAtom<Post[]>('posts', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Actions
export function createPost(content: string, mediaUrl?: string) {
  const user = currentUser.get();
  if (!user) return;

  const newPost: Post = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorName: user.name,
    authorAvatar: user.avatar,
    content,
    mediaUrl,
    tags: content.match(/#\w+/g) || [],
    likes: 0,
    createdAt: new Date().toISOString()
  };

  posts.set([newPost, ...posts.get()]);
}

export function followUser(targetUserId: string) {
  const user = currentUser.get();
  if (!user) return;

  currentUser.set({
    ...user,
    following: [...user.following, targetUserId]
  });

  users.set(
    users.get().map(u =>
      u.id === targetUserId
        ? { ...u, followers: [...u.followers, user.id] }
        : u
    )
  );
}

export function likePost(postId: string) {
  posts.set(
    posts.get().map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    )
  );
}

// UI Components
import { useStore } from '@nanostores/react';

export function Feed() {
  const $posts = useStore(posts);
  const $currentUser = useStore(currentUser);
  const following = $currentUser?.following || [];

  // Filter to show posts from followed users
  const feedPosts = $posts.filter(p =>
    following.includes(p.authorId) || p.authorId === $currentUser?.id
  );

  return (
    <div className="space-y-4">
      {feedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function PostComposer() {
  const [content, setContent] = useState('');

  return (
    <div className="bg-white p-4 rounded shadow">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's happening?"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={() => {
          createPost(content);
          setContent('');
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Post
      </button>
    </div>
  );
}
```

**What you build (PURE FRONTEND):**
- ✅ Feed page (`src/pages/feed.astro`)
- ✅ Post composer (`src/components/PostComposer.tsx`)
- ✅ User profile (`src/pages/profile/[id].astro`)
- ✅ Follow/unfollow UI
- ✅ Like/comment components
- ✅ Local state with browser persistence

**What you DON'T build:**
- ❌ ANY backend code
- ❌ NO API calls
- ❌ NO database operations

## Pattern 2: Course Platform (Pure Frontend)

**Example: Online Learning App**

```typescript
// ✅ PURE FRONTEND - NO BACKEND CODE

interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  price: number;
  lessons: Lesson[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl: string;
  duration: number; // seconds
  order: number;
}

interface Enrollment {
  userId: string;
  courseId: string;
  progress: number; // percentage
  completedLessons: string[]; // lesson IDs
  enrolledAt: string;
  lastAccessedAt: string;
}

// State management with nanostores
// src/stores/courses.ts
import { persistentAtom } from '@nanostores/persistent';

export const courses = persistentAtom<Course[]>('courses', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const enrollments = persistentAtom<Enrollment[]>('enrollments', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Actions
export function enrollInCourse(courseId: string, userId: string) {
  const enrollment: Enrollment = {
    userId,
    courseId,
    progress: 0,
    completedLessons: [],
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString()
  };
  enrollments.set([...enrollments.get(), enrollment]);
}

export function completeLesson(userId: string, courseId: string, lessonId: string) {
  const allEnrollments = enrollments.get();
  const enrollment = allEnrollments.find(
    e => e.userId === userId && e.courseId === courseId
  );

  if (!enrollment) return;

  const course = courses.get().find(c => c.id === courseId);
  if (!course) return;

  const updatedEnrollment = {
    ...enrollment,
    completedLessons: [...enrollment.completedLessons, lessonId],
    progress: ((enrollment.completedLessons.length + 1) / course.lessons.length) * 100,
    lastAccessedAt: new Date().toISOString()
  };

  enrollments.set(
    allEnrollments.map(e =>
      e.userId === userId && e.courseId === courseId
        ? updatedEnrollment
        : e
    )
  );
}

// UI Components
import { useStore } from '@nanostores/react';

export function CourseCatalog() {
  const $courses = useStore(courses);

  return (
    <div className="grid grid-cols-3 gap-6">
      {$courses.map(course => (
        <div key={course.id} className="border rounded p-4">
          <h3 className="text-xl font-bold">{course.name}</h3>
          <p className="text-gray-600">{course.instructor}</p>
          <p className="text-sm">{course.lessons.length} lessons</p>
          <p className="text-lg font-bold">${course.price}</p>
          <button
            onClick={() => enrollInCourse(course.id, currentUserId)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Enroll Now
          </button>
        </div>
      ))}
    </div>
  );
}

export function ProgressDashboard({ userId }: { userId: string }) {
  const $enrollments = useStore(enrollments);
  const userEnrollments = $enrollments.filter(e => e.userId === userId);

  return (
    <div className="space-y-4">
      {userEnrollments.map(enrollment => (
        <div key={enrollment.courseId} className="border rounded p-4">
          <h3>Course Progress</h3>
          <div className="w-full bg-gray-200 rounded">
            <div
              className="bg-green-500 h-4 rounded"
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <p>{enrollment.progress.toFixed(0)}% complete</p>
        </div>
      ))}
    </div>
  );
}
```

**What you build (PURE FRONTEND):**
- ✅ Course catalog (`src/pages/courses/index.astro`)
- ✅ Course detail page (`src/pages/courses/[id].astro`)
- ✅ Lesson viewer (`src/components/LessonViewer.tsx`)
- ✅ Progress dashboard (`src/pages/dashboard.astro`)
- ✅ Certificate generator
- ✅ Local progress tracking

**What you DON'T build:**
- ❌ ANY backend code
- ❌ NO API calls
- ❌ NO database operations

## Pattern 3: Team Collaboration Tool (Pure Frontend)

**Example: Project Management App**

```typescript
// ✅ PURE FRONTEND - NO BACKEND CODE

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  deadline: string;
  teamId: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string; // user ID
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  members: string[]; // user IDs
}

// State management with nanostores
// src/stores/projects.ts
import { persistentAtom } from '@nanostores/persistent';

export const teams = persistentAtom<Team[]>('teams', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const projects = persistentAtom<Project[]>('projects', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const tasks = persistentAtom<Task[]>('tasks', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Actions
export function createTask(task: Omit<Task, 'id' | 'createdAt'>) {
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  tasks.set([...tasks.get(), newTask]);
}

export function updateTaskStatus(taskId: string, status: Task['status']) {
  tasks.set(
    tasks.get().map(t =>
      t.id === taskId ? { ...t, status } : t
    )
  );
}

export function assignTask(taskId: string, userId: string) {
  tasks.set(
    tasks.get().map(t =>
      t.id === taskId ? { ...t, assignedTo: userId } : t
    )
  );
}

// UI Components
import { useStore } from '@nanostores/react';

export function KanbanBoard({ projectId }: { projectId: string }) {
  const $tasks = useStore(tasks);
  const projectTasks = $tasks.filter(t => t.projectId === projectId);

  const columns = {
    todo: projectTasks.filter(t => t.status === 'todo'),
    in_progress: projectTasks.filter(t => t.status === 'in_progress'),
    done: projectTasks.filter(t => t.status === 'done')
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(columns).map(([status, columnTasks]) => (
        <div key={status} className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-4">{status.replace('_', ' ').toUpperCase()}</h3>
          <div className="space-y-2">
            {columnTasks.map(task => (
              <div
                key={task.id}
                className="bg-white p-3 rounded shadow cursor-move"
                draggable
                onDragEnd={(e) => {
                  // Handle drag and drop to change status
                }}
              >
                <h4 className="font-semibold">{task.title}</h4>
                <p className="text-sm text-gray-600">{task.description}</p>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.priority === 'high' ? 'bg-red-100' :
                  task.priority === 'medium' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**What you build (PURE FRONTEND):**
- ✅ Team dashboard
- ✅ Project kanban board
- ✅ Task list with filters
- ✅ Team member directory
- ✅ Activity feed
- ✅ Drag-and-drop task management

**What you DON'T build:**
- ❌ ANY backend code
- ❌ NO API calls
- ❌ NO database operations
```

### Phase 3: Update Documentation

1. **`one/knowledge/quick-start.md`** - Add "Building Your First Feature (Frontend-Only)" section
2. **`one/connections/workflow.md`** - Update Phase 4 to emphasize frontend-first
3. **`web/AGENTS.md`** - Add "When to Use Backend vs Frontend" decision tree
4. **`README.md`** - Update examples to show frontend-only patterns

### Phase 4: Add Guardrails

Create `.claude/hooks/check-backend-request.py`:

```python
#!/usr/bin/env python3
"""
Hook: Warn when backend development starts without explicit request
"""

import sys
import json

def check_backend_intent(user_message):
    """Check if user explicitly requested backend work"""

    backend_keywords = [
        "backend", "database", "schema", "mutation", "query",
        "convex function", "business logic", "custom backend"
    ]

    # If message contains backend keywords, allow
    for keyword in backend_keywords:
        if keyword.lower() in user_message.lower():
            return True

    return False

if __name__ == "__main__":
    # Read user input
    user_message = sys.argv[1] if len(sys.argv) > 1 else ""

    # Check if backend work is justified
    if not check_backend_intent(user_message):
        print("⚠️  TIP: Consider building frontend-only using existing backend services.")
        print("The ONE Platform backend already provides:")
        print("  • 66+ entity types (things)")
        print("  • 25+ connection types")
        print("  • 67+ event types")
        print("")
        print("Only create backend code if you need:")
        print("  • New entity/connection/event types")
        print("  • Complex business logic")
        print("  • External integrations")
        print("")
        print("Check backend/convex/schema.ts for available types.")
        print("")

    sys.exit(0)  # Always allow, just warn
```

## Success Metrics

**After implementation, we should see:**

1. **98%+ of apps built with NO backend** - Ecommerce, LMS, SaaS all work client-side
2. **Production-ready in minutes** - Deploy to Vercel/Netlify immediately
3. **Real payments working** - Stripe/PayPal integrated client-side
4. **Zero backend knowledge needed** - Users build and ship without Convex
5. **Backend only for auth + sync** - Added explicitly when requested

## Migration Path

**For existing users:**

1. **Announcement** - "The backend is complete. Focus on frontend."
2. **Examples** - Show 10 common features built frontend-only
3. **Documentation** - Update all guides to frontend-first approach
4. **Support** - Help migrate any in-progress backend work to frontend

**For new users:**

1. **Onboarding** - "You're building on a complete backend"
2. **Quick start** - First feature is frontend-only
3. **Examples** - All tutorials show frontend-only patterns
4. **Backend docs** - Marked "Advanced" and "Usually not needed"

## FAQ

**Q: Can I really accept payments without a backend?**
A: YES! Stripe.js and PayPal SDK handle payments client-side. No backend needed. Thousands of businesses use this.

**Q: What about storing user data?**
A: nanostores + localStorage gives you up to 10MB per domain. That's enough for most apps. IndexedDB for larger datasets.

**Q: How do I handle user authentication?**
A: For single-device: Just store auth state in nanostores. For multi-device: Use Clerk or Auth0 (client-side) or add backend later.

**Q: Can I build a real business on this?**
A: Absolutely! Many successful businesses run on client-side only. Examples: landing pages with Stripe, course platforms, productivity tools.

**Q: What about SEO?**
A: Astro provides SSR and static generation. Full SEO support without backend.

**Q: When should I add the ONE Platform backend?**
A: When you want: (1) Groups/multi-tenant, (2) Multi-user with roles, (3) Activity tracking/events, (4) Connections/relationships, (5) Knowledge/RAG, (6) Real-time sync. Start frontend-first, integrate backend later via `/web/src/services` and `/web/src/providers`.

**Q: How hard is it to integrate the backend?**
A: Super easy! Just import services and providers. Your frontend code mostly stays the same - you're just swapping nanostores for backend services. Check `/web/src/services` and `/web/src/providers` for examples.

**Q: What does the backend give me?**
A: The full 6-dimension ontology: Groups (multi-tenant), People (multi-user + roles), Things (66+ entity types), Connections (25+ relationship types), Events (67+ event types), Knowledge (RAG/embeddings). It's a complete platform, not just auth + sync.

## Next Steps

### Phase 1: Update ALL Agents to Default Frontend-Only

**🚨 CRITICAL: Every agent must default to frontend-only unless user says "use backend" 🚨**

1. ✅ Create this plan document
2. ⏳ Update `.claude/agents/agent-director.md` - Route frontend-only by default (99% of requests)
3. ⏳ Update `.claude/agents/agent-frontend.md` - ONLY build frontend, NEVER touch backend
4. ⏳ Update `.claude/agents/agent-backend.md` - Help integrate services, DON'T build new backend
5. ⏳ Update `.claude/agents/agent-builder.md` - Default to frontend-only
6. ⏳ Update `.claude/agents/agent-designer.md` - Design for frontend-only apps
7. ⏳ Update `.claude/agents/agent-quality.md` - Test frontend-only apps
8. ⏳ Update `CLAUDE.md` - Add "Frontend-First Development" section
9. ⏳ Create frontend-only examples (ecommerce + Stripe, LMS, SaaS)

### Phase 2: Test and Verify

10. ⏳ Test: "Build an ecommerce store" → Should produce ONLY frontend code (nanostores + Stripe.js)
11. ⏳ Test: "Build an LMS" → Should produce ONLY frontend code (nanostores)
12. ⏳ Test: "Build an ecommerce store with backend" → Should integrate services from /web/src/services
13. ⏳ Verify NO Convex imports unless explicitly requested

### Phase 3: Deploy and Monitor

14. ⏳ Deploy updated agents
15. ⏳ Monitor success metrics (target: 98%+ frontend-only)

---

## Final Word

**🚨 ALL AGENTS DEFAULT TO FRONTEND-ONLY 🚨**

**UNLESS USER EXPLICITLY SAYS "USE BACKEND":**

**What agents build (99% of requests):**
- ✅ Pure frontend with nanostores
- ✅ Stripe.js for payments (client-side)
- ✅ React + Astro UI components
- ✅ NO backend code
- ✅ NO Convex imports
- ✅ Deploy to Vercel/Netlify TODAY

**What agents DON'T build (unless requested):**
- ❌ Backend code
- ❌ Convex mutations/queries
- ❌ Database schema
- ❌ API endpoints

**Only when user says "use backend" or "add groups/multi-user":**
- Then help integrate existing services from `/web/src/services`
- Then help add providers from `/web/src/providers`
- DON'T build new backend code, just integrate existing

**Every agent updated:**
- agent-director → Routes frontend-only by default
- agent-frontend → NEVER touches backend
- agent-backend → Integrates services (doesn't build new)
- agent-builder → Defaults to frontend-only
- agent-designer → Designs for frontend-only
- agent-quality → Tests frontend-only

**DEFAULT = FRONTEND-ONLY. Backend integration is OPTIONAL and EXPLICIT.**
