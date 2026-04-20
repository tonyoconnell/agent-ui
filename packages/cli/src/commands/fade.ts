import { getClient } from "../lib/sdk.js";
import { parseArgs, flagNumber } from "../lib/args.js";
import { output } from "../lib/output.js";

export const name = "fade";
export const summary = "fade — asymmetric decay of all paths";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const trailRate = flagNumber(args, "rate", 0.05) ?? 0.05;
  const resistanceRate = flagNumber(args, "resistance-rate", trailRate * 2) ?? trailRate * 2;
  const res = await getClient()
    .fade(trailRate, resistanceRate)
    .catch((err: Error) => ({ error: err.message, trailRate, resistanceRate }));
  output(res);
}
