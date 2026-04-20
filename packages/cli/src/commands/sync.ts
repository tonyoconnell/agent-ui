import { apiRequest } from "../lib/http.js";
import { parseArgs } from "../lib/args.js";

export const name = "sync";
export const summary = "sync — tick all loops (L1-L7) + optional scope (tick|docs|todos|agents|fade|evolve|know|frontier)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const scope = args.positional[0];
  const loopMap: Record<string, string> = {
    tick: "",
    fade: "L3",
    evolve: "L5",
    know: "L6",
    frontier: "L7",
  };
  const loops = scope && loopMap[scope] !== undefined ? loopMap[scope] : "";
  const path = loops ? `/api/tick?loops=${loops}` : "/api/tick";
  const res = await apiRequest(path, { method: "POST" }).catch(() => apiRequest(path));
  console.log(JSON.stringify(res, null, 2));
}
