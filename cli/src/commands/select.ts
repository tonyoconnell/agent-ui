import { apiRequest } from "../lib/http.js";
import { parseArgs, flagString, flagNumber } from "../lib/args.js";

export const name = "select";
export const summary = "select — probabilistic path selection";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const type = flagString(args, "type");
  const sensitivity = flagNumber(args, "sensitivity", 0.5);
  const q = new URLSearchParams();
  if (type) q.set("type", type);
  q.set("sensitivity", String(sensitivity));
  const res = await apiRequest(`/api/loop/stage?${q.toString()}`).catch((err: Error) => ({
    error: err.message,
    type,
  }));
  console.log(JSON.stringify(res, null, 2));
}
