import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg } from "../lib/args.js";

export const name = "export";
export const summary = "export — export substrate data as JSON (paths|units|skills|highways|toxic)";

const KINDS = ["paths", "units", "skills", "highways", "toxic"] as const;
type ExportKind = (typeof KINDS)[number];

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const kind = requireArg(args, 0, `kind (${KINDS.join("|")})`);
  if (!KINDS.includes(kind as ExportKind)) {
    throw new Error(`unknown export kind "${kind}" — choose: ${KINDS.join(", ")}`);
  }
  const res = await apiRequest(`/api/export/${kind}`).catch((err: Error) => ({ error: err.message, kind }));
  console.log(JSON.stringify(res, null, 2));
}
