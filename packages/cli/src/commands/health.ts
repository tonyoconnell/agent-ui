import { getClient } from "../lib/sdk.js";
import { output } from "../lib/output.js";

export const name = "health";
export const summary = "health — substrate health check (status, uptime, world state)";

export async function run(_argv: string[]): Promise<void> {
  const res = await getClient()
    .health()
    .catch((err: Error) => ({ error: err.message }));
  output(res);
}
