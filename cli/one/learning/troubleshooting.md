---
title: Common Issues and Solutions
dimension: knowledge
category: troubleshooting
tags: debugging, errors, solutions, fixes
related_dimensions: all
scope: global
created: 2025-11-08
version: 1.0.0
ai_context: |
  Comprehensive troubleshooting guide for common issues in ONE platform
  development, with solutions and preventive measures.
---

# Common Issues and Solutions

**Quick fixes for frequent development problems.**

---

## TypeScript Errors

### Issue: TypeScript errors after schema changes

**Symptoms:**
- Type errors in Convex queries/mutations
- `_generated` types out of sync
- Import errors from `@/convex/_generated/api`

**Solution:**
```bash
# Regenerate Convex types
cd backend && npx convex dev

# Check frontend types
cd web && bunx astro check
```

**Prevention:**
- Always run `npx convex dev` after schema changes
- Wait for type generation to complete before coding
- Use TypeScript strict mode to catch issues early

---

## Authentication Issues

### Issue: Auth not working

**Symptoms:**
- Login fails silently
- Session not persisting
- `getUserIdentity()` returns null

**Solution:**
```bash
# 1. Check BETTER_AUTH_SECRET matches
# Compare web/.env.local and backend/.env.local
grep BETTER_AUTH_SECRET web/.env.local
grep BETTER_AUTH_SECRET backend/.env.local

# 2. Verify Convex deployment URL
grep PUBLIC_CONVEX_URL web/.env.local

# 3. Check auth configuration
cat backend/convex/auth.ts
```

**Common Causes:**
- `BETTER_AUTH_SECRET` mismatch between frontend and backend
- Wrong `PUBLIC_CONVEX_URL` in frontend
- Missing OAuth credentials
- Rate limiting triggered (check `@convex-dev/rate-limiter` logs)

**Prevention:**
- Use same `.env.local` template for web and backend
- Generate `BETTER_AUTH_SECRET` once and share it
- Test auth flow after any environment variable changes

---

## Hydration Issues

### Issue: Hydration mismatch

**Symptoms:**
- Console error: "Hydration failed"
- Component renders differently on server vs client
- Flash of unstyled content (FOUC)

**Solution:**
```astro
<!-- Add client:load directive to interactive components -->
<ShoppingCart client:load />

<!-- Or use client:only for client-only components -->
<ClientOnlyWidget client:only="react" />
```

**Common Causes:**
- Using browser APIs (localStorage, window) in SSR
- Date/time rendering (server timezone ≠ client timezone)
- Random values generated on server and client

**Prevention:**
```typescript
// Use client-only rendering for browser APIs
import { useEffect, useState } from 'react';

function BrowserComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Safe to use browser APIs here
  return <div>{localStorage.getItem('key')}</div>;
}
```

---

## Tailwind Styling Issues

### Issue: Tailwind styles not applying

**Symptoms:**
- Colors not rendering
- Custom theme variables not working
- Dark mode not switching

**Solution:**
```css
/* Ensure HSL format with hsl() wrapper */
@theme {
  --color-background: 0 0% 100%;  /* HSL format */
}

.my-component {
  background-color: hsl(var(--color-background));  /* hsl() wrapper */
}
```

**Common Causes:**
- Using OKLCH format instead of HSL
- Missing `hsl()` wrapper around CSS variables
- Using `@apply` directive (not supported in Tailwind v4)
- Missing `@source` directive for component files

**Prevention:**
- Always use HSL format: `H S% L%`
- Always wrap with `hsl()`: `hsl(var(--color-name))`
- Never use `@apply` in Tailwind v4
- Add `@source` directive to scan all component files

---

## Build Issues

### Issue: Build fails on Cloudflare

**Symptoms:**
- `react-dom/server` module not found
- Edge runtime errors
- SSR errors in production

**Solution:**
```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge'
      }
    }
  }
});
```

**Common Causes:**
- Missing `react-dom/server.edge` alias
- Using Node.js-specific APIs in edge runtime
- Missing environment variables in Cloudflare Pages

**Prevention:**
- Use `react-dom/server.edge` for Cloudflare compatibility
- Test builds locally: `bun run build`
- Verify environment variables in Cloudflare dashboard

---

## Convex Issues

### Issue: Query not updating in real-time

**Symptoms:**
- `useQuery` returns stale data
- Changes in database not reflected in UI
- Real-time subscriptions not working

**Solution:**
```typescript
// Ensure using useQuery (not ConvexHttpClient)
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  // CORRECT: Real-time subscription
  const data = useQuery(api.queries.things.list, { groupId });

  // WRONG: Static fetch (no real-time updates)
  // const data = await client.query(api.queries.things.list, { groupId });
}
```

**Common Causes:**
- Using `ConvexHttpClient` instead of `useQuery` hook
- Component not wrapped in `ConvexProvider`
- Query invalidation not triggered
- Index not defined for query pattern

**Prevention:**
- Always use `useQuery` for real-time data
- Wrap app in `ConvexProvider`
- Define indexes for all query patterns
- Test real-time updates during development

---

## Content Collections Issues

### Issue: Content not found or types missing

**Symptoms:**
- `getCollection()` returns empty array
- Type errors on `post.data` fields
- Content not appearing on pages

**Solution:**
```bash
# Regenerate content types
bunx astro sync

# Check content directory structure
ls -la src/content/blog/

# Verify schema matches content
cat src/content/config.ts
```

**Common Causes:**
- Missing `bunx astro sync` after content changes
- Schema doesn't match content frontmatter
- Content files in wrong directory
- Invalid YAML frontmatter

**Prevention:**
- Run `bunx astro sync` after adding/changing content
- Validate frontmatter matches schema
- Use TypeScript types: `CollectionEntry<"blog">`
- Test content rendering locally before deploying

---

## Multi-Tenancy Issues

### Issue: Cross-tenant data leaks

**Symptoms:**
- User sees data from other groups
- Queries return data from wrong groupId
- Security audit fails

**Solution:**
```typescript
// ALWAYS validate group access
const group = await ctx.db.get(args.groupId);
if (!group || group.status !== "active") {
  throw new Error("Invalid group");
}

// ALWAYS scope queries by groupId
const things = await ctx.db
  .query("things")
  .withIndex("group_type", q =>
    q.eq("groupId", args.groupId).eq("type", args.type)
  )
  .collect();
```

**Common Causes:**
- Missing groupId validation
- Query without groupId scope
- Using wrong groupId from session
- Hierarchical access not implemented correctly

**Prevention:**
- NEVER query without groupId scope
- Validate group exists and is active
- Test with multiple groups during development
- Add integration tests for multi-tenancy

---

## Performance Issues

### Issue: Slow page loads or high JS bundle size

**Symptoms:**
- Lighthouse score < 90
- Large JavaScript bundles (> 200KB)
- Slow Time to Interactive (TTI)

**Solution:**
```astro
<!-- Use appropriate client directives -->
<HeavyComponent client:visible />  <!-- Load when visible -->
<SearchBox client:idle />          <!-- Load when idle -->
<CriticalComponent client:load />  <!-- Load immediately -->

<!-- Dynamic imports for heavy components -->
<script>
  const HeavyChart = lazy(() => import('./HeavyChart'));
</script>
```

**Common Causes:**
- Overuse of `client:load` directive
- No code splitting
- Heavy libraries in client bundle
- No lazy loading for images/components

**Prevention:**
- Default to static HTML (no client directive)
- Use `client:idle` or `client:visible` for non-critical components
- Dynamic import heavy libraries
- Lazy load images with `loading="lazy"`

---

## Deployment Issues

### Issue: Environment variables not working in production

**Symptoms:**
- `process.env.VAR_NAME` is undefined
- API calls fail with auth errors
- Database connection fails

**Solution:**
```bash
# 1. Check Cloudflare Pages environment variables
wrangler pages deployment list --project-name=web

# 2. Add variables in Cloudflare dashboard
# Settings → Environment Variables

# 3. Ensure PUBLIC_ prefix for client-side vars
PUBLIC_CONVEX_URL=https://...
BETTER_AUTH_SECRET=...  # Server-side only
```

**Common Causes:**
- Missing environment variables in Cloudflare dashboard
- Forgetting `PUBLIC_` prefix for client-side variables
- Wrong deployment environment (preview vs production)
- Environment variables not synced after changes

**Prevention:**
- Use `PUBLIC_` prefix for client-accessible variables
- Add all variables to Cloudflare dashboard
- Test in preview deployment before production
- Document all required environment variables

---

## Git Issues

### Issue: Merge conflicts in generated files

**Symptoms:**
- Conflicts in `_generated/` directory
- Conflicts in `package-lock.json` or `bun.lockb`
- Conflicts in `.astro/` cache

**Solution:**
```bash
# For generated files, prefer theirs and regenerate
git checkout --theirs backend/convex/_generated/
cd backend && npx convex dev

# For lockfiles, regenerate
rm bun.lockb
bun install

# For cache, delete and rebuild
rm -rf .astro/
bunx astro sync
```

**Prevention:**
- Add `_generated/` to `.gitignore` (already done)
- Commit lockfiles carefully
- Clear cache before merging: `rm -rf .astro/`

---

## Quick Diagnostic Commands

```bash
# Check all types
bunx astro check && cd backend && npx convex dev

# View backend logs
cd backend && npx convex logs --history 50

# Test auth flow
cd web && bun test test/auth/

# Check environment
env | grep CONVEX
env | grep BETTER_AUTH

# Verify build
cd web && bun run build
```

---

**When in doubt, regenerate types, clear cache, and rebuild.**
