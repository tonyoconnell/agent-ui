import type { APIRoute } from 'astro'
import type { InboxEntity } from '@/data/in-types'

type Session = InboxEntity & { messages: Array<{ sender: string; content: string; ts: number }> }

// In-memory session bus — C1 single-isolate. C2 upgrades to TypeDB persistence.
const sessions = new Map<string, Session>()

export const GET: APIRoute = async ({ url }) => {
  const sid = url.searchParams.get('sessionId')
  if (sid) return Response.json(sessions.get(sid) ?? null)
  return Response.json([...sessions.values()])
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as {
    sessionId?: string
    sender?: string
    content?: string
  } | null
  if (!body?.sessionId || !body.sender || !body.content) {
    return Response.json({ error: 'sessionId, sender, content required' }, { status: 400 })
  }
  const { sessionId, sender, content } = body
  const msg = { sender, content, ts: Date.now() }
  const existing = sessions.get(sessionId)
  if (existing) {
    existing.messages.push(msg)
    existing.unread = true
    existing.preview = content.slice(0, 100)
  } else {
    sessions.set(sessionId, {
      id: `session:${sessionId}`,
      dimension: 'events',
      type: 'session',
      title: content.slice(0, 40),
      subtitle: sender,
      preview: content.slice(0, 100),
      timestamp: msg.ts,
      unread: true,
      status: 'now',
      tags: ['chat', sessionId],
      messages: [msg],
      sessionId,
    })
  }
  return Response.json({ ok: true })
}
