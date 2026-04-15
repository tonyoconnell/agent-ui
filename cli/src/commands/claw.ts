import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagBool } from "../lib/args.js";

export const name = "claw";
export const summary = "claw — generate nanoclaw config for an agent (POST /api/claw)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const agentId = requireArg(args, 0, "agentId");
  const res = await apiRequest("/api/claw", {
    method: "POST",
    body: { agentId, dryRun: flagBool(args, "dry-run") },
  });
  console.log(JSON.stringify(res, null, 2));
}
