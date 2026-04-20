import { getClient } from "../lib/sdk.js";
import { output } from "../lib/output.js";

export const name = "revenue";
export const summary = "revenue — substrate revenue aggregates (GDP, top earners, transactions)";

export async function run(_argv: string[]): Promise<void> {
  const res = await getClient()
    .revenue()
    .catch((err: Error) => ({ error: err.message }));
  output(res);
}
