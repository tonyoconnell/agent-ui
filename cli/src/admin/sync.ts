/**
 * Sync Command
 *
 * Syncs files from the monorepo to cli/ directory for npm publishing.
 *
 * Usage:
 *   npx oneie admin sync
 */

import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { loadManifest } from "./manifest.js";
import type { AdminOptions } from "./index.js";

/**
 * Run the sync command
 */
export async function runSync(options: AdminOptions): Promise<void> {
  const basePath = process.cwd();
  const manifest = await loadManifest(basePath);

  console.log(chalk.cyan("📂 Syncing files to CLI package\n"));

  if (options.dryRun) {
    console.log(chalk.yellow("🔍 Dry run mode - no changes will be made\n"));
  }

  const cliPath = path.join(basePath, manifest.release.cli_path);
  let totalFiles = 0;

  // Process each sync entry
  for (const sync of manifest.release.sync) {
    const sourcePath = path.join(basePath, sync.source);
    const destPath = path.join(cliPath, sync.dest);

    if (!options.dryRun) {
      const spinner = ora(`Syncing ${sync.source} → ${sync.dest}`).start();

      try {
        // Check if source exists
        if (!(await fs.pathExists(sourcePath))) {
          spinner.warn(`Source not found: ${sync.source}`);
          continue;
        }

        // Get stats to determine if it's a file or directory
        const stats = await fs.stat(sourcePath);

        if (stats.isDirectory()) {
          // Count files first
          const files = await glob("**/*", {
            cwd: sourcePath,
            nodir: true,
            ignore: ["**/node_modules/**", "**/.git/**"],
          });

          // Remove and recreate destination
          await fs.remove(destPath);
          await fs.copy(sourcePath, destPath, {
            filter: (src) => {
              // Skip node_modules and .git
              return !src.includes("node_modules") && !src.includes(".git");
            },
          });

          totalFiles += files.length;
          spinner.succeed(`Synced ${sync.source} → ${sync.dest} (${files.length} files)`);
        } else {
          // Single file
          await fs.ensureDir(path.dirname(destPath));
          await fs.copy(sourcePath, destPath);
          totalFiles += 1;
          spinner.succeed(`Synced ${sync.source} → ${sync.dest}`);
        }
      } catch (error: any) {
        spinner.fail(`Failed to sync ${sync.source}: ${error.message}`);
      }
    } else {
      // Dry run
      const exists = await fs.pathExists(sourcePath);
      if (exists) {
        const stats = await fs.stat(sourcePath);
        if (stats.isDirectory()) {
          const files = await glob("**/*", {
            cwd: sourcePath,
            nodir: true,
            ignore: ["**/node_modules/**", "**/.git/**"],
          });
          console.log(chalk.gray(`Would sync ${sync.source} → ${sync.dest} (${files.length} files)`));
          totalFiles += files.length;
        } else {
          console.log(chalk.gray(`Would sync ${sync.source} → ${sync.dest}`));
          totalFiles += 1;
        }
      } else {
        console.log(chalk.yellow(`Source not found: ${sync.source}`));
      }
    }
  }

  // Summary
  console.log("");
  if (options.dryRun) {
    console.log(chalk.gray(`Would sync ${totalFiles} files total\n`));
  } else {
    console.log(chalk.green(`✅ Synced ${totalFiles} files to ${manifest.release.cli_path}\n`));
  }
}
