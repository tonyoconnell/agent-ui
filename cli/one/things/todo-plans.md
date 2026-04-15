---
title: Todo Plans
dimension: things
primary_dimension: things
category: todo-plans.md
tags: agent, cycle, ontology
related_dimensions: events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-plans.md category.
  Location: one/things/todo-plans.md
  Purpose: Documents plans content collection & 100-cycle task management
  Related dimensions: events, groups, knowledge, people
  For AI agents: Read this to understand todo plans.
---

# Plans Content Collection & 100-Cycle Task Management

## Overview

The **Plans content collection** is a structured system for managing feature implementation plans using the **100-cycle paradigm**. Instead of traditional time-based planning (days/weeks), plans are broken into 100 discrete cycle passes, each representing a concrete step.

**Location:** `web/src/content/plans/`

## Schema Structure

```typescript
PlanSchema {
  title: string                           // Plan title
  description: string                     // Brief description
  feature: string                         // Feature name
  organization?: string                   // Organization name
  personRole?: enum                       // User's role
  ontologyDimensions?: string[]          // Mapped to 6-dimension ontology
  assignedSpecialist?: string            // Agent/specialist assigned
  totalCycles: number                 // Always 100 (default)
  completedCycles: number            // How many completed

  // Standard 100-cycle phase breakdown
  cycleTemplate?: {
    range: string                        // e.g., "1-10"
    phase: string                        // e.g., "Foundation & Setup"
    description: string
    tasks?: string[]
  }[]

  // Individual task tracking
  tasks?: {
    cycleNumber: number              // 1-100
    content: string                      // Task description
    status: 'pending'|'in_progress'|'completed'
    activeForm: string                   // Present continuous form
    dependencies?: number[]              // Other cycle numbers
  }[]

  // Metrics
  dependenciesMet: number
  totalDependencies: number

  // Learning tracking
  lessonsLearned?: {
    cycle: number
    lesson: string
  }[]

  // Timestamps
  createdAt?: date
  updatedAt?: date
  startedAt?: date
  completedAt?: date
  draft?: boolean
}
```

## 100-Cycle Breakdown

Every feature follows this standard 100-cycle sequence:

### **Cycle 1-10: Foundation & Setup**

- Understand requirements and constraints
- Map feature to 6-dimension ontology (Groups, People, Things, Connections, Events, Knowledge)
- Read relevant documentation and code patterns
- Create implementation plan
- Identify dependencies and risks

### **Cycle 11-20: Backend Schema & Services**

- Design/update database schema (groups, things, connections, events, knowledge)
- Create Effect.ts services (pure business logic)
- Implement Convex mutations and queries
- Add proper error handling and validation

### **Cycle 21-30: Frontend Pages & Components**

- Create React components with proper props/hooks
- Build Astro pages with SSR data fetching
- Implement loading and error states
- Use shadcn/ui components for consistency

### **Cycle 31-40: Integration & Connections**

- Implement external system integrations
- Connect protocols (A2A, ACP, AP2, X402, AG-UI)
- Manage cross-platform data flows
- Ensure bidirectional synchronization

### **Cycle 41-50: Authentication & Authorization**

- Implement security layers
- Define role-based access control (RBAC)
- Add permission validation
- Audit logging for sensitive operations

### **Cycle 51-60: Knowledge & RAG**

- Create vector embeddings
- Implement semantic search
- Build RAG (Retrieval-Augmented Generation) features
- Add knowledge categorization and tagging

### **Cycle 61-70: Quality & Testing**

- Write unit tests for services
- Create integration tests for full flows
- Implement end-to-end (E2E) tests
- Achieve target code coverage (80%+)

### **Cycle 71-80: Design & Wireframes**

- Create UI/UX wireframes and mockups
- Design component library additions
- Ensure WCAG accessibility compliance
- Apply brand identity and design tokens

### **Cycle 81-90: Performance & Optimization**

- Optimize database queries and indexes
- Implement caching strategies
- Reduce JavaScript bundle size
- Profile and optimize rendering

### **Cycle 91-100: Deployment & Documentation**

- Write comprehensive documentation
- Prepare changelog and release notes
- Configure deployment pipelines
- Deploy to production
- Monitor and collect feedback

## Usage

### Creating a New Plan

1. **Create markdown file** in `web/src/content/plans/`

```markdown
---
title: "Feature Name"
description: "Brief description"
feature: "Feature Name"
organization: "Org Name"
personRole: "platform_owner"
ontologyDimensions: ["Things", "Knowledge"]
assignedSpecialist: "Agent Name"
totalCycles: 100
completedCycles: 0
createdAt: 2025-10-30
draft: false
---

# Feature Plan

Content here...
```

2. **Track tasks** with cycle numbers and status:

```yaml
tasks:
  - cycleNumber: 1
    content: "Understand requirements"
    status: pending
    activeForm: "Understanding requirements"

  - cycleNumber: 2
    content: "Design schema"
    status: pending
    activeForm: "Designing schema"
    dependencies: [1]
```

3. **Record lessons** after each completed cycle:

```yaml
lessonsLearned:
  - cycle: 5
    lesson: "X pattern works better than Y approach"
  - cycle: 10
    lesson: "Need additional validation for edge case Z"
```

### Viewing Plans

Plans are available in the web application:

- **Collection:** `/plans` - List all plans
- **Individual:** `/plans/[slug]` - View specific plan with task breakdown
- **Dashboard:** `/plans/dashboard` - Analytics and progress tracking

### Integration with CLI Workflow

Plans integrate with ONE CLI commands:

- `/now` - Display current cycle and context
- `/next` - Advance to next cycle
- `/todo` - View complete plan
- `/done` - Mark cycle complete and record lesson

## Key Features

✅ **Dependency Tracking** - Tasks can declare dependencies on other cycles
✅ **Progress Metrics** - Track completed cycles, dependencies met
✅ **Lesson Capture** - Record learning after each step
✅ **Type Safety** - Full TypeScript support via Zod schema
✅ **Ontology Mapping** - All plans map to 6-dimension ontology
✅ **Multi-tenancy** - Plans can be org/group specific

## Examples

### Simple Linear Plan

Cycles with no dependencies, sequential execution

### Complex Plan

Cycles with dependencies enabling parallel work after foundation phase:

- Cycle 1-10: Foundation (sequential)
- Cycle 11-30: Backend + Frontend (parallel)
- Cycle 31+: Integration (depends on Backend + Frontend)

### Lightweight Plan

Minimal tasks for well-understood features:

- Skip irrelevant cycles
- Combine related cycles
- Mark as draft and iterate

## Benefits

| Aspect      | Traditional Planning        | Cycle-Based          |
| ----------- | --------------------------- | ------------------------ |
| Unit        | Days/weeks (variable)       | Cycle passes (fixed) |
| Accuracy    | Low (depends on estimation) | High (concrete steps)    |
| Parallelism | Sequential bias             | Natural parallelism      |
| Context     | Heavy (150k tokens)         | Light (3k tokens)        |
| Speed       | Slow (115s avg)             | Fast (20s avg)           |
| Learning    | Lost after project          | Captured per cycle   |

## Related Files

- **Schema:** `web/src/content/config.ts` - PlanSchema definition
- **Pages:** `web/src/pages/plans/` - Collection pages and routes
- **CLI:** `.claude/commands/done.md` - Mark cycle complete
- **Ontology:** `one/knowledge/ontology.md` - 6-dimension reference
- **Workflow:** `one/connections/workflow.md` - 6-phase development process

## Future Enhancements

- [ ] Real-time collaboration on plans
- [ ] Cycle timeline visualization
- [ ] Dependency graph visualization
- [ ] AI-powered lesson extraction
- [ ] Plan templates for common feature types
- [ ] Integration with GitHub issues and PRs
- [ ] Automated progress updates from commits
- [ ] Cross-team plan aggregation and analytics
