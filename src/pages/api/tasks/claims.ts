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
    // All claimed tasks (active status)
    const tasksQ = `match $t isa task, has task-id $id, has task-status $s, has owner $o, has claimed-at $c; $s = "active"; select $id, $o, $c;`
    const tasks = (await read(tasksQ)) as Array<{ id: string; o: string; c: string }>

    // All wave-locks
    const wavesQ = `match $wl isa wave-lock, has wave-lock-id $id, has owner $o, has claimed-at $c; select $id, $o, $c;`
    const waves = (await read(wavesQ)) as Array<{ id: string; o: string; c: string }>

    const now = Date.now()

    // Compute age for each claim
    const taskClaims = tasks.map((t) => ({
      id: t.id,
      owner: t.o,
      claimedAt: t.c,
      ageMinutes: Math.round((now - new Date(t.c).getTime()) / 60_000),
    }))

    const waveClaims = waves.map((w) => ({
      id: w.id,
      owner: w.o,
      claimedAt: w.c,
      ageMinutes: Math.round((now - new Date(w.c).getTime()) / 60_000),
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
