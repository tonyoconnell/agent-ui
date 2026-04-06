export { world } from "./persist"
export type { PersistentWorld, Insight } from "./persist"
export { world as createWorld, unit } from "./world"
export type { World, Unit, Signal, Emit, Edge } from "./world"
export { llm, anthropic, openai } from "./llm"
export { agent } from "./agent"
export type { Agent, AgentCtx } from "./agent"
export { md, parse } from "./md"

// Agent markdown → TypeDB
export {
  parse as parseAgentMd,
  toTypeDB,
  worldToTypeDB,
  syncAgent,
  syncAgentWithIdentity,
  syncWorld,
  syncFromMarkdown,
  loadAgent,
  loadWorld,
  wireAgent,
  wireWorld,
  parseDirectory,
} from "./agent-md"
export type { AgentSpec, SkillSpec, WorldSpec } from "./agent-md"

// DocItem, VerifiedItem — import directly from "./doc-scan" (uses Node.js APIs)

// Task management — parse, sync, extract (uses Node.js APIs)
export { parseTodoFile, computePriority, effectivePriority, scanTodos, EFFORT_MODEL } from "./task-parse"
export type { Task, Value, Phase, Effort } from "./task-parse"
export { syncTasks, markTaskDone, loadTasks } from "./task-sync"
export { extractTasks, extractAndWrite, extractAll } from "./task-extract"

export { agentverse } from "./agentverse"
export { boot } from "./boot"

// Bridge — three systems, one truth
export { resolve, resolvePath, mirrorMark, mirrorWarn, mirrorActor, absorb } from "./bridge"

// Loop system — the one loop
export { loop, compose, schedule } from "./core"
export type { Outcome, Source, Selector, Actor, Marker, Loop, LoopResult } from "./core"

// Sources — what to sense
export { signals, struggling, advisors, highways, surges, unexploredTags, unitGaps, fadeAction, knowAction } from "./sources"
export type { StrugglingUnit, Advisor, Highway } from "./sources"

// Selectors — how to choose
export { first, random, byPheromone, weighted, byPriority, priorityWeighted, bySuccessRate, byNeed, fallback, filtered, roundRobin } from "./selectors"

// Composed loops
export { signalLoop, fadeLoop, evolveLoop, consultLoop, knowLoop, frontierLoop, docLoop, getPriorityEvolve } from "./loops"
export type { Complete } from "./loops"

// Tick orchestrator
export { tick, resetTick, getCycle, forceLoop } from "./tick"
export type { TickResult } from "./tick"

// Legacy tick
export { tick as legacyTick } from "./loop"
export type { TickResult as LegacyTickResult } from "./loop"

// ONE v2 (uses Node.js — import directly from "./one", "./one-complete", etc.)
export { one } from "./one"
export type { SubstrateConfig, TimerConfig, SopConfig, WorkflowConfig, HandlerConfig } from "./substrate-config"
export type { TickResult as SubstrateTickResult, SubstrateOptions } from "./substrate"
export type { Config as ProdConfig, TickResult as ProdTickResult } from "./one-prod"

// Context — docs as knowledge
export {
  loadContext,
  contextForSkill,
  readDoc,
  docIndex,
  ingestDocs,
  recallDocs,
  CANONICAL,
} from "./context"
export type { DocKey, DocMeta } from "./context"
