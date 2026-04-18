import { apiRequest } from "../lib/http.js";

export const name = "stats";
export const summary = "stats — substrate statistics (units, skills, highways, revenue)";

export async function run(_argv: string[]): Promise<void> {
  const res = await apiRequest("/api/stats").catch((err: Error) => ({ error: err.message }));
  console.log(JSON.stringify(res, null, 2));
}
