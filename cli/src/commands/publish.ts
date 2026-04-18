import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString, flagNumber } from "../lib/args.js";

export const name = "publish";
export const summary = "publish — publish a capability to the marketplace (operator+ required)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const skillId = requireArg(args, 0, "skillId");
  const name = flagString(args, "name");
  const price = flagNumber(args, "price");
  if (!name) throw new Error("missing --name <name>");
  if (price === undefined) throw new Error("missing --price <number>");
  const scope = flagString(args, "scope") ?? "group";
  const tagsRaw = flagString(args, "tags");
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : undefined;
  const res = await apiRequest("/api/capabilities/publish", {
    method: "POST",
    body: { skillId, name, price, scope, ...(tags ? { tags } : {}) },
  }).catch((err: Error) => ({ error: err.message, skillId }));
  console.log(JSON.stringify(res, null, 2));
}
