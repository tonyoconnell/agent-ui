/**
 * Build Command
 *
 * Builds packages from the manifest by copying files to apps/ and packages/.
 *
 * Usage:
 *   npx oneie admin build <package>   # Build specific package
 *   npx oneie admin build --all       # Build all packages
 */

import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import {
  loadManifest,
  getPackage,
  getPackageNames,
  getSharedFiles,
  resolvePackageDependencies,
  type PackageConfig,
} from "./manifest.js";
import type { AdminOptions } from "./index.js";

/**
 * Run the build command
 */
export async function runBuild(
  args: string[],
  options: AdminOptions
): Promise<void> {
  const basePath = process.cwd();

  // Handle --all flag
  if (args.includes("--all") || args[0] === "--all") {
    await buildAllPackages(basePath, options);
    return;
  }

  // Single package build
  const packageName = args[0];
  if (!packageName) {
    console.error(chalk.red("\n❌ Please specify a package name.\n"));
    console.log("Usage: npx oneie admin build <package>");
    console.log("       npx oneie admin build --all\n");
    console.log("Available packages:");
    const names = await getPackageNames(basePath);
    names.forEach((name) => console.log(chalk.gray(`  - ${name}`)));
    process.exit(1);
  }

  await buildPackage(packageName, basePath, options);
}

/**
 * Build all packages
 */
async function buildAllPackages(
  basePath: string,
  options: AdminOptions
): Promise<void> {
  const packageNames = await getPackageNames(basePath);

  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan(`Building all ${packageNames.length} packages`));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  for (const packageName of packageNames) {
    await buildPackage(packageName, basePath, options);
    console.log("");
  }

  console.log(chalk.green(`\n✅ Built ${packageNames.length} packages\n`));
}

/**
 * Build a single package
 */
async function buildPackage(
  packageName: string,
  basePath: string,
  options: AdminOptions
): Promise<void> {
  const pkg = await getPackage(packageName, basePath);

  if (!pkg) {
    console.error(chalk.red(`\n❌ Package not found: ${packageName}\n`));
    console.log("Available packages:");
    const names = await getPackageNames(basePath);
    names.forEach((name) => console.log(chalk.gray(`  - ${name}`)));
    process.exit(1);
  }

  console.log(chalk.cyan(`\n📦 Building: ${packageName}`));
  console.log(chalk.gray(`   ${pkg.description}`));
  console.log(chalk.gray(`   Type: ${pkg.type} | Price: ${pkg.price}\n`));

  if (options.dryRun) {
    console.log(chalk.yellow("🔍 Dry run mode - no changes will be made\n"));
  }

  const manifest = await loadManifest(basePath);
  const appDir = path.join(basePath, "apps", packageName);
  const pkgDir = path.join(basePath, "packages", packageName);

  // Step 1: Clean output directories
  if (!options.dryRun) {
    const spinner = ora("Cleaning output directories...").start();
    await fs.remove(appDir);
    await fs.remove(pkgDir);
    await fs.ensureDir(appDir);
    await fs.ensureDir(pkgDir);
    spinner.succeed("Cleaned output directories");
  }

  // Step 2: Copy shared files
  let sharedFileCount = 0;
  if (!options.dryRun) {
    const spinner = ora("Copying shared files...").start();
    const sharedFiles = await getSharedFiles(undefined, basePath);
    sharedFileCount = await copyFiles(sharedFiles, basePath, appDir, manifest.global_exclude, options);
    spinner.succeed(`Copied ${sharedFileCount} shared files`);
  } else {
    const sharedFiles = await getSharedFiles(undefined, basePath);
    console.log(chalk.gray(`Would copy ${sharedFiles.length} shared file patterns`));
  }

  // Step 3: Copy dependency files (if requires other packages)
  if (pkg.requires && pkg.requires.length > 0) {
    const deps = await resolvePackageDependencies(packageName, basePath);
    if (deps.length > 0) {
      if (!options.dryRun) {
        const spinner = ora(`Copying files from ${deps.length} dependencies...`).start();
        for (const dep of deps) {
          const depPkg = await getPackage(dep, basePath);
          if (depPkg) {
            await copyFiles(depPkg.include, basePath, appDir, manifest.global_exclude, options);
          }
        }
        spinner.succeed(`Copied files from dependencies: ${deps.join(", ")}`);
      } else {
        console.log(chalk.gray(`Would copy files from dependencies: ${deps.join(", ")}`));
      }
    }
  }

  // Step 4: Copy package-specific files
  // For "web" package, strip "web/" prefix so files go to root
  let pkgFileCount = 0;
  const stripPrefix = packageName === "web" ? "web/" : undefined;

  if (!options.dryRun) {
    const spinner = ora("Copying package files...").start();
    pkgFileCount = await copyFiles(pkg.include, basePath, appDir, manifest.global_exclude, options, stripPrefix);
    spinner.succeed(`Copied ${pkgFileCount} package files`);
  } else {
    console.log(chalk.gray(`Would copy ${pkg.include.length} package file patterns`));
  }

  // Step 5: Apply exclusions
  if (!options.dryRun && pkg.exclude) {
    const spinner = ora("Applying exclusions...").start();
    await applyExclusions(appDir, [...manifest.global_exclude, ...pkg.exclude]);
    spinner.succeed("Applied exclusions");
  }

  // Step 6: Generate package.json for app
  if (!options.dryRun) {
    const spinner = ora("Generating package.json...").start();
    await generatePackageJson(appDir, pkg, "app");
    spinner.succeed("Generated package.json");
  }

  // Step 7: Generate README
  if (!options.dryRun) {
    const spinner = ora("Generating README.md...").start();
    await generateReadme(appDir, pkg, packageName);
    spinner.succeed("Generated README.md");
  }

  // Step 8: Copy to packages/ directory (npm-ready)
  if (!options.dryRun) {
    const spinner = ora("Creating npm package...").start();
    await fs.copy(appDir, pkgDir);
    await generatePackageJson(pkgDir, pkg, "npm");
    spinner.succeed("Created npm package");
  }

  // Summary
  console.log(chalk.green(`\n✅ Built ${packageName}`));
  console.log(chalk.gray(`   App:     ${appDir}`));
  console.log(chalk.gray(`   Package: ${pkgDir}`));
}

/**
 * Copy files matching glob patterns
 * For patterns starting with "web/", strip the prefix so files go to root of destPath
 */
async function copyFiles(
  patterns: string[],
  basePath: string,
  destPath: string,
  excludePatterns: string[],
  options: AdminOptions,
  stripPrefix?: string
): Promise<number> {
  let count = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: basePath,
      ignore: excludePatterns,
      nodir: true,
    });

    for (const file of files) {
      const srcPath = path.join(basePath, file);

      // Strip prefix if specified (e.g., "web/" -> "")
      let destFile = file;
      if (stripPrefix && file.startsWith(stripPrefix)) {
        destFile = file.slice(stripPrefix.length);
      }
      destFile = path.join(destPath, destFile);

      if (await fs.pathExists(srcPath)) {
        await fs.ensureDir(path.dirname(destFile));
        await fs.copy(srcPath, destFile);
        count++;

        if (options.verbose) {
          console.log(chalk.gray(`  + ${file}`));
        }
      }
    }
  }

  return count;
}

/**
 * Apply exclusion patterns to a directory
 */
async function applyExclusions(
  dirPath: string,
  patterns: string[]
): Promise<void> {
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: dirPath,
      nodir: true,
    });

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }
  }
}

/**
 * Generate package.json for app or npm package
 */
async function generatePackageJson(
  dirPath: string,
  pkg: PackageConfig,
  type: "app" | "npm"
): Promise<void> {
  const packageJson: any = {
    name: type === "app" ? `${pkg.name.replace("@oneie/", "")}-app` : pkg.name,
    version: pkg.version,
    description: pkg.description,
    type: "module",
  };

  if (type === "app") {
    packageJson.scripts = {
      dev: "astro dev",
      build: "astro build",
      preview: "astro preview",
      deploy: "wrangler pages deploy dist",
    };
    packageJson.dependencies = pkg.dependencies || {};
  } else {
    // npm package
    packageJson.main = "./web/src/index.ts";
    packageJson.exports = {
      ".": "./web/src/index.ts",
      "./components/*": "./web/src/components/*",
      "./pages/*": "./web/src/pages/*",
    };
    packageJson.peerDependencies = pkg.dependencies || {};
  }

  await fs.writeJson(path.join(dirPath, "package.json"), packageJson, {
    spaces: 2,
  });
}

/**
 * Generate README.md
 */
async function generateReadme(
  dirPath: string,
  pkg: PackageConfig,
  packageName: string
): Promise<void> {
  const envRequired = pkg.env?.required?.map((e) => `- \`${e}\``).join("\n") || "None";
  const envOptional = pkg.env?.optional?.map((e) => `- \`${e}\``).join("\n") || "None";

  const readme = `# ${pkg.description}

\`${pkg.name}\` - Part of the ONE Platform

## Installation

\`\`\`bash
npx oneie@latest init my-app
npx oneie install ${packageName}
\`\`\`

## Environment Variables

**Required:**
${envRequired}

**Optional:**
${envOptional}

## Development

\`\`\`bash
cd my-app
bun install
bun run dev
\`\`\`

Visit http://localhost:4321

## Build

\`\`\`bash
bun run build
\`\`\`

## Deploy

\`\`\`bash
bun run deploy
\`\`\`

## Documentation

See the [ONE Platform Docs](https://one.ie) for more information.

## License

See LICENSE.md
`;

  await fs.writeFile(path.join(dirPath, "README.md"), readme, "utf-8");
}
