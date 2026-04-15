---
title: Deep Researcher Agent
dimension: things
category: plans
tags: agent, ai, ai-agent, architecture, groups, ontology
related_dimensions: events, groups, knowledge, people
scope: global
created: 2025-11-03
updated: 2025-11-03
version: 1.0.0
ai_context: |
  This document is part of the things dimension in the plans category.
  Location: one/things/plans/deep-researcher-agent.md
  Purpose: Documents deep researcher agent
  Related dimensions: events, groups, knowledge, people
  For AI agents: Read this to understand deep researcher agent.
---

# Deep Researcher Agent

A fully autonomous agent that performs multi-step research, reasoning, and synthesis across complex information landscapes. Inspired by Tongyi DeepResearch architecture and adapted for the ONE Platform 6-dimension ontology.

## Overview

The Deep Researcher Agent combines agentic continual pre-training, reinforcement learning, and iterative reasoning to solve complex information-seeking and analysis tasks. It excels at:

- Multi-step web research with reasoning
- Academic and professional research tasks
- Long-horizon planning and execution
- Information synthesis and report generation
- Complex problem decomposition

## 6-Dimension Ontology Mapping

### Groups

- **Organization Level**: Research team or domain (legal, technical, domain-specific)
- **Parent-Child**: Enterprise research department → domain teams
- **Data Scoping**: All research tasks, findings, and reports scoped to `groupId`
- **Plans**: `starter` (basic research), `pro` (advanced with synthesis), `enterprise` (multi-researcher parallel)

### People

- **Role**: `org_owner` (research director), `org_user` (researcher), `customer` (requesting research)
- **Permissions**:
  - View/create research tasks (all users)
  - Access synthetic data (pro/enterprise)
  - Execute reinforcement learning (org_owner)
  - Publish reports (org_user+)

### Things

- **Entity Type**: `researcher_agent` (the agent itself)
  - `properties.model`: "deepresearch-30b-moe" or variant
  - `properties.mode`: "react" | "heavy"
  - `properties.maxTurns`: cycle limit
  - `properties.tools`: ["web_search", "academic_retrieval", "python_exec", "knowledge_graph"]

- **Research Task** (`research_task`):
  - `properties.question`: the research objective
  - `properties.domain`: "academic", "legal", "technical", "general"
  - `properties.complexity`: "simple" | "moderate" | "complex" | "phd_level"
  - `properties.status`: "pending" | "in_progress" | "completed" | "failed"

- **Research Report** (`research_report`):
  - `properties.taskId`: reference to source task
  - `properties.findings`: synthesized conclusions
  - `properties.sources`: verified citations
  - `properties.confidence`: 0-1 score
  - `properties.timestamp`: completion time

### Connections

- **`researches`**: researcher_agent → research_task
  - metadata: `{ executionMode: "react" | "heavy", duration: milliseconds }`

- **`produces`**: researcher_agent → research_report
  - metadata: `{ quality: number, synthesisMethod: "single" | "parallel_synthesis" }`

- **`references`**: research_report → knowledge (source verification)
  - metadata: `{ citation: string, confidence: 0-1 }`

- **`requests`**: person → research_task (as researcher or requestor)
  - metadata: `{ role: "director" | "researcher" | "requester" }`

### Events

- **`research_started`**: Agent begins task
  - `metadata.taskId`, `metadata.mode`, `metadata.maxTurns`

- **`research_reasoning_step`**: Each thought-action-observation cycle
  - `metadata.turn`, `metadata.thought`, `metadata.action`, `metadata.observation`

- **`research_completed`**: Task finished with results
  - `metadata.taskId`, `metadata.turnsUsed`, `metadata.success`, `metadata.reportId`

- **`synthesis_executed`**: Multi-researcher parallel synthesis
  - `metadata.taskId`, `metadata.researcherCount`, `metadata.synthesisTime`

### Knowledge

- **Research Memory**: Vector embeddings of completed research patterns
  - Indexed by domain (academic, legal, technical)
  - Supports RAG for similar task discovery
  - Incremental updates from RL training

- **Synthetic Data Catalog**:
  - Entity-anchored knowledge graphs
  - Multi-style QA pairs for training
  - Action synthesis trajectories
  - Domain-specific difficulty levels

## Architecture

### Training Pipeline

```
Raw Model
    ↓
[Agentic CPT] ← Synthetic data synthesis (AgentFounder)
    ↓
Agentic Foundation Model
    ↓
[Agentic SFT] ← Expert-like trajectories (ReAct + IterResearch)
    ↓
Cold-Started Model
    ↓
[On-Policy RL] ← Dynamic data curation (GRPO)
    ↓
Production Deep Researcher Agent
```

### Execution Modes

#### 1. Native ReAct Mode

Pure reasoning without prompt engineering. Simple `Thought → Action → Observation` cycle.

```
Turn 1:
  Thought: I need to search for information about X
  Action: search("X")
  Observation: [Search results]

Turn 2:
  Thought: The results show Y, I need to dig deeper into Z
  Action: search("Z site:academic.org")
  Observation: [Academic sources]

... (continues up to maxTurns)
```

**Best for**: Straightforward research, time-sensitive tasks, baseline performance measurement.

#### 2. Heavy Mode (IterResearch)

Complex multi-step tasks with "cognitive focus" reconstruction.

```
Research Round 1:
  [Reconstruct workspace from previous round]
  Analyze problem
  Integrate findings into evolving report
  Decide: more research OR final answer?

  → Parallel Research Agents work in parallel
  → Synthesis Agent integrates conclusions

[Repeat until done or complexity exhausted]
```

**Best for**: PhD-level questions, multi-domain synthesis, maximum reasoning depth.

### Tool Suite

- **Web Search**: Real-time information retrieval
- **Academic Retrieval**: Scholarly sources, papers, citations
- **Knowledge Graph**: Entity relationships, structured data
- **Python Execution**: Computational tasks, data analysis
- **Fallback Providers**: Redundancy and reliability

## Backend Implementation

### Schema (backend/convex/schema.ts)

```typescript
// Researcher agent configuration
{
  type: "researcher_agent",
  properties: {
    model: string,
    mode: "react" | "heavy",
    maxTurns: number,
    tools: string[],
    temperature: number,
    contextLength: number,
    trainingVersion: string,
    rlCheckpoint?: string,
    syntheticDataVersion?: string
  }
}

// Research task
{
  type: "research_task",
  properties: {
    question: string,
    domain: string,
    complexity: "simple" | "moderate" | "complex" | "phd_level",
    assignedAgentId: Id<"things">,
    status: "pending" | "in_progress" | "completed" | "failed",
    metadata: {
      expectedTurns?: number,
      requiresSynthesis?: boolean,
      deadline?: number
    }
  }
}

// Research report (output)
{
  type: "research_report",
  properties: {
    taskId: Id<"things">,
    findings: string,
    sources: Array<{citation: string, url: string, confidence: number}>,
    methodology: string,
    confidence: number,
    executionMode: "react" | "heavy",
    turnsUsed: number,
    synthesisMethod?: "single" | "parallel_synthesis",
    timestamp: number
  }
}
```

### Service Pattern (convex/services/DeepResearcherEffect.ts)

```typescript
import { Effect, pipe } from "effect";
import { Id } from "./_generated/api";

export type ResearchRequest = {
  taskId: Id<"things">;
  question: string;
  domain: string;
  complexity: "simple" | "moderate" | "complex" | "phd_level";
  mode: "react" | "heavy";
  maxTurns: number;
};

export type ResearchResult = {
  success: boolean;
  findings?: string;
  sources?: Array<{ citation: string; url: string; confidence: number }>;
  turnsUsed: number;
  error?: string;
};

export const executeResearch = (
  request: ResearchRequest,
): Effect.Effect<ResearchResult, ResearchError> => {
  return pipe(
    validateRequest(request),
    Effect.flatMap(loadModel),
    Effect.flatMap(initializeWorkspace),
    request.mode === "heavy"
      ? Effect.flatMap(executeHeavyMode)
      : Effect.flatMap(executeReActMode),
    Effect.flatMap(synthesizeReport),
    Effect.tapError(handleResearchError),
  );
};

export const executeReActMode = (
  state: ResearchState,
): Effect.Effect<ResearchState, ResearchError> => {
  return repeatTurns(state, state.request.maxTurns);
};

export const executeHeavyMode = (
  state: ResearchState,
): Effect.Effect<ResearchState, ResearchError> => {
  return pipe(
    parallelResearch(state),
    Effect.flatMap(synthesizeFindings),
    Effect.flatMap(iterateRounds),
  );
};
```

### Mutations (convex/mutations/researcher.ts)

```typescript
export const createResearchTask = mutation({
  args: {
    groupId: v.id("groups"),
    question: v.string(),
    domain: v.string(),
    complexity: v.string(),
    mode: v.string(),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("things", {
      groupId: args.groupId,
      type: "research_task",
      name: args.question.substring(0, 100),
      properties: {
        question: args.question,
        domain: args.domain,
        complexity: args.complexity,
        status: "pending",
      },
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log task creation
    await ctx.db.insert("events", {
      groupId: args.groupId,
      type: "research_started",
      actorId: ctx.auth?.getUserIdentity()?.tokenIdentifier,
      targetId: taskId,
      timestamp: Date.now(),
      metadata: { mode: args.mode, complexity: args.complexity },
    });

    return taskId;
  },
});

export const publishReport = mutation({
  args: {
    groupId: v.id("groups"),
    taskId: v.id("things"),
    findings: v.string(),
    sources: v.array(v.object({ citation: v.string(), url: v.string() })),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("things", {
      groupId: args.groupId,
      type: "research_report",
      name: `Report: ${new Date().toISOString()}`,
      properties: {
        taskId: args.taskId,
        findings: args.findings,
        sources: args.sources,
        confidence: args.confidence,
        timestamp: Date.now(),
      },
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Link report to task
    await ctx.db.insert("connections", {
      groupId: args.groupId,
      type: "produces",
      sourceId: args.taskId,
      targetId: reportId,
      validFrom: Date.now(),
      metadata: { quality: args.confidence },
    });

    // Mark task complete
    await ctx.db.patch(args.taskId, {
      properties: {
        ...(await ctx.db.get(args.taskId)),
        status: "completed",
      },
      updatedAt: Date.now(),
    });

    return reportId;
  },
});
```

## Data Synthesis Pipeline

### AgentFounder: Continual Pre-Training Data

1. **Data Reorganization**: Collect from documents, crawled data, knowledge graphs, tool invocation records
2. **Question Construction**: Generate multi-style QA pairs from entity-anchored knowledge
3. **Action Synthesis**: Construct first/higher-order action synthesis data offline

### Post-Training Synthetic Data

1. **Knowledge Graph Fusion**: Create interconnected graphs from real websites
2. **Controlled Difficulty**: Strategically obfuscate information using atomic operations
3. **Set Theory Formalization**: Model information-seeking with formal verification
4. **PhD-Level Escalation**: Iterative complexity upgrades via question-crafting agent

## Training Infrastructure

### Synthetic Training Environment

- Offline Wikipedia database + custom tool suite
- Cost-effective, fast, controllable
- Decoupled from live web APIs

### Stable Tool Sandbox

- Concurrency handling with caching
- Automatic retries with fallback providers
- Fast, deterministic tool execution

### Automatic Data Curation

- Real-time optimization guided by training dynamics
- Automated synthesis and filtering pipeline
- Closes loop between data generation and training

### On-Policy Asynchronous RL Framework

- Custom GRPO algorithm with token-level policy gradient
- Leave-one-out advantage estimation
- Conservative negative sample filtering
- Parallel agent instances with step-level async

## Limitations & Future Work

1. **Context Length**: 128k insufficient for extremely long-horizon tasks
2. **Model Scale**: Pipeline validation needed for larger foundation models (>30B MoE)
3. **RL Efficiency**: Explore partial rollouts and off-policy techniques
4. **Tool Reliability**: Improve error recovery and tool fallbacks

## Real-World Applications

### Legal Research Agent (Tongyi FaRui Pattern)

- Autonomous case law retrieval
- Statute cross-referencing
- Multi-source legal synthesis
- Verifiable citations with confidence scores

### Technical Research Agent

- Complex system architecture analysis
- Cross-domain knowledge integration
- Performance benchmark synthesis
- Implementation guidance generation

### Domain-Specific Variants

- Medical literature review
- Financial market analysis
- Scientific hypothesis generation
- Business intelligence synthesis

## Related Patterns

- **Agentic Continual Pre-Training**: Foundation model training with synthetic data
- **IterResearch**: Multi-round reasoning with workspace reconstruction
- **Research-Synthesis**: Parallel researchers with final synthesis agent
- **Heavy Mode**: Test-time scaling for complex reasoning

---

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Ontology Version**: 6-Dimensions v1.0.0
**Based On**: Tongyi DeepResearch (Alibaba Tongyi Lab)
