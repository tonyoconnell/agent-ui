/**
 * /api/tasks — Task CRUD
 *
 * GET  → List all tasks (optional ?phase=wire&status=todo)
 * POST → Create a new task
 */
import type { APIRoute } from 'astro'
import { read, write, parseAnswers } from '@/lib/typedb'

export const GET: APIRoute = async ({ url }) => {
  const phase = url.searchParams.get('phase')
  const status = url.searchParams.get('status')

  let tql = 'match $t isa task'
  const filters: string[] = []
  if (phase) filters.push(`has phase "${phase}"`)
  if (status) filters.push(`has status "${status}"`)

  tql += filters.length ? ', ' + filters.join(', ') : ''
  tql += `, has tid $id, has name $name, has status $s, has priority $p,
    has phase $ph, has task-type $tt;
    select $id, $name, $s, $p, $ph, $tt;`

  const answers = await read(tql)
  const rows = parseAnswers(answers)
  return new Response(JSON.stringify({ tasks: rows }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as {
    tid: string
    name: string
    description?: string
    taskType?: string
    status?: string
    priority?: string
    phase?: string
    importance?: number
    price?: number
    currency?: string
    blockedBy?: string[]
  }

  if (!body.tid || !body.name) {
    return new Response(JSON.stringify({ error: 'Missing tid or name' }), { status: 400 })
  }

  const now = new Date().toISOString().replace('Z', '')

  await write(`
    insert $t isa task,
      has tid "${body.tid}",
      has name "${body.name}",
      has description "${body.description || ''}",
      has task-type "${body.taskType || 'work'}",
      has status "${body.status || 'todo'}",
      has priority "${body.priority || 'P1'}",
      has phase "${body.phase || 'tasks'}",
      has importance ${body.importance || 5},
      has price ${body.price || 0},
      has currency "${body.currency || 'SUI'}";
  `)

  // Create dependency relations if blockedBy specified
  if (body.blockedBy?.length) {
    for (const blockerId of body.blockedBy) {
      await write(`
        match
          $dep isa task, has tid "${body.tid}";
          $blocker isa task, has tid "${blockerId}";
        insert
          (dependent: $dep, blocker: $blocker) isa dependency;
      `).catch(() => {})
    }
  }

  return new Response(JSON.stringify({ ok: true, tid: body.tid }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
