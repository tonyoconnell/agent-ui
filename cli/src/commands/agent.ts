/**
 * Agent Command - Non-interactive ONE Platform setup
 *
 * Designed for AI agents (Claude Code, Cursor, etc.) and CI/CD environments.
 * Zero interaction required - auto-detects context and completes setup in 5-10 seconds.
 */

import chalk from "chalk";
import ora from "ora";
import * as fs from "fs-extra";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { detectContext } from "../lib/detect.js";
import { getAgentType } from "../lib/agent-detection.js";
import {
  createInstallationFolder,
  mirrorOntologyStructure,
  createOnboardingFile,
  updateOrgEnvFile,
  updateGitignore,
  rollbackInstallation,
} from "../utils/installation-setup.js";
import { slugify } from "../utils/validation.js";

const execAsync = promisify(exec);

export interface AgentOptions {
  quiet?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
  skipWeb?: boolean;
  basePath?: string;
}

/**
 * Runs the agent command (non-interactive setup)
 */
export async function runAgent(options: AgentOptions = {}): Promise<void> {
  const basePath = options.basePath || process.cwd();

  // Show agent type if verbose
  if (options.verbose) {
    const agentType = getAgentType();
    console.log(chalk.cyan(`🤖 Detected: ${agentType}\n`));
  }

  if (!options.quiet) {
    console.log(chalk.cyan("🤖 ONE Agent Setup"));
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
  }

  // Step 1: Detect context
  let spinner: any;
  if (!options.quiet) {
    spinner = ora("Detecting context...").start();
  }

  const context = await detectContext(basePath);

  if (!options.quiet && spinner) {
    spinner.succeed("Detected context:");
    console.log(`  Name: ${context.user.name} (from ${getDetectionSource("user")})`);
    console.log(`  Email: ${context.user.email}`);
    console.log(`  Organization: ${context.organization} (from ${getDetectionSource("org")})`);
    if (context.website) {
      console.log(`  Website: ${context.website}`);
    }
    console.log("");
  }

  if (options.dryRun) {
    console.log(chalk.yellow("🔍 Dry run mode - no changes will be made\n"));
    console.log(chalk.bold("Would perform these actions:\n"));
    console.log(`1. Copy /one directory (ontology, docs, specs)`);
    console.log(`2. Copy /.claude directory (agents, commands, hooks)`);
    console.log(`3. Create installation folder: /${slugify(context.organization)}`);
    console.log(`4. Update .env.local with organization settings`);
    console.log(`5. Update .gitignore to exclude installation folder`);
    if (!options.skipWeb) {
      console.log(`6. Clone web template (optional)`);
    }
    console.log(chalk.green("\n✓ Dry run complete (no changes made)\n"));
    return;
  }

  let installationPath: string | null = null;

  try {
    // Step 2: Sync platform files
    if (!options.quiet) {
      spinner = ora("Copying /one directory (ontology, docs, specs)...").start();
    }

    const oneSourcePath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../../one"
    );
    const oneTargetPath = path.join(basePath, "one");

    if (await fs.pathExists(oneSourcePath)) {
      await fs.copy(oneSourcePath, oneTargetPath, { overwrite: true });
      if (!options.quiet && spinner) {
        spinner.succeed("Copied /one directory");
      }
    } else {
      if (!options.quiet && spinner) {
        spinner.warn("/one directory not found in CLI package");
      }
    }

    // Sync .claude directory
    if (!options.quiet) {
      spinner = ora("Copying .claude directory (agents, commands, hooks)...").start();
    }

    const claudeSourcePath = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../../.claude"
    );
    const claudeTargetPath = path.join(basePath, ".claude");

    if (await fs.pathExists(claudeSourcePath)) {
      await fs.copy(claudeSourcePath, claudeTargetPath, { overwrite: true });
      if (!options.quiet && spinner) {
        spinner.succeed("Copied .claude directory");
      }
    } else {
      if (!options.quiet && spinner) {
        spinner.warn(".claude directory not found in CLI package");
      }
    }

    // Copy root documentation files
    if (!options.quiet) {
      spinner = ora("Copying documentation files...").start();
    }

    const rootFiles = [
      "AGENTS.md",
      "CLAUDE.md",
      "README.md",
      "SECURITY.md",
      "LICENSE.md",
      ".mcp.json",
    ];
    const cliRoot = path.join(
      path.dirname(new URL(import.meta.url).pathname),
      "../.."
    );

    let copiedCount = 0;
    for (const file of rootFiles) {
      const sourcePath = path.join(cliRoot, file);
      const targetPath = path.join(basePath, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath, { overwrite: true });
        copiedCount++;
      }
    }

    if (!options.quiet && spinner) {
      spinner.succeed(`Copied ${copiedCount} documentation files`);
    }

    // Step 3: Create installation folder
    const orgSlug = slugify(context.organization);

    if (!options.quiet) {
      spinner = ora(`Creating installation folder: /${orgSlug}`).start();
    }

    installationPath = await createInstallationFolder(orgSlug, basePath);

    if (!options.quiet && spinner) {
      spinner.succeed(`Created installation folder: /${orgSlug}`);
    }

    // Mirror ontology structure
    if (!options.quiet) {
      spinner = ora("Creating folder structure...").start();
    }

    await mirrorOntologyStructure(installationPath);

    if (!options.quiet && spinner) {
      spinner.succeed("Created ontology subdirectories");
    }

    // Create .onboarding.json
    if (!options.quiet) {
      spinner = ora("Creating .onboarding.json...").start();
    }

    await createOnboardingFile(installationPath, {
      userName: context.user.name,
      userEmail: context.user.email,
      organizationName: context.organization,
      organizationSlug: orgSlug,
      websiteUrl: context.website || "https://example.com",
    });

    if (!options.quiet && spinner) {
      spinner.succeed("Created .onboarding.json handoff file");
    }

    // Update .env.local
    if (!options.quiet) {
      spinner = ora("Updating .env.local...").start();
    }

    await updateOrgEnvFile(
      {
        orgName: context.organization,
        orgWebsite: context.website || "https://example.com",
        orgFolder: orgSlug,
        backendEnabled: false,
      },
      basePath
    );

    if (!options.quiet && spinner) {
      spinner.succeed(`Updated .env.local`);
    }

    // Update .gitignore
    if (!options.quiet) {
      spinner = ora("Updating .gitignore...").start();
    }

    await updateGitignore(orgSlug, true, basePath);

    if (!options.quiet && spinner) {
      spinner.succeed(`Updated .gitignore to exclude /${orgSlug}/`);
    }

    // Clone web (optional)
    let websiteCloned = false;
    if (!options.skipWeb) {
      const webPath = path.join(basePath, "web");

      if (!(await fs.pathExists(webPath))) {
        if (!options.quiet) {
          spinner = ora("Cloning web template...").start();
        }

        try {
          await execAsync(
            `git clone --depth 1 https://github.com/one-ie/web.git "${webPath}"`
          );
          await fs.remove(path.join(webPath, ".git"));

          const envContent = `# Organization Configuration
ORG_NAME=${context.organization}
ORG_WEBSITE=${context.website || "https://example.com"}
ORG_FOLDER=${orgSlug}
ONE_BACKEND=off

# Convex Backend (placeholder - update with your deployment)
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment
`;
          await fs.writeFile(path.join(webPath, ".env.local"), envContent, "utf-8");

          websiteCloned = true;
          if (!options.quiet && spinner) {
            spinner.succeed("Web template cloned and configured!");
          }
        } catch {
          if (!options.quiet && spinner) {
            spinner.warn("Failed to clone web template (optional)");
          }
        }
      }
    }

    // Success!
    if (options.quiet) {
      console.log("✓ ONE Platform initialized\n");
      console.log("→ claude");
      console.log("→ /one");
    } else {
      console.log(chalk.green("\n✅ Your ONE Platform is ready!\n"));

      console.log(chalk.bold("📁 Platform Files:\n"));
      console.log(`   /one/                 → Ontology, docs, specs`);
      console.log(`   /.claude/             → Agents, commands, hooks`);
      console.log(`   /${orgSlug}/          → Your organization folder`);
      if (websiteCloned) {
        console.log(`   /web/                 → Astro + React website`);
      }
      console.log(`   CLAUDE.md, AGENTS.md  → AI instructions\n`);

      console.log(chalk.bold("🏢 Organization:\n"));
      console.log(`   Name: ${context.organization}`);
      console.log(`   Folder: /${orgSlug}/\n`);

      console.log(chalk.bold("🚀 Next steps:\n"));
      if (websiteCloned) {
        console.log(chalk.cyan("  Start your website:"));
        console.log(chalk.gray("    cd web && bun install && bun run dev\n"));
      }
      console.log(chalk.cyan("  Use Claude Code:"));
      console.log(chalk.gray("    /one\n"));
    }
  } catch (error: any) {
    console.error(chalk.red("\n✗ Error:"), error.message);

    // Rollback on failure
    if (installationPath) {
      const spinner = ora("Rolling back installation...").start();
      await rollbackInstallation(installationPath);
      spinner.succeed("Rolled back changes");
    }

    throw error;
  }
}

/**
 * Helper to describe where context was detected from
 */
function getDetectionSource(type: "user" | "org"): string {
  if (type === "user") {
    if (process.argv.includes("--name")) return "CLI flag";
    if (process.argv.includes("--claude-user")) return "Claude context";
    if (process.env.CLAUDE_USER_NAME) return "Claude env";
    return "git config";
  } else {
    if (process.argv.includes("--org")) return "CLI flag";
    if (process.argv.includes("--claude-org")) return "Claude context";
    if (process.env.CLAUDE_ORG_NAME) return "Claude env";
    return "git remote";
  }
}
