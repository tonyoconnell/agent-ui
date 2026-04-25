/** Structured sub-types for rich payloads (mirrors rich-messages.md). */
export interface PaymentMetadata {
  receiver: string
  amount: number
  action: string
  currency?: 'SUI' | 'USD'
  transactionDigest?: string
}

/** Rich payload shape — matches the RichMessage contract in rich-messages.md. */
export interface RichMessage {
  type: 'text' | 'embed' | 'thread' | 'reaction' | 'payment'
  content: string
  payment?: PaymentMetadata
  reactions?: string[]
  embed?: Record<string, unknown>
  thread?: Record<string, unknown>
}

/**
 * Fire-and-forget UI signal. Emits a click signal to the substrate so the
 * router learns UI flow. ADL gates pass-through for ui:* receivers (no
 * TypeDB entry needed).
 *
 * @param id      Receiver id, e.g. `"ui:chat:copy"`. Segments after the
 *                first are auto-derived into tags: `['ui','click','chat','copy']`.
 * @param payload Optional rich payload attached as `data.rich`.
 */
export function emitClick(id: string, payload?: Record<string, unknown>): void {
  const segments = id.split(':')
  const derived = segments.length > 1 ? segments.slice(1) : []
  const tags = ['ui', 'click', ...derived]

  // signal.ts expects data as a string (TQL string attribute).
  const dataObj: Record<string, unknown> = { tags }
  if (payload !== undefined) dataObj.rich = payload

  const body: Record<string, unknown> = {
    sender: 'ui',
    receiver: id,
    data: JSON.stringify(dataObj),
    scope: 'public',
  }

  // Dev auto-degrade: after the first 4xx/5xx, stop emitting for this session
  // (the gateway secret is missing in local dev — every request would 500).
  // Production is unaffected.
  if (signalDisabled) return
  fetch('/api/signal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then((r) => {
      if (import.meta.env?.DEV && r.status >= 400) signalDisabled = true
    })
    .catch(() => {
      if (import.meta.env?.DEV) signalDisabled = true
    })
}

let signalDisabled = false
