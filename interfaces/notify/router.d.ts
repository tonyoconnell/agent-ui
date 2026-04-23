// Route a notification through the user's preferred channel
export type NotifyChannel = "push" | "email" | "webhook"

export interface UserNotifyPrefs {
  channels: NotifyChannel[]
  push?: import("./push").PushSubscription
  email?: string
  webhookUrl?: string
}

export interface NotifyEvent {
  kind: "co-sign-request" | "agent-alive" | "scope-change" | "tx-confirmed" | "wallet-saved"
  uid: string
  data: Record<string, unknown>
}

// Route event through preferred channels; fallback chain if primary fails
export declare function routeNotification(
  prefs: UserNotifyPrefs,
  event: NotifyEvent
): Promise<void>
