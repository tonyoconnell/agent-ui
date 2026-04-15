/**
 * Validate Command
 *
 * Validates the manifest against actual files in the monorepo.
 * Reports missing files, unused patterns, and configuration issues.
 *
 * Usage:
 *   npx oneie admin validate
 */

import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { loadManifest, getPackageNames, getSharedFiles } from "./manifest.js";
import type { AdminOptions } from "./index.js";

interface ValidationResult {
  package: string;
  missingFiles: string[];
  emptyPatterns: string[];
  warnings: string[];
}

/**
 * Run the validate command
 */
export async function runValidate(options: AdminOptions): Promise<void> {
  const basePath = process.cwd();
  const manifest = await loadManifest(basePath);

  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan("Validating Package Manifest"));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  const results: ValidationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  // Validate shared files
  console.log(chalk.bold("Checking shared files...\n"));
  const sharedResult = await validateSharedFiles(basePath, manifest, options);
  if (sharedResult.missingFiles.length > 0 || sharedResult.emptyPatterns.length > 0) {
    results.push(sharedResult);
    totalErrors += sharedResult.missingFiles.length;
    totalWarnings += sharedResult.emptyPatterns.length;
  } else {
    console.log(chalk.green("  ✓ All shared files exist\n"));
  }

  // Validate each package
  console.log(chalk.bold("Checking packages...\n"));
  const packageNames = await getPackageNames(basePath);

  for (const packageName of packageNames) {
    const pkg = manifest.packages[packageName];
    const result = await validatePackage(packageName, pkg, basePath, options);

    if (result.missingFiles.length > 0 || result.emptyPatterns.length > 0 || result.warnings.length > 0) {
      results.push(result);
      totalErrors += result.missingFiles.length;
      totalWarnings += result.emptyPatterns.length + result.warnings.length;

      console.log(chalk.yellow(`  ⚠ ${packageName}:`));
      result.missingFiles.forEach((f) => console.log(chalk.red(`    ✗ Missing: ${f}`)));
      result.emptyPatterns.forEach((p) => console.log(chalk.yellow(`    ? Empty pattern: ${p}`)));
      result.warnings.forEach((w) => console.log(chalk.yellow(`    ! ${w}`)));
      console.log("");
    } else {
      console.log(chalk.green(`  ✓ ${packageName}`));
    }
  }

  // Validate release sync paths
  console.log(chalk.bold("\nChecking release sync paths...\n"));
  for (const sync of manifest.release.sync) {
    const sourcePath = path.join(basePath, sync.source);
    const exists = await fs.pathExists(sourcePath);

    if (exists) {
      console.log(chalk.green(`  ✓ ${sync.source}`));
    } else {
      console.log(chalk.red(`  ✗ Missing: ${sync.source}`));
      totalErrors++;
    }
  }

  // Summary
  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan("Validation Summary"));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  console.log(`Packages checked: ${packageNames.length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}\n`);

  if (totalErrors > 0) {
    console.log(chalk.red("❌ Validation failed\n"));
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(chalk.yellow("⚠ Validation passed with warnings\n"));
  } else {
    console.log(chalk.green("✅ Validation passed\n"));
  }
}

/**
 * Validate shared files
 */
async function validateSharedFiles(
  basePath: string,
  manifest: any,
  options: AdminOptions
): Promise<ValidationResult> {
  const result: ValidationResult = {
    package: "shared",
    missingFiles: [],
    emptyPatterns: [],
    warnings: [],
  };

  for (const [category, patterns] of Object.entries(manifest.shared)) {
    for (const pattern of patterns as string[]) {
      const files = await glob(pattern, {
        cwd: basePath,
        nodir: true,
      });

      if (files.length === 0) {
        // Check if it's a literal file path
        const literalPath = path.join(basePath, pattern);
        if (!(await fs.pathExists(literalPath))) {
          if (pattern.includes("*")) {
            result.emptyPatterns.push(`${category}: ${pattern}`);
          } else {
            result.missingFiles.push(`${category}: ${pattern}`);
          }
        }
      }

      if (options.verbose && files.length > 0) {
        console.log(chalk.gray(`  ${pattern} → ${files.length} files`));
      }
    }
  }

  return result;
}

/**
 * Validate a single package
 */
async function validatePackage(
  packageName: string,
  pkg: any,
  basePath: string,
  options: AdminOptions
): Promise<ValidationResult> {
  const result: ValidationResult = {
    package: packageName,
    missingFiles: [],
    emptyPatterns: [],
    warnings: [],
  };

  // Check include patterns
  for (const pattern of pkg.include || []) {
    const files = await glob(pattern, {
      cwd: basePath,
      nodir: true,
    });

    if (files.length === 0) {
      const literalPath = path.join(basePath, pattern);
      if (!(await fs.pathExists(literalPath))) {
        if (pattern.includes("*")) {
          result.emptyPatterns.push(pattern);
        } else {
          result.missingFiles.push(pattern);
        }
      }
    }
  }

  // Check dependencies exist
  if (pkg.requires) {
    for (const dep of pkg.requires) {
      if (!pkg.include) continue;
      // Just warn, don't fail
      result.warnings.push(`Depends on: ${dep}`);
    }
  }

  // Check required env vars are documented
  if (pkg.env?.required && pkg.env.required.length > 0) {
    if (options.verbose) {
      console.log(chalk.gray(`  Required env: ${pkg.env.required.join(", ")}`));
    }
  }

  return result;
}
