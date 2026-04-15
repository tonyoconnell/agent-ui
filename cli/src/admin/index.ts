/**
 * ONE Platform Admin Commands
 *
 * Secret admin commands for package management and releases.
 * Only work when run from the monorepo root.
 *
 * Usage:
 *   npx oneie admin build <package>   # Build a package
 *   npx oneie admin build --all       # Build all packages
 *   npx oneie admin release [type]    # Release to npm (patch|minor|major)
 *   npx oneie admin validate          # Validate manifest against files
 *   npx oneie admin sync              # Sync files to cli/
 *   npx oneie admin list              # List all packages
 */

import chalk from "chalk";
import { isMonorepo } from "./monorepo.js";
import { runBuild } from "./build.js";
import { runRelease } from "./release.js";
import { runValidate } from "./validate.js";
import { runSync } from "./sync.js";
import { runList } from "./list.js";

export interface AdminOptions {
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Main admin command router
 */
export async function runAdmin(args: string[]): Promise<void> {
  // Check if we're in the monorepo
  const monorepoCheck = await isMonorepo();
  if (!monorepoCheck.isMonorepo) {
    console.error(chalk.red("\n❌ Admin commands only work in the ONE monorepo.\n"));
    console.error(chalk.yellow("Missing markers:"));
    monorepoCheck.missingMarkers.forEach((marker) => {
      console.error(chalk.gray(`  - ${marker}`));
    });
    console.error(chalk.gray("\nRun this command from the monorepo root.\n"));
    process.exit(1);
  }

  // Parse command
  const command = args[0];
  const subArgs = args.slice(1);

  // Parse flags
  const options: AdminOptions = {
    dryRun: subArgs.includes("--dry-run"),
    verbose: subArgs.includes("--verbose"),
    quiet: subArgs.includes("--quiet"),
  };

  // Filter out flags from args
  const cleanArgs = subArgs.filter(
    (arg) => !arg.startsWith("--")
  );

  switch (command) {
    case "build":
      await runBuild(cleanArgs, options);
      break;

    case "release":
      await runRelease(cleanArgs, options);
      break;

    case "validate":
      await runValidate(options);
      break;

    case "sync":
      await runSync(options);
      break;

    case "list":
      await runList(options);
      break;

    case "help":
    case undefined:
      showHelp();
      break;

    default:
      console.error(chalk.red(`\n❌ Unknown admin command: ${command}\n`));
      showHelp();
      process.exit(1);
  }
}

function showHelp(): void {
  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan("ONE Platform Admin Commands"));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  console.log(chalk.bold("Usage:"));
  console.log("  npx oneie admin <command> [options]\n");

  console.log(chalk.bold("Commands:"));
  console.log("  build <package>   Build a package from manifest");
  console.log("  build --all       Build all packages");
  console.log("  release [type]    Release to npm (patch|minor|major)");
  console.log("  validate          Validate manifest against files");
  console.log("  sync              Sync files to cli/ directory");
  console.log("  list              List all packages\n");

  console.log(chalk.bold("Options:"));
  console.log("  --dry-run         Show what would happen without changes");
  console.log("  --verbose         Show detailed output");
  console.log("  --quiet           Minimal output\n");

  console.log(chalk.bold("Examples:"));
  console.log(chalk.gray("  npx oneie admin build shop"));
  console.log(chalk.gray("  npx oneie admin build --all --dry-run"));
  console.log(chalk.gray("  npx oneie admin release patch"));
  console.log(chalk.gray("  npx oneie admin validate"));
  console.log(chalk.gray("  npx oneie admin sync\n"));
}
