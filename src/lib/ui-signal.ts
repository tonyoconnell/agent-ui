/** Minimal shape for rich UI payloads attached to click signals. */
export interface RichMessage {
  type?: string
  content?: unknown
  [key: string]: unknown
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
export function emitClick(id: string, payload?: RichMessage): void {
  const segments = id.split(':')
  const derived = segments.length > 1 ? segments.slice(1) : []
  const tags = ['ui', 'click', ...derived]

  const body: Record<string, unknown> = {
    sender: 'ui',
    receiver: id,
    data: {
      tags,
      ...(payload !== undefined && { rich: payload }),
    },
  }

  fetch('/api/signal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}
