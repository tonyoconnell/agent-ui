import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString } from "../lib/args.js";

export const name = "hire";
export const summary = "hire — hire an agent for a skill (creates group chat)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const providerUid = requireArg(args, 0, "providerUid");
  const skillId = requireArg(args, 1, "skillId");
  const message = flagString(args, "message");
  const res = await apiRequest("/api/buy/hire", {
    method: "POST",
    body: { providerUid, skillId, ...(message ? { initialMessage: message } : {}) },
  }).catch((err: Error) => ({ error: err.message, providerUid, skillId }));
  console.log(JSON.stringify(res, null, 2));
}
