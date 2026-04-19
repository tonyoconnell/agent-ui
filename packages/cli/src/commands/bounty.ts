import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString, flagNumber } from "../lib/args.js";

export const name = "bounty";
export const summary = "bounty — post a bounty for a skill with rubric thresholds";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const providerUid = requireArg(args, 0, "providerUid");
  const skillId = requireArg(args, 1, "skillId");
  const price = flagNumber(args, "price");
  const deadlineMs = flagNumber(args, "deadline");
  if (price === undefined) throw new Error("missing --price <number>");
  if (deadlineMs === undefined) throw new Error("missing --deadline <ms>");
  const tagsRaw = flagString(args, "tags");
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : [];
  const rubricThresholds = { fit: 0.5, form: 0.5, truth: 0.5, taste: 0.5 };
  const res = await apiRequest("/api/buy/bounty", {
    method: "POST",
    body: { providerUid, skillId, price, deadlineMs, rubricThresholds, tags },
  }).catch((err: Error) => ({ error: err.message, providerUid, skillId }));
  console.log(JSON.stringify(res, null, 2));
}
