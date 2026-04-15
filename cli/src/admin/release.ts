/**
 * Release Command
 *
 * Handles versioning and publishing the CLI to npm.
 *
 * Usage:
 *   npx oneie admin release patch   # Bug fixes (1.0.0 → 1.0.1)
 *   npx oneie admin release minor   # New features (1.0.0 → 1.1.0)
 *   npx oneie admin release major   # Breaking changes (1.0.0 → 2.0.0)
 *   npx oneie admin release         # Same as 'sync' (no version bump)
 */

import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { loadManifest } from "./manifest.js";
import { runSync } from "./sync.js";
import type { AdminOptions } from "./index.js";

const execAsync = promisify(exec);

type ReleaseType = "patch" | "minor" | "major" | "sync";

/**
 * Run the release command
 */
export async function runRelease(
  args: string[],
  options: AdminOptions
): Promise<void> {
  const basePath = process.cwd();
  const releaseType = (args[0] as ReleaseType) || "sync";

  // Validate release type
  if (!["patch", "minor", "major", "sync"].includes(releaseType)) {
    console.error(chalk.red(`\n❌ Invalid release type: ${releaseType}\n`));
    console.log("Valid types: patch | minor | major | sync\n");
    process.exit(1);
  }

  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan(`ONE Platform Release: ${releaseType}`));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  if (options.dryRun) {
    console.log(chalk.yellow("🔍 Dry run mode - no changes will be made\n"));
  }

  const manifest = await loadManifest(basePath);

  // Step 1: Sync files
  console.log(chalk.bold("Step 1: Syncing files\n"));
  await runSync(options);

  // Step 2: Bump version (if not sync-only)
  let newVersion = "";
  if (releaseType !== "sync") {
    console.log(chalk.bold("\nStep 2: Bumping version\n"));

    const versionFilePath = path.join(basePath, manifest.release.version_file);
    const packageJson = await fs.readJson(versionFilePath);
    const currentVersion = packageJson.version;

    newVersion = bumpVersion(currentVersion, releaseType);

    if (!options.dryRun) {
      const spinner = ora(`Bumping version: ${currentVersion} → ${newVersion}`).start();
      packageJson.version = newVersion;
      await fs.writeJson(versionFilePath, packageJson, { spaces: 2 });
      spinner.succeed(`Version bumped: ${currentVersion} → ${newVersion}`);
    } else {
      console.log(chalk.gray(`Would bump version: ${currentVersion} → ${newVersion}`));
    }
  }

  // Step 3: Git commit and tag
  if (releaseType !== "sync" && !options.dryRun) {
    console.log(chalk.bold("\nStep 3: Git commit and tag\n"));

    const spinner = ora("Creating git commit...").start();

    try {
      // Add changes
      await execAsync("git add -A", { cwd: basePath });

      // Commit
      const commitMessage = `Release v${newVersion}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

      await execAsync(`git commit -m "${commitMessage}"`, { cwd: basePath });

      // Tag
      await execAsync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, {
        cwd: basePath,
      });

      spinner.succeed(`Created commit and tag: v${newVersion}`);
    } catch (error: any) {
      spinner.warn(`Git operations failed: ${error.message}`);
    }
  }

  // Step 4: Push to GitHub
  if (!options.dryRun) {
    console.log(chalk.bold("\nStep 4: Pushing to GitHub\n"));

    const spinner = ora("Pushing to GitHub...").start();

    try {
      await execAsync("git push", { cwd: basePath });
      if (releaseType !== "sync") {
        await execAsync("git push --tags", { cwd: basePath });
      }
      spinner.succeed("Pushed to GitHub");
    } catch (error: any) {
      spinner.warn(`Push failed: ${error.message}`);
    }
  }

  // Step 5: Publish to npm
  if (releaseType !== "sync" && !options.dryRun) {
    console.log(chalk.bold("\nStep 5: Publishing to npm\n"));

    const cliPath = path.join(basePath, manifest.release.cli_path);
    const spinner = ora("Publishing to npm...").start();

    try {
      // Build TypeScript
      await execAsync("npm run build", { cwd: cliPath });

      // Publish
      await execAsync("npm publish --access=public", { cwd: cliPath });

      spinner.succeed(`Published ${manifest.release.npm_name}@${newVersion} to npm`);
    } catch (error: any) {
      spinner.fail(`npm publish failed: ${error.message}`);
    }
  }

  // Summary
  console.log(chalk.green("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.green("✅ Release complete!"));
  console.log(chalk.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  if (releaseType !== "sync") {
    console.log(chalk.bold("Published:"));
    console.log(chalk.gray(`  npm: https://www.npmjs.com/package/${manifest.release.npm_name}`));
    console.log(chalk.gray(`  Version: ${newVersion}\n`));

    console.log(chalk.bold("Install:"));
    console.log(chalk.gray(`  npx ${manifest.release.npm_name}@${newVersion}\n`));
  }
}

/**
 * Bump a semver version
 */
function bumpVersion(version: string, type: ReleaseType): string {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return version;
  }
}
