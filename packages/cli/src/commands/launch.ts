import { parseArgs, requireArg, flagString, flagBool } from "../lib/args.js";

export const name = "launch";
export const summary = "launch — handoff to agent-launch to mint a token for an agent";

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const agentUid = requireArg(args, 0, "agentUid");
  const { launchToken } = await import("@oneie/sdk/launch");
  const result = await launchToken(agentUid, {
    agentLaunchUrl: flagString(args, "agent-launch-url"),
    chain: (flagString(args, "chain") as "sui" | "base" | "solana" | undefined) ?? "sui",
    dryRun: flagBool(args, "dry-run"),
  });
  console.log(JSON.stringify(result, null, 2));
  console.log(
    "\nBuy/sell/holders/delegation belong to agent-launch (ONE is the substrate, agent-launch is the mint).",
  );
}
