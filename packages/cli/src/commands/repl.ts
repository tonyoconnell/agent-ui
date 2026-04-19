import { createInterface } from "node:readline";

export const name = "repl";
export const summary = "repl — interactive substrate shell (type .help to start)";

const COMMANDS = [
  "signal", "ask", "mark", "warn", "fade",
  "highways", "know", "recall", "reveal", "forget",
  "frontier", "select", "sync", "claw", "launch",
  "pay", "hire", "bounty", "commend", "flag", "status",
  "capabilities", "publish", "stats", "health", "revenue", "export",
  "config", "completion", "doctor",
];

export async function run(_argv: string[]): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: "oneie> ",
    historySize: 100,
  });

  console.log("oneie repl — type .help for commands, .exit to quit");
  rl.prompt();

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) { rl.prompt(); return; }

    if (trimmed === ".exit" || trimmed === "exit" || trimmed === "quit") {
      rl.close();
      process.exit(0);
    }

    if (trimmed === ".help") {
      console.log("Commands: " + COMMANDS.join(", "));
      rl.prompt();
      return;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (!COMMANDS.includes(cmd)) {
      console.log(`unknown command "${cmd}" — type .help`);
      rl.prompt();
      return;
    }

    try {
      const mod = await import(`./${cmd}.js`);
      await (mod as { run: (argv: string[]) => Promise<void> }).run(args);
    } catch (err) {
      console.log(JSON.stringify({ error: (err as Error).message }));
    }

    rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}
