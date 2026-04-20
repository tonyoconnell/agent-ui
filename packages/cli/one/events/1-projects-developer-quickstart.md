# Projects Feature - Developer Quick Reference

**TL;DR:** Building a portfolio feature using Astro content collections. 4 components, 2 pages, optional backend.

---

## What You're Building

A **portfolio/projects system** that lets users showcase their work. Content-first approach using Astro content collections (no database required initially).

```
/projects                 ← Listing page with filters
├── /one-platform        ← Detail page
├── /ecommerce-platform  ← Detail page
└── /ai-tutor-system     ← Detail page
```

---

## Phase Reference

### Phase 1: Schema (Designer) - 10 min

**File to modify:** `web/src/content/config.ts`

```typescript
// Add this schema
const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  owner: z.string().optional(),
  team: z.array(z.string()).optional(),
  progress: z.number().optional(),
  // ... 10+ more fields (see full plan)
});

// Add to collections
export const collections = {
  // ... existing
  projects: defineCollection({ type: 'content', schema: ProjectSchema }),
};
```

**Deliverable:** Updated config.ts + wireframes

---

### Phase 2: Content (Frontend) - 10 min

**Files to create:** `web/src/content/projects/*.md`

```markdown
---
name: "ONE Platform"
description: "Revolutionary 6-dimension ontology"
status: "in_progress"
progress: 75
tags: ["astro", "react", "convex"]
owner: "Team"
team: ["Dev 1", "Dev 2"]
image: "https://..."
featured: true
draft: false
---

## Detailed description here...
```

**Tasks:**
1. Create directory: `mkdir -p /web/src/content/projects`
2. Add 3 example projects (see full plan for content)
3. Sync types: `cd web && bunx astro sync`

**Deliverable:** 3 projects in collection + synced types

---

### Phase 3: Components (Frontend) - 30 min

**Files to create:** 4 React components in `/web/src/components/projects/`

```typescript
// 1. ProjectCard.tsx - Grid/list display
// → Renders: Image, title, description, tags, progress bar
// → Props: project, viewMode ('grid'|'list')

// 2. ProjectList.tsx - Container with filters
// → Renders: ProjectCard array with sorting/filtering logic
// → Props: projects, viewMode, gridColumns, showFilters

// 3. ProjectFilters.tsx - Filter UI
// → Renders: Search, category, status, tags, sort dropdowns
// → Props: filters, handlers (onChange callbacks)

// 4. ProjectDetail.tsx - Detail view
// → Renders: Full project info, gallery, team, links
// → Props: project
```

**Key imports:**
```typescript
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, TrendingUp } from 'lucide-react';
import type { CollectionEntry } from 'astro:content';
```

**Deliverable:** 4 production-ready components

---

### Phase 4: Pages (Frontend) - 20 min

**Files to create:** 2 Astro pages in `/web/src/pages/projects/`

```astro
// /pages/projects/index.astro
---
import { getCollection } from 'astro:content';
const projects = await getCollection('projects');
const projects = projects.filter(p => !p.data.draft);
---

<Layout>
  <h1>Featured Projects</h1>
  <ProjectList client:load projects={projects} viewMode="grid" />
</Layout>

// /pages/projects/[slug].astro
---
export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map(p => ({ params: { slug: p.slug } }));
}

const { slug } = Astro.params;
const project = await getEntry('projects', slug);
---

<Layout>
  <ProjectDetail client:load project={project} />
</Layout>
```

**Deliverable:** Dynamic routing + SSR pages

---

### Phase 5: Backend (Optional, Backend) - 15 min

**Files to create:** 2 Convex files (optional)

```typescript
// /backend/convex/queries/projects.ts
export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.query("entities")
      .withIndex("by_type", q => q.eq("type", "project"))
      .filter(q => q.eq(q.field("groupId"), args.groupId))
      .collect();
  },
});

// /backend/convex/mutations/projects.ts
export const create = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("entities", {
      groupId: args.groupId,
      type: "project",
      name: args.name,
      properties: { description: args.description },
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log event
    await ctx.db.insert("events", {
      groupId: args.groupId,
      type: "thing_created",
      timestamp: Date.now(),
      metadata: { thingType: "project", thingId: projectId },
    });

    return projectId;
  },
});
```

**Deliverable:** CRUD operations for projects

---

### Phase 6: Testing (Quality) - 20 min

**Files to create:** 2 test files

```typescript
// /web/test/components/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/ProjectCard';

it('renders project name', () => {
  render(<ProjectCard project={mockProject} />);
  expect(screen.getByText('Test Project')).toBeDefined();
});

// /web/test/pages/projects.test.ts
import { getCollection } from 'astro:content';

it('content collection includes projects', async () => {
  const projects = await getCollection('projects');
  expect(projects.length).toBeGreaterThan(0);
});
```

**Deliverable:** Tests + comprehensive documentation

---

## File Structure Reference

```
ONE/
├── web/
│   ├── src/
│   │   ├── content/
│   │   │   ├── config.ts                    ← MODIFY: Add ProjectSchema
│   │   │   └── projects/                    ← CREATE: New directory
│   │   │       ├── one-platform.md          ← CREATE: Example 1
│   │   │       ├── ecommerce-platform.md    ← CREATE: Example 2
│   │   │       └── ai-tutor-system.md       ← CREATE: Example 3
│   │   │
│   │   ├── components/
│   │   │   └── projects/                    ← CREATE: New directory
│   │   │       ├── ProjectCard.tsx          ← CREATE
│   │   │       ├── ProjectList.tsx          ← CREATE
│   │   │       ├── ProjectFilters.tsx       ← CREATE
│   │   │       └── ProjectDetail.tsx        ← CREATE
│   │   │
│   │   └── pages/
│   │       └── projects/                    ← CREATE: New directory
│   │           ├── index.astro              ← CREATE
│   │           └── [slug].astro             ← CREATE
│   │
│   └── test/
│       ├── components/
│       │   └── ProjectCard.test.tsx         ← CREATE
│       └── pages/
│           └── projects.test.ts             ← CREATE
│
├── backend/
│   └── convex/
│       ├── queries/
│       │   └── projects.ts                  ← CREATE (optional)
│       └── mutations/
│           └── projects.ts                  ← CREATE (optional)
│
├── .claude/
│   ├── plans/
│   │   ├── 1-projects-feature.md            ← FULL PLAN (this directory)
│   │   ├── 1-projects-team-briefing.md      ← TEAM BRIEFING
│   │   └── 1-projects-developer-quickstart.md  ← THIS FILE
│   │
│   └── designs/
│       └── projects-wireframes.md           ← CREATE: Wireframes
│
└── one/
    └── knowledge/
        └── projects-feature.md              ← CREATE: Documentation
```

---

## Component API Reference

### ProjectCard

```typescript
interface ProjectCardProps {
  project: CollectionEntry<'projects'>;
  viewMode?: 'grid' | 'list';
}

// Usage:
<ProjectCard project={project} viewMode="grid" />
```

### ProjectList

```typescript
interface ProjectListProps {
  projects: CollectionEntry<'projects'>[];
  viewMode?: 'grid' | 'list';
  gridColumns?: '2' | '3' | '4';
  showFilters?: boolean;
}

// Usage:
<ProjectList
  client:load
  projects={projects}
  viewMode={viewMode}
  gridColumns={gridColumns}
  showFilters={true}
/>
```

### ProjectDetail

```typescript
interface ProjectDetailProps {
  project: CollectionEntry<'projects'>;
}

// Usage:
<ProjectDetail client:load project={project} />
```

### ProjectFilters

```typescript
interface ProjectFiltersProps {
  categories: string[];
  statuses: string[];
  tags: string[];
  selectedCategory: string | null;
  selectedStatus: string | null;
  selectedTags: Set<string>;
  searchTerm: string;
  sortBy: 'newest' | 'oldest' | 'progress' | 'name';
  onCategoryChange: (cat: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onTagToggle: (tag: string) => void;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: any) => void;
}
```

---

## ProjectSchema Fields

```typescript
{
  id?: string;                                    // Optional ID
  name: string;                                   // Required
  description: string;                            // Required
  longDescription?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  owner?: string;
  team?: string[];
  collaborators?: string[];
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  progress?: number;                              // 0-100
  budget?: number;
  actualCost?: number;
  image?: string;
  images?: string[];
  thumbnailImage?: string;
  websiteUrl?: string;
  repositoryUrl?: string;
  liveLink?: string;
  featured?: boolean;
  draft?: boolean;
  type?: 'portfolio' | 'case_study' | 'freelance' | 'internal' | 'product';
  industry?: string;
  technologies?: string[];
  metadata?: Record<string, any>;
  seo?: { title?: string; description?: string; keywords?: string[] };
}
```

---

## Common Tasks

### Adding a New Project

1. Create file in `/web/src/content/projects/my-project.md`
2. Add frontmatter with required fields (name, description)
3. Add markdown content below `---`
4. Run `bunx astro sync` to verify
5. Push to git - automatically deployed

### Updating ProjectSchema

1. Modify `web/src/content/config.ts`
2. Update ProjectSchema with new fields
3. Add new fields to example projects
4. Run `bunx astro sync`
5. Update tests if needed

### Adding Filtering

1. ProjectList already handles: category, status, tags, search
2. Add new filter field to ProjectFilters component
3. Update ProjectList filtering logic
4. Test with sample data

### Customizing Styling

All components use Tailwind v4:
```css
@import "tailwindcss";

@theme {
  --color-primary: 222.2 47.4% 11.2%;
}
```

Change colors in `src/styles/global.css`

---

## Testing Checklist

- [ ] Content collection syncs: `bunx astro sync`
- [ ] Type checking passes: `bunx astro check`
- [ ] Build succeeds: `bun run build`
- [ ] Dev server works: `bun run dev`
- [ ] ProjectCard renders (grid & list)
- [ ] ProjectList filters work
- [ ] ProjectDetail displays all info
- [ ] Pages load at `/projects` and `/projects/[slug]`
- [ ] Filters are responsive
- [ ] Mobile layout works
- [ ] Accessibility OK (keyboard nav, screen readers)
- [ ] Tests pass: `bun test`

---

## Debugging Tips

### Content Collection Not Syncing
```bash
cd web
rm -rf .astro node_modules/.astro
bunx astro sync
```

### Type Errors in Components
```bash
bunx astro check --strict
```

### Pages Not Generating
```bash
# Check static path generation
bunx astro build --verbose
```

### Style Issues
Check Tailwind compilation in `src/styles/global.css`

### Component Not Rendering
Make sure to add `client:load` directive in Astro files

---

## Performance Targets

- Page load: < 1s
- Filter response: < 100ms
- Time to interactive: < 2s
- Lighthouse score: > 90
- CLS (Cumulative Layout Shift): < 0.1

Use Chrome DevTools to measure:
```
Ctrl+Shift+I → Performance → Record
```

---

## Deployment

### Automatic (Cloudflare Pages)
```bash
# Just push to main
git add .
git commit -m "feat: add projects feature"
git push origin main

# Cloudflare Pages auto-deploys
```

### Manual Deployment
```bash
cd web
bun run build
wrangler pages deploy dist --project-name=web
```

### Backend Deployment (if needed)
```bash
cd backend
npx convex deploy
```

---

## Ontology Notes

Projects map to the 6-dimension ontology:

1. **Groups** - Projects have `groupId` for multi-tenancy
2. **People** - `owner` and `team` are person references
3. **Things** - `type: "project"` is a thing type
4. **Connections** - `created_by`, `belongs_to_portfolio`
5. **Events** - `project_viewed`, `thing_created`
6. **Knowledge** - `tags`, `metadata` enable RAG/search

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/projects-feature

# Make changes across phases
git add web/src/content/config.ts
git add web/src/content/projects/
git add web/src/components/projects/
git add web/src/pages/projects/
# ... etc

# Commit by phase
git commit -m "feat(schema): add ProjectSchema to config"
git commit -m "feat(content): add example projects"
git commit -m "feat(components): add ProjectCard, List, etc"
git commit -m "feat(pages): add projects routing"

# Push and create PR
git push origin feat/projects-feature
# → Create PR on GitHub
# → Cloudflare builds automatically
# → Review and merge
```

---

## Resources

- **Full Plan:** `.claude/plans/1-projects-feature.md` (complete specs)
- **Team Briefing:** `.claude/plans/1-projects-team-briefing.md`
- **Ontology:** `one/knowledge/ontology.md`
- **Convex Patterns:** `web/AGENTS.md`
- **Component Patterns:** `one/knowledge/patterns/frontend/`
- **Blog Example:** `web/src/pages/blog/` (similar pattern)
- **Products Example:** `web/src/pages/products/` (similar pattern)

---

## Quick Command Reference

```bash
# Development
cd /Users/toc/Server/ONE/web
bun run dev                    # Start dev server

# Sync content types
bunx astro sync               # Generate types from content

# Type checking
bunx astro check              # Check TypeScript
bunx astro check --strict     # Strict mode

# Building
bun run build                 # Build for production
bun run preview               # Preview build locally

# Testing
bun test                      # Run tests
bun test --watch              # Watch mode
bun test test/components/     # Run specific test file

# Backend
cd ../backend
npx convex dev                # Start Convex dev server
npx convex deploy             # Deploy to production
```

---

## Success Criteria

Complete when:

1. ✓ All 6 phases done
2. ✓ No TypeScript errors
3. ✓ All tests pass
4. ✓ Pages load correctly
5. ✓ Filters/search work
6. ✓ Mobile responsive
7. ✓ Accessible (WCAG AA)
8. ✓ Merged to main
9. ✓ Live on production

---

**Questions?** Refer to the full plan or reach out to your team lead.

**Ready to build!** 🚀
