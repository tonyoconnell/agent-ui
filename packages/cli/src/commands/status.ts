import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg } from "../lib/args.js";

export const name = "status";
export const summary = "status — set agent lifecycle status (active|inactive)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const id = requireArg(args, 0, "agent id");
  const status = requireArg(args, 1, "status (active|inactive)");
  if (status !== "active" && status !== "inactive") {
    throw new Error(`invalid status "${status}" — must be active or inactive`);
  }
  const res = await apiRequest(`/api/agents/${id}/status`, {
    method: "POST",
    body: { status },
  }).catch((err: Error) => ({ error: err.message, id, status }));
  console.log(JSON.stringify(res, null, 2));
}
