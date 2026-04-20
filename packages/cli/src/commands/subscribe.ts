import { apiRequest } from "../lib/http.js";
import { parseArgs, flagString } from "../lib/args.js";

export const name = "subscribe";
export const summary =
  "subscribe <tag...> [--scope private|public] [--uid <uid>] — subscribe to tags (Stage 12)";

/**
 * `oneie subscribe <tags...> [--scope private|public] [--uid <uid>]`
 *
 * Subscribes the authenticated unit (or --uid override) to one or more tags.
 * Creates a subscription record in D1 that Cycle 2 routing uses to resolve
 * `receiver: "tag:X"` signals. Scope 'private' = only group-mates can reach you
 * via the tag; 'public' = any world member can (default).
 *
 * See lifecycle-one.md § Stage 12 — Subscribe.
 */
export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const tags = args.positional;
  if (tags.length === 0) {
    console.error("Usage: oneie subscribe <tag...> [--scope private|public] [--uid <uid>]");
    process.exit(1);
  }

  const scope = flagString(args, "scope") ?? "public";
  const uid = flagString(args, "uid");

  const body: Record<string, unknown> = { tags, scope };
  if (uid) body.uid = uid;

  const res = await apiRequest("/api/subscribe", {
    method: "POST",
    body,
  }).catch((err: Error) => ({ error: err.message }));

  console.log(JSON.stringify(res, null, 2));
}
