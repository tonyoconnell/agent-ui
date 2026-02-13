// Legacy exports (for backwards compatibility)
export type { Envelope, ActionHandler } from "./types"
export { Agent } from "./agent"
export { Runtime } from "./runtime"
export { createEnvelope } from "./envelope"

// New architecture: unit + colony
export { unit } from "./unit"
export { colony } from "./colony"
export type { Unit, UnitError, RouteFn } from "./unit"
export type { Colony, ColonyError, UnitJSON, Edge } from "./colony"

// The Substrate: 50 lines, zero returns, two fields
export { unit as atom, colony as swarm } from "./substrate"
export type { Unit as Atom, Colony as Swarm, Envelope as Signal } from "./substrate"
