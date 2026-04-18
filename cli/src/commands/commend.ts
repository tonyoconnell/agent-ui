import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg } from "../lib/args.js";

export const name = "commend";
export const summary = "commend — raise agent success-rate and strengthen its paths";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const id = requireArg(args, 0, "agent id");
  const res = await apiRequest(`/api/agents/${id}/commend`, {
    method: "POST",
  }).catch((err: Error) => ({ error: err.message, id }));
  console.log(JSON.stringify(res, null, 2));
}
