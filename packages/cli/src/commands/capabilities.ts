import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString, flagNumber } from "../lib/args.js";

export const name = "capabilities";
export const summary = "capabilities — add a skill capability to an agent";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const id = requireArg(args, 0, "agent id");
  const taskName = flagString(args, "task");
  if (!taskName) throw new Error("missing --task <name>");
  const price = flagNumber(args, "price", 0);
  const res = await apiRequest(`/api/agents/${id}/capabilities`, {
    method: "POST",
    body: { taskName, price },
  }).catch((err: Error) => ({ error: err.message, id, taskName }));
  console.log(JSON.stringify(res, null, 2));
}
