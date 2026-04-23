/**
 * Multi-channel notification router.
 *
 * Tries channels in preference order; falls back to the next channel on failure.
 * At least one channel must succeed, otherwise throws an aggregated error.
 */

import { sendPush } from './push'
import { sendEmail } from './email'
import { sendWebhook, type WebhookPayload } from './webhook'

/** Supported notification channels in priority order. */
export type NotifyChannel = 'push' | 'email' | 'webhook'

/** User notification preferences. */
export interface UserNotifyPrefs {
  /** Ordered list of channels to attempt (first = highest priority). */
  channels: NotifyChannel[]

  /** Web Push subscription — required when 'push' is in channels. */
  pushSubscription?: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  /** Email address — required when 'email' is in channels. */
  email?: string

  /** Webhook URL — required when 'webhook' is in channels. */
  webhookUrl?: string

  /** Webhook signing secret — required when 'webhook' is in channels. */
  webhookSecret?: string
}

/** Structured notification event. */
export interface NotifyEvent {
  /** Short human-readable event name (e.g. "signal:received", "payment:settled"). */
  event: string

  /** User-facing title for push / email subject. */
  title: string

  /** User-facing body text. */
  body: string

  /** Optional icon URL for push notifications. */
  icon?: string

  /** Arbitrary structured data attached to the event. */
  data?: Record<string, unknown>
}

/**
 * Route a notification to a user across their preferred channels.
 *
 * Tries each channel in `prefs.channels` order. If a channel fails (throws),
 * logs the error and falls through to the next. Succeeds as soon as one
 * channel delivers. Throws an aggregated error if all channels fail.
 */
export async function routeNotification(prefs: UserNotifyPrefs, event: NotifyEvent): Promise<void> {
  if (prefs.channels.length === 0) {
    throw new Error('No notification channels configured in user preferences')
  }

  const errors: Array<{ channel: NotifyChannel; error: string }> = []

  for (const channel of prefs.channels) {
    try {
      switch (channel) {
        case 'push': {
          if (!prefs.pushSubscription) {
            throw new Error('push channel selected but pushSubscription is not set')
          }
          await sendPush(prefs.pushSubscription, {
            title: event.title,
            body: event.body,
            icon: event.icon,
            data: event.data,
          })
          return // delivered
        }

        case 'email': {
          if (!prefs.email) {
            throw new Error('email channel selected but email address is not set')
          }
          await sendEmail({
            to: prefs.email,
            subject: event.title,
            text: event.body,
            html: event.data?.html as string | undefined,
          })
          return // delivered
        }

        case 'webhook': {
          if (!prefs.webhookUrl || !prefs.webhookSecret) {
            throw new Error('webhook channel selected but webhookUrl or webhookSecret is not set')
          }
          const webhookPayload: WebhookPayload = {
            event: event.event,
            timestamp: Date.now(),
            data: {
              title: event.title,
              body: event.body,
              icon: event.icon,
              ...event.data,
            },
          }
          await sendWebhook(prefs.webhookUrl, webhookPayload, prefs.webhookSecret)
          return // delivered
        }

        default: {
          // Exhaustive check — TypeScript will catch unhandled channels at compile time.
          const _exhaustive: never = channel
          throw new Error(`Unknown notification channel: ${_exhaustive}`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({ channel, error: message })
      // fall through to next channel
    }
  }

  // All channels failed
  const summary = errors.map((e) => `${e.channel}: ${e.error}`).join('; ')
  throw new Error(`All notification channels failed — ${summary}`)
}
