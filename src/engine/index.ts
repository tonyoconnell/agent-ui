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
  syncWorld,
  syncFromMarkdown,
  loadAgent,
  loadWorld,
  wireAgent,
  wireWorld,
  parseDirectory,
} from "./agent-md"
export type { AgentSpec, SkillSpec, WorldSpec } from "./agent-md"

export { agentverse } from "./agentverse"
export { boot } from "./boot"
export { tick } from "./loop"
export type { TickResult } from "./loop"

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
