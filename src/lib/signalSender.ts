/**
 * signalSender — Utilities for sending world manipulation signals
 *
 * All POST /api/signal calls for STREAM 5 gestures.
 */

export interface SignalResponse {
  ok: boolean
  error?: string
  routed?: string
  result?: string
  latency?: number
  success?: boolean
}

/**
 * Send a signal via POST /api/signal
 */
async function sendSignal(
  receiver: string,
  data: unknown,
  sender = 'ui:world'
): Promise<SignalResponse> {
  try {
    const res = await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        receiver,
        data: typeof data === 'string' ? data : JSON.stringify(data),
      }),
    })
    const json = (await res.json()) as SignalResponse
    if (!res.ok) {
      console.error(`Signal failed: ${receiver}`, json.error)
    }
    return json
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Signal error: ${receiver}`, msg)
    return { ok: false, error: msg }
  }
}

/**
 * GESTURE 1: Drag to move units
 * POST /api/signal { receiver: 'world:move', data: { id, x, y } }
 */
export async function signalMove(id: string, x: number, y: number) {
  return sendSignal('world:move', { id, x, y })
}

/**
 * GESTURE 2: Rename unit (inline edit)
 * POST /api/signal { receiver: 'world:rename', data: { id, name } }
 */
export async function signalRename(id: string, name: string) {
  return sendSignal('world:rename', { id, name })
}

/**
 * GESTURE 3: Draw path (create link)
 * POST /api/signal { receiver: 'world:link', data: { from, to } }
 */
export async function signalLink(from: string, to: string) {
  return sendSignal('world:link', { from, to })
}

/**
 * GESTURE 4: Mark path (strengthen)
 * POST /api/signal { receiver: 'world:mark', data: { from, to } }
 */
export async function signalMark(from: string, to: string) {
  return sendSignal('world:mark', { from, to })
}

/**
 * GESTURE 4: Warn path (add resistance)
 * POST /api/signal { receiver: 'world:warn', data: { from, to } }
 */
export async function signalWarn(from: string, to: string) {
  return sendSignal('world:warn', { from, to })
}

/**
 * GESTURE 6: Delete unit
 * POST /api/signal { receiver: 'world:remove', data: { id } }
 */
export async function signalRemove(id: string) {
  return sendSignal('world:remove', { id })
}

/**
 * GESTURE 7: Create group
 * POST /api/signal { receiver: 'world:group', data: { units: [ids], name } }
 */
export async function signalGroup(units: string[], name: string) {
  return sendSignal('world:group', { units, name })
}

/**
 * Run a task (signal for GESTURE to be added later)
 * POST /api/signal { receiver: 'world:run-task', data: { unitId, taskName } }
 */
export async function signalRunTask(unitId: string, taskName: string) {
  return sendSignal('world:run-task', { unitId, taskName })
}
