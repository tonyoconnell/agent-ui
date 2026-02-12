// ENG-001: types.ts - All TypeScript interfaces for the Envelope System

/**
 * Envelope - fundamental unit of agent communication
 * Contains the action to execute, inputs, results, and optional callback chain
 */
export interface Envelope {
  id: string;
  env: {
    envelope: string;
    action: string;
    inputs: Record<string, unknown>;
  };
  payload: {
    status: "pending" | "resolved" | "rejected";
    results: unknown | null;
  };
  callback: Envelope | null;
  metadata?: {
    sender: string;
    receiver: string;
    timestamp: number;
    parentEnvelope?: string;
  };
}

/**
 * Agent interface - has a name, status, action registry, and processes envelopes
 */
export interface Agent {
  id: string;
  name: string;
  status: "ready" | "waiting" | "idle" | "error";
  actions: Record<string, ActionHandler>;
  envelopes: Envelope[];
  promises: AgentPromise[];
}

/**
 * Action handler type - a function an agent can execute
 */
export type ActionHandler = (inputs: Record<string, unknown>) => unknown | Promise<unknown>;

/**
 * Promise tracking - tracks async envelope resolution
 */
export interface AgentPromise {
  id: string;
  label: string;
  status: "pending" | "resolved" | "rejected" | "idle";
  envelope: string;
  result?: unknown;
}

/**
 * UI Schema for JSON-driven rendering
 * The JsonRenderer uses this to decide which component to render
 */
export interface UISchema {
  id: string;
  type: string;
  [key: string]: unknown;
  children?: UISchema[];
}
