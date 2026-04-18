import { apiRequest } from "../lib/http.js";

export const name = "revenue";
export const summary = "revenue — substrate revenue aggregates (GDP, top earners, transactions)";

export async function run(_argv: string[]): Promise<void> {
  const res = await apiRequest("/api/revenue").catch((err: Error) => ({ error: err.message }));
  console.log(JSON.stringify(res, null, 2));
}
