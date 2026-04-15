import { apiRequest } from "../lib/http.js";
import { parseArgs, flagString } from "../lib/args.js";

export const name = "recall";
export const summary = "recall — query hypotheses";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const subject = flagString(args, "subject") ?? args.positional[0];
  const path = subject ? `/api/hypotheses?subject=${encodeURIComponent(subject)}` : "/api/hypotheses";
  const res = await apiRequest(path);
  console.log(JSON.stringify(res, null, 2));
}
