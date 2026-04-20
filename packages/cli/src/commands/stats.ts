import { getClient } from "../lib/sdk.js";
import { output } from "../lib/output.js";

export const name = "stats";
export const summary = "stats — substrate statistics (units, skills, highways, revenue)";

export async function run(_argv: string[]): Promise<void> {
  const res = await getClient()
    .stats()
    .catch((err: Error) => ({ error: err.message }));
  output(res);
}
