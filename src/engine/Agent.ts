// ENG-003: Agent.ts - DeterministicAgent class implementing the core execution logic

import type { Agent, ActionHandler, AgentPromise, Envelope } from "./types";

/**
 * DeterministicAgent - The core agent implementation
 * Processes envelopes by looking up actions and executing them
 * Implements the exact logic from the whiteboard
 */
export class DeterministicAgent implements Agent {
  id: string;
  name: string;
  status: "ready" | "waiting" | "idle" | "error";
  actions: Record<string, ActionHandler>;
  envelopes: Envelope[];
  promises: AgentPromise[];

  /**
   * Route function - placeholder that gets wired by Runtime
   * This allows the Runtime to inject routing behavior
   */
  route: (envelope: Envelope) => Promise<void>;

  constructor(id: string, name: string, actions: Record<string, ActionHandler>) {
    this.id = id;
    this.name = name;
    this.status = "idle";
    this.actions = actions;
    this.envelopes = [];
    this.promises = [];

    // Default route implementation - will be overwritten by Runtime
    this.route = async (_envelope: Envelope) => {
      console.warn(`Agent ${this.name}: route() not wired to Runtime`);
    };
  }

  /**
   * THE LOGIC - this is exactly what was on the whiteboard
   * 1. Destructure from envelope payload
   * 2. Look up action by name, call it with inputs
   * 3. Update envelope payload with results
   * 4. If callback exists, pack results and route
   */
  async execute(envelope: Envelope): Promise<void> {
    this.status = "ready";

    try {
      // 1. Destructure from envelope payload
      const { action, inputs } = envelope.env;
      const { callback } = envelope;

      // 2. Look up action by name, call it with inputs
      const handler = this.actions[action];
      if (!handler) {
        throw new Error(`Action "${action}" not found on agent ${this.name}`);
      }

      const result = await handler(inputs);

      // 3. Update envelope payload with results
      envelope.payload.status = "resolved";
      envelope.payload.results = result;

      // 4. If callback exists, pack results and route
      if (callback) {
        callback.payload.results = { ...(result as Record<string, unknown>) };
        this.substitute(callback, result);
        await this.route(callback);
      }

      this.status = "idle";
    } catch (error) {
      envelope.payload.status = "rejected";
      this.status = "error";
      throw error;
    }
  }

  /**
   * Template interpolation - replace {{ references }} in callback with actual values
   * Walks the envelope inputs and replaces any {{ env-xxx.results }} patterns
   * with actual values from previousResults
   */
  substitute(envelope: Envelope, previousResults: unknown): void {
    const inputs = envelope.env.inputs;

    for (const key in inputs) {
      const value = inputs[key];

      if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
        // Replace the template with actual results
        inputs[key] = previousResults;
      } else if (typeof value === "object" && value !== null) {
        // Recursively handle nested objects
        this.substituteObject(value as Record<string, unknown>, previousResults);
      }
    }
  }

  /**
   * Helper to recursively substitute values in nested objects
   */
  private substituteObject(obj: Record<string, unknown>, previousResults: unknown): void {
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
        obj[key] = previousResults;
      } else if (typeof value === "object" && value !== null) {
        this.substituteObject(value as Record<string, unknown>, previousResults);
      }
    }
  }
}
