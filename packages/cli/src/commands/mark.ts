import { getClient } from "../lib/sdk.js";
import { parseArgs, requireArg, flagNumber } from "../lib/args.js";
import { output } from "../lib/output.js";

export const name = "mark";
export const summary = "mark — strengthen a path";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const edge = requireArg(args, 0, "edge (from->to)");
  const strength = flagNumber(args, "strength", 1) ?? 1;
  const res = await getClient()
    .mark(edge, { fit: strength, form: strength, truth: strength, taste: strength })
    .catch((err: Error) => ({ error: err.message, edge, strength }));
  output(res);
}
