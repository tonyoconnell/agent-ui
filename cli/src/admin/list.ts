/**
 * List Command
 *
 * Lists all packages defined in the manifest.
 *
 * Usage:
 *   npx oneie admin list
 */

import chalk from "chalk";
import { loadManifest, getPackageNames } from "./manifest.js";
import type { AdminOptions } from "./index.js";

/**
 * Run the list command
 */
export async function runList(options: AdminOptions): Promise<void> {
  const basePath = process.cwd();
  const manifest = await loadManifest(basePath);

  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan("ONE Platform Packages"));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  // Group by type
  const foundation: string[] = [];
  const free: string[] = [];
  const paid: string[] = [];

  for (const [name, pkg] of Object.entries(manifest.packages)) {
    if (pkg.type === "foundation") {
      foundation.push(name);
    } else if (pkg.price === "free" || pkg.price === "$0") {
      free.push(name);
    } else {
      paid.push(name);
    }
  }

  // Foundation
  if (foundation.length > 0) {
    console.log(chalk.bold("Foundation:"));
    for (const name of foundation) {
      const pkg = manifest.packages[name];
      console.log(chalk.green(`  ${name.padEnd(15)} ${pkg.description}`));
    }
    console.log("");
  }

  // Free
  if (free.length > 0) {
    console.log(chalk.bold("Free:"));
    for (const name of free) {
      const pkg = manifest.packages[name];
      console.log(chalk.blue(`  ${name.padEnd(15)} ${pkg.description}`));
    }
    console.log("");
  }

  // Paid
  if (paid.length > 0) {
    console.log(chalk.bold("Paid:"));
    for (const name of paid) {
      const pkg = manifest.packages[name];
      const price = pkg.price.padEnd(6);
      const deps = pkg.requires ? chalk.gray(` (requires: ${pkg.requires.join(", ")})`) : "";
      console.log(chalk.yellow(`  ${name.padEnd(15)} ${price} ${pkg.description}${deps}`));
    }
    console.log("");
  }

  // Bundles
  if (Object.keys(manifest.bundles).length > 0) {
    console.log(chalk.bold("Bundles:"));
    for (const [name, bundle] of Object.entries(manifest.bundles)) {
      const price = bundle.price.padEnd(6);
      const savings = bundle.savings ? chalk.green(` (save ${bundle.savings})`) : "";
      const includes = chalk.gray(`[${bundle.includes.join(", ")}]`);
      console.log(`  ${name.padEnd(15)} ${price} ${bundle.description}${savings}`);
      console.log(chalk.gray(`                  ${includes}`));
    }
    console.log("");
  }

  // Summary
  const totalPackages = Object.keys(manifest.packages).length;
  const totalBundles = Object.keys(manifest.bundles).length;

  console.log(chalk.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.gray(`Total: ${totalPackages} packages, ${totalBundles} bundles\n`));

  // Verbose mode: show file counts
  if (options.verbose) {
    console.log(chalk.bold("File patterns per package:\n"));
    for (const [name, pkg] of Object.entries(manifest.packages)) {
      console.log(`  ${name}: ${pkg.include.length} patterns`);
    }
    console.log("");
  }
}
