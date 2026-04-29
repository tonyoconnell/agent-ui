/**
 * Email delivery via Postmark or Resend — checked in priority order.
 *
 * Required env (one of):
 *   POSTMARK_API_KEY  — Postmark server token
 *   RESEND_API_KEY    — Resend API key
 *
 *   NOTIFY_FROM_EMAIL — sender address (required for both providers)
 */

interface EmailPayload {
  to: string
  subject: string
  text?: string
  html?: string
  from?: string
}

/** Detected provider, for reporting. */
export type EmailProvider = 'postmark' | 'resend' | 'none'

function getEnv(name: string): string | undefined {
  const g = globalThis as any
  return g[name] || import.meta.env[name] || (typeof process !== 'undefined' ? process.env?.[name] : undefined)
}

/** Returns which provider will be used based on available env vars. */
export function detectEmailProvider(): EmailProvider {
  if (getEnv('POSTMARK_API_KEY')) return 'postmark'
  if (getEnv('RESEND_API_KEY')) return 'resend'
  return 'none'
}

async function sendViaPostmark(payload: EmailPayload): Promise<void> {
  const apiKey = getEnv('POSTMARK_API_KEY')
  if (!apiKey) throw new Error('POSTMARK_API_KEY is not set')

  const from = payload.from || getEnv('NOTIFY_FROM_EMAIL')
  if (!from) throw new Error('NOTIFY_FROM_EMAIL is not set')

  const body: Record<string, unknown> = {
    From: from,
    To: payload.to,
    Subject: payload.subject,
    TextBody: payload.text ?? '',
  }
  if (payload.html) body.HtmlBody = payload.html

  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Postmark delivery failed: ${response.status} — ${text}`)
  }
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
  const apiKey = getEnv('RESEND_API_KEY')
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')

  const from = payload.from || getEnv('NOTIFY_FROM_EMAIL')
  if (!from) throw new Error('NOTIFY_FROM_EMAIL is not set')

  const body: Record<string, unknown> = {
    from,
    to: [payload.to],
    subject: payload.subject,
    text: payload.text,
  }
  if (payload.html) body.html = payload.html

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Resend delivery failed: ${response.status} — ${text}`)
  }
}

/**
 * Send an email via the first available provider.
 *
 * Provider detection order: Postmark → Resend.
 * Throws if no provider is configured or delivery fails.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const provider = detectEmailProvider()

  if (provider === 'postmark') {
    await sendViaPostmark(payload)
    return
  }

  if (provider === 'resend') {
    await sendViaResend(payload)
    return
  }

  throw new Error('No email provider configured. Set POSTMARK_API_KEY or RESEND_API_KEY.')
}
