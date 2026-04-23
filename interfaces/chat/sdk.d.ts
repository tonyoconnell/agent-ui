import type { Sid } from "../types-session"

// SDK chat method contract (from @oneie/sdk)
export interface SdkChatOptions {
  sid?: Sid
  stream?: boolean
}

export declare function chatSdk(
  message: string,
  opts?: SdkChatOptions
): Promise<{ sid: Sid; message: string }>
