// cli/src/commands/signal.ts — Cycle 1 stub. Wires to engine in Cycle 2 (T-C2-*).
// Verb: oneie signal [args]
export const name = "signal";
export const summary = "signal — substrate verb (Cycle 2)";
export async function run(argv: string[]): Promise<void> {
  console.log(JSON.stringify({ command: "signal", argv, status: "stub", cycle: 1 }));
}
