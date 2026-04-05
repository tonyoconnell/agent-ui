/**
 * Channel Adapters — Normalize webhooks to signals
 */

import type { Signal, Env } from '../types'

// ═══════════════════════════════════════════════════════════════════════════
// TELEGRAM
// ═══════════════════════════════════════════════════════════════════════════

interface TelegramUpdate {
  message?: {
    message_id: number
    chat: { id: number; title?: string }
    from?: { id: number; username?: string }
    text?: string
    reply_to_message?: { message_id: number }
  }
}

export const normalizeTelegram = (payload: TelegramUpdate): Signal | null => {
  const msg = payload.message
  if (!msg?.text) return null

  return {
    id: `tg-${msg.message_id}`,
    group: `tg-${msg.chat.id}`,
    channel: 'telegram',
    sender: msg.from?.username || msg.from?.id.toString() || 'unknown',
    content: msg.text,
    replyTo: msg.reply_to_message?.message_id?.toString(),
    ts: Date.now(),
  }
}

export const sendTelegram = async (env: Env, groupId: string, text: string): Promise<void> => {
  if (!env.TELEGRAM_TOKEN) return
  const chatId = groupId.replace('tg-', '')
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCORD
// ═══════════════════════════════════════════════════════════════════════════

interface DiscordMessage {
  id: string
  channel_id: string
  author: { id: string; username: string }
  content: string
}

export const normalizeDiscord = (payload: DiscordMessage): Signal => ({
  id: `dc-${payload.id}`,
  group: `dc-${payload.channel_id}`,
  channel: 'discord',
  sender: payload.author.username,
  content: payload.content,
  ts: Date.now(),
})

export const sendDiscord = async (env: Env, channelId: string, text: string): Promise<void> => {
  if (!env.DISCORD_TOKEN) return
  const id = channelId.replace('dc-', '')
  await fetch(`https://discord.com/api/v10/channels/${id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bot ${env.DISCORD_TOKEN}`,
    },
    body: JSON.stringify({ content: text }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// WEB (direct HTTP)
// ═══════════════════════════════════════════════════════════════════════════

interface WebMessage {
  id?: string
  group: string
  sender?: string
  content: string
}

export const normalizeWeb = (payload: WebMessage): Signal => ({
  id: payload.id || `web-${Date.now()}`,
  group: payload.group,
  channel: 'web',
  sender: payload.sender || 'anonymous',
  content: payload.content,
  ts: Date.now(),
})

// ═══════════════════════════════════════════════════════════════════════════
// DISPATCHER
// ═══════════════════════════════════════════════════════════════════════════

export const normalize = (channel: string, payload: unknown): Signal | null => {
  switch (channel) {
    case 'telegram': return normalizeTelegram(payload as TelegramUpdate)
    case 'discord': return normalizeDiscord(payload as DiscordMessage)
    case 'web': return normalizeWeb(payload as WebMessage)
    default: return null
  }
}

export const send = async (env: Env, group: string, text: string): Promise<void> => {
  if (group.startsWith('tg-')) return sendTelegram(env, group, text)
  if (group.startsWith('dc-')) return sendDiscord(env, group, text)
  // Web channels don't have push — client polls or uses websocket
}
