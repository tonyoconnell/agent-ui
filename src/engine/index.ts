// ============================================================
// ONE — The Recommended Interface
// ============================================================
// world() is the primary entry point. It unifies all layers:
// substrate, persistence, LLM, agentverse, and ASI.
//
// Usage:
//   import { world } from "@/engine"
//   const w = world()
// ============================================================

export { world } from "./one"
export type { One, World } from "./one"

// ============================================================
// Substrate Layer (backwards compatibility)
// ============================================================
// The 70-line foundation. Use world() instead for new code.

export { unit as atom, colony as swarm } from "./substrate"
export type { Unit as Atom, Colony as Swarm, Signal } from "./substrate"

// Unit + Colony (direct access when needed)
export { unit } from "./unit"
export { colony } from "./colony"
export type { Unit, UnitError, RouteFn } from "./unit"
export type { Colony, ColonyError, UnitJSON, Edge } from "./colony"

// Legacy type alias
export type { Signal as Envelope } from "./substrate"

// ============================================================
// Extension Layers (backwards compatibility)
// ============================================================

// Persistence: TypeDB layer
export { persisted } from "./persist"

// LLM: any model as a unit
export { llm, anthropic, openai } from "./llm"

// Agentverse: 2M agents as a colony
export { agentverse, sync as syncAgentverse } from "./agentverse"
export type { Agentverse } from "./agentverse"

// ASI: orchestrator as a unit
export { asi } from "./asi"
export type { ASI } from "./asi"

// ============================================================
// Legacy Exports (deprecated, for migration support)
// ============================================================

export type { Signal as ActionHandler } from "./unit"
export { Agent } from "./agent"
export { Runtime } from "./runtime"
export { createEnvelope } from "./envelope"
