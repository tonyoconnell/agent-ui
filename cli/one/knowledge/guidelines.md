---
title: Important Development Guidelines
dimension: knowledge
category: development
tags: guidelines, best-practices, tailwind, react, cloudflare
related_dimensions: all
scope: global
created: 2025-11-08
version: 1.0.0
ai_context: |
  Critical development guidelines for Tailwind v4, React 19, Cloudflare,
  authentication, environment variables, and content collections.
---

# Important Development Guidelines

**Critical patterns and conventions for ONE platform development.**

---

## Authentication

- Backend handles all auth logic (`backend/convex/auth.ts`)
- Frontend uses Better Auth client hooks
- 6 authentication methods supported:
  1. Email/Password
  2. OAuth (Google, GitHub, etc.)
  3. Magic Links
  4. Password Reset
  5. Email Verification
  6. Two-Factor Authentication (2FA)
- All auth pages under `/account/*` route
- Session management via Better Auth cookies
- Rate limiting via `@convex-dev/rate-limiter`

---

## Environment Variables

### Root (.env) - CRITICAL FOR DEPLOYMENTS

```bash
# Cloudflare Global API Key - FULL ACCESS to Cloudflare API
# This provides complete programmatic access for automated deployments
CLOUDFLARE_GLOBAL_API_KEY=your-cloudflare-global-api-key
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_EMAIL=your-cloudflare-email

# Alternative: Cloudflare API Token (scoped access)
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

**IMPORTANT:** The `CLOUDFLARE_GLOBAL_API_KEY` provides **FULL ACCESS** to the Cloudflare API. This enables automated deployments via `./scripts/cloudflare-deploy.sh` and the `/release` command without manual intervention. Keep this key secure and never commit `.env` to version control.

### Web (.env.local)

```bash
PUBLIC_CONVEX_URL=https://shocking-falcon-870.convex.cloud
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:4321
# OAuth credentials...
```

### Backend (.env.local)

```bash
CONVEX_DEPLOYMENT=prod:shocking-falcon-870
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## Tailwind v4 Specifics

**CRITICAL:** Tailwind v4 uses CSS-based configuration (no JS config file).

### Core Principles

- **NO `tailwind.config.mjs` file** - Use CSS `@theme` blocks instead
- **ALWAYS use HSL format:** `--color-name: 0 0% 100%`
- **ALWAYS wrap with `hsl()`:** `hsl(var(--color-background))`
- **NO `@apply` directive** in Tailwind v4
- **Use `@variant dark (.dark &)`** for dark mode
- **Add `@source` directive** to scan component files

### Example Configuration

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
  --color-primary: 222.2 47.4% 11.2%;
}

/* Dark mode overrides */
@variant dark (.dark &);

.dark {
  --color-background: 222.2 84% 4.9%;
  --color-foreground: 210 40% 98%;
}

/* Use colors with hsl() wrapper */
.my-component {
  background-color: hsl(var(--color-background));
  color: hsl(var(--color-foreground));
}
```

### Common Mistakes

**WRONG:**
```css
/* Don't use OKLCH or raw values */
--color-primary: oklch(0.5 0.2 180);
background: var(--color-background);  /* Missing hsl() */
```

**CORRECT:**
```css
/* Use HSL with hsl() wrapper */
--color-primary: 222.2 47.4% 11.2%;
background: hsl(var(--color-background));
```

---

## React 19 + Cloudflare

**SSR Compatibility:**

- Uses `react-dom/server.edge` for Cloudflare Workers compatibility
- Configured in `astro.config.mjs` with Vite alias:
  ```javascript
  vite: {
    resolve: {
      alias: {
        'react-dom/server': 'react-dom/server.edge'
      }
    }
  }
  ```
- Deployed to Cloudflare Pages with edge rendering
- Full React 19 features (Server Components, Actions, Hooks)

### Islands Architecture

```astro
<!-- Static (no JS) -->
<ProductCard product={product} />

<!-- Interactive (loads immediately) -->
<ShoppingCart client:load />

<!-- Deferred (loads when idle) -->
<SearchBox client:idle />

<!-- Lazy (loads when visible) -->
<RelatedProducts client:visible />
```

---

## Content Collections

**Type-safe content management:**

- Blog posts in `src/content/blog/`
- Type-safe schemas in `src/content/config.ts`
- Run `bunx astro sync` after content changes
- Use `CollectionEntry<"blog">` type (lowercase)

### Example Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
```

### Usage

```astro
---
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
---

{posts.map(post => (
  <article>
    <h2>{post.data.title}</h2>
    <p>{post.data.description}</p>
  </article>
))}
```

---

## Multi-Tenancy Guidelines

**CRITICAL:** Every mutation/query MUST scope by groupId.

```typescript
// ALWAYS validate group
const group = await ctx.db.get(args.groupId);
if (!group || group.status !== "active") {
  throw new Error("Invalid group");
}

// ALWAYS filter by groupId
const things = await ctx.db
  .query("things")
  .withIndex("group_type", q =>
    q.eq("groupId", args.groupId).eq("type", args.type)
  )
  .collect();
```

**Never query without groupId scope.** Cross-tenant data leaks = security catastrophe.

---

## Installation Folders

**Data isolation via groupId, NOT schema customization.**

### Directory Structure

```
/one/                    # Global templates (everyone uses)
/<installation-name>/    # Organization-specific overrides
  ├── knowledge/
  │   ├── brand-guide.md
  │   ├── features.md
  │   └── rules.md
  └── groups/<group-slug>/
```

### Security

- Never store secrets in installation folders
- Use `.env.local` for sensitive configuration
- Installation folders excluded from git by default

---

## Code Pattern Conventions

### Import Aliases

```typescript
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

### TypeScript Strict Mode

- `strict: true` enabled
- No `any` except in entity `properties` field
- Use discriminated unions for errors (`_tag` field)

### Error Handling

```typescript
// Tagged union pattern
type Result<T> =
  | { _tag: "success"; value: T }
  | { _tag: "error"; error: string };
```

---

## Performance Guidelines

### Astro Islands

- Default to static HTML (no JS)
- Add interactivity strategically with `client:*` directives
- Use `client:idle` for non-critical components
- Use `client:visible` for below-the-fold content

### Code Splitting

```typescript
// Dynamic imports for heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));
```

### Database Queries

- Always use indexes for queries
- Batch operations when possible
- Use `first()` instead of `collect()` for single items

---

**Follow these guidelines for consistent, performant, secure development.**
