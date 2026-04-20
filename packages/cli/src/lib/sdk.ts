/**
 * SDK client factory for CLI commands
 *
 * Creates a SubstrateClient configured from CLI environment.
 */
import { SubstrateClient } from "@oneie/sdk";
import { getBaseUrl, tryGetApiKey } from "./config.js";

let cachedClient: SubstrateClient | undefined;

export function getClient(): SubstrateClient {
  if (!cachedClient) {
    cachedClient = new SubstrateClient({
      baseUrl: getBaseUrl(),
      apiKey: tryGetApiKey(),
    });
  }
  return cachedClient;
}

export function resetClient(): void {
  cachedClient = undefined;
}

export { SubstrateClient };
