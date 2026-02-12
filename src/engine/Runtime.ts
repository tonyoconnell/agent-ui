// ENG-006: Runtime.ts - Orchestrator for the envelope system

import type { DeterministicAgent } from "./Agent";
import { PromiseTracker } from "./PromiseTracker";
import { Router } from "./Router";
import type { AgentPromise, Envelope, UISchema } from "./types";

/**
 * Log entry for the event log
 */
export interface LogEntry {
  ts: number;
  level: "info" | "ok" | "warn" | "error";
  msg: string;
}

/**
 * Runtime - The main orchestrator for the envelope system
 * Manages agents, routes envelopes, tracks promises, and generates UI schema
 */
export class Runtime {
  router: Router;
  promiseTracker: PromiseTracker;
  eventLog: LogEntry[];

  constructor() {
    this.router = new Router();
    this.promiseTracker = new PromiseTracker();
    this.eventLog = [];
  }

  /**
   * Register an agent with the runtime
   * Wires up the agent's route method to use the router
   * @param agent - The agent to register
   */
  registerAgent(agent: DeterministicAgent): void {
    // Wire up the agent's route method to use our router
    agent.route = async (envelope: Envelope) => {
      this.log("info", `Routing ${envelope.id} -> ${envelope.metadata?.receiver}`);
      await this.router.route(envelope);
    };

    this.router.register(agent);
    this.log("info", `Agent registered: ${agent.name} (${agent.id})`);
  }

  /**
   * Send an envelope through the system
   * Creates a promise to track the envelope and routes it
   * @param envelope - The envelope to send
   * @returns The AgentPromise tracking this envelope
   */
  async send(envelope: Envelope): Promise<AgentPromise> {
    const promise = this.promiseTracker.create(
      envelope.id,
      `${envelope.env.action} -> ${envelope.metadata?.receiver}`
    );

    this.log("info", `Envelope created: ${envelope.id}`);

    try {
      await this.router.route(envelope);
      this.promiseTracker.resolve(promise.id, envelope.payload.results);
      this.log("ok", `Promise ${promise.id} resolved`);
    } catch (e) {
      const error = e as Error;
      this.promiseTracker.reject(promise.id);
      this.log("error", `Promise ${promise.id} rejected: ${error.message}`);
    }

    return promise;
  }

  /**
   * Log a message to the event log
   * @param level - The log level
   * @param msg - The message to log
   */
  log(level: LogEntry["level"], msg: string): void {
    this.eventLog.push({
      ts: Date.now(),
      level,
      msg,
    });
  }

  /**
   * Get the event log
   * @returns Array of log entries
   */
  getLog(): LogEntry[] {
    return [...this.eventLog];
  }

  /**
   * Get all promises
   * @returns Array of all promises
   */
  getPromises(): AgentPromise[] {
    return this.promiseTracker.getAll();
  }

  /**
   * Get all agents
   * @returns Array of all agents
   */
  getAgents(): DeterministicAgent[] {
    return this.router.getAllAgents();
  }

  /**
   * Returns the full state as a JSON UI schema
   * This drives the frontend - the JsonRenderer uses this to render components
   */
  toUISchema(): UISchema {
    const agents = this.router.getAllAgents();

    return {
      id: "agent-workspace",
      type: "page",
      layout: "vertical-stack",
      children: [
        {
          id: "panel-top",
          type: "tabbed-panel",
          activeTab: agents[0]?.id || "",
          tabs: agents.map(agent => ({
            id: agent.id,
            label: agent.name,
            content: {
              type: "section",
              children: [
                {
                  type: "agent-info",
                  agent: {
                    id: agent.id,
                    name: agent.name,
                    status: agent.status,
                    actionCount: Object.keys(agent.actions).length,
                  },
                },
                {
                  type: "promise-tracker",
                  label: "Promises",
                  items: agent.promises,
                },
              ],
            },
          })),
        },
        {
          id: "panel-bottom",
          type: "panel",
          children: [
            {
              id: "envelope-list-main",
              type: "envelope-list",
              label: "Envelopes",
              items: [],
            },
            {
              id: "logic-viewer",
              type: "logic-viewer",
              label: "Logic",
              code: `const { action, inputs, callback } = envelope.env;
let result = await this.actions[action](inputs);
envelope.payload.status = "resolved";
envelope.payload.results = result;
if (callback) {
  callback.payload.results = { ...result };
  this.substitute(callback, result);
  await this.route(callback);
}`,
            },
            {
              id: "envelope-list-nested",
              type: "envelope-list",
              label: "Envelopes (nested)",
              items: [],
            },
          ],
        },
      ],
    };
  }

  /**
   * Generate UI schema for a specific agent
   * @param agentId - The ID of the agent
   * @returns UI schema for the agent's view
   */
  toAgentUISchema(agentId: string): UISchema | null {
    const agent = this.router.getAgent(agentId);
    if (!agent) return null;

    // Separate envelopes into main and nested (callbacks)
    const mainEnvelopes = agent.envelopes.filter(e => !e.metadata?.parentEnvelope);
    const nestedEnvelopes = agent.envelopes.filter(e => e.metadata?.parentEnvelope);

    return {
      id: `agent-view-${agentId}`,
      type: "agent-view",
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        actionCount: Object.keys(agent.actions).length,
      },
      promises: agent.promises,
      envelopes: mainEnvelopes,
      nestedEnvelopes: nestedEnvelopes,
    };
  }
}
