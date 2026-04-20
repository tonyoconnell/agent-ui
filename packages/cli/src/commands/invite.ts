import { apiRequest } from "../lib/http.js";
import { parseArgs, flagString } from "../lib/args.js";
import { output } from "../lib/output.js";

export const name = "invite";
export const summary = "invite — add an agent to a group, or open a federation bridge (Scale+/Enterprise)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const target = args.positional[0];
  if (!target) {
    console.error("Usage: oneie invite <agent-uid|world> --into <group-id> [--role operator] [--url <world-url>]");
    process.exit(1);
  }

  // World federation mode: --url present or target === "world"
  const worldUrl = flagString(args, "url", "");
  if (target === "world" || worldUrl) {
    const url = worldUrl || target;
    const res = await apiRequest<unknown>("/api/federation/connect", {
      method: "POST",
      body: { targetUrl: url },
    }).catch((err: Error) => ({ error: err.message }));
    output(res);
    return;
  }

  // Agent invite mode: --into <group-id>
  const gid = flagString(args, "into", "");
  if (!gid) {
    console.error("--into <group-id> is required for agent invites");
    process.exit(1);
  }
  const role = flagString(args, "role", "operator");

  const res = await apiRequest<unknown>(`/api/groups/${encodeURIComponent(gid)}/invite`, {
    method: "POST",
    body: { uid: target, role },
  }).catch((err: Error) => ({ error: err.message }));
  output(res);
}
