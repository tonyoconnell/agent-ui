export type { Agent, AgentCtx } from './agent'
export { agent } from './agent'
export type { AgentSpec, SkillSpec, WorldSpec } from './agent-md'
// Agent markdown → TypeDB
export {
  loadAgent,
  loadWorld,
  parse as parseAgentMd,
  parseDirectory,
  syncAgent,
  syncAgentWithIdentity,
  syncFromMarkdown,
  syncWorld,
  toTypeDB,
  wireAgent,
  wireWorld,
  worldToTypeDB,
} from './agent-md'
export { anthropic, llm, openai } from './llm'
export { md, parse } from './md'
export type { Insight, PersistentWorld, TaskMatch } from './persist'
export { isToxic, world } from './persist'
export type { Edge, Emit, Signal, Unit, World } from './world'
export { unit, world as createWorld } from './world'

// DocItem, VerifiedItem — import directly from "./doc-scan" (uses Node.js APIs)

export { agentverse } from './agentverse'
export { boot } from './boot'
// Bridge — three systems, one truth
export { absorb, mirrorActor, mirrorMark, mirrorWarn, resolve, resolvePath } from './bridge'
export type { BuilderComplete, BuilderOnDone } from './builder'
export { registerBuilder } from './builder'
export type { DocKey, DocMeta } from './context'
// Context — docs as knowledge
export {
  CANONICAL,
  contextForSkill,
  docIndex,
  inferDocsFromTags,
  ingestDocs,
  loadContext,
  readDoc,
  recallDocs,
  resolveContext,
} from './context'
export type { Actor, Loop, LoopResult, Marker, Outcome, Selector, Source } from './core'
// Loop system — the one loop
export { compose, loop, schedule } from './core'
export type { TickResult as LegacyTickResult } from './loop'
// Legacy tick
export { tick as legacyTick } from './loop'
export type { Complete } from './loops'
// Composed loops
export {
  consultLoop,
  docLoop,
  evolveLoop,
  fadeLoop,
  frontierLoop,
  getPriorityEvolve,
  knowLoop,
  signalLoop,
} from './loops'
// ONE v2 (uses Node.js — import directly from "./one", "./one-complete", etc.)
export { one } from './one'
export type { Config as ProdConfig, TickResult as ProdTickResult } from './one-prod'
// Selectors — how to choose
export {
  byNeed,
  byPheromone,
  byPriority,
  bySuccessRate,
  fallback,
  filtered,
  first,
  priorityWeighted,
  random,
  roundRobin,
  weighted,
} from './selectors'
export type { Advisor, Highway, StrugglingUnit } from './sources'
// Sources — what to sense
export {
  advisors,
  fadeAction,
  highways,
  knowAction,
  signals,
  struggling,
  surges,
  unexploredTags,
  unitGaps,
} from './sources'
export type { SubstrateOptions, TickResult as SubstrateTickResult } from './substrate'
export type { HandlerConfig, SopConfig, SubstrateConfig, TimerConfig, WorkflowConfig } from './substrate-config'
export { extractAll, extractAndWrite, extractTasks } from './task-extract'
export type { Effort, Phase, Task, Value, Wave } from './task-parse'
// Task management — parse, sync, extract (uses Node.js APIs)
export { computePriority, EFFORT_MODEL, effectivePriority, parseTodoFile, scanTodos, WAVE_MODEL } from './task-parse'
export { loadTasks, markTaskDone, syncTasks } from './task-sync'
export type { TickResult } from './tick'
// Tick orchestrator
export { forceLoop, getCycle, resetTick, tick } from './tick'
export type { TaskEnvelope, WaveEnvelope } from './wave-runner'
export { modelForWave, waveRunner } from './wave-runner'
export type { CloseOpts, Stage, StageOutcome, WorkLoop } from './work-loop'
// Work loop — developer loop as signals on the substrate
export { workLoop } from './work-loop'
