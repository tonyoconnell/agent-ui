import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagBool } from "../lib/args.js";

export const name = "forget";
export const summary = "forget — GDPR erasure of a uid";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const uid = requireArg(args, 0, "uid");
  if (!flagBool(args, "yes")) {
    console.error(`This will permanently delete all TypeDB records for ${uid}.`);
    console.error(`Re-run with --yes to confirm.`);
    process.exit(2);
  }
  await apiRequest(`/api/memory/forget/${encodeURIComponent(uid)}`, { method: "DELETE" });
  console.log(JSON.stringify({ forgotten: uid }, null, 2));
}
