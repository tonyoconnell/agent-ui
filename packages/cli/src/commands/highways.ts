import { getClient } from "../lib/sdk.js";
import { parseArgs, flagNumber } from "../lib/args.js";
import { output } from "../lib/output.js";

export const name = "highways";
export const summary = "highways — top weighted paths";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const limit = flagNumber(args, "limit", 20) ?? 20;
  const res = await getClient()
    .highways(limit)
    .catch((err: Error) => ({ error: err.message }));
  output(res);
}
