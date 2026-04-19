/**
 * GET /api/tasks/claims — View active task claims and wave-locks
 *
 * Returns all currently claimed tasks and locked waves.
 * Useful for debugging deadlocks, monitoring contention.
 * Returns: { tasks: [...], waves: [...] }
 */
import type { APIRoute } from 'astro'
import { read } from '@/lib/typedb'

export const GET: APIRoute = async () => {
  try {
    // All claimed tasks (have owner set)
    const tasksQ = `match $t isa task, has task-id $id, has owner $o; select $id, $o;`
    const tasks = (await read(tasksQ)) as Array<{ id: string; o: string }>

    // All wave-locks (if wave-lock entity exists)
    const wavesQ = `match $wl isa wave-lock, has wave-lock-id $id, has owner $o; select $id, $o;`
    let waves: Array<{ id: string; o: string }> = []
    try {
      waves = (await read(wavesQ)) as Array<{ id: string; o: string }>
    } catch {
      // wave-lock may not exist in schema
    }

    // Return claims without timestamp (claimed-at not in schema)
    const taskClaims = tasks.map((t) => ({
      id: t.id,
      owner: t.o,
    }))

    const waveClaims = waves.map((w) => ({
      id: w.id,
      owner: w.o,
    }))

    return new Response(
      JSON.stringify({
        tasks: taskClaims,
        waves: waveClaims,
        summary: {
          activeTasks: taskClaims.length,
          lockedWaves: waveClaims.length,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (e) {
    console.error('Claims endpoint error:', e instanceof Error ? e.message : String(e))
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch claims',
        tasks: [],
        waves: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
