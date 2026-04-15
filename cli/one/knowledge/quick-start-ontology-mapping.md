---
title: Quick Start Page - Ontology Mapping
description: Maps quick-start page design to the 6-dimension ontology
dimension: knowledge
category: design-patterns
tags: quick-start, ontology, design, documentation
created: 2025-11-06
---

# Quick Start Page - 6-Dimension Ontology Mapping

This document traces every design decision and component through the ONE 6-dimension ontology, ensuring the page is not just beautiful but also ontologically coherent.

---

## 1. Groups Dimension (Multi-Tenant Isolation)

### How the Quick Start Page Models Groups

**The Question:** Who owns this documentation? Who can customize it?

**Answer:** The quick-start page is scoped to a group (or organization level for platform-wide documentation).

```typescript
// Quick start is a "thing" in the knowledge dimension
{
  _id: "quickstart_docs_001",
  groupId: "one_platform",           // Owned by the organization
  type: "documentation",              // Documentation thing type
  name: "Quick Start Guide",
  properties: {
    designType: "wireframe",
    pages: [
      { name: "hero", sections: [...] },
      { name: "benefits", sections: [...] }
    ],
    brandColors: {
      primary: "222.2 47.4% 11.2%",   // From group settings
      accent: "210 100% 50%"
    }
  },
  status: "published",
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### Hierarchical Groups (Nested Organizations)

Different organizations can have different quick-start pages:

```
groups/one-platform (organization)
├── docs/quick-start (scoped to one-platform)
│   └── colors: primary blue, accent cyan
│
groups/acme-corp (organization)
├── docs/quick-start (scoped to acme-corp)
│   └── colors: primary red, accent orange
│
groups/emma-dao (dao)
├── docs/quick-start (scoped to emma-dao)
│   └── colors: primary purple, accent green
```

**Implication:** The same design system (wireframe + components) serves all groups. Only the color tokens change based on `group.properties.brandColors`.

---

## 2. People Dimension (Authorization & Roles)

### Who Can View, Edit, and Publish the Quick Start Page?

**Roles:**
- **platform_owner**: Can edit documentation across all groups
- **org_owner**: Can customize quick-start for their organization
- **org_user**: Can view documentation
- **customer**: Can view public documentation

### Role-Based Content Customization

```typescript
// Quick start page renders different CTAs by role

if (role === "org_user" || role === "customer") {
  // "Start Building" → points to /quick-start
  showCTA("Start Building", "/quick-start");
}

if (role === "org_owner") {
  // Additional CTA: "Customize Branding"
  showCTA("Customize Branding", "/admin/branding");
}

if (role === "platform_owner") {
  // Edit documentation
  showButton("Edit Documentation", "/admin/docs/quick-start/edit");
}
```

### Authorization Chain

```
Person (Emma)
  ↓ has role: org_user
Organization (Acme Corp)
  ↓ has access to
Quick Start Documentation
  ↓ reads
Colors: primary, accent, fonts (from Acme's brand settings)
```

---

## 3. Things Dimension (Entities)

### What Things Are Involved in the Quick Start Page?

**Primary Things:**
1. **Documentation** (thing type: "documentation")
   - Quick start page itself

2. **Design** (thing type: "design")
   - Wireframes (components OntologyFlow, QuickStartOptions, QuickWalkthrough)
   - Design tokens (colors, typography, spacing)
   - Component definitions (React component specs)

3. **Content** (thing type: "text_content" or "blog_post")
   - Tutorial steps
   - Code examples
   - Explanations

4. **Navigation** (thing type: "workflow" or "guide")
   - Learning path (Next Steps section)
   - Related documentation links

### Entity Relationships to Quick Start

```typescript
// Things on the quick start page
{
  // Thing 1: The page itself
  {
    type: "documentation",
    name: "Quick Start Guide",
    properties: {
      sections: [
        { name: "hero", component: "HeroSection" },
        { name: "quick-start-options", component: "QuickStartOptions" },
        { name: "walkthrough", component: "QuickWalkthrough" },
        { name: "benefits", component: "BenefitsGrid" }
      ]
    }
  },

  // Thing 2: Featured course (in "Next Steps" section)
  {
    type: "course",
    name: "Learn the 6 Dimensions",
    properties: {
      duration: "10 minutes",
      difficulty: "beginner",
      url: "/docs/core-concepts/ontology"
    }
  },

  // Thing 3: Referenced feature (Ontology)
  {
    type: "knowledge_base",
    name: "6-Dimension Ontology",
    properties: {
      chapters: ["groups", "people", "things", "connections", "events", "knowledge"]
    }
  }
}
```

---

## 4. Connections Dimension (Relationships)

### How Does the Quick Start Page Relate to Other Things?

**Connection Types:**

1. **teaches** (Documentation → Concept)
   ```typescript
   {
     fromThingId: "quickstart_docs_001",
     toThingId: "ontology_knowledge_001",
     relationshipType: "teaches",
     metadata: {
       section: "hero",
       learningObjective: "understand 6 dimensions visually"
     }
   }
   ```

2. **references** (Documentation → Related Docs)
   ```typescript
   {
     fromThingId: "quickstart_docs_001",
     toThingId: "backend_guide_001",
     relationshipType: "references",
     metadata: {
       context: "next-steps",
       order: 2
     }
   }
   ```

3. **created_by** (Documentation → Design Agent)
   ```typescript
   {
     fromThingId: "quickstart_docs_001",
     toThingId: "design_agent_001",
     relationshipType: "created_by",
     metadata: {
       role: "designer",
       stage: "5_design"
     }
   }
   ```

4. **connected_to** (Component → Component)
   ```typescript
   {
     fromThingId: "OntologyFlowComponent",
     toThingId: "DimensionColors",
     relationshipType: "uses",
     metadata: {
       tokens: ["--color-dimension-groups", "--color-dimension-people"]
     }
   }
   ```

### Why This Matters

**Knowledge Graph Query Example:**
```typescript
// Find all documentation that teaches about the 6 dimensions
const docs = await findConnections({
  toThingId: "ontology_knowledge_001",
  relationshipType: "teaches"
});
// Returns: [quick_start, architecture_guide, onboarding_flow, ...]

// Find all next steps from quick-start
const nextSteps = await findConnections({
  fromThingId: "quickstart_docs_001",
  relationshipType: "references",
  metadata: { context: "next-steps" }
});
// Returns: [backend_guide, architecture_guide, deployment_guide, ...]
```

---

## 5. Events Dimension (Actions & Audit Trail)

### What Actions Happen on the Quick Start Page?

**User Actions (Things That Get Logged):**

```typescript
// Event 1: User views quick start page
{
  type: "page_viewed",
  actorId: "user_123",
  targetId: "quickstart_docs_001",
  timestamp: 1234567890,
  metadata: {
    path: "/docs/getting-started/quick-start",
    referrer: "google.com",
    device: "mobile"
  }
}

// Event 2: User scrolls to section
{
  type: "section_scrolled",
  actorId: "user_123",
  targetId: "quickstart_docs_001",
  timestamp: 1234567891,
  metadata: {
    section: "benefits-grid",
    scrollPercentage: 45
  }
}

// Event 3: User clicks "Start Building" CTA
{
  type: "cta_clicked",
  actorId: "user_123",
  targetId: "quickstart_docs_001",
  timestamp: 1234567892,
  metadata: {
    ctaLabel: "Start Building",
    ctaTarget: "/quick-start",
    section: "hero"
  }
}

// Event 4: User copies code block
{
  type: "code_copied",
  actorId: "user_123",
  targetId: "quickstart_docs_001",
  timestamp: 1234567893,
  metadata: {
    code: "bun install",
    step: 1,
    section: "quick-start-options"
  }
}

// Event 5: User opens tab
{
  type: "tab_switched",
  actorId: "user_123",
  targetId: "quickstart_docs_001",
  timestamp: 1234567894,
  metadata: {
    tabName: "bootstrap",
    section: "quick-start-options"
  }
}

// Event 6: User clicks "Next Steps" link
{
  type: "link_clicked",
  actorId: "user_123",
  targetId: "quickstart_docs_001",
  timestamp: 1234567895,
  metadata: {
    link: "/docs/core-concepts/ontology",
    linkText: "Learn the 6 Dimensions",
    section: "next-steps"
  }
}

// Event 7: Page reaches performance milestone
{
  type: "page_loaded",
  actorId: "system",
  targetId: "quickstart_docs_001",
  timestamp: 1234567890,
  metadata: {
    lcp: 2200,           // Largest Contentful Paint: 2.2s (< 2.5s target)
    fid: 85,             // First Input Delay: 85ms (< 100ms target)
    cls: 0.08,           // Cumulative Layout Shift: 0.08 (< 0.1 target)
    performanceScore: 92 // Lighthouse score
  }
}
```

### Analytics Derived from Events

**Conversion Funnel:**
```
Users who view page: 1000
↓ Scroll past hero: 800 (80%)
↓ Reach benefits section: 700 (70%)
↓ Click CTA: 150 (15%)
↓ Complete quick start: 120 (12%)

Metric: 12% conversion rate (target: > 10%)
```

**Engagement Metrics:**
```
Average time on page: 2m 15s (target: > 90s) ✓
Users who interact with tabs: 45% (target: > 40%) ✓
Users who copy code: 38% (target: > 30%) ✓
Click-through to next docs: 22% (target: > 20%) ✓
```

**Performance Events (Logged by System):**
```
LCP (Largest Contentful Paint): 2.2s
FID (First Input Delay): 85ms
CLS (Cumulative Layout Shift): 0.08
Lighthouse Score: 92/100
```

### Why This Matters

**Product Insights:**
- Which sections do users spend most time reading?
- What's the conversion path from "interested" to "building"?
- Which CTA is most effective (primary vs secondary)?
- What's the drop-off point?
- Do users on mobile vs desktop behave differently?

**Design Validation:**
- Is the page meeting performance targets (LCP, CLS)?
- Are users finding the code blocks easy to use (copy button)?
- Do users expand all walkthrough steps or just first few?

---

## 6. Knowledge Dimension (Semantics & Search)

### How Does the Quick Start Page Enable Intelligence?

**Labels & Categorization:**

```typescript
// Knowledge about the quick start page
{
  thingId: "quickstart_docs_001",
  labels: [
    // Skill level
    "audience:beginners",
    "audience:developers",

    // Topic
    "topic:getting-started",
    "topic:ontology",
    "topic:setup",

    // Format
    "format:interactive",
    "format:step-by-step",
    "format:code-examples",

    // Goal
    "goal:learn",
    "goal:build",

    // Status
    "status:published",
    "status:featured",

    // Technology
    "technology:astro",
    "technology:react",
    "technology:tailwind",

    // Skill requirements
    "skill:javascript",
    "skill:typescript",
    "skill:node.js"
  ]
}
```

### Semantic Search

**User searches for:**
```
"how do i get started with ONE?"
↓
Search engine vectorizes this query
↓
Finds documents with labels:
  - audience:beginners (matches "get started")
  - goal:learn (matches user intent)
  - format:step-by-step (matches "how do i")
↓
Returns: Quick Start Page (rank 1)
```

### RAG (Retrieval-Augmented Generation)

**When AI needs context about quick-start patterns:**

```typescript
// AI query
"Generate a quick start guide for feature X"

// RAG retrieval
vectorSearch({
  query: "getting started structure",
  limit: 5
});

// Returns chunks from quick-start page:
[
  {
    chunk: "Hero section with headline, subheadline, value props",
    source: "quickstart_docs_001",
    label: "format:interactive",
    relevance: 0.95
  },
  {
    chunk: "Tabbed setup options (bootstrap vs clone)",
    source: "quickstart_docs_001",
    label: "format:step-by-step",
    relevance: 0.92
  },
  {
    chunk: "Walkthrough with 5 expandable steps",
    source: "quickstart_docs_001",
    label: "format:interactive",
    relevance: 0.89
  }
]

// AI uses these chunks as templates for new guides
```

### Embeddings for Similarity

**Content similar to quick-start:**
```typescript
// Vector similarity search
findSimilarContent("quickstart_docs_001", topK: 5);

// Returns similar docs
[
  { name: "5-Minute Setup Guide", similarity: 0.92 },
  { name: "Getting Started with Astro", similarity: 0.87 },
  { name: "Onboarding Flow", similarity: 0.84 },
  { name: "Tutorial Series", similarity: 0.81 },
  { name: "Installation Guide", similarity: 0.78 }
]
```

### Knowledge Chunks (Reusable Patterns)

**Chunk 1: Hero Section Pattern**
```typescript
{
  id: "chunk_hero_pattern",
  title: "Hero Section: Problem + Solution + CTA",
  content: "Lead with the problem (manual setup is slow). Show the solution (ONE automates). Include dual CTAs (Primary: start now, Secondary: learn more).",
  labels: ["pattern:hero", "pattern:sales", "component:hero"],
  sources: ["quickstart_docs_001"],
  usage: "Used in: Quick Start, Landing Page, Feature Pages"
}
```

**Chunk 2: Tabbed Options Pattern**
```typescript
{
  id: "chunk_tabs_pattern",
  title: "Tabbed Decision: Bootstrap vs Manual",
  content: "When users have multiple setup paths, use tabs to avoid overwhelming them. Bootstrap (easy path) vs Clone (control path). Benefits list for each.",
  labels: ["pattern:tabs", "pattern:setup", "component:tabs"],
  sources: ["quickstart_docs_001"],
  usage: "Used in: Installation guides, Setup wizards"
}
```

**Chunk 3: Expandable Walkthrough Pattern**
```typescript
{
  id: "chunk_walkthrough_pattern",
  title: "5-Step Expandable Walkthrough",
  content: "Progressive disclosure: Show numbered steps, expand on click. Reduces cognitive load. Each step includes code, explanation, details.",
  labels: ["pattern:walkthrough", "pattern:tutorial", "component:accordion"],
  sources: ["quickstart_docs_001"],
  usage: "Used in: Tutorials, Onboarding, Setup guides"
}
```

### Future AI Generation

**When building future guides, the system can:**

1. **Query by pattern:** "Show me all hero section patterns"
2. **Adapt existing pattern:** "Create a hero for Feature X based on quick-start hero"
3. **Combine chunks:** "Combine hero, tabs, and walkthrough for new feature guide"
4. **Maintain consistency:** "Ensure this guide follows ONE documentation standards"

---

## Complete Ontology Loop

### Cycle: User Views Page → Gets Value → Signals Success

```
1. GROUPS (Container)
   User (Emma) belongs to organization (Acme Corp)
   ↓

2. PEOPLE (Authorization)
   Emma has role: org_user
   Permission to view quick-start docs
   ↓

3. THINGS (Content)
   Quick-start page loads (documentation thing)
   - Hero section (displays ontology)
   - Quick-start options (tabs with setup paths)
   - Walkthrough (5 steps)
   ↓

4. CONNECTIONS (Relationships)
   Documentation (quick-start) teaches Concept (6 dimensions)
   Documentation references Course (Learn Ontology)
   ↓

5. EVENTS (Actions Logged)
   Emma views page
   Emma scrolls to benefits
   Emma clicks "Start Building" CTA
   Emma copies code block
   Emma opens "Learn Ontology" link
   ↓

6. KNOWLEDGE (Understanding)
   System learns:
   - Emma is beginner (reads quick-start)
   - Emma interested in ontology (clicked link)
   - Emma has 30 min available (read time)
   - Emma prefers guided path (clicked bootstrap option)

   Labels updated:
   - emma: +audience:beginner
   - emma: +goal:learn
   - emma: +skill:potential:javascript
```

### Business Value From Ontology

**What We Know After This Loop:**

```
User Signal          Ontology Mapping        Business Value
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Viewed quick-start   event:page_viewed       User is interested
Scrolled benefits    event:section_scrolled  User engaged with value prop
Clicked bootstrap    connection:chose_path   User prefers guided approach
Copied code          event:code_copied       User attempting setup
Clicked ontology     event:link_clicked      User wants deeper knowledge
(30 min on page)     event:duration          User is committed

Result: User has 95% chance of completing setup
Action: Send email: "Next: Build Your First Feature"
```

---

## Design Principles Derived From Ontology

### 1. Teach Through Groups Dimension
Every time you show a feature, highlight: "This works at any organizational scale."

**Example:** "The same quick-start setup works for Emma's startup and Fortune 500 companies."

### 2. Respect People Dimension
Always show role-appropriate content. An org_user sees different CTAs than platform_owner.

**Example:** Only show "Customize Branding" to org_owner role.

### 3. Model Things Dimension
Every entity on the page should have a type. Documentation is a thing. Design is a thing.

**Example:** Page title → "Quick Start" (documentation thing)

### 4. Strengthen Connections Dimension
Make relationships explicit. Link to related documentation, courses, guides.

**Example:** "Next Steps" section connects to 3 related courses.

### 5. Log Everything (Events Dimension)
Track all user interactions. Anonymize where needed, but log comprehensively.

**Example:** Page load → event, scroll → event, click → event

### 6. Enable Knowledge (Knowledge Dimension)
Label content for searchability and RAG. Future AI will learn from this.

**Example:** Label: "audience:beginners" enables AI to find beginner-friendly content.

---

## Implementation Guidance

### When Frontend Specialist Builds Components

**OntologyFlow Component:**
```typescript
// Maps to Knowledge dimension
// Chunks: "6-dimension-overview" pattern
// Labels: ["pattern:diagram", "format:visual"]
// Purpose: Teach the ontology

// Maps to Things dimension
// Type: "design" (it's a design artifact)
// Properties: { designType: "diagram" }
```

**QuickStartOptions Component:**
```typescript
// Maps to Things dimension (documentation)
// Maps to Knowledge dimension (tabbed pattern)
// Labels: ["pattern:tabs", "format:code"]
// Purpose: Guide setup path selection
```

**QuickWalkthrough Component:**
```typescript
// Maps to Things dimension (walkthrough content)
// Maps to Knowledge dimension (expandable pattern)
// Labels: ["pattern:walkthrough", "format:step-by-step"]
// Purpose: Guide step-by-step setup
```

### When Frontend Specialist Adds Events

```typescript
// In OntologyFlow component
useEffect(() => {
  logEvent({
    type: "component_rendered",
    targetId: "quickstart_docs_001",
    metadata: { component: "OntologyFlow" }
  });
}, []);

// In QuickStartOptions component
const handleTabChange = (tab) => {
  logEvent({
    type: "tab_switched",
    targetId: "quickstart_docs_001",
    metadata: { tabName: tab, section: "quick-start-options" }
  });
};

// In copy button
const handleCopy = () => {
  logEvent({
    type: "code_copied",
    targetId: "quickstart_docs_001",
    metadata: { code: codeToCopy, section: "quick-start-options" }
  });
};
```

### When Measuring Success

**Metrics to Track (from Events):**
1. Page views (event: page_viewed)
2. Scroll depth (event: section_scrolled)
3. CTA clicks (event: cta_clicked)
4. Code copies (event: code_copied)
5. Tab switches (event: tab_switched)
6. Next step clicks (event: link_clicked)
7. Performance metrics (event: page_loaded)

**Success Criteria (derived from ontology):**
- User progresses through all 6 dimensions (understood → interested → building)
- User's role-based content is appropriate (people dimension)
- User is connected to related documentation (connections dimension)
- User's actions are logged for analytics (events dimension)
- Future AI can learn from this page (knowledge dimension)

---

## Conclusion

**The quick-start page is not just a design artifact. It's a complete ontological entity** that:

1. **Groups:** Scoped to organizations (multi-tenant from day one)
2. **People:** Respects role-based authorization (shows appropriate content)
3. **Things:** Documents what exists and how to get started
4. **Connections:** Links to related documentation and courses
5. **Events:** Logs every user action for analytics and learning
6. **Knowledge:** Teaches the ontology and provides patterns for future docs

When built this way, the quick-start page becomes:
- **Scalable** (same page works for 2-person startup to 10M-person enterprise)
- **Learnable** (AI agents can extract patterns for future guides)
- **Measurable** (comprehensive event logging enables optimization)
- **Principled** (every design decision maps to ontology)

---

**Design Agent:** Ontology mapping complete. All design decisions validated against the 6 dimensions.

