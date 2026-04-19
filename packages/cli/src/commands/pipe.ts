import { createInterface } from "node:readline";
import { apiRequest } from "../lib/http.js";

export const name = "pipe";
export const summary = "pipe — stream NDJSON signals from stdin, output results as NDJSON";

export async function run(_argv: string[]): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    terminal: false,
  });

  const promises: Promise<void>[] = [];

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const p = (async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        process.stdout.write(JSON.stringify({ error: "invalid JSON", input: trimmed }) + "\n");
        return;
      }

      const res = await apiRequest("/api/signal", {
        method: "POST",
        body: parsed,
      }).catch((err: Error) => ({ error: err.message, input: parsed }));

      process.stdout.write(JSON.stringify(res) + "\n");
    })();

    promises.push(p);
  });

  await new Promise<void>((resolve) => rl.on("close", resolve));
  await Promise.all(promises);
}
