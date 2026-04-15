import { apiRequest } from "../lib/http.js";

export const name = "know";
export const summary = "know — promote highways to hypotheses (L6)";

export async function run(_argv: string[]): Promise<void> {
  const res = await apiRequest("/api/tick?loops=L6", { method: "POST" }).catch(() =>
    apiRequest("/api/hypotheses"),
  );
  console.log(JSON.stringify(res, null, 2));
}
