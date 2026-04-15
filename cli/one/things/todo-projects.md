---
title: Todo Projects
dimension: things
primary_dimension: things
category: todo-projects.md
tags: ai
related_dimensions: events, groups, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the todo-projects.md category.
  Location: one/things/todo-projects.md
  Purpose: Documents projects content collection & management system
  Related dimensions: events, groups, people
  For AI agents: Read this to understand todo projects.
---

# Projects Content Collection & Management System

## Overview

The **Projects content collection** defines the 6 core projects for the ONE Platform. Each project represents a major product offering with its own scope, timeline, and deliverables.

**Location:** `web/src/content/projects/`

## Core Projects

The platform consists of exactly 6 projects:

1. **Pages** - Static website and landing pages builder
2. **Blog** - Content publishing platform with audience engagement
3. **Shop** - E-commerce platform with products and payments
4. **Dashboard** - Analytics and team management interface
5. **Website** - Full-featured website builder with CMS
6. **Email** - Email marketing platform with automation

## Schema Structure

```typescript
ProjectSchema {
  title: string                           // Project title
  description: string                     // Brief description
  project: string                         // Project name
  organization?: string                   // Organization name
  personRole?: enum                       // User's role
  ontologyDimensions?: string[]          // Mapped to 6-dimension ontology
  assignedSpecialist?: string            // Agent/specialist assigned
  status: enum                            // Project status (planning, active, completed, archived)
  priority?: enum                         // Priority level (low, medium, high, critical)

  // Timeline & Dates
  startDate: date                         // Project start date
  targetEndDate?: date                    // Target completion date
  completedAt?: date                      // Actual completion date

  // Scope & Specifications
  objectives?: string[]                   // Project objectives
  deliverables?: string[]                 // Expected deliverables
  scope?: string                          // Project scope document

  // Metrics
  progress: number                        // Percentage complete (0-100)
  budget?: number                         // Project budget
  spent?: number                          // Amount spent
  estimatedHours?: number                 // Estimated effort in hours
  actualHours?: number                    // Actual effort spent

  // Organization
  parentProjectId?: string                // Parent project (for sub-projects)
  tags?: string[]                         // Tags for categorization
  teams?: string[]                        // Team members assigned

  // Lessons & Insights
  lessonsLearned?: {
    milestone: string
    lesson: string
  }[]

  // Timestamps
  createdAt?: date
  updatedAt?: date
  draft?: boolean
}
```

## Project Status Lifecycle

- **planning** - Initial planning phase, not yet active
- **active** - Currently in progress
- **on_hold** - Paused but not completed
- **completed** - Successfully finished
- **archived** - Historical project, no longer active

## Usage

### Project Files

Each of the 6 core projects has its own markdown file:

- `pages.md` - Pages builder for static sites and landing pages
- `blog.md` - Blog platform for content publishing
- `shop.md` - E-commerce platform with shopping and payments
- `dashboard.md` - Analytics and team management
- `website.md` - Full-featured website builder with CMS
- `email.md` - Email marketing with automation

### Project Structure

All projects follow the same schema structure with the following key fields:

```yaml
title: "Project Name" # Project title
description: "Description" # Brief overview
project: "Project Name" # Project identifier
organization: "ONE Platform" # Organization
status: "active" # Status (active, planning, completed, archived)
priority: "high" # Priority (low, medium, high, critical)
startDate: 2025-10-30 # Start date
targetEndDate: 2026-XX-XX # Target completion
progress: 0 # Progress percentage (0-100)
ontologyDimensions: [...] # Mapped 6-dimension ontology
assignedSpecialist: "agent-x" # Assigned specialist/agent
objectives: [...] # Project objectives
deliverables: [...] # Expected deliverables
createdAt: 2025-10-30 # Creation date
draft: false # Draft status
```

### Viewing Projects

The 6 core projects are available in the web application:

- **Pages:** `/projects/pages` - Static pages and landing page builder
- **Blog:** `/projects/blog` - Content publishing platform
- **Shop:** `/projects/shop` - E-commerce platform
- **Dashboard:** `/projects/dashboard` - Analytics and team management
- **Website:** `/projects/website` - Full-featured website builder
- **Email:** `/projects/email` - Email marketing platform

**Collection View:** `/projects` - Lists all 6 core projects

## Key Features

✅ **Progress Tracking** - Monitor project completion percentage
✅ **Timeline Management** - Start dates, target dates, completion tracking
✅ **Budget Tracking** - Monitor spent vs. budget allocation
✅ **Hierarchical Organization** - Support for parent/child projects
✅ **Resource Allocation** - Team member and specialist assignment
✅ **Lesson Capture** - Record learning after each milestone
✅ **Type Safety** - Full TypeScript support via Zod schema
✅ **Ontology Mapping** - All projects map to 6-dimension ontology
✅ **Multi-tenancy** - Projects can be org/group specific

## Project Hierarchy

### The 6 Core Projects

The platform is organized into 6 independent projects, each with distinct scope and deliverables:

```
ONE Platform Projects
├── Pages (Landing pages & static sites)
├── Blog (Content publishing)
├── Shop (E-commerce & payments)
├── Dashboard (Analytics & management)
├── Website (Full website builder)
└── Email (Email marketing)
```

Each project:

- Has independent development timeline
- Maps to specific 6-dimension ontology dimensions
- Assigned to specialized agents/teams
- Tracks progress from 0-100%
- Has clear objectives and deliverables

## Benefits

| Aspect         | Benefit                                           |
| -------------- | ------------------------------------------------- |
| Clarity        | 6 clearly defined products with specific focus    |
| Organization   | Each project organized by product offering        |
| Tracking       | Real-time progress visibility for each product    |
| Planning       | Defined scope, timeline, and deliverables         |
| Specialization | Each project assigned to specialized teams/agents |
| Scalability    | Each project independently scalable               |
| Portfolio      | Complete product portfolio representation         |

## Related Files

- **Schema:** `web/src/content/config.ts` - ProjectSchema definition
- **Pages:** `web/src/pages/projects/` - Collection pages and routes
- **Ontology:** `one/knowledge/ontology.md` - 6-dimension reference
- **Workflow:** `one/connections/workflow.md` - 6-phase development process

## Future Enhancements

### Pages Project

- [ ] Advanced page template library (50+ templates)
- [ ] Conditional content rendering
- [ ] A/B testing framework
- [ ] Advanced analytics integration

### Blog Project

- [ ] Comment system and moderation
- [ ] Social sharing optimization
- [ ] Subscriber management
- [ ] Paywall and membership features

### Shop Project

- [ ] Advanced inventory management
- [ ] Vendor/seller management system
- [ ] Marketplace features
- [ ] Advanced fraud detection

### Dashboard Project

- [ ] Custom dashboard builder
- [ ] Advanced forecasting models
- [ ] Team performance analytics
- [ ] Automated alert system

### Website Project

- [ ] AI-powered content generation
- [ ] Advanced form builder
- [ ] Dynamic pricing engine
- [ ] Multi-tenant website hosting

### Email Project

- [ ] Advanced AI-powered subject line optimization
- [ ] Predictive send time optimization
- [ ] Dynamic content personalization
- [ ] Advanced compliance tools
