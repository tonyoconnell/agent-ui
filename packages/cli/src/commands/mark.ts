import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagNumber } from "../lib/args.js";

export const name = "mark";
export const summary = "mark — strengthen a path";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const edge = requireArg(args, 0, "edge (from->to)");
  const strength = flagNumber(args, "strength", 1);
  const res = await apiRequest("/api/loop/mark-dims", {
    method: "POST",
    body: { edge, strength, source: "cli" },
  }).catch((err: Error) => ({ error: err.message, edge, strength }));
  console.log(JSON.stringify(res, null, 2));
}
