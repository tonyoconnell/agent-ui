import type { Envelope } from "./types"
import type { Agent } from "./agent"

export class Runtime {
  private agents = new Map<string, Agent>()

  register(agent: Agent): void {
    agent.route = (e) => this.route(e)
    this.agents.set(agent.id, agent)
  }

  async send(envelope: Envelope): Promise<void> {
    await this.route(envelope)
  }

  private async route(envelope: Envelope): Promise<void> {
    const agent = this.agents.get(envelope.metadata?.receiver || "")
    if (!agent) throw new Error(`Agent not found: ${envelope.metadata?.receiver}`)
    agent.envelopes.push(envelope)
    await agent.execute(envelope)
  }

  getAgents(): Agent[] {
    return [...this.agents.values()]
  }
}
