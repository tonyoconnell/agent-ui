// ENG-005: Router.ts - Routes envelopes between agents

import type { DeterministicAgent } from "./Agent";
import type { Envelope } from "./types";

/**
 * Router - Routes envelopes to the correct agent based on receiver metadata
 * Maintains a registry of agents and dispatches envelopes to them
 */
export class Router {
  private agents: Map<string, DeterministicAgent>;

  constructor() {
    this.agents = new Map();
  }

  /**
   * Register an agent with the router
   * @param agent - The agent to register
   */
  register(agent: DeterministicAgent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Unregister an agent from the router
   * @param agentId - The ID of the agent to remove
   */
  unregister(agentId: string): void {
    this.agents.delete(agentId);
  }

  /**
   * Get an agent by ID
   * @param agentId - The ID of the agent to get
   * @returns The agent or undefined
   */
  getAgent(agentId: string): DeterministicAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   * @returns Array of all registered agents
   */
  getAllAgents(): DeterministicAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Route an envelope to its receiver agent
   * Looks up the receiver from envelope metadata and calls agent.execute()
   * @param envelope - The envelope to route
   */
  async route(envelope: Envelope): Promise<void> {
    const receiverId = envelope.metadata?.receiver;

    if (!receiverId) {
      throw new Error("No receiver specified on envelope");
    }

    const agent = this.agents.get(receiverId);

    if (!agent) {
      throw new Error(`Agent "${receiverId}" not found in router`);
    }

    // Add envelope to agent's queue
    agent.envelopes.push(envelope);
    agent.status = "ready";

    // Execute the envelope
    await agent.execute(envelope);
  }

  /**
   * Check if an agent is registered
   * @param agentId - The ID to check
   * @returns true if agent exists
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }
}
