import type { Envelope } from "./types"

interface Props {
  action: string
  inputs: Record<string, unknown>
  sender: string
  receiver: string
  callback?: Props | null
}

export function createEnvelope(props: Props): Envelope {
  const id = `env-${crypto.randomUUID().slice(0, 8)}`
  return {
    id,
    env: { envelope: id, action: props.action, inputs: props.inputs },
    payload: { status: "pending", results: null },
    callback: props.callback ? createEnvelope(props.callback) : null,
    metadata: { sender: props.sender, receiver: props.receiver, timestamp: Date.now() },
  }
}
