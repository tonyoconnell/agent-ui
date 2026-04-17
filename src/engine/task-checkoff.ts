import { writeSilent } from '@/lib/typedb'
import type { WaveEnvelope } from './wave-runner'

export type CheckoffOutcome = 'result' | 'timeout' | 'dissolved' | 'failure'

export interface CheckoffResult {
  outcome: CheckoffOutcome
  ok: boolean
  taskId: string
  rubricScore?: number
}

type AskResult = { result?: unknown; timeout?: boolean; dissolved?: boolean; failure?: boolean }

const SAFE_ID = /^[a-zA-Z0-9_:.-]+$/

/**
 * Normalize a net.ask() result for a task completion.
 *
 * The critical fix: when a WaveEnvelope comes back with verify.ok === false
 * (W4 FAIL), this is still outcome.result !== undefined in ask() terms. Without
 * this check, loop.ts marks FAIL cycles as "done" in TypeDB.
 *
 * selfCheckoff reads verify.ok, updates TypeDB task status, and returns a
 * normalized outcome. Callers (loop.ts) handle their own pheromone marks.
 */
export async function selfCheckoff(taskId: string, askResult: AskResult): Promise<CheckoffResult> {
  if (!SAFE_ID.test(taskId)) {
    return { outcome: 'failure', ok: false, taskId }
  }

  if (askResult.result !== undefined) {
    const envelope = askResult.result as Partial<WaveEnvelope>
    const verifyRan = envelope?.verify !== undefined
    const verifyOk = !verifyRan || envelope.verify!.ok !== false
    const rubricScore = envelope?.verify?.score

    if (verifyOk) {
      writeSilent(`
        match $t isa task, has task-id "${taskId}", has done $d, has task-status $st;
        delete $d of $t; delete $st of $t;
        insert $t has done true, has task-status "done";
      `).catch(() => {})
      return { outcome: 'result', ok: true, taskId, rubricScore }
    }

    // W4 explicitly returned FAIL — treat as failure
    writeSilent(`
      match $t isa task, has task-id "${taskId}", has task-status $st;
      delete $st of $t;
      insert $t has task-status "failed";
    `).catch(() => {})
    return { outcome: 'failure', ok: false, taskId, rubricScore }
  }

  if (askResult.timeout) {
    return { outcome: 'timeout', ok: false, taskId }
  }

  if (askResult.dissolved) {
    return { outcome: 'dissolved', ok: false, taskId }
  }

  // explicit failure — no result, no timeout, no dissolved
  writeSilent(`
    match $t isa task, has task-id "${taskId}", has task-status $st;
    delete $st of $t;
    insert $t has task-status "failed";
  `).catch(() => {})
  return { outcome: 'failure', ok: false, taskId }
}
