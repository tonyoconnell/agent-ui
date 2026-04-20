import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg } from "../lib/args.js";

export const name = "flag";
export const summary = "flag — lower agent success-rate and raise path resistance";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const id = requireArg(args, 0, "agent id");
  const res = await apiRequest(`/api/agents/${id}/flag`, {
    method: "POST",
  }).catch((err: Error) => ({ error: err.message, id }));
  console.log(JSON.stringify(res, null, 2));
}
