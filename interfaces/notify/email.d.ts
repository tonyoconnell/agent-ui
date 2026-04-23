export interface EmailPayload {
  to: string
  subject: string
  text: string
  html?: string
}

export declare function sendEmail(payload: EmailPayload): Promise<void>
