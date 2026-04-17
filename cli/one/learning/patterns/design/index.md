# Design Patterns

Reusable patterns for consistent, accessible, and performant UI design across the ONE Platform.

## Overview

This directory contains proven design patterns that accelerate decision-making and reduce reinvention. Each pattern maps to specific use cases in the 6-dimension ontology.

## Patterns

### Wireframe Template

**Reference:** `wireframe-template.md`

Create visual representations of feature interfaces that satisfy user flows and acceptance criteria. Maps to:
- **Things:** Entities displayed in the interface
- **Connections:** Relationships shown between entities
- **Events:** Actions available to users
- **Knowledge:** Labels and categories for entities

**Use when:** Starting design work for a new feature, designing multiple screens, need to validate layout hierarchy.

### Component Architecture

**Reference:** `component-architecture.md`

Compose React components from shadcn/ui primitives using a layered architecture:
1. **Atoms:** Base shadcn/ui components (Button, Input, Card)
2. **Patterns:** Combine atoms into domain-specific components (ProductCard, UserProfile)
3. **Features:** Combine patterns into page layouts
4. **Pages:** Astro pages with SSR data fetching

**Use when:** Designing reusable component libraries, defining component hierarchies, planning implementation structure.

### Test-Driven Design Pattern

**Reference:** `test-driven-design-pattern.md`

Design interfaces driven by acceptance criteria, ensuring every design decision enables tests to pass.

**Process:**
1. Read test thing (user flows, acceptance criteria)
2. For each criterion, identify corresponding UI element
3. Map wireframe screens to test flows
4. Validate all criteria are satisfied

**Use when:** Starting from quality agent's test definitions, ensuring design-test alignment, validating completeness.

## Design System Reference

**Comprehensive specification:** `one/knowledge/develop/design.md`

Contains:
- Design tokens (colors, spacing, typography, motion)
- Color modes (light/dark)
- Typography scale and best practices
- Spacing rhythm and grid system
- Button variants and states
- Component language principles
- Interaction rules and accessibility guidelines
- Implementation playbook
- QA checklist

## Common Design Decisions

### Question: What layout pattern should I use?

**Answer depends on:**
1. **Primary user goal** - Create, read, update, delete, browse, search
2. **Content type** - Article, table, grid, form, dashboard
3. **Density** - Content-heavy, moderate, sparse
4. **Entity types involved** - Things being displayed/edited

**Pattern recommendations:**
- **Form-based (create/edit):** Centered single column with max-w-2xl
- **List/browse:** Grid of cards with filters or table with pagination
- **Detail view:** Hero section + content sections + sidebar
- **Dashboard:** Sidebar + main area with card grid
- **Content-heavy:** 3-column [nav | content | meta]

### Question: What components should I use?

**Start with shadcn/ui:**
- Card, Button, Badge, Avatar (structure)
- Input, Label, Select, Textarea (forms)
- Dialog, Drawer, Popover, Tooltip (overlays)
- Table, Pagination, Dropdown (data)
- Toast, Alert, Progress, Skeleton (feedback)

**Compose into domain patterns:**
- Don't create ProductCard, CourseCard, UserCard
- Create generic ThingCard that accepts a type prop
- Extract reusable patterns; minimize custom components

### Question: How do I ensure accessibility?

**Checklist:**
- [ ] Contrast AA+ (4.5:1 body, 3:1 large)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus states visible (outline/ring)
- [ ] ARIA labels on interactive elements
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Loading states communicated
- [ ] Motion respects prefers-reduced-motion

### Question: What about responsive design?

**Mobile-first approach:**
1. Design for 320px (mobile)
2. Enhance at 768px (tablet)
3. Optimize at 1024px+ (desktop)

**Use Tailwind responsive variants:**
- `sm:` (640px)
- `md:` (768px)
- `lg:` (1024px)
- `xl:` (1280px)
- `2xl:` (1536px)

## Integration with Agent-Designer

The agent-designer uses these patterns to:
1. **Create wireframes** - Maps user flows to screens using layout patterns
2. **Define components** - Composes shadcn/ui into domain patterns
3. **Set tokens** - Generates design tokens from group brand guidelines

**Agent uses these patterns as knowledge chunks for:**
- Layout recommendations
- Component composition advice
- Accessibility validation
- Performance optimization

## Related Documentation

- **Design System:** `one/knowledge/develop/design.md` - Complete token and guideline specifications
- **Frontend Architecture:** `one/knowledge/architecture-frontend.md` - Astro + React implementation patterns
- **Agent-Designer:** `.claude/agents/agent-designer.md` - Design agent responsibilities and workflows
- **Quality Guidelines:** `one/knowledge/quality-loop.md` - Testing and validation patterns

## Golden Rules

1. **Design is not decoration** - Every element must enable a user flow or test
2. **Use proven patterns** - Minimize custom components; compose existing ones
3. **Accessibility first** - WCAG AA compliance is non-negotiable
4. **Token-driven** - Pull colors/spacing from design system, never hard-code
5. **Test-driven** - Map each acceptance criterion to a UI element
6. **Responsive by default** - Mobile-first thinking in every design
7. **Reusable knowledge** - Store patterns as knowledge chunks for future designs

## Contributing to Design Patterns

When you discover a proven pattern:
1. Document it with context (when to use, why it works)
2. Create wireframe or component example
3. Add accessibility notes
4. Store as knowledge chunk for RAG
5. Link to related patterns

Patterns evolve. Update them as the platform grows and user needs change.
