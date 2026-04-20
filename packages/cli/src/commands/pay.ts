import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString, flagNumber } from "../lib/args.js";

export const name = "pay";
export const summary = "pay — transfer payment between substrate units";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const to = requireArg(args, 0, "to (receiver uid)");
  const from = flagString(args, "from");
  const task = flagString(args, "task");
  const amount = flagNumber(args, "amount", 1);
  if (!from) throw new Error("missing --from <uid>");
  if (!task) throw new Error("missing --task <task-id>");
  const res = await apiRequest("/api/pay", {
    method: "POST",
    body: { from, to, task, amount },
  }).catch((err: Error) => ({ error: err.message, from, to, task, amount }));
  console.log(JSON.stringify(res, null, 2));
}
