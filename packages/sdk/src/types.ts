export interface SdkConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class OneSdkError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "OneSdkError";
  }
}

export type Outcome<T> =
  | { result: T }
  | { timeout: true }
  | { dissolved: true };
