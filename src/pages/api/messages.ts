import type { APIRoute } from 'astro'
import { getD1 } from '@/lib/cf-env'

export const prerender = false

/**
 * Get conversation messages from a group (D1 database)
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url)
    const groupId = url.searchParams.get('group')

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'group parameter required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const db = await getD1(locals)

    if (!db) {
      return new Response(JSON.stringify({ error: 'D1 database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const messages = await db
      .prepare(`
      SELECT id, sender, content, role, ts FROM messages
      WHERE group_id = ?
      ORDER BY ts ASC
      LIMIT 50
    `)
      .bind(groupId)
      .all()

    return new Response(
      JSON.stringify({
        group: groupId,
        messages: messages.results || [],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('[MESSAGES API] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to retrieve messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Post a new message to a group (sends to nanoclaw webhook)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const { groupId, text } = (await request.json()) as any

    if (!groupId || !text) {
      return new Response(JSON.stringify({ error: 'groupId and text required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Send to nanoclaw webhook as telegram
    const res = await fetch('https://nanoclaw.oneie.workers.dev/webhook/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: Date.now(),
        message: {
          message_id: Date.now(),
          chat: { id: groupId.replace('tg-', ''), type: 'private' },
          text,
          from: { id: groupId.replace('tg-', ''), first_name: 'User' },
        },
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[MESSAGES POST] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to post message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
