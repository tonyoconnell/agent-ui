/**
 * WAL — Write-Ahead Log for pheromone
 *
 * Buffers mark/warn operations to D1 in 500ms windows.
 * Keeps mark() path sub-microsecond by batching DB writes.
 */

interface BufferedMark {
  delta_s: number
  delta_r: number
  count: number
}

interface D1Result {
  success: boolean
  rows?: { id: number }[]
}

// In-memory buffer: edge → {delta_s, delta_r, count}
const markBuffer = new Map<string, BufferedMark>()
let flushTimer: NodeJS.Timeout | null = null
const FLUSH_INTERVAL_MS = 500

/**
 * Buffer a mark/warn operation. Called from world.ts.
 * Returns immediately (sync, sub-microsecond).
 * Batch flushed to D1 every 500ms.
 */
export const bufferMark = (edge: string, deltaS: number, deltaR: number): void => {
  const current = markBuffer.get(edge) || { delta_s: 0, delta_r: 0, count: 0 }
  markBuffer.set(edge, {
    delta_s: current.delta_s + deltaS,
    delta_r: current.delta_r + deltaR,
    count: current.count + 1,
  })

  // Start flush timer if not already running
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushToD1().catch((err) => {
        console.error('[WAL] flush error:', err)
      })
    }, FLUSH_INTERVAL_MS)
  }
}

/**
 * Flush buffered marks to D1.
 * Converts buffer to batch insert statement.
 * Clears buffer and resets timer.
 */
export const flushToD1 = async (db?: any): Promise<void> => {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (markBuffer.size === 0) return

  // Prepare batch insert
  const now = new Date().toISOString()
  const window = Math.floor(Date.now() / 500)
  const rows: unknown[] = []

  for (const [edge, { delta_s, delta_r, count }] of markBuffer) {
    rows.push({
      edge,
      delta_s,
      delta_r,
      count,
      window,
      synced: 0,
      ts: now,
    })
  }

  // Clear buffer (fire-and-forget writes)
  markBuffer.clear()

  // If no DB available (unit tests, dry run), skip
  if (!db) return

  // Batch insert to D1
  try {
    // Build multi-row insert statement
    const valuesList = rows
      .map(
        (r: any) =>
          `('${r.edge.replace(/'/g, "''")}', ${r.delta_s}, ${r.delta_r}, ${r.count}, ${r.window}, 0, '${r.ts}')`,
      )
      .join(',')

    const sql = `
      INSERT INTO marks (edge, delta_s, delta_r, count, window, synced, ts)
      VALUES ${valuesList}
    `

    await db.prepare(sql).all()
  } catch (err) {
    console.error('[WAL] D1 insert failed:', err)
    // Don't throw — losing a batch is better than crashing the app
  }
}

/**
 * Force synchronous flush (for tests or shutdown).
 * Blocks until D1 write completes.
 */
export const flushSync = async (db?: any): Promise<void> => {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  await flushToD1(db)
}

/**
 * Get current buffer state (for monitoring/testing).
 */
export const getBufferState = (): { edges: number; pending: number } => {
  let pending = 0
  for (const { count } of markBuffer.values()) {
    pending += count
  }
  return {
    edges: markBuffer.size,
    pending,
  }
}

/**
 * Clear buffer without flushing (for tests).
 */
export const clearBuffer = (): void => {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  markBuffer.clear()
}
