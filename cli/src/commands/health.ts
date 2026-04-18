import { apiRequest } from "../lib/http.js";

export const name = "health";
export const summary = "health — substrate health check (status, uptime, world state)";

export async function run(_argv: string[]): Promise<void> {
  const res = await apiRequest("/api/health").catch((err: Error) => ({ error: err.message }));
  console.log(JSON.stringify(res, null, 2));
}
