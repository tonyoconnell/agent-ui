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
