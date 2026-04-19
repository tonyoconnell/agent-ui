import { apiRequest } from "../lib/http.js";
import { parseArgs, flagNumber } from "../lib/args.js";

export const name = "fade";
export const summary = "fade — asymmetric decay of all paths";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const rate = flagNumber(args, "rate", 0.05);
  const res = await apiRequest(`/api/decay-cycle?rate=${rate}`, { method: "POST" }).catch(
    (err: Error) => ({ error: err.message, rate }),
  );
  console.log(JSON.stringify(res, null, 2));
}
