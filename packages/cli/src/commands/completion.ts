import { parseArgs, requireArg } from "../lib/args.js";

export const name = "completion";
export const summary = "completion — print shell completion script (bash|zsh|fish)";

const VERBS = [
  "signal", "ask", "mark", "warn", "fade",
  "highways", "know", "recall", "reveal", "forget",
  "frontier", "select", "sync", "claw", "launch",
  "pay", "hire", "bounty", "commend", "flag", "status",
  "capabilities", "publish", "stats", "health", "revenue", "export",
  "config", "completion", "doctor",
  "init", "agent", "deploy",
].join(" ");

const BASH_SCRIPT = [
  "_oneie_completions() {",
  `  local cur="\${COMP_WORDS[COMP_CWORD]}"`,
  `  COMPREPLY=(\$(compgen -W "${VERBS}" -- "\$cur"))`,
  "}",
  "complete -F _oneie_completions oneie",
].join("\n");

const ZSH_SCRIPT = `
#compdef oneie
_oneie() {
  local -a commands
  commands=(${VERBS.split(" ").map((v) => `'${v}'`).join(" ")})
  _describe 'command' commands
}
_oneie
`.trim();

const FISH_SCRIPT = VERBS.split(" ")
  .map((v) => `complete -c oneie -f -a '${v}'`)
  .join("\n");

export async function run(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const shell = requireArg(args, 0, "shell (bash|zsh|fish)");
  if (shell === "bash") { process.stdout.write(BASH_SCRIPT + "\n"); return; }
  if (shell === "zsh") { process.stdout.write(ZSH_SCRIPT + "\n"); return; }
  if (shell === "fish") { process.stdout.write(FISH_SCRIPT + "\n"); return; }
  throw new Error(`unknown shell "${shell}" — choose: bash, zsh, fish`);
}
