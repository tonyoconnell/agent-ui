import { apiRequest } from "../lib/http.js";
import { parseArgs, requireArg, flagString } from "../lib/args.js";

export const name = "buy";
export const summary =
  "buy <tag-or-skill> [--from <agent>] — discover + hire a capability (Free tier allowed)";

/**
 * `oneie buy <tag> [--from <agent>]`
 *
 * Two shapes:
 *   1. `oneie buy <skillId> --from <providerUid>` — direct hire, known provider
 *   2. `oneie buy <tag>` — discover best provider by tag, then hire top match
 *
 * Wraps GET /api/agents/discover + POST /api/buy/hire. The hire path already
 * creates a group chat and, for paid capabilities, opens a Sui escrow with
 * the 50 bps protocol fee (see one/buy-and-sell.md § SETTLE).
 *
 * Failed delivery → warn(1) at the server and automatic escrow refund.
 *
 * Tier: Free tier allowed (buy is the entry-level commerce verb).
 */
export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const tagOrSkill = requireArg(args, 0, "tag-or-skillId");
  const explicitProvider = flagString(args, "from");
  const message = flagString(args, "message");

  let providerUid = explicitProvider;
  let skillId = tagOrSkill;

  if (!providerUid) {
    // Discover: find top-ranked provider for the given tag/skill.
    const discoverRes = (await apiRequest(
      `/api/agents/discover?skill=${encodeURIComponent(tagOrSkill)}&limit=1`,
      { method: "GET" },
    ).catch((err: Error) => ({ error: err.message }))) as
      | { error: string }
      | { agents?: Array<{ uid: string; skillId?: string }> };

    if ("error" in discoverRes) {
      console.error(`❌ discover failed: ${discoverRes.error}`);
      process.exit(1);
    }
    const top = discoverRes.agents?.[0];
    if (!top) {
      console.log(JSON.stringify({ error: `no agent found for "${tagOrSkill}"`, query: tagOrSkill }, null, 2));
      process.exit(1);
    }
    providerUid = top.uid;
    skillId = top.skillId ?? tagOrSkill;
  }

  const res = await apiRequest("/api/buy/hire", {
    method: "POST",
    body: {
      providerUid,
      skillId,
      ...(message ? { initialMessage: message } : {}),
    },
  }).catch((err: Error) => ({ error: err.message, providerUid, skillId }));

  // Best-effort marketplace signal — pheromone learns which tags buyers pursue.
  apiRequest("/api/signal", {
    method: "POST",
    body: {
      sender: "cli:buy",
      receiver: `marketplace:${skillId}`,
      data: { tags: ["marketplace", "buy"], content: { provider: providerUid, skillId } },
    },
  }).catch(() => {
    /* fire-and-forget */
  });

  console.log(JSON.stringify(res, null, 2));
}
