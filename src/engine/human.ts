/**
 * Human Unit — a human as a substrate receiver.
 *
 * Routes signals to Telegram or Discord and waits for reply via durable ask.
 * Pheromone accumulates on the path identically to any other unit:
 *   - Fast, accurate humans become highways
 *   - Humans who ignore requests accumulate resistance, eventually dissolve
 *
 * The substrate measures and routes humans the same way it routes models.
 *
 * Tasks:
 *   approve  — yes/no decision with optional feedback
 *   review   — open-ended review, returns text
 *   choose   — pick from numbered options
 *
 * Usage:
 *   net.units['anthony'] = human('anthony', {
 *     env, telegram: 123456789, timeout: 3_600_000
 *   })
 *   const { result, timeout } = await net.ask(
 *     { receiver: 'anthony:approve', data: { draft: '...' } }, 'writer'
 *   )
 */

import { type DurableAskEnv, durableAsk } from './durable-ask'
import { type Signal, type Unit, unit } from './world'

export interface HumanOpts {
  env: DurableAskEnv
  telegram?: number // Telegram user/chat ID
  discord?: string // Discord channel ID
  timeout?: number // ms, default 24h
  botToken?: string // Telegram bot token (if not in env)
}

const tg = async (botToken: string, chatId: number, text: string) => {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  }).catch(() => {})
}

export const human = (id: string, opts: HumanOpts): Unit => {
  const timeout = opts.timeout ?? 86_400_000 // 24h

  const notify = async (text: string, askId: string) => {
    if (opts.telegram && opts.botToken) {
      await tg(opts.botToken, opts.telegram, `${text}\n\n_Ask ID: \`${askId}\`_`)
    }
    // Discord: extend here with a fetch to discord.com/api/v10/channels/{id}/messages
  }

  const wait = (askId: string, signal: import('./world').Signal) =>
    durableAsk(
      opts.env,
      signal,
      id,
      timeout,
      opts.telegram ? { type: 'telegram', id: String(opts.telegram) } : undefined,
    )

  return unit(id)
    .on('approve', async (data) => {
      const { draft, question, replyTo } = data as { draft?: string; question?: string; replyTo?: string }
      const msg = question ?? `Please approve:\n\n${draft ?? '(no content)'}\n\nReply: *yes* / *no* / [feedback]`
      const askId = replyTo ?? `ask:${crypto.randomUUID()}`
      await notify(msg, askId)
      return wait(askId, { receiver: id, data })
    })
    .on('review', async (data) => {
      const { content, question, replyTo } = data as { content?: string; question?: string; replyTo?: string }
      const msg = question ?? `Please review:\n\n${content ?? '(no content)'}`
      const askId = replyTo ?? `ask:${crypto.randomUUID()}`
      await notify(msg, askId)
      return wait(askId, { receiver: id, data })
    })
    .on('choose', async (data) => {
      const { options, question, replyTo } = data as { options: string[]; question?: string; replyTo?: string }
      const numbered = options.map((o, i) => `${i + 1}. ${o}`).join('\n')
      const msg = `${question ?? 'Choose one:'}\n\n${numbered}\n\nReply with a number.`
      const askId = replyTo ?? `ask:${crypto.randomUUID()}`
      await notify(msg, askId)
      return wait(askId, { receiver: id, data })
    })
    .on('claim', async (data) => {
      const { bountyId, accept, deliverable, bounty_id, content, deadline, question, replyTo } = data as {
        bountyId?: string
        accept?: boolean
        deliverable?: string
        bounty_id?: string
        content?: string
        deadline?: string
        question?: string
        replyTo?: string
      }

      // Structured bounty claim signal — short-circuit: no prompt/wait needed
      if (bountyId !== undefined && accept !== undefined) {
        if (!bountyId) return { status: 'dissolved' }
        if (!accept) return { bountyId, status: 'declined' }
        if (deliverable) return { bountyId, status: 'delivered', deliverable }
        return { bountyId, status: 'accepted' }
      }

      // Legacy prompt-and-wait flow (bounty_id / content / deadline)
      const brief =
        typeof content === 'object' && content !== null
          ? ((content as Record<string, unknown>).brief as string | undefined)
          : undefined
      const body = brief ?? (typeof content === 'string' ? content : null) ?? '(no brief provided)'
      const deadlineStr = deadline ? `\n\n_Deadline: ${deadline}_` : ''
      const msg =
        question ??
        `Bounty claim available${bounty_id ? ` (${bounty_id})` : ''}:\n\n${body}${deadlineStr}\n\nReply with your deliverable (audit report, doc link, or file), or *decline* to pass.`
      const askId = replyTo ?? `ask:${crypto.randomUUID()}`
      await notify(msg, askId)
      return wait(askId, { receiver: id, data })
    })
}

/**
 * Build a structured bounty claim signal for the given persona unit.
 * Receiver is `<persona>:claim`.
 *
 * @param persona  The human unit id (e.g. "anthony")
 * @param bountyId The bounty being claimed/declined
 * @param accept   true = accept, false = decline
 * @param deliverable  Optional work product — triggers 'delivered' status
 */
export const bountyClaimSignal = (
  persona: string,
  bountyId: string,
  accept: boolean,
  deliverable?: string,
): Signal => ({
  receiver: `${persona}:claim`,
  data: { bountyId, accept, ...(deliverable !== undefined ? { deliverable } : {}) },
})
