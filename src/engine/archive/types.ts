export interface Envelope {
  id: string
  env: {
    envelope: string
    action: string
    inputs: Record<string, unknown>
  }
  payload: {
    status: "pending" | "resolved" | "rejected"
    results: unknown
  }
  callback: Envelope | null
  metadata?: {
    sender: string
    receiver: string
    timestamp: number
  }
}

export type ActionHandler = (inputs: Record<string, unknown>) => unknown | Promise<unknown>
