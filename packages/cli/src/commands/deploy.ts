import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const name = "deploy";
export const summary = "deploy — run the deploy pipeline, or --hosted to upload agent to BaaS";

export async function run(argv: string[]): Promise<void> {
  const hostedIdx = argv.indexOf("--hosted");
  if (hostedIdx === -1) {
    // Local deploy pipeline (default)
    const child = spawn("bun", ["run", "deploy", ...argv], { stdio: "inherit" });
    await new Promise<void>((resolve, reject) => {
      child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`deploy exited ${code}`))));
    });
    return;
  }

  // --hosted: POST markdown to /api/agents/deploy
  const rest = argv.filter((_, i) => i !== hostedIdx);
  const mdFile = rest.find((a) => !a.startsWith("-")) ?? "agent.md";
  const apiKey = process.env.ONE_API_KEY;
  const baseUrl = process.env.ONE_API_URL ?? "https://one.ie";

  let markdown: string;
  try {
    markdown = readFileSync(resolve(process.cwd(), mdFile), "utf8");
  } catch {
    console.error(`❌  Cannot read ${mdFile}`);
    process.exit(1);
  }

  const res = await fetch(`${baseUrl}/api/agents/deploy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ markdown }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("❌  Deploy failed:", json);
    process.exit(1);
  }

  console.log("✅  Agent deployed to ONE BaaS");
  console.log(JSON.stringify(json, null, 2));
}
