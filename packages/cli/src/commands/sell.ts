import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString, flagNumber } from "../lib/args.js";

export const name = "sell";
export const summary =
  "sell <skill> --price <amount> [--name <name>] [--tags t1,t2] — list a capability on the marketplace (Builder+)";

/**
 * `oneie sell <skill> --price <amount> [--tags ...]`
 *
 * Wraps POST /api/capabilities/publish — the endpoint creates the capability
 * relation with the price, scope='group' (discoverable), and an owner grant.
 * The server also emits `marketplace:sell` as a substrate signal so pheromone
 * learns which skills get listed where.
 *
 * Tier: Builder+ (Free tier is buy-only per one/pricing.md). Gate enforced at
 * endpoint, not in CLI.
 */
export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const skillId = requireArg(args, 0, "skillId");
  const price = flagNumber(args, "price");
  if (price === undefined) throw new Error("missing --price <number>");
  const skillName = flagString(args, "name") ?? skillId;
  const scope = flagString(args, "scope") ?? "group";
  const tagsRaw = flagString(args, "tags");
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : undefined;

  const res = await apiRequest("/api/capabilities/publish", {
    method: "POST",
    body: {
      skillId,
      name: skillName,
      price,
      scope,
      ...(tags ? { tags } : {}),
    },
  }).catch((err: Error) => ({ error: err.message, skillId }));

  // Best-effort marketplace signal — pheromone learns which skills are listed.
  apiRequest("/api/signal", {
    method: "POST",
    body: {
      sender: "cli:sell",
      receiver: `marketplace:${skillId}`,
      data: { tags: ["marketplace", "sell", ...(tags ?? [])], weight: price, content: { price } },
    },
  }).catch(() => {
    /* signal is fire-and-forget — don't fail the sell on telemetry */
  });

  console.log(JSON.stringify(res, null, 2));
}
