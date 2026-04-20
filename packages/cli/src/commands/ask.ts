// cli/src/commands/ask.ts — Cycle 1 stub. Wires to engine in Cycle 2 (T-C2-*).
// Verb: oneie ask [args]
export const name = "ask";
export const summary = "ask — substrate verb (Cycle 2)";
export async function run(argv: string[]): Promise<void> {
  console.log(JSON.stringify({ command: "ask", argv, status: "stub", cycle: 1 }));
}
