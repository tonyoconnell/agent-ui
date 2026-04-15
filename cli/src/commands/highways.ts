import { apiRequest } from "../lib/http.js";
import { parseArgs, flagNumber } from "../lib/args.js";

export const name = "highways";
export const summary = "highways — top weighted paths";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const limit = flagNumber(args, "limit", 20);
  const res = await apiRequest(`/api/loop/highways?limit=${limit}`).catch(() =>
    apiRequest(`/api/export/highways?limit=${limit}`),
  );
  console.log(JSON.stringify(res, null, 2));
}
