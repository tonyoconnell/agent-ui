---
title: Page Template
dimension: knowledge
category: patterns
tags: ai, architecture, frontend
related_dimensions: connections, events, things
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the knowledge dimension in the patterns category.
  Location: one/knowledge/patterns/frontend/page-template.md
  Purpose: Documents pattern: astro page template
  Related dimensions: connections, events, things
  For AI agents: Read this to understand page template.
---

# Pattern: Astro Page Template

**Category:** Frontend
**Context:** When creating Astro pages that fetch data server-side and render with islands architecture
**Problem:** Need consistent page structure that leverages SSR, uses DataProvider pattern for data fetching, and adds interactivity selectively

## Solution

Use Astro's SSR for initial page load, fetch data server-side via ConvexHttpClient (provider abstraction), render static content, and add React islands for interactivity.

## Template

```astro
---
// src/pages/[thingType]/[id].astro
import Layout from '@/layouts/Layout.astro';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import {EntityName}Detail from '@/components/features/{EntityName}Detail';
import {EntityName}Actions from '@/components/features/{EntityName}Actions';

// Server-side data fetching
const { id, thingType } = Astro.params;

if (!id || !thingType) {
  return Astro.redirect('/404');
}

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);

// Fetch data server-side using provider (works with any backend)
const thing = await convex.query(api.queries.things.get, {
  id: id
});

if (!thing) {
  return Astro.redirect('/404');
}

// Extract metadata for SEO
const title = `${thing.name || 'Untitled'} | ${thingType}`;
const description = thing.properties?.description || `View ${thingType} details`;

// Optional: Fetch related things (e.g., lessons for a course)
const relatedThings = await convex.query(api.queries.connections.getRelated, {
  thingId: id,
  relationshipType: "part_of",
  direction: "to"
}).catch(() => []);
---

<Layout title={title} description={description}>
  <div class="container mx-auto px-4 py-8">
    <!-- Static header (no JS needed) -->
    <header class="mb-8">
      <h1 class="text-4xl font-bold">{thing.name || 'Untitled'}</h1>
      <p class="text-muted-foreground mt-2">
        {thing.properties?.description || ''}
      </p>
    </header>

    <!-- Interactive detail component (React island) -->
    <{EntityName}Detail
      client:load
      thing={thing}
      thingId={id}
      relatedThings={relatedThings}
    />

    <!-- Interactive actions (only if user interaction needed) -->
    <{EntityName}Actions
      client:visible
      thingId={id}
      status={thing.status}
    />
  </div>
</Layout>

<style>
  /* Page-specific styles (scoped) */
  h1 {
    @apply text-foreground;
  }
</style>
```

## Variables

- `{entities}` - Table name (e.g., "entities")
- `{entity}` - Lowercase entity name (e.g., "course", "lesson")
- `{EntityName}` - PascalCase entity name (e.g., "Course", "Lesson")

## Usage

1. Copy template to `src/pages/{entities}/[id].astro`
2. Replace all `{EntityName}` and `{entity}` with your entity name
3. Create corresponding React components
4. Add page-specific metadata and styles
5. Choose appropriate `client:` directives (`load`, `visible`, `idle`, `only`)

## Example (Course Detail Page)

```astro
---
// src/pages/course/[id].astro
import Layout from '@/layouts/Layout.astro';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import CourseDetail from '@/components/features/CourseDetail';
import EnrollButton from '@/components/features/EnrollButton';

const { id } = Astro.params;
if (!id) return Astro.redirect('/404');

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);

// Fetch course (generic thing pattern)
const course = await convex.query(api.queries.things.get, {
  id: id
});

if (!course) return Astro.redirect('/404');

// Fetch related lessons using generic connection pattern
const lessons = await convex.query(api.queries.connections.getRelated, {
  thingId: id,
  relationshipType: "part_of",
  direction: "to"
});

const title = `${course.name} | Course`;
const description = course.properties?.description || "View course details";
---

<Layout title={title} description={description}>
  <div class="container mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-4xl font-bold">{course.name}</h1>
      <p class="text-muted-foreground mt-2">{course.properties?.description}</p>
    </header>

    <!-- Course details (interactive, loads immediately) -->
    <CourseDetail
      client:load
      course={course}
      lessons={lessons}
    />

    <!-- Enroll button (only visible when scrolled to) -->
    <EnrollButton
      client:visible
      courseId={id}
      price={course.properties?.price}
    />
  </div>
</Layout>
```

## Client Directives

Choose the right directive for performance:

- `client:load` - Load immediately (critical interactivity)
- `client:idle` - Load when browser is idle (non-critical)
- `client:visible` - Load when scrolled into view (below fold)
- `client:only` - Skip SSR, client-only (rare)

**Rule of thumb:** Use `client:visible` for most components below the fold.

## Common Mistakes

- **Mistake:** Adding `client:load` to everything
  - **Fix:** Use `client:visible` or `client:idle` for non-critical components
- **Mistake:** Fetching data client-side that could be SSR
  - **Fix:** Use `ConvexHttpClient` in frontmatter for SSR data
- **Mistake:** Not handling null/undefined thing
  - **Fix:** Always check if thing exists, redirect to 404
- **Mistake:** Hardcoding metadata
  - **Fix:** Extract title/description from thing data
- **Mistake:** Rendering sensitive data without auth check
  - **Fix:** Check auth server-side or use protected Convex queries
- **Mistake:** Using deprecated `getById` or `getByConnection` patterns
  - **Fix:** Use generic `api.queries.things.get` and `api.queries.connections.getRelated` that work with any thing type
- **Mistake:** Creating type-specific pages instead of generic
  - **Fix:** Use `[thingType]/[id].astro` pattern to handle all 66 thing types in one page

## Related Patterns

- **component-template.md** - React components used in pages
- **form-template.md** - Forms for creating/editing entities
- **Layout patterns** - Consistent page layouts
