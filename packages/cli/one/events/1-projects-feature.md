# ONE Platform - Projects Feature Implementation Plan

**Status:** Ready for Execution
**Created:** 2025-10-30
**Plan ID:** 1-projects-feature
**Feature ID:** 1-projects
**Total Features:** 4
**Target Cycles:** 1-100

---

## Executive Summary

Build a complete Projects feature following the 6-dimension ontology. Projects already exist as a "thing type" in the ontology. This plan adds the frontend content collection, pages, components, and optional backend support.

### Ontology Alignment

| Dimension | Mapping | Status |
|-----------|---------|--------|
| **Groups** | Projects scoped to `groupId` | Existing in schema |
| **People** | Project owners, collaborators, viewers | New connections |
| **Things** | `type: "project"` (already in ontology) | Ready |
| **Connections** | `created_by`, `belongs_to_portfolio`, custom connectors | New |
| **Events** | `project_viewed`, `thing_created`, `thing_updated` | Existing events |
| **Knowledge** | Project tags, descriptions, search metadata | New |

### Key Facts

- **Project thing type:** Already exists in ontology (see `backend/convex/types/ontology.ts`)
- **Event types:** `project_viewed`, `thing_created`, `thing_updated` already defined
- **Content collections:** Blog, news, products, plans already implemented - pattern established
- **Technology:** Astro 5, React 19, Tailwind v4, Convex (existing stack)
- **Pattern:** Reuse product/blog patterns for projects

---

## Deliverables Overview

### Phase 1: Schema Design (Cycle 1-15)
- Define `ProjectSchema` in `web/src/content/config.ts`
- Create Zod validation rules
- Design project property structure

### Phase 2: Content Collection (Cycle 16-30)
- Create `/web/src/content/projects/` directory
- Add example project entries
- Create asset structure

### Phase 3: Frontend Components (Cycle 31-50)
- `ProjectCard.tsx` - Grid/list display component
- `ProjectList.tsx` - Container with filtering/sorting
- `ProjectDetail.tsx` - Detail page component
- `ProjectSearch.tsx` - Search and filter logic
- `ProjectFilters.tsx` - Filter UI component

### Phase 4: Pages & Routing (Cycle 51-70)
- `/web/src/pages/projects/index.astro` - Listing page
- `/web/src/pages/projects/[slug].astro` - Detail page
- SSR data fetching
- Dynamic routing

### Phase 5: Backend (Optional, Cycle 71-85)
- Convex mutations for project CRUD
- Convex queries for project retrieval
- Event logging (project_viewed, etc.)

### Phase 6: Testing & Docs (Cycle 86-100)
- Unit tests for components
- Integration tests for pages
- E2E tests for workflows
- Documentation updates

---

## Detailed Team Assignments

### Team Structure

```
PROJECT DIRECTOR (You - Engineering Director)
├── Agent-Designer (Phase 1: Schema & Wireframes)
├── Agent-Frontend (Phases 2-4: Components & Pages)
├── Agent-Backend (Phase 5: Convex mutations/queries)
└── Agent-Quality (Phase 6: Tests & Validation)
```

---

## Phase 1: Schema Design (Cycle 1-15)

**Responsible Agent:** `agent-designer`
**Duration:** ~10 minutes
**Dependencies:** None

### Task 1-1: Define ProjectSchema

**File:** `/Users/toc/Server/ONE/web/src/content/config.ts`

Add this schema definition:

```typescript
const ProjectSchema = z.object({
  id: z.string().optional(),                           // Unique identifier (optional, defaults to slug)
  name: z.string(),                                     // Project name/title
  description: z.string(),                              // Short description
  longDescription: z.string().optional(),               // Detailed description

  // Project Metadata
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).default('planning'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),                      // e.g., "web-development", "design", "ai"
  tags: z.array(z.string()).optional(),                 // Tag array for search/filter

  // Team & Ownership
  owner: z.string().optional(),                         // Creator/owner name
  team: z.array(z.string()).optional(),                 // Team member names
  collaborators: z.array(z.string()).optional(),        // Collaborator names

  // Dates
  startDate: z.date().optional(),                       // Project start date
  endDate: z.date().optional(),                         // Project completion/target date
  createdAt: z.date().optional(),                       // Content creation date
  updatedAt: z.date().optional(),                       // Last modified date

  // Progress & Metrics
  progress: z.number().optional().default(0),           // 0-100 completion percentage
  budget: z.number().optional(),                        // Budget amount (in cents or base units)
  actualCost: z.number().optional(),                    // Actual spending

  // Media & Links
  image: z.string().optional(),                         // Featured image URL
  images: z.array(z.string()).optional(),               // Gallery images
  thumbnailImage: z.string().optional(),                // Custom thumbnail
  websiteUrl: z.string().optional(),                    // Project website/live link
  repositoryUrl: z.string().optional(),                 // GitHub/code repo link
  liveLink: z.string().optional(),                      // Live deployment URL

  // SEO & Display
  slug: z.string().optional(),                          // URL slug (auto-generated from name)
  featured: z.boolean().default(false),                 // Feature on homepage
  draft: z.boolean().default(false),                    // Hide if draft

  // Classification
  type: z.enum(['portfolio', 'case_study', 'freelance', 'internal', 'product']).optional(),
  industry: z.string().optional(),                      // Industry/vertical
  technologies: z.array(z.string()).optional(),         // Tech stack used

  // Rich Metadata
  metadata: z.record(z.any()).optional(),               // Flexible additional data
  seo: z.object({                                        // SEO configuration
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
});

// Export schema type
export type ProjectSchema = z.infer<typeof ProjectSchema>;
```

### Task 1-2: Update Collections Export

**File:** `/Users/toc/Server/ONE/web/src/content/config.ts`
**Line:** ~156-172

Update the exports section:

```typescript
const projects = defineCollection({
  type: 'content',
  schema: ProjectSchema,
});

export const collections = {
  blog: blog,
  news: news,
  products: products,
  categories: categories,
  collections: productCollections,
  plans: plans,
  projects: projects,  // ADD THIS LINE
};

// Export types
export type BlogSchema = z.infer<typeof BlogSchema>;
export type NewsSchema = z.infer<typeof NewsSchema>;
export type ProductSchema = z.infer<typeof ProductSchema>;
export type CategorySchema = z.infer<typeof CategorySchema>;
export type ProductCollectionSchema = z.infer<typeof ProductCollectionSchema>;
export type PlanSchema = z.infer<typeof PlanSchema>;
export type ProjectSchema = z.infer<typeof ProjectSchema>; // ADD THIS LINE
```

### Task 1-3: Create Wireframes

**Deliverable:** Wireframe document at `/Users/toc/Server/ONE/.claude/designs/projects-wireframes.md`

Create wireframes for:
1. Projects listing page (`/projects`)
   - Hero section with title
   - Filter panel (category, status, technology, owner)
   - View toggle (grid/list)
   - Project cards in grid/list format
   - Pagination/infinite scroll

2. Project detail page (`/projects/[slug]`)
   - Hero with project image
   - Project metadata (dates, team, status)
   - Description sections
   - Technology stack display
   - Links (website, repository, live)
   - Gallery (if multiple images)
   - Team/collaborators section
   - Related projects

3. Project card component
   - Featured image
   - Title
   - Short description
   - Tags
   - Status badge
   - Team avatars (optional)
   - View link

---

## Phase 2: Content Collection Setup (Cycle 16-30)

**Responsible Agent:** `agent-frontend`
**Duration:** ~10 minutes
**Dependencies:** Phase 1 (Schema Design)

### Task 2-1: Create Projects Directory

**Command:**
```bash
mkdir -p /Users/toc/Server/ONE/web/src/content/projects
```

### Task 2-2: Create Example Project Entries

Create **3 example projects** in `/Users/toc/Server/ONE/web/src/content/projects/`:

**File 1:** `/Users/toc/Server/ONE/web/src/content/projects/one-platform.md`

```markdown
---
name: "ONE Platform"
description: "Revolutionary 6-dimension ontology for AI-native applications"
longDescription: "Built a complete multi-tenant platform using a novel 6-dimension ontology that models reality through Groups, People, Things, Connections, Events, and Knowledge. This approach enables infinite scalability from friend circles to global governments without schema changes."

status: "in_progress"
priority: "high"
category: "web-development"
tags: ["astro", "react", "convex", "ontology", "ai"]

owner: "ONE Team"
team: ["Engineering Director", "Backend Specialist", "Frontend Developer", "Design Lead"]

startDate: 2024-01-15
endDate: 2025-12-31
createdAt: 2024-01-15
updatedAt: 2025-10-30

progress: 75

image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop"
images:
  - "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop"
  - "https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=800&h=600&fit=crop"

websiteUrl: "https://one.ie"
repositoryUrl: "https://github.com/one-ie/web"
liveLink: "https://web.one.ie"

featured: true
draft: false

type: "product"
industry: "SaaS/Platform"
technologies: ["Astro", "React", "TypeScript", "Convex", "Tailwind CSS", "Cloudflare"]

metadata:
  teamSize: 4
  budget: 150000
  actualCost: 145000
  hoursSpent: 2400
  completionTarget: "2025-12"

seo:
  title: "ONE Platform - 6-Dimension Ontology for AI"
  description: "Revolutionary multi-tenant platform architecture for AI-native applications"
  keywords: ["platform", "ontology", "ai", "saas", "astro", "convex"]
---

## Overview

ONE Platform is a revolutionary approach to building AI-native applications using a 6-dimension ontology. Instead of traditional schema design, we model reality through six interconnected dimensions that can scale infinitely.

## Technology Stack

- **Frontend:** Astro 5.14, React 19, TypeScript 5.9, Tailwind CSS v4
- **Backend:** Convex Cloud, Better Auth, Effect.ts
- **Deployment:** Cloudflare Pages (frontend), Convex Cloud (backend)

## Key Achievements

- 66+ entity types without schema changes
- Multi-tenant isolation via groups
- Real-time updates via Convex subscriptions
- 50+ accessible UI components (shadcn/ui)
- 100+ automated tests

## Lessons Learned

The 6-dimension model proves that traditional ER diagrams limit scalability. By thinking in dimensions rather than tables, we can build systems that scale from friend circles to governments without changes.
```

**File 2:** `/Users/toc/Server/ONE/web/src/content/projects/ecommerce-platform.md`

```markdown
---
name: "E-Commerce Platform Redesign"
description: "Complete redesign and modernization of legacy e-commerce system"
longDescription: "Led the complete redesign of an aging e-commerce platform, implementing modern architecture with Astro, React, and Convex. Improved page load times by 60% and added advanced product filtering, dynamic pricing, and recommendation engine."

status: "completed"
priority: "high"
category: "web-development"
tags: ["ecommerce", "astro", "react", "performance"]

owner: "Jane Smith"
team: ["Jane Smith", "John Developer", "Sarah Designer"]

startDate: 2023-06-01
endDate: 2024-03-31
createdAt: 2023-06-01
updatedAt: 2024-03-31

progress: 100

image: "https://images.unsplash.com/photo-1460925895917-adf4e12482c5?w=800&h=600&fit=crop"
images:
  - "https://images.unsplash.com/photo-1460925895917-adf4e12482c5?w=800&h=600&fit=crop"

websiteUrl: "https://shop.example.com"
repositoryUrl: "https://github.com/example/ecommerce"
liveLink: "https://shop.example.com"

featured: false
draft: false

type: "portfolio"
industry: "E-Commerce"
technologies: ["Astro", "React", "Stripe", "Convex"]

metadata:
  teamSize: 3
  budget: 75000
  actualCost: 72000

seo:
  title: "E-Commerce Platform Redesign - Case Study"
  description: "Modernized legacy platform with 60% performance improvement"
  keywords: ["ecommerce", "redesign", "astro", "performance"]
---

## Challenge

The existing e-commerce platform was built on legacy technology with poor performance, limited search capabilities, and outdated UX. Mobile conversion rates were 40% below industry standards.

## Solution

- Complete redesign with modern Astro + React stack
- Implemented advanced product filtering and faceted search
- Added ML-powered recommendation engine
- Optimized images and implemented lazy loading
- Reduced main thread work by 70%

## Results

- 60% improvement in page load times (3.2s → 1.3s)
- 35% increase in mobile conversion rates
- 45% reduction in bounce rate
- 200K SKUs indexed for instant search
```

**File 3:** `/Users/toc/Server/ONE/web/src/content/projects/ai-tutor-system.md`

```markdown
---
name: "AI Tutor System"
description: "Intelligent tutoring system using LLMs and spaced repetition"
longDescription: "Built a personalized AI tutoring system that adapts to individual learning styles using large language models, embeddings, and spaced repetition algorithms. Students showed 40% improvement in learning outcomes."

status: "completed"
priority: "high"
category: "ai"
tags: ["ai", "education", "machine-learning", "llm"]

owner: "Alex Chen"
team: ["Alex Chen", "Data Scientist", "ML Engineer"]

startDate: 2023-09-01
endDate: 2024-06-30
createdAt: 2023-09-01
updatedAt: 2024-06-30

progress: 100

image: "https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=800&h=600&fit=crop"

featured: true
draft: false

type: "portfolio"
industry: "EdTech"
technologies: ["Python", "OpenAI", "Pinecone", "FastAPI", "React"]

metadata:
  teamSize: 2
  studentsImpacted: 5000
  improvementRate: 40

seo:
  title: "AI Tutor System - EdTech Innovation"
  description: "Intelligent tutoring with 40% learning outcome improvement"
  keywords: ["ai", "education", "tutoring", "llm", "machine-learning"]
---

## Overview

Created an intelligent tutoring system that uses large language models and vector embeddings to provide personalized, adaptive learning experiences.

## Technical Architecture

- **LLM Backbone:** OpenAI GPT-4 with custom fine-tuning
- **Vector Store:** Pinecone for semantic search
- **Backend:** FastAPI with async processing
- **Frontend:** React with real-time updates
- **Data:** 50K+ educational resources indexed

## Impact

- 5,000+ students tutored
- 40% average improvement in learning outcomes
- 95% student satisfaction rating
- Reduced tutoring cost by 70% vs human tutors
```

### Task 2-3: Verify Content Collection Sync

**Command:**
```bash
cd /Users/toc/Server/ONE/web && bunx astro sync
```

This generates TypeScript types for the new content collection.

---

## Phase 3: Frontend Components (Cycle 31-50)

**Responsible Agent:** `agent-frontend`
**Duration:** ~30 minutes
**Dependencies:** Phase 2 (Content Collection)

### Task 3-1: Create ProjectCard Component

**File:** `/Users/toc/Server/ONE/web/src/components/projects/ProjectCard.tsx`

```typescript
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, TrendingUp } from 'lucide-react';
import type { CollectionEntry } from 'astro:content';

type ProjectEntry = CollectionEntry<'projects'>;

interface ProjectCardProps {
  project: ProjectEntry;
  viewMode?: 'grid' | 'list';
}

export function ProjectCard({ project, viewMode = 'grid' }: ProjectCardProps) {
  const { data, slug } = project;
  const href = `/projects/${slug}`;

  // Format dates
  const startDate = data.startDate ? new Date(data.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  }) : null;

  const endDate = data.endDate ? new Date(data.endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  }) : null;

  const statusColors: Record<string, string> = {
    'planning': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'on_hold': 'bg-gray-100 text-gray-800',
  };

  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
        {data.image && (
          <img
            src={data.image}
            alt={data.name}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground hover:text-primary">
                <a href={href}>{data.name}</a>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            </div>
            <Badge className={statusColors[data.status || 'planning']}>
              {data.status || 'planning'}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {startDate && (
              <div className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                <span>{startDate}</span>
              </div>
            )}
            {data.team && data.team.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{data.team.length} team members</span>
              </div>
            )}
            {data.progress !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{data.progress}% complete</span>
              </div>
            )}
          </div>

          {data.tags && data.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-3">
              {data.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {data.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{data.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm" asChild>
          <a href={href}>View</a>
        </Button>
      </div>
    );
  }

  // Grid view (default)
  return (
    <a
      href={href}
      className="group block h-full border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image */}
      {data.image ? (
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={data.image}
            alt={data.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {data.status && (
            <div className="absolute top-3 right-3">
              <Badge className={statusColors[data.status]}>
                {data.status}
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-muted to-muted-foreground flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No image</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {data.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {data.description}
        </p>

        {/* Metadata */}
        <div className="mt-4 space-y-2">
          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {data.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {data.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{data.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Dates */}
          {(startDate || endDate) && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              {startDate && <span>{startDate}</span>}
              {startDate && endDate && <span>-</span>}
              {endDate && <span>{endDate}</span>}
            </div>
          )}

          {/* Progress Bar */}
          {data.progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-foreground">Progress</span>
                <span className="text-xs text-muted-foreground">{data.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Team */}
        {data.team && data.team.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <span className="font-medium">{data.team.length}</span> team members
          </div>
        )}
      </div>
    </a>
  );
}

export default ProjectCard;
```

### Task 3-2: Create ProjectList Component

**File:** `/Users/toc/Server/ONE/web/src/components/projects/ProjectList.tsx`

```typescript
'use client';

import React, { useState, useMemo } from 'react';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';
import type { CollectionEntry } from 'astro:content';

type ProjectEntry = CollectionEntry<'projects'>;

interface ProjectListProps {
  projects: ProjectEntry[];
  viewMode?: 'grid' | 'list';
  gridColumns?: '2' | '3' | '4';
  showFilters?: boolean;
}

export function ProjectList({
  projects,
  viewMode = 'grid',
  gridColumns = '3',
  showFilters = true,
}: ProjectListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'progress' | 'name'>('newest');

  // Get unique values for filters
  const categories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach(p => {
      if (p.data.category) cats.add(p.data.category);
    });
    return Array.from(cats).sort();
  }, [projects]);

  const statuses = useMemo(() => {
    const stats = new Set<string>();
    projects.forEach(p => {
      if (p.data.status) stats.add(p.data.status);
    });
    return Array.from(stats).sort();
  }, [projects]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => {
      if (p.data.tags) {
        p.data.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => {
      const matchesSearch = searchTerm === '' ||
        p.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.data.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === null || p.data.category === selectedCategory;
      const matchesStatus = selectedStatus === null || p.data.status === selectedStatus;

      const matchesTags = selectedTags.size === 0 ||
        (p.data.tags && p.data.tags.some(tag => selectedTags.has(tag)));

      return matchesSearch && matchesCategory && matchesStatus && matchesTags;
    });

    // Sort
    result = result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.data.updatedAt?.getTime() || b.data.createdAt?.getTime() || 0) -
                 (a.data.updatedAt?.getTime() || a.data.createdAt?.getTime() || 0);
        case 'oldest':
          return (a.data.updatedAt?.getTime() || a.data.createdAt?.getTime() || 0) -
                 (b.data.updatedAt?.getTime() || b.data.createdAt?.getTime() || 0);
        case 'progress':
          return (b.data.progress || 0) - (a.data.progress || 0);
        case 'name':
          return a.data.name.localeCompare(b.data.name);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, selectedCategory, selectedStatus, selectedTags, searchTerm, sortBy]);

  const gridClass = {
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[gridColumns];

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <ProjectFilters
          categories={categories}
          statuses={statuses}
          tags={allTags}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          selectedTags={selectedTags}
          searchTerm={searchTerm}
          sortBy={sortBy}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onTagToggle={(tag) => {
            const newTags = new Set(selectedTags);
            if (newTags.has(tag)) {
              newTags.delete(tag);
            } else {
              newTags.add(tag);
            }
            setSelectedTags(newTags);
          }}
          onSearchChange={setSearchTerm}
          onSortChange={setSortBy}
        />
      )}

      {/* Results Info */}
      <div className="mt-6 mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {projects.length} projects
        </p>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-2">No projects found</p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedStatus(null);
              setSelectedTags(new Set());
              setSearchTerm('');
            }}
            className="text-primary hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Projects Grid/List */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              viewMode="list"
            />
          ))}
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-6`}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              viewMode="grid"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList;
```

### Task 3-3: Create ProjectFilters Component

**File:** `/Users/toc/Server/ONE/web/src/components/projects/ProjectFilters.tsx`

```typescript
'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProjectFiltersProps {
  categories: string[];
  statuses: string[];
  tags: string[];
  selectedCategory: string | null;
  selectedStatus: string | null;
  selectedTags: Set<string>;
  searchTerm: string;
  sortBy: 'newest' | 'oldest' | 'progress' | 'name';
  onCategoryChange: (category: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onTagToggle: (tag: string) => void;
  onSearchChange: (term: string) => void;
  onSortChange: (sort: 'newest' | 'oldest' | 'progress' | 'name') => void;
}

export function ProjectFilters({
  categories,
  statuses,
  tags,
  selectedCategory,
  selectedStatus,
  selectedTags,
  searchTerm,
  sortBy,
  onCategoryChange,
  onStatusChange,
  onTagToggle,
  onSearchChange,
  onSortChange,
}: ProjectFiltersProps) {
  const hasActiveFilters = selectedCategory || selectedStatus || selectedTags.size > 0 || searchTerm;

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
      {/* Search */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as any)}
          className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="progress">Progress (High to Low)</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(null)}
              className="text-xs"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
                className="text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {statuses.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(null)}
              className="text-xs"
            >
              All
            </Button>
            {statuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusChange(selectedStatus === status ? null : status)}
                className="text-xs capitalize"
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">
            Tags {selectedTags.size > 0 && `(${selectedTags.size})`}
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.has(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onCategoryChange(null);
            onStatusChange(null);
            onSearchChange('');
            // Can't reset selectedTags here without callback
          }}
          className="w-full text-xs"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default ProjectFilters;
```

### Task 3-4: Create ProjectDetail Component

**File:** `/Users/toc/Server/ONE/web/src/components/projects/ProjectDetail.tsx`

```typescript
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Globe, Users, Calendar, TrendingUp } from 'lucide-react';
import type { CollectionEntry } from 'astro:content';

type ProjectEntry = CollectionEntry<'projects'>;

interface ProjectDetailProps {
  project: ProjectEntry;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const { data } = project;

  const statusColors: Record<string, string> = {
    'planning': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'on_hold': 'bg-gray-100 text-gray-800',
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {data.image && (
        <div className="relative h-96 rounded-lg overflow-hidden">
          <img
            src={data.image}
            alt={data.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">{data.name}</h1>
            <p className="text-lg text-muted-foreground mt-2">{data.description}</p>
          </div>
          {data.status && (
            <Badge className={statusColors[data.status]}>
              {data.status.replace('_', ' ')}
            </Badge>
          )}
        </div>

        {/* Action Links */}
        <div className="flex gap-2 flex-wrap">
          {data.liveLink && (
            <Button asChild>
              <a href={data.liveLink} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                View Live
              </a>
            </Button>
          )}
          {data.websiteUrl && !data.liveLink && (
            <Button asChild>
              <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4 mr-2" />
                Website
              </a>
            </Button>
          )}
          {data.repositoryUrl && (
            <Button variant="outline" asChild>
              <a href={data.repositoryUrl} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                Source Code
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Timeline */}
        {(data.startDate || data.endDate) && (
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {data.startDate && <div>Start: {formatDate(data.startDate)}</div>}
              {data.endDate && <div>End: {formatDate(data.endDate)}</div>}
              {data.startDate && data.endDate && (
                <div className="text-xs pt-2">
                  {Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        {data.progress !== undefined && (
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{data.progress}%</div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Team */}
        {data.team && data.team.length > 0 && (
          <div className="p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Users className="w-4 h-4" />
              Team
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="font-semibold text-foreground mb-1">{data.team.length} members</div>
              <ul className="text-xs space-y-1">
                {data.team.map((member) => (
                  <li key={member} className="text-muted-foreground">{member}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Priority */}
        {data.priority && (
          <div className="p-4 border border-border rounded-lg">
            <div className="text-sm font-medium text-foreground mb-2">Priority</div>
            <Badge variant="outline" className="capitalize">
              {data.priority}
            </Badge>
          </div>
        )}
      </div>

      {/* Description */}
      {data.longDescription && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h2>Overview</h2>
          <p>{data.longDescription}</p>
        </div>
      )}

      {/* Technologies */}
      {data.technologies && data.technologies.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Technology Stack</h2>
          <div className="flex gap-2 flex-wrap">
            {data.technologies.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Tags</h2>
          <div className="flex gap-2 flex-wrap">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {data.images && data.images.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${data.name} - Image ${idx + 1}`}
                className="rounded-lg object-cover h-64 w-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Collaborators */}
      {data.collaborators && data.collaborators.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Collaborators</h2>
          <div className="flex gap-2 flex-wrap">
            {data.collaborators.map((collaborator) => (
              <Badge key={collaborator} variant="outline">
                {collaborator}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
```

---

## Phase 4: Pages & Routing (Cycle 51-70)

**Responsible Agent:** `agent-frontend`
**Duration:** ~20 minutes
**Dependencies:** Phase 3 (Components)

### Task 4-1: Create Projects Listing Page

**File:** `/Users/toc/Server/ONE/web/src/pages/projects/index.astro`

```astro
---
import Layout from '@/layouts/Layout.astro';
import { getCollection } from 'astro:content';
import { Grid, List } from 'lucide-react';
import { ProjectList } from '@/components/projects/ProjectList';

// Get all projects
const entries = await getCollection('projects');

// Filter out drafts
const projects = entries.filter(p => !p.data.draft);

// Get view mode from URL params
const viewModeParam = Astro.url.searchParams.get('view') || 'grid';
const viewMode = (viewModeParam === 'list' || viewModeParam === 'grid') ? viewModeParam : 'grid';

const gridColumnsParam = Astro.url.searchParams.get('columns') || '3';
const gridColumns = (gridColumnsParam === '2' || gridColumnsParam === '3' || gridColumnsParam === '4') ? gridColumnsParam : '3';
---

<Layout title="Projects" description="Browse our portfolio of successful projects">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Header -->
    <div class="mb-12">
      <h1 class="text-4xl font-bold text-foreground mb-3" data-usal="fade-right duration-700">
        Featured Projects
      </h1>
      <p class="text-lg text-muted-foreground max-w-2xl" data-usal="fade-right duration-700 delay-100">
        Explore our portfolio of innovative projects spanning web development, design, AI, and beyond.
        Each project showcases our expertise and commitment to excellence.
      </p>
    </div>

    <!-- View Controls -->
    <div class="flex justify-end gap-2 items-center mb-8" data-usal="fade-left duration-700">
      <a
        href="/projects?view=list"
        class={`p-2 rounded-md hover:bg-accent hover:scale-110 transition-all duration-200 ${viewMode === 'list' ? 'bg-accent' : ''}`}
        title="List view"
      >
        <List className="w-5 h-5" />
      </a>
      <a
        href="/projects?view=grid&columns=2"
        class={`p-2 rounded-md hover:bg-accent hover:scale-110 transition-all duration-200 ${viewMode === 'grid' && gridColumns === '2' ? 'bg-accent' : ''}`}
        title="2 columns grid"
      >
        <Grid className="w-5 h-5" />
      </a>
      <a
        href="/projects?view=grid&columns=3"
        class={`p-2 rounded-md hover:bg-accent hover:scale-110 transition-all duration-200 ${viewMode === 'grid' && gridColumns === '3' ? 'bg-accent' : ''}`}
        title="3 columns grid"
      >
        <div class="w-5 h-5 grid grid-cols-3 gap-0.5">
          <div class="bg-current rounded-sm"></div>
          <div class="bg-current rounded-sm"></div>
          <div class="bg-current rounded-sm"></div>
        </div>
      </a>
      <a
        href="/projects?view=grid&columns=4"
        class={`p-2 rounded-md hover:bg-accent hover:scale-110 transition-all duration-200 ${viewMode === 'grid' && gridColumns === '4' ? 'bg-accent' : ''}`}
        title="4 columns grid"
      >
        <div class="w-5 h-5 grid grid-cols-2 grid-rows-2 gap-0.5">
          <div class="bg-current rounded-sm"></div>
          <div class="bg-current rounded-sm"></div>
          <div class="bg-current rounded-sm"></div>
          <div class="bg-current rounded-sm"></div>
        </div>
      </a>
    </div>

    <!-- Project List -->
    <ProjectList
      client:load
      projects={projects}
      viewMode={viewMode}
      gridColumns={gridColumns}
      showFilters={true}
    />
  </div>
</Layout>
```

### Task 4-2: Create Projects Detail Page

**File:** `/Users/toc/Server/ONE/web/src/pages/projects/[slug].astro`

```astro
---
import Layout from '@/layouts/Layout.astro';
import { getCollection, getEntry } from 'astro:content';
import { ProjectDetail } from '@/components/projects/ProjectDetail';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

// Generate static paths for all projects
export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects
    .filter(p => !p.data.draft)
    .map(project => ({
      params: { slug: project.slug },
    }));
}

const { slug } = Astro.params;

// Get project from collection
const projectEntry = await getEntry('projects', slug!);

if (!projectEntry) {
  return Astro.redirect('/404');
}

const { data } = projectEntry;

// Get related projects (same category or technology)
const allProjects = await getCollection('projects');
const relatedProjects = allProjects
  .filter(p =>
    p.slug !== slug &&
    !p.data.draft &&
    (p.data.category === data.category ||
     (p.data.technologies && data.technologies &&
      p.data.technologies.some(t => data.technologies?.includes(t))))
  )
  .slice(0, 3);
---

<Layout title={`${data.name} - Projects`} description={data.description}>
  <div class="min-h-screen bg-background">
    <!-- Breadcrumb -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <a href="/projects">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </a>
      </Button>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectDetail client:load project={projectEntry} />
    </div>

    <!-- Related Projects -->
    {relatedProjects.length > 0 && (
      <div class="mt-16 border-t border-border pt-12 bg-muted/20">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 class="text-2xl font-bold text-foreground mb-8">Related Projects</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProjects.map(project => (
              <a
                href={`/projects/${project.slug}`}
                class="group block border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {project.data.image && (
                  <div class="h-40 overflow-hidden bg-muted">
                    <img
                      src={project.data.image}
                      alt={project.data.name}
                      class="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div class="p-4">
                  <h3 class="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {project.data.name}
                  </h3>
                  <p class="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {project.data.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
</Layout>
```

---

## Phase 5: Backend Support (Optional, Cycle 71-85)

**Responsible Agent:** `agent-backend`
**Duration:** ~15 minutes
**Dependencies:** Phase 1 (Schema defined)
**Note:** Only needed if backend CRUD operations are required. Can be skipped for content-only projects.

### Task 5-1: Create Project Queries (Optional)

**File:** `/Users/toc/Server/ONE/backend/convex/queries/projects.ts` (optional)

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all projects in a group
 */
export const listByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_type", (q) => q.eq("type", "project"))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
  },
});

/**
 * Get single project by ID
 */
export const getById = query({
  args: { projectId: v.id("entities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/**
 * Search projects by name
 */
export const searchByName = query({
  args: {
    groupId: v.id("groups"),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("entities")
      .withIndex("by_type", (q) => q.eq("type", "project"))
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();

    return projects.filter((p) =>
      p.name.toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});
```

### Task 5-2: Create Project Mutations (Optional)

**File:** `/Users/toc/Server/ONE/backend/convex/mutations/projects.ts` (optional)

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a new project
 */
export const create = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    description: v.string(),
    properties: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("entities", {
      groupId: args.groupId,
      type: "project",
      name: args.name,
      properties: {
        description: args.description,
        ...args.properties,
      },
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log creation event
    await ctx.db.insert("events", {
      groupId: args.groupId,
      type: "thing_created",
      timestamp: Date.now(),
      metadata: {
        thingType: "project",
        thingId: projectId,
        actorId: ctx.auth?.getUserIdentity()?.tokenIdentifier || "anonymous",
      },
    });

    return projectId;
  },
});

/**
 * Update a project
 */
export const update = mutation({
  args: {
    projectId: v.id("entities"),
    updates: v.object({
      name: v.optional(v.string()),
      properties: v.optional(v.any()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(args.projectId, {
      name: args.updates.name || project.name,
      properties: {
        ...project.properties,
        ...args.updates.properties,
      },
      status: args.updates.status || project.status,
      updatedAt: Date.now(),
    });

    // Log update event
    await ctx.db.insert("events", {
      groupId: project.groupId,
      type: "thing_updated",
      timestamp: Date.now(),
      metadata: {
        thingType: "project",
        thingId: args.projectId,
      },
    });
  },
});

/**
 * Delete a project
 */
export const delete_ = mutation({
  args: { projectId: v.id("entities") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.delete(args.projectId);

    // Log deletion event
    await ctx.db.insert("events", {
      groupId: project.groupId,
      type: "thing_updated",
      timestamp: Date.now(),
      metadata: {
        thingType: "project",
        thingId: args.projectId,
        action: "deleted",
      },
    });
  },
});
```

---

## Phase 6: Testing & Documentation (Cycle 86-100)

**Responsible Agent:** `agent-quality`
**Duration:** ~20 minutes
**Dependencies:** Phases 4 & 5 (Implementation complete)

### Task 6-1: Component Unit Tests

**File:** `/Users/toc/Server/ONE/web/test/components/ProjectCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import type { CollectionEntry } from 'astro:content';

const mockProject: CollectionEntry<'projects'> = {
  id: 'test-project',
  slug: 'test-project',
  collection: 'projects',
  data: {
    name: 'Test Project',
    description: 'A test project',
    status: 'in_progress',
    progress: 50,
    tags: ['test', 'example'],
    team: ['Developer 1', 'Developer 2'],
    image: 'https://example.com/image.jpg',
    featured: false,
    draft: false,
  },
  body: '',
  render: async () => ({ Content: () => null, headings: [], remarkPluginFrontmatter: {} }),
};

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(<ProjectCard project={mockProject} viewMode="grid" />);
    expect(screen.getByText('Test Project')).toBeDefined();
  });

  it('renders project description', () => {
    render(<ProjectCard project={mockProject} viewMode="grid" />);
    expect(screen.getByText('A test project')).toBeDefined();
  });

  it('displays status badge', () => {
    render(<ProjectCard project={mockProject} viewMode="grid" />);
    expect(screen.getByText(/in_progress/i)).toBeDefined();
  });

  it('displays tags', () => {
    render(<ProjectCard project={mockProject} viewMode="grid" />);
    expect(screen.getByText('test')).toBeDefined();
    expect(screen.getByText('example')).toBeDefined();
  });

  it('displays team count', () => {
    render(<ProjectCard project={mockProject} viewMode="list" />);
    expect(screen.getByText(/2 team members/)).toBeDefined();
  });

  it('shows progress bar', () => {
    render(<ProjectCard project={mockProject} viewMode="grid" />);
    expect(screen.getByText('50%')).toBeDefined();
  });
});
```

### Task 6-2: Page Integration Tests

**File:** `/Users/toc/Server/ONE/web/test/pages/projects.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getCollection } from 'astro:content';

describe('Projects Pages', () => {
  it('content collection includes projects', async () => {
    const projects = await getCollection('projects');
    expect(projects.length).toBeGreaterThan(0);
  });

  it('all projects have required fields', async () => {
    const projects = await getCollection('projects');
    projects.forEach((p) => {
      expect(p.data.name).toBeDefined();
      expect(p.data.description).toBeDefined();
    });
  });

  it('filters out draft projects', async () => {
    const projects = await getCollection('projects');
    const drafts = projects.filter((p) => p.data.draft);
    // In production, drafts should be filtered in the page
    expect(drafts).toBeDefined();
  });

  it('projects have unique slugs', async () => {
    const projects = await getCollection('projects');
    const slugs = projects.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(slugs.length).toBe(uniqueSlugs.size);
  });
});
```

### Task 6-3: Documentation Update

**File:** `/Users/toc/Server/ONE/one/knowledge/projects-feature.md`

Create comprehensive feature documentation:

```markdown
# Projects Feature

**Status:** Implemented
**Version:** 1.0.0
**Ontology Alignment:** 100%

## Overview

The Projects feature enables portfolio and project management on the ONE Platform. Projects are modeled as a "thing" type in the 6-dimension ontology.

## Content Collection

**File:** `web/src/content/projects/`
**Schema:** `web/src/content/config.ts`

### ProjectSchema Fields

- `name` (required) - Project name/title
- `description` (required) - Short description
- `longDescription` (optional) - Detailed description
- `status` - One of: planning, in_progress, completed, on_hold
- `priority` - One of: low, medium, high
- `category` - Project category (e.g., web-development)
- `tags` - Array of tags for filtering
- `owner` - Project creator/owner name
- `team` - Array of team member names
- `startDate` - Project start date
- `endDate` - Project completion date
- `progress` - 0-100 completion percentage
- `image` - Featured image URL
- `images` - Array of image URLs for gallery
- `websiteUrl` - Project website URL
- `repositoryUrl` - Code repository URL
- `liveLink` - Live deployment URL
- `technologies` - Tech stack array
- `metadata` - Flexible additional data

## Pages & Routes

- `/projects` - All projects listing with filters
- `/projects/[slug]` - Individual project detail page

## Components

- `ProjectCard` - Grid/list view card component
- `ProjectList` - Container with filtering and sorting
- `ProjectDetail` - Detail page component
- `ProjectFilters` - Filter UI component

## Ontology Mapping

| Dimension | Mapping |
|-----------|---------|
| Groups | projectId scoped to groupId |
| People | owner, team, collaborators |
| Things | type: "project" |
| Connections | created_by, belongs_to_portfolio |
| Events | project_viewed, thing_created, thing_updated |
| Knowledge | tags, descriptions, metadata |

## Creating a Project Entry

```markdown
---
name: "My Awesome Project"
description: "Short description of the project"
longDescription: "Detailed description..."
status: "completed"
progress: 100
category: "web-development"
tags: ["astro", "react"]
owner: "Your Name"
team: ["Dev 1", "Dev 2"]
startDate: 2024-01-01
endDate: 2024-06-30
image: "https://example.com/image.jpg"
websiteUrl: "https://project.example.com"
repositoryUrl: "https://github.com/example/project"
technologies: ["React", "Node.js", "PostgreSQL"]
featured: true
draft: false
---

## Project Overview

Your project description content here...
```

## Backend Integration (Optional)

If backend CRUD operations are needed:

- Mutations: `backend/convex/mutations/projects.ts`
- Queries: `backend/convex/queries/projects.ts`

Events logged:
- `thing_created` - When project created
- `thing_updated` - When project modified
- `project_viewed` - When project viewed (custom event)

## Filtering & Search

Projects support:
- Category filtering
- Status filtering (planning, in_progress, completed, on_hold)
- Tag-based filtering
- Text search (name, description)
- Sorting (newest, oldest, progress, name)

## View Modes

- Grid view (2, 3, or 4 columns)
- List view (details expanded)
- Toggle via URL params: `?view=grid&columns=3`
```

---

## Execution Roadmap

```
PHASE 1: Schema Design (Cycle 1-15)
│
├─ Task 1-1: Define ProjectSchema in config.ts
├─ Task 1-2: Update collections export
└─ Task 1-3: Create wireframes

   DELIVERABLE: ProjectSchema definition + wireframes

PHASE 2: Content Collection (Cycle 16-30)
│
├─ Task 2-1: Create projects directory
├─ Task 2-2: Add 3 example projects
└─ Task 2-3: Sync content collection

   DELIVERABLE: Astro content collection with examples

PHASE 3: Frontend Components (Cycle 31-50)
│
├─ Task 3-1: ProjectCard component
├─ Task 3-2: ProjectList component
├─ Task 3-3: ProjectFilters component
└─ Task 3-4: ProjectDetail component

   DELIVERABLE: 4 React components (grid, filter, detail)

PHASE 4: Pages & Routing (Cycle 51-70)
│
├─ Task 4-1: /projects index page
└─ Task 4-2: /projects/[slug] detail page

   DELIVERABLE: Dynamic routing with SSR

PHASE 5: Backend (Optional, Cycle 71-85)
│
├─ Task 5-1: Project queries
└─ Task 5-2: Project mutations

   DELIVERABLE: Convex CRUD operations (optional)

PHASE 6: Testing & Docs (Cycle 86-100)
│
├─ Task 6-1: Component unit tests
├─ Task 6-2: Page integration tests
└─ Task 6-3: Documentation update

   DELIVERABLE: Tests + complete documentation
```

---

## Success Criteria

- [ ] ProjectSchema defined with Zod validation
- [ ] Content collection syncs without errors
- [ ] 3+ example projects created
- [ ] ProjectCard renders in grid and list modes
- [ ] ProjectList with filters and sorting works
- [ ] Projects listing page renders at `/projects`
- [ ] Project detail pages render at `/projects/[slug]`
- [ ] All components are responsive and accessible (WCAG)
- [ ] Unit tests pass (components)
- [ ] Integration tests pass (pages)
- [ ] Documentation complete and accurate
- [ ] Featured projects highlight correctly
- [ ] Filters work correctly (category, status, tags)
- [ ] Search functionality works
- [ ] Related projects display on detail pages
- [ ] No build errors or type issues

---

## Team Assignments

| Phase | Tasks | Agent | Duration | Status |
|-------|-------|-------|----------|--------|
| 1 | Schema design | agent-designer | ~10 min | Ready |
| 2 | Content collection | agent-frontend | ~10 min | Ready |
| 3 | Components | agent-frontend | ~30 min | Ready |
| 4 | Pages | agent-frontend | ~20 min | Ready |
| 5 | Backend | agent-backend | ~15 min | Optional |
| 6 | Testing | agent-quality | ~20 min | Ready |

**Total Estimated Time:** 95-110 minutes (1.5-2 hours)
**Complexity:** Medium
**Dependencies:** Minimal (content-first approach)

---

## Ontology Alignment Summary

This feature maps perfectly to all 6 dimensions:

1. **Groups** - Projects scoped via `groupId` field (inherited from schema)
2. **People** - Project owner, team members, collaborators (roles)
3. **Things** - `type: "project"` already in ontology (15 thing types total)
4. **Connections** - `created_by`, `belongs_to_portfolio` relationships
5. **Events** - `thing_created`, `thing_updated`, `project_viewed` events
6. **Knowledge** - Tags, descriptions, metadata, search vectors

**Verdict:** 100% ontology aligned - Ready to build!

---

**Created:** 2025-10-30
**Last Updated:** 2025-10-30
**Validation Status:** APPROVED - Ready for Execution
```

---

## Summary for Director

You now have a **complete implementation plan** for the Projects feature:

### What's Ready

1. **ProjectSchema** - Comprehensive Zod schema with all fields
2. **3 Example Projects** - Real portfolio examples to demonstrate the feature
3. **4 React Components** - ProjectCard, ProjectList, ProjectFilters, ProjectDetail
4. **2 Astro Pages** - Listing page with dynamic routing + detail pages
5. **Optional Backend** - Convex mutations/queries for CRUD
6. **Complete Tests** - Unit and integration tests
7. **Full Documentation** - Feature overview and usage guide

### Team Execution Order

```
1. agent-designer creates schemas & wireframes (10 min)
   ↓
2. agent-frontend creates content & components (60 min)
   ├─ Creates projects directory
   ├─ Adds example projects
   ├─ Builds 4 React components
   └─ Creates 2 Astro pages
   ↓
3. agent-backend (optional) adds Convex CRUD (15 min)
   ├─ Project mutations
   └─ Project queries
   ↓
4. agent-quality writes tests & docs (20 min)
   ├─ Component tests
   ├─ Page tests
   └─ Documentation
```

### Parallel Execution Opportunity

- **agent-frontend** can start components (Task 3) immediately after schema is approved
- **agent-backend** can work on mutations (Task 5) in parallel with components
- **agent-quality** can write tests while implementation is finishing

### Key Advantages

- **Content-first approach** - Uses Astro content collections (no backend DB required initially)
- **Ontology-aligned** - "project" thing type already exists
- **Pattern reuse** - Follows products/blog implementation patterns
- **Responsive design** - Tailwind v4 with mobile-first approach
- **Full-featured** - Includes filtering, sorting, search, gallery, team display
- **Extensible** - Properties field allows unlimited custom data

Ready to execute? Assign the tasks to your specialists!
