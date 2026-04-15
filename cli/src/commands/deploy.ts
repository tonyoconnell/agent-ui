import { spawn } from "node:child_process";

export const name = "deploy";
export const summary = "deploy — run the deploy pipeline (wraps `bun run deploy`)";

export async function run(argv: string[]): Promise<void> {
  const child = spawn("bun", ["run", "deploy", ...argv], { stdio: "inherit" });
  await new Promise<void>((resolve, reject) => {
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`deploy exited ${code}`))));
  });
}
