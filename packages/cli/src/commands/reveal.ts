import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg } from "../lib/args.js";

export const name = "reveal";
export const summary = "reveal — full memory card for a uid";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const uid = requireArg(args, 0, "uid");
  const res = await apiRequest(`/api/memory/reveal/${encodeURIComponent(uid)}`);
  console.log(JSON.stringify(res, null, 2));
}
