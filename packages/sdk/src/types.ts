export interface SdkConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class OneSdkError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "OneSdkError";
  }
}

export type Outcome<T> =
  | { result: T; latency: number }
  | { timeout: true; latency: number }
  | { dissolved: true; latency: number }
  | { failure: true; latency: number };

export interface SignalResponse {
  ok: boolean;
  routed: string | null;
  result?: unknown;
  latency: number;
  success: boolean;
  sui?: string | null;
}

export interface HighwaysResponse {
  highways: Array<{ path: string; strength: number; resistance: number; net: number }>;
}

export interface HypothesesResponse {
  hypotheses: Array<{
    hid: string;
    statement: string;
    status: string;
    observations: number;
    pValue: number;
    actionReady: boolean;
  }>;
}

export interface MarkDimsResponse {
  ok: boolean;
  edge: string;
  scores: { fit: number; form: number; truth: number; taste: number };
  marks: Array<{ edge: string; action: "mark" | "warn"; strength: number }>;
}

export interface DecayResponse {
  before: { edges: number; avgStrength: number; avgResistance: number };
  after: { edges: number; avgStrength: number; avgResistance: number };
  decayed: { trailRate: number; resistanceRate: number };
  timestamp: string;
}

export interface AuthAgentOpts {
  name?: string;
  uid?: string;
  kind?: string;
}

export interface AuthAgentResponse {
  uid: string;
  name: string;
  kind: string;
  wallet: string | null;
  apiKey: string;
  keyId: string;
  returning: boolean;
}

export interface SyncAgentWorldInput {
  agents: Array<{ name?: string; content: string }>;
  world?: string;
  description?: unknown;
}

export interface SyncAgentResponse {
  ok: boolean;
  agent?: string;
  uid?: string;
  wallet?: string | null;
  suiObjectId?: string | null;
  skills?: string[];
  world?: string;
  agents?: Array<{
    name: string;
    uid: string;
    wallet: string | null;
    suiObjectId: string | null;
    skills: string[];
  }>;
}

export interface DiscoverAgent {
  uid: string;
  name: string;
  unitKind: string;
  skillId: string;
  skillName: string;
  reputation: number;
  successRate: number;
  activityScore: number;
  price: number;
  currency: string;
  strength: number;
}

export interface DiscoverResponse {
  agents: DiscoverAgent[];
  skill: string;
  count: number;
  limit: number;
}

export interface AgentCapability {
  skill: string;
  price?: number;
}

export interface RegisterOpts {
  kind?: string;
  capabilities?: AgentCapability[];
  wallet?: string;
  chain?: string;
}

export interface RegisterResponse {
  ok: boolean;
  uid: string;
  status: string;
  kind: string;
  wallet: string | null;
  walletLinked: boolean;
  capabilities: number;
}

export interface PayResponse {
  ok: boolean;
  from: string;
  to: string;
  task: string;
  amount: number;
  sui: string | null;
}

export interface ClawOpts {
  persona?: string;
  telegramToken?: string;
  openrouterKey?: string;
  groupId?: string;
}

export interface ClawResponse {
  ok: boolean;
  workerUrl?: string;
  apiKey?: string;
  error?: string;
}

export interface AgentActionResponse {
  ok: boolean;
  id: string;
  action: string;
}

export interface AgentStatusResponse {
  ok: boolean;
  id: string;
  status: string;
}

export interface CapabilityItem {
  skillId: string;
  skillName: string;
  price: number;
  currency: string;
}

export interface Stats {
  units: { total: number; proven: number; atRisk: number };
  skills: { total: number };
  highways: { count: number; totalEdges: number };
  revenue: { total: number; gdp: number };
  signals: { total: number; recent: number };
  timestamp: string;
}

export interface WorldInfo {
  units: number;
  agents: number;
  edges: number;
  highways: number;
  loadedAgoMs: number;
  totalRevenue: string;
  avgSuccessRate: string;
  topGroup: { id: string; name: string; memberCount: number } | null;
}

export interface Health {
  status: "healthy" | "degraded";
  world: WorldInfo;
  version: string;
  phase: string;
  uptime: number;
  timestamp: string;
}
