// Web Push notification contract
export interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, unknown>
}

export declare function sendPush(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<void>
