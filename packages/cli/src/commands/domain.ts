import { apiRequest } from "../lib/http.js";
import { parseArgs } from "../lib/args.js";
import { output } from "../lib/output.js";

export const name = "domain";
export const summary = "domain — bind a custom hostname to your deployment (Scale+ tier)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const hostname = args.positional[0];
  if (!hostname) {
    console.error("Usage: oneie domain <hostname>  (e.g. oneie domain tutor.example.com)");
    process.exit(1);
  }

  const res = await apiRequest<unknown>("/api/domains/create", {
    method: "POST",
    body: { hostname },
  }).catch((err: Error) => ({ error: err.message }));
  output(res);
}
