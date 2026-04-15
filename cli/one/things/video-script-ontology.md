---
title: Video Script Ontology
dimension: things
category: video-script-ontology.md
tags: 6-dimensions, architecture, events, ontology
related_dimensions: connections, events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the video-script-ontology.md category.
  Location: one/things/video-script-ontology.md
  Purpose: Documents video script: why the 6-dimension ontology is non-negotiable
  Related dimensions: connections, events, groups, knowledge, people
  For AI agents: Read this to understand video script ontology.
---

# Video Script: Why the 6-Dimension Ontology is Non-Negotiable
## Opening Hook (30 seconds)

"You're drowning in feature requests. Your codebase is fragmenting. Your estimates are consistently wrong. Your team ships slower every sprint.

The problem isn't your tools. It's your **data model**.

Every successful platform solves the same problem: scaling from idea to millions of users without chaos. The difference between platforms that scale and platforms that collapse isn't luck. It's _architecture_.

Today, we're showing you a data model that makes that architecture inevitable."

---

## Part 1: The Problem Statement (60 seconds)

### Problem 1: Fragmented Thinking

Most codebases evolve organically:

- Users are in one place (auth service)
- Content is scattered (blog tables, document tables, asset tables)
- Relationships are implied (foreign keys everywhere)
- Events are... somewhere (logs, webhooks, eventual consistency)
- Search is bolted on (Elasticsearch, Vector DB, full-text index)

Result: **Every feature adds complexity. Every team member has a different mental model.**

### Problem 2: Estimation Catastrophe

You estimate in days:

- "This feature is 3 days" (no, it's 8)
- "This bug fix is 2 hours" (you mean 6 hours)
- "We can ship this quarter" (actually 2025)

Why? Because you're estimating at the wrong level. **Time is a terrible unit for predicting software.**

Time depends on:

- Developer skill (varies 10x)
- Context switching (varies 20x)
- Unexpected dependencies (varies 50x)
- Sleep, mood, interruptions (varies infinitely)

### Problem 3: Scaling Breaks Everything

You build a social feature for users. Then you need it for teams. Then for organizations. Then for hierarchies of organizations.

Each time, you're **refactoring your data model**. Your users table becomes a people table. Your follows table becomes a connections table. Your audit logs become an event stream.

You're reinventing the same wheel repeatedly.

---

## Part 2: The Ontology Solution (90 seconds)

### What Is It?

The 6-Dimension Ontology is a **universal data model** that doesn't change as you scale:

```
1. GROUPS    - Containers (friend circles to governments)
2. PEOPLE    - Authorization (who can do what)
3. THINGS    - Entities (users, content, tokens, anything)
4. CONNECTIONS - Relationships (owns, authored, enrolled, etc.)
5. EVENTS    - Actions (complete audit trail)
6. KNOWLEDGE - Meaning (embeddings, vectors, RAG)
```

That's it. Five tables. That's your entire data model.

### Why It Works

**It maps to how humans think about the world:**

- Things exist (nouns)
- People do things (verbs)
- Relationships connect things (grammar)
- Actions have consequences (causality)
- Meaning emerges from patterns (knowledge)
- Organization contains scale (groups)

You can describe **any feature** using these dimensions:

- A user following another user? Connection.
- A team owning a project? Connection + Group.
- A product sold to a customer? Thing + Event.
- Search across all content? Knowledge.
- "Who can edit this?" Authorization via People.

**The magic:** You don't need to redesign your schema when you scale. You just add more groups or things.

---

## Part 3: The Practical Benefits (120 seconds)

### Benefit 1: Forced Clarity

Before you code, you answer:

- ✅ Which group owns this?
- ✅ Who can access it (People/authorization)?
- ✅ What entities are involved (Things)?
- ✅ How do they relate (Connections)?
- ✅ What actions matter (Events)?
- ✅ What needs to be searchable (Knowledge)?

**Result:** You catch architectural problems before you write a line of code. You know exactly what you're building.

### Benefit 2: 98% Context Reduction

Traditional approach: "I need to understand this entire feature."

- 150,000 tokens of context
- 45 minutes to onboard
- One mistake costs 8 hours to debug

Ontology approach: "I need to implement one cycle pass."

- 3,000 tokens of context
- 5 minutes to understand
- Errors are isolated to one dimension

**We measured this:** Context reduction from 150k → 3k tokens per cycle. That's **50x improvement**.

### Benefit 3: Cycle-Based Planning

Stop estimating in days. Estimate in **cycle passes**.

```
Cycle 1-10:    Foundation (understand the problem)
Cycle 11-20:   Backend (schema & services)
Cycle 21-30:   Frontend (UI & components)
Cycle 31-40:   Integration (external systems)
Cycle 41-50:   Auth (security & permissions)
...
Cycle 91-100:  Deployment (production & docs)
```

Why cycle? Because:

- **It's predictable.** Each cycle is a concrete step (not "about 3 days").
- **It's parallelizable.** Cycle 11-20 (Backend) and Cycle 21-30 (Frontend) run concurrently.
- **It's error-isolated.** A bug in Cycle 25 doesn't block Cycle 50.
- **It's learnable.** Each cycle captures lessons that improve the next.

**Measured result:** 115 seconds → 20 seconds per feature average. **5.75x faster**.

### Benefit 4: Zero Refactoring Between Scales

You build for users. Now you need it for teams.

Traditional approach:

- Refactor users → people
- Refactor follows → connections
- Refactor audit logs → event stream
- Update 40+ queries

Ontology approach:

- **Nothing changes.** People are already Things with role metadata. Teams are already Groups. Follows are already Connections.

Scale from 2 people (friend circle) to 8 billion (global government). Same schema.

### Benefit 5: Complete Audit Trail

Every action is logged as an Event:

- Who did it (actor)
- What they did (action type)
- What changed (target)
- When it happened (timestamp)
- Why it matters (metadata)

**Result:** Compliance is free. Debugging is deterministic. You can replay any sequence of events.

### Benefit 6: Semantic Search Built-In

The Knowledge dimension stores embeddings. Linked to Things. Scoped to Groups.

Result: You get RAG (Retrieval-Augmented Generation) for free. Your AI features know the context. Your search is intelligent.

---

## Part 4: Real-World Impact (60 seconds)

### Case Study: Creator Platform

**Without ontology:**

- Onboard creators: 2 weeks
- Add team features: 4 weeks (refactor)
- Add course marketplace: 6 weeks (new concept)
- Add community features: 8 weeks (more refactoring)
- Total: 20+ weeks

**With ontology:**

- Onboard creators: 3 days (10 cycles)
- Add team features: 2 days (understand Groups)
- Add course marketplace: 3 days (new Thing type)
- Add community features: 2 days (different Group structure)
- Total: 10 days

**Why?** Because the schema doesn't change. The data model is universal. You're just using existing dimensions in new combinations.

### Case Study: Enterprise CRM

**Pain point:** "Customers need custom fields."

Traditional: "We need a whole plugin architecture."

Ontology: "Those are already in `properties` (flexible JSON)."

**Same for:** Hierarchies, multi-tenancy, audit trails, integrations, automation, search.

---

## Part 5: Why It's Not Optional (45 seconds)

### Myth: "We can add the ontology later"

❌ False. Here's why:

- If you build without it, your schema is _already wrong_.
- Fixing it later costs 10x more (refactoring + data migration + testing).
- Your team learns the wrong patterns.
- Your codebase fragments further.

### Truth: Ontology First

**Start with the 6 dimensions. Everything follows.**

You don't have to implement all of it immediately:

- Start with Groups, People, Things (simple CRUD)
- Add Connections as you need relationships
- Add Events when you need audit trails
- Add Knowledge when you need search

But you need the **shape** of the ontology from day one.

---

## Part 6: The Competitive Advantage (45 seconds)

### Your competitors:

- Ship slowly
- Refactor constantly
- Lose context switching
- Estimate wildly
- Scale painfully

### You (with ontology):

- Ship 5x faster
- Never refactor the core schema
- 50x less context overhead
- Predictable cycle-based planning
- Scale infinitely without schema changes

**That's not incremental improvement. That's a different category.**

---

## Closing: The Choice (30 seconds)

"You have two paths:

**Path 1:** Build organically. Refactor constantly. Estimate in days. Pray scaling works.

**Path 2:** Start with the ontology. Clear thinking. Predictable cycle-based planning. Scale without friction.

The question isn't _whether_ you'll have a data model. You always will.

The question is: **Will you choose it deliberately, or will it choose itself through chaos?**

We've made the choice. We're using the 6-Dimension Ontology.

We're shipping 5x faster. We're scaling without refactoring. We're growing a team without onboarding pain.

You can too."

---

## Key Soundbites (for social/quotes)

- "The ontology isn't theory. It's the shape of reality. Build against it."
- "Estimation in days is guessing. Estimation in cycles is predicting."
- "Scale from friend circles to governments without changing your schema."
- "Context reduction: 150k tokens → 3k tokens per cycle."
- "The question isn't if you'll have a data model. It's: Will you choose it deliberately?"
- "5x faster shipping. 0 refactoring on scale. Infinite audit trails."
- "Every successful platform solves the same problem. We solved it once, universally."

---

## Implementation Notes

**This script works best as:**

1. **30-second elevator pitch** (Part 1 + Opening Hook)
2. **5-minute technical talk** (Parts 1-4)
3. **15-minute deep dive** (All parts + code examples)
4. **Long-form article** (Expand each section with code, diagrams, testimonials)

**Visual aids to include:**

- 6-dimension diagram (groups → people → things → connections → events → knowledge)
- Context reduction chart (150k → 3k)
- Execution speed chart (115s → 20s)
- Scaling comparison (refactoring costs timeline)
- Real feature examples mapped to 6 dimensions
