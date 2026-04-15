---
title: Performance Optimization Guide
dimension: knowledge
category: performance
tags: optimization, performance, speed, efficiency, lighthouse
related_dimensions: all
scope: global
created: 2025-11-08
version: 1.0.0
ai_context: |
  Comprehensive guide to performance optimization in the ONE platform,
  covering Astro islands, code splitting, caching, and database optimization.
---

# Performance Optimization Guide

**Build fast applications that scale.**

---

## Core Performance Principles

1. **Static by default** - Ship HTML, not JavaScript
2. **Progressive enhancement** - Add interactivity strategically
3. **Lazy loading** - Load what's needed, when it's needed
4. **Optimize database queries** - Use indexes, batch operations
5. **Edge deployment** - Serve from 330+ locations worldwide

---

## Astro Islands Architecture

**Performance principle:** Static HTML by default. Add interactivity strategically.

### Client Directives

```astro
<!-- Static (no JS) - BEST -->
<ProductCard product={product} />

<!-- Interactive (loads immediately) - Use sparingly -->
<ShoppingCart client:load />

<!-- Deferred (loads when idle) - Good for non-critical -->
<SearchBox client:idle />

<!-- Lazy (loads when visible) - Best for below-fold -->
<RelatedProducts client:visible />

<!-- Client-only (never SSR) - Use for browser APIs -->
<BrowserWidget client:only="react" />
```

### Performance Impact

| Directive | Initial JS | TTI Impact | Use Case |
|-----------|-----------|------------|----------|
| None (static) | 0KB | None | Default for everything |
| `client:visible` | Lazy | Minimal | Below-fold content |
| `client:idle` | Deferred | Low | Non-critical features |
| `client:load` | Immediate | Medium | Critical interactivity |
| `client:only` | Immediate | Medium | Browser-only components |

**Golden Rule:** Start with no directive. Add `client:*` only when interactivity is required.

---

## Code Splitting

### Dynamic Imports

```typescript
// Split heavy components
import { lazy } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));
const VideoPlayer = lazy(() => import('./VideoPlayer'));

// Use with Suspense
<Suspense fallback={<Skeleton />}>
  <HeavyChart data={data} />
</Suspense>
```

### Route-Based Splitting

```typescript
// Astro automatically code-splits by route
// Each page = separate bundle

// pages/index.astro        → index.js
// pages/products/[id].astro → products-[id].js
// pages/checkout.astro     → checkout.js
```

**Result:** Each page loads only the JS it needs.

---

## Image Optimization

### Astro Image Component

```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.jpg';
---

<!-- Optimized with multiple formats -->
<Image
  src={hero}
  alt="Hero image"
  width={1200}
  height={600}
  loading="lazy"
  format="webp"
/>
```

### Performance Gains

- Automatic format conversion (WebP, AVIF)
- Responsive images (`srcset`)
- Lazy loading by default
- Automatic width/height (prevents layout shift)

---

## Database Query Optimization

### 1. Use Indexes

```typescript
// schema.ts
defineTable({
  groupId: v.id("groups"),
  type: v.string(),
  name: v.string(),
  createdAt: v.number(),
})
  .index("by_group_type", ["groupId", "type"])
  .index("by_group_created", ["groupId", "createdAt"])
```

**Query pattern → Index required:**

```typescript
// Query pattern: list by group + type
.query("things")
  .withIndex("by_group_type", q =>
    q.eq("groupId", groupId).eq("type", type)
  )

// Index required: ["groupId", "type"]
```

### 2. Batch Operations

```typescript
// BAD: N+1 queries
for (const id of ids) {
  const thing = await ctx.db.get(id);  // 100 queries for 100 IDs
  results.push(thing);
}

// GOOD: Single batch operation
const things = await Promise.all(
  ids.map(id => ctx.db.get(id))
);  // 1 batch for 100 IDs
```

### 3. Use `first()` for Single Items

```typescript
// BAD: Collect all and take first
const things = await ctx.db
  .query("things")
  .withIndex("by_group_type", q => q.eq("groupId", groupId))
  .collect();
const thing = things[0];  // Fetches ALL, uses only 1

// GOOD: Use first()
const thing = await ctx.db
  .query("things")
  .withIndex("by_group_type", q => q.eq("groupId", groupId))
  .first();  // Fetches ONLY 1
```

### 4. Pagination

```typescript
// Paginate large result sets
export const listPaginated = query({
  args: {
    groupId: v.id("groups"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const results = await ctx.db
      .query("things")
      .withIndex("by_group_created", q => q.eq("groupId", args.groupId))
      .order("desc")
      .paginate({
        cursor: args.cursor,
        numItems: limit,
      });

    return results;
  },
});
```

---

## Caching Strategies

### 1. Edge Caching (Cloudflare)

```astro
---
// pages/api/products.ts
export const prerender = true;  // Static generation

// Or dynamic with cache headers
export async function get() {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
---
```

### 2. Convex Real-Time Caching

```typescript
// Convex automatically caches query results
// Invalidates cache on mutation

// queries/products.ts
export const list = query({
  handler: async (ctx) => {
    // Cached until mutation occurs
    return await ctx.db.query("products").collect();
  },
});

// mutations/products.ts
export const create = mutation({
  handler: async (ctx, args) => {
    // Mutation invalidates query cache
    return await ctx.db.insert("products", args);
  },
});
```

### 3. Browser Storage

```typescript
// Cache static data in localStorage
function getCachedData(key: string) {
  const cached = localStorage.getItem(key);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 3600000) {  // 1 hour
      return data;
    }
  }
  return null;
}

function setCachedData(key: string, data: any) {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now(),
  }));
}
```

---

## Bundle Size Optimization

### 1. Tree Shaking

```typescript
// GOOD: Named imports (tree-shakable)
import { Button } from '@/components/ui/button';

// BAD: Default import (entire package)
import * as UI from '@/components/ui';
```

### 2. Remove Unused Dependencies

```bash
# Analyze bundle size
bunx astro build --verbose

# Remove unused packages
bun remove unused-package
```

### 3. Use Smaller Alternatives

```typescript
// Instead of moment.js (67KB)
import { formatDistance } from 'date-fns';  // 2KB

// Instead of lodash (71KB)
import debounce from 'lodash.debounce';  // 1KB

// Instead of axios (15KB)
fetch('/api/data');  // Native, 0KB
```

---

## Lighthouse Optimization Checklist

**Target: 90+ score on all metrics**

### Performance (90+)

- [ ] Use static HTML by default (no `client:load`)
- [ ] Optimize images (WebP, lazy loading)
- [ ] Code split heavy components
- [ ] Remove unused CSS/JS
- [ ] Enable edge caching (Cloudflare)

### Accessibility (95+)

- [ ] Use semantic HTML (`<header>`, `<nav>`, `<main>`)
- [ ] Add ARIA labels where needed
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Color contrast ratio ≥ 4.5:1

### Best Practices (95+)

- [ ] HTTPS everywhere
- [ ] No console errors
- [ ] Proper meta tags
- [ ] Valid robots.txt
- [ ] Secure headers (CSP, HSTS)

### SEO (95+)

- [ ] Meta description on every page
- [ ] Proper heading hierarchy (H1 → H6)
- [ ] Alt text on all images
- [ ] Sitemap.xml generated
- [ ] Structured data (JSON-LD)

---

## Monitoring Performance

### 1. Lighthouse CI

```bash
# Run Lighthouse locally
bunx astro build
npx lighthouse http://localhost:4321 --view

# Target scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 95+
```

### 2. Web Vitals

```typescript
// Track Core Web Vitals
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(console.log);  // Cumulative Layout Shift
onFID(console.log);  // First Input Delay
onLCP(console.log);  // Largest Contentful Paint
```

### 3. Convex Dashboard

- Query latency (p50, p95, p99)
- Function execution time
- Database read/write operations
- Real-time active connections

**Target metrics:**
- Query latency p95: < 100ms
- Function execution: < 500ms
- Database reads: < 50ms
- Active connections: Monitor for leaks

---

## Performance Budget

**Set limits and enforce them:**

| Metric | Budget | Current | Status |
|--------|--------|---------|--------|
| Initial JS | < 100KB | 85KB | ✅ |
| Total Page Weight | < 500KB | 420KB | ✅ |
| Time to Interactive | < 3s | 2.1s | ✅ |
| First Contentful Paint | < 1.5s | 1.2s | ✅ |
| Lighthouse Score | > 90 | 94 | ✅ |

**Enforce in CI:**

```bash
# Fail build if bundle exceeds budget
bunx astro build
npx bundlesize
```

---

## Quick Wins

**Implement these for immediate gains:**

1. **Add `loading="lazy"` to images below fold**
   ```html
   <img src="hero.jpg" loading="lazy" alt="Hero" />
   ```

2. **Use `client:idle` instead of `client:load`**
   ```astro
   <SearchBox client:idle />  <!-- Deferred loading -->
   ```

3. **Enable Cloudflare cache**
   ```astro
   export const prerender = true;
   ```

4. **Add database indexes**
   ```typescript
   .index("by_group_type", ["groupId", "type"])
   ```

5. **Use WebP images**
   ```astro
   <Image format="webp" />
   ```

**Result:** 20-30 point Lighthouse score improvement in < 1 hour.

---

**Build fast. Stay fast. Monitor always.**
