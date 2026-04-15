# Projects Feature - Team Briefing Document

**Project:** ONE Platform - Projects Feature
**Plan ID:** 1-projects-feature
**Status:** Ready for Execution
**Date:** 2025-10-30
**Total Estimated Time:** 95-110 minutes (1.5-2 hours)

---

## Executive Summary

We're building a complete **Projects content feature** for the ONE Platform. Projects are already defined in the ontology as a "thing type", so we're adding the frontend presentation layer using Astro content collections and React components.

**Key Facts:**
- No backend schema changes needed (project type already exists)
- Content-first approach (perfect for portfolios and case studies)
- Follows established patterns from products/blog collections
- 4 team members, 6 phases, parallel execution opportunity

---

## Team Assignments at a Glance

```
DIRECTOR (You)
├── AGENT-DESIGNER (10 min)
│   └── Phase 1: Schema design & wireframes
│
├── AGENT-FRONTEND (90 min)
│   ├── Phase 2: Content collection setup
│   ├── Phase 3: Build 4 React components
│   └── Phase 4: Create 2 Astro pages
│
├── AGENT-BACKEND (15 min, optional)
│   └── Phase 5: Convex mutations/queries
│
└── AGENT-QUALITY (20 min)
    └── Phase 6: Tests & documentation
```

---

## Phase-by-Phase Breakdown

### PHASE 1: Schema Design (Cycle 1-15) - AGENT-DESIGNER

**Duration:** ~10 minutes
**Deliverables:** ProjectSchema + wireframes

**Tasks:**
1. Define `ProjectSchema` in `web/src/content/config.ts`
   - 20+ fields covering all project aspects
   - Status, priority, timeline, team, links, etc.

2. Update collections export to include projects

3. Create wireframes for:
   - `/projects` listing page (grid/list view)
   - `/projects/[slug]` detail page
   - ProjectCard component (grid & list modes)

**What to expect from Designer:**
- Zod schema with complete type definitions
- 3-4 wireframes showing layout & interactions
- Component hierarchy diagram

---

### PHASE 2: Content Collection (Cycle 16-30) - AGENT-FRONTEND

**Duration:** ~10 minutes
**Deliverables:** Astro content collection + 3 examples

**Tasks:**
1. Create directory structure:
   ```
   /web/src/content/projects/
   ├── one-platform.md
   ├── ecommerce-platform.md
   └── ai-tutor-system.md
   ```

2. Add 3 high-quality example projects with:
   - Complete metadata (dates, team, progress)
   - Rich descriptions
   - Technology stacks
   - Real external links

3. Run `bunx astro sync` to generate TypeScript types

**What Frontend will deliver:**
- 3 ready-to-use project markdown files
- Verified content collection sync
- Type definitions generated

---

### PHASE 3: Components (Cycle 31-50) - AGENT-FRONTEND

**Duration:** ~30 minutes
**Deliverables:** 4 React components

**Components to build:**

1. **ProjectCard** (`ProjectCard.tsx`)
   - Grid mode: Image, title, description, tags, progress bar
   - List mode: Compact layout with metadata
   - Status badges, team count, date range

2. **ProjectList** (`ProjectList.tsx`)
   - Container component with filter state
   - Handles sorting & filtering logic
   - Grid/list view toggle
   - Empty state handling

3. **ProjectFilters** (`ProjectFilters.tsx`)
   - Search input (name/description)
   - Category filter (dropdown)
   - Status filter (buttons)
   - Tag filter (badge toggles)
   - Sort dropdown (newest, oldest, progress, name)

4. **ProjectDetail** (`ProjectDetail.tsx`)
   - Full project information display
   - Image gallery
   - Timeline, team, progress metrics
   - Technology tags
   - External links (live, repo, website)
   - Related projects section

**What Frontend will deliver:**
- 4 production-ready React components
- Fully typed with CollectionEntry<'projects'>
- Responsive design (Tailwind v4)
- Accessible (WCAG compliant)
- Shadcn/ui integration

---

### PHASE 4: Pages & Routing (Cycle 51-70) - AGENT-FRONTEND

**Duration:** ~20 minutes
**Deliverables:** 2 Astro pages with SSR

**Pages to create:**

1. **Projects Listing** (`pages/projects/index.astro`)
   ```
   /projects

   Features:
   - Hero section with description
   - View toggle (grid 2/3/4 col, list)
   - ProjectList component with filters
   - Responsive layout
   - URL params for view mode
   ```

2. **Project Detail** (`pages/projects/[slug].astro`)
   ```
   /projects/[slug]

   Features:
   - Static path generation for all projects
   - ProjectDetail component display
   - Back link to listing
   - Related projects carousel
   - Breadcrumbs
   - SEO meta tags
   ```

**What Frontend will deliver:**
- 2 Astro pages with dynamic routing
- SSR data fetching via `getCollection()`
- Static site generation for all projects
- No client state needed for listing (pure SSR)
- Islands architecture with `client:load`

---

### PHASE 5: Backend (OPTIONAL, Cycle 71-85) - AGENT-BACKEND

**Duration:** ~15 minutes
**Deliverables:** Convex mutations/queries (optional)

**Note:** This phase is optional. Content collections work standalone without backend.

**If Backend implements CRUD:**

1. **Queries** (`backend/convex/queries/projects.ts`)
   - `listByGroup(groupId)` - Get all projects in a group
   - `getById(projectId)` - Fetch single project
   - `searchByName(groupId, searchTerm)` - Search projects

2. **Mutations** (`backend/convex/mutations/projects.ts`)
   - `create(groupId, name, description, properties)` - Create project
   - `update(projectId, updates)` - Update project
   - `delete_(projectId)` - Delete project

3. **Event Logging**
   - `thing_created` when project created
   - `thing_updated` when project modified
   - `project_viewed` when project viewed (custom event)

**What Backend will deliver:**
- Convex CRUD operations (if needed)
- Event logging for audit trail
- Type-safe mutations/queries
- Group scoping support

---

### PHASE 6: Testing & Documentation (Cycle 86-100) - AGENT-QUALITY

**Duration:** ~20 minutes
**Deliverables:** Tests + documentation

**Testing tasks:**

1. **Component Unit Tests** (`test/components/ProjectCard.test.tsx`)
   - Renders project data correctly
   - Handles both grid and list modes
   - Displays tags, status, progress
   - Team count display
   - Image fallback

2. **Page Integration Tests** (`test/pages/projects.test.ts`)
   - Content collection loads
   - All projects have required fields
   - Drafts are filtered out
   - Slugs are unique
   - Related projects logic works

**Documentation tasks:**

1. Create `/one/knowledge/projects-feature.md`
   - Feature overview
   - Schema field reference
   - Component documentation
   - Ontology mapping
   - Adding new projects guide
   - Backend integration docs

**What Quality will deliver:**
- Unit tests with >80% coverage
- Integration tests for pages
- Comprehensive feature documentation
- Ontology alignment verification
- Success criteria checklist

---

## Execution Timeline

### Day 1 - Sequential Phases

```
09:00 - PHASE 1 (Designer)
└─ 10 min: Schema + wireframes
   ↓
09:10 - PHASE 2 (Frontend starts)
└─ 10 min: Content collection + examples
   ↓
09:20 - PHASE 3 (Frontend continues)
└─ 30 min: Build 4 React components
   ├─ Can parallel with Backend
   │
09:50 - PHASE 5 (Backend, optional)
└─ 15 min: Mutations/queries
   ├─ Running parallel with Phase 4
   │
09:50 - PHASE 4 (Frontend continues)
└─ 20 min: Create 2 Astro pages
   ↓
10:10 - PHASE 6 (Quality)
└─ 20 min: Tests + documentation

DONE by 10:30 (1.5 hours)
```

### Parallel Execution Opportunity

**Can run in parallel:**
- Phase 3 (Frontend components) + Phase 5 (Backend CRUD)
- Phase 6 (Testing) after Phase 4 starts

**Saves ~15 minutes if fully parallelized** (down to ~1 hour)

---

## Key Files to Create/Modify

### New Files to Create

```
/web/src/content/projects/
├── one-platform.md
├── ecommerce-platform.md
└── ai-tutor-system.md

/web/src/components/projects/
├── ProjectCard.tsx
├── ProjectList.tsx
├── ProjectFilters.tsx
└── ProjectDetail.tsx

/web/src/pages/projects/
├── index.astro
└── [slug].astro

/backend/convex/mutations/
└── projects.ts (optional)

/backend/convex/queries/
└── projects.ts (optional)

/web/test/
├── components/ProjectCard.test.tsx
└── pages/projects.test.ts

/.claude/designs/
└── projects-wireframes.md

/one/knowledge/
└── projects-feature.md
```

### Files to Modify

```
/web/src/content/config.ts
├── Add ProjectSchema definition (25 lines)
├── Add projects to collections export (2 lines)
└── Add type export (1 line)
```

---

## Success Criteria Checklist

### Phase 1 ✓
- [ ] ProjectSchema defined with 20+ fields
- [ ] Zod validation complete
- [ ] Collections export updated
- [ ] Wireframes created

### Phase 2 ✓
- [ ] `/web/src/content/projects/` directory created
- [ ] 3 example projects added
- [ ] `bunx astro sync` runs without errors
- [ ] TypeScript types generated

### Phase 3 ✓
- [ ] ProjectCard component renders grid & list modes
- [ ] ProjectList with filtering/sorting works
- [ ] ProjectFilters UI functional
- [ ] ProjectDetail displays all project data
- [ ] All components responsive & accessible
- [ ] No TypeScript errors

### Phase 4 ✓
- [ ] `/projects` listing page renders
- [ ] `/projects/[slug]` detail pages work
- [ ] Static paths generate for all projects
- [ ] View toggle (grid/list) works
- [ ] Filters and search functional
- [ ] Related projects display
- [ ] No build errors

### Phase 5 (Optional) ✓
- [ ] Convex mutations work
- [ ] Convex queries work
- [ ] Events logged correctly
- [ ] Group scoping works

### Phase 6 ✓
- [ ] Component unit tests pass
- [ ] Page integration tests pass
- [ ] Documentation complete
- [ ] Ontology mapping verified
- [ ] All success criteria met

---

## Parallel Execution Strategy

**Recommended for Time Efficiency:**

```
AGENT-DESIGNER
└─ Phase 1 (10 min)
   ↓ (gives schema to frontend)

AGENT-FRONTEND (can do this in parallel with Backend)
├─ Phase 2 (10 min)
├─ Phase 3 (30 min)
└─ Phase 4 (20 min)
   Total: 60 min

AGENT-BACKEND (can start after Phase 2)
└─ Phase 5 (15 min) - PARALLEL with Phases 3-4

AGENT-QUALITY (can start after Phase 4)
└─ Phase 6 (20 min)

TOTAL CRITICAL PATH: 10 + 60 + 20 = 90 minutes
(If Phase 5 runs parallel, saves 15 min → 75 min total)
```

---

## Ontology Alignment

### 6-Dimension Mapping

| Dimension | What Exists | Implementation |
|-----------|-------------|-----------------|
| **Groups** | Projects belong to groups | `groupId` field inherited from schema |
| **People** | Owners, team, collaborators | `owner`, `team`, `collaborators` fields |
| **Things** | `type: "project"` | Already in ontology (15 types total) |
| **Connections** | `created_by`, `belongs_to_portfolio` | Will be created in Phase 5 (optional) |
| **Events** | `project_viewed`, `thing_created`, `thing_updated` | Logged in Phase 5 mutations |
| **Knowledge** | Tags, descriptions, metadata | Stored in `properties` and indexable |

**Result:** 100% ontology-aligned feature ✓

---

## Risk Assessment

### Low Risk
- Content collection approach is proven (blog, products work)
- ProjectSchema is straightforward
- Astro static generation is reliable
- Components reuse established patterns

### No Breaking Changes
- Only adding new content collection
- Only adding new components
- Only adding new pages (no modifications to existing routes)
- Backend changes are optional (backward compatible)

### Contingencies
- If Astro sync fails → Check TypeScript, re-run in web directory
- If component tests fail → Check imports, verify shadcn/ui installed
- If pages don't render → Verify getStaticPaths returns correct format
- If filters don't work → Check React state management logic

---

## Acceptance Criteria

Feature is **DONE** when:

1. **All 6 phases complete** with no outstanding tasks
2. **All tests pass** (unit + integration)
3. **No TypeScript errors** (`bunx astro check` clean)
4. **Responsive design verified** (mobile, tablet, desktop)
5. **Accessibility verified** (WCAG Level AA)
6. **Documentation complete** and reviewed
7. **Example projects display correctly**
8. **Filters and search work as expected**
9. **Performance acceptable** (Lighthouse score >90)
10. **Build succeeds** without warnings

---

## Questions for the Team

Before starting, confirm:

1. **AGENT-DESIGNER:** Should wireframes include dark mode variants?
2. **AGENT-FRONTEND:** Should we add loading states for content fetching?
3. **AGENT-BACKEND:** Should project creation be limited to specific roles?
4. **AGENT-QUALITY:** Should we include E2E tests (Playwright) or just unit/integration?

---

## Communication Checkpoints

**After Phase 1:** Designer confirms schema approved before Frontend starts
**After Phase 2:** Frontend confirms content syncs before building components
**After Phase 3:** Frontend confirms components work before building pages
**After Phase 4:** Frontend confirms pages render before Quality starts testing
**After Phase 5:** Backend confirms mutations work before Quality tests
**After Phase 6:** Quality confirms all tests pass → Feature ready for production

---

## Deployment Plan

Once complete:

1. **Frontend** - Automatic via Cloudflare Pages on git merge to main
2. **Content** - Projects visible immediately after merge
3. **Backend** (if used) - Deploy via `npx convex deploy`
4. **Documentation** - Available at `/one/knowledge/projects-feature.md`

---

## Success Metrics

After launch, measure:

- **Page load time** for `/projects` (target: <1s)
- **Filter responsiveness** (target: <100ms per filter change)
- **Time to interactive** (target: <2s)
- **Mobile conversion** (track clicks to project details)
- **SEO rankings** (project pages index in search)
- **User engagement** (average time on project detail page)

---

## Lessons to Capture

After completion, document:

1. What worked well (patterns, processes)
2. What could improve (tooling, documentation)
3. Edge cases encountered
4. Performance findings
5. Testing strategy effectiveness

---

## References

- **Full Implementation Plan:** `.claude/plans/1-projects-feature.md`
- **Ontology Specification:** `one/knowledge/ontology.md`
- **Content Collections:** `web/src/content/config.ts`
- **Similar Features:** Products (`web/src/pages/products/`) and Blog (`web/src/pages/blog/`)
- **Design Patterns:** `one/knowledge/patterns/`

---

## Team Contact & Escalation

For questions during execution:

- **Schema/Ontology:** Refer to `one/knowledge/ontology.md`
- **Convex patterns:** Refer to `web/AGENTS.md`
- **Component patterns:** Refer to `one/knowledge/patterns/frontend/`
- **Build issues:** Check `.astro/` and `web/dist/` directories
- **Type errors:** Run `bunx astro sync` and `bunx astro check`

---

## Next Steps

1. **Review this briefing** with all team members
2. **Confirm assignments** - Each agent confirms their phases
3. **Start Phase 1** - Designer begins schema design
4. **Wait for handoff** - Phase 1 designer → Frontend Phase 2
5. **Execute in parallel** where possible
6. **Track progress** - Update status after each phase
7. **Launch to production** - Once all phases complete & tests pass

---

## Timeline Summary

```
Phase 1:  Schema Design           [10 min]  ▓▓
Phase 2:  Content Collection      [10 min]  ▓▓
Phase 3:  Components              [30 min]  ▓▓▓▓▓▓
Phase 4:  Pages & Routing         [20 min]  ▓▓▓▓
Phase 5:  Backend (optional)      [15 min]  ▓▓▓ (parallel)
Phase 6:  Testing & Docs          [20 min]  ▓▓▓▓

Total: 95-110 minutes (1.5-2 hours)
With parallel execution: ~75-90 minutes

Status: READY FOR EXECUTION ✓
```

---

**Created:** 2025-10-30
**Status:** APPROVED - Ready for Team Execution
**Complexity:** MEDIUM
**Risk Level:** LOW
**Estimated ROI:** HIGH (adds portfolio capabilities instantly)
