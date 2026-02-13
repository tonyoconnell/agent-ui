import type { Envelope, ActionHandler } from "./types"

export class Agent {
  id: string
  name: string
  status: "ready" | "idle" | "error" = "idle"
  actions: Record<string, ActionHandler>
  envelopes: Envelope[] = []
  route: (envelope: Envelope) => Promise<void> = async () => {}

  constructor(id: string, name: string, actions: Record<string, ActionHandler>) {
    this.id = id
    this.name = name
    this.actions = actions
  }

  // Create agent from JSON (actions return static results)
  static fromJSON(data: { id: string; name: string; actions: Record<string, unknown> }): Agent {
    const actions: Record<string, ActionHandler> = {}
    for (const [name, result] of Object.entries(data.actions)) {
      actions[name] = () => result
    }
    return new Agent(data.id, data.name, actions)
  }

  async execute(envelope: Envelope): Promise<void> {
    this.status = "ready"
    const { action, inputs } = envelope.env

    try {
      const result = await this.actions[action]?.(inputs)
      envelope.payload = { status: "resolved", results: result }

      if (envelope.callback) {
        this.substitute(envelope.callback, result)
        await this.route(envelope.callback)
      }
      this.status = "idle"
    } catch {
      envelope.payload.status = "rejected"
      this.status = "error"
    }
  }

  private substitute(envelope: Envelope, results: unknown): void {
    const walk = (o: Record<string, unknown>) => {
      for (const k in o) {
        if (typeof o[k] === "string" && (o[k] as string).startsWith("{{")) o[k] = results
        else if (o[k] && typeof o[k] === "object") walk(o[k] as Record<string, unknown>)
      }
    }
    walk(envelope.env.inputs)
  }
}
