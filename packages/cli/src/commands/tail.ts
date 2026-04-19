import { getBaseUrl, tryGetApiKey } from "../lib/config.js";
import { parseArgs, flagString } from "../lib/args.js";

export const name = "tail";
export const summary = "tail — live-tail substrate events via SSE (Ctrl+C to stop)";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const tag = flagString(args, "tag");
  const base = getBaseUrl();
  const key = tryGetApiKey();

  const url = `${base.replace(/\/$/, "")}/api/stream`;
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (key) headers.Authorization = `Bearer ${key}`;

  console.error(`tailing ${url}${tag ? ` (filter: ${tag})` : ""} — ctrl+c to stop`);

  const response = await fetch(url, { headers });
  if (!response.ok || !response.body) {
    throw new Error(`stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const block of parts) {
      const dataLine = block.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const raw = dataLine.slice(6);
      if (raw === "[DONE]") return;
      try {
        const event = JSON.parse(raw) as Record<string, unknown>;
        if (tag) {
          const str = JSON.stringify(event);
          if (!str.includes(tag)) continue;
        }
        console.log(JSON.stringify(event, null, 2));
      } catch {
        // skip unparseable SSE frames
      }
    }
  }
}
