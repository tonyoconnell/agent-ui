import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs-extra";
import * as path from "path";
import {
  validateInstallationName,
  createInstallationFolder,
  mirrorOntologyStructure,
  createReadme,
  createOnboardingFile,
  updateEnvFile,
  updateOrgEnvFile,
  updateGitignore,
  rollbackInstallation,
} from "../utils/installation-setup.js";
import {
  isValidEmail,
  isValidUrl,
  slugify,
  isReservedName,
  isReservedFolder,
  isReservedWebsite,
} from "../utils/validation.js";
import { launchClaude } from "../utils/launch-claude.js";
import { displayBanner } from "../banner.js";

const execAsync = promisify(exec);

/**
 * Init command options
 */
export interface InitOptions {
  name?: string;
  email?: string;
  organizationName?: string;
  installationName?: string;
  websiteUrl?: string;
  basePath?: string;
  skipClaudeLaunch?: boolean;
}

/**
 * Runs the init command interactively (new onboarding flow)
 */
export async function runInit(options: InitOptions = {}): Promise<void> {
  // Display banner
  displayBanner();

  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.cyan("Welcome! Let's build your platform."));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  // Step 1: Collect user information
  let userName = options.name;
  if (!userName) {
    const { name } = await prompts({
      type: "text",
      name: "name",
      message: "What's your name?",
      validate: (value) =>
        value.length > 0 ? true : "Name cannot be empty",
    });

    if (!name) {
      console.log(chalk.yellow("\nCancelled."));
      return;
    }

    userName = name;
  }

  // Step 2: Collect organization name
  let organizationName = options.organizationName;
  if (!organizationName) {
    const { name } = await prompts({
      type: "text",
      name: "name",
      message: "Organization name?",
      validate: (value) => {
        if (value.length === 0) return "Organization name cannot be empty";
        if (isReservedName(value)) {
          return 'Organization name "one" is reserved for ONE Platform';
        }
        return true;
      },
    });

    if (!name) {
      console.log(chalk.yellow("\nCancelled."));
      return;
    }

    organizationName = name;
  }

  // Step 3: Collect website URL (optional)
  let websiteUrl = options.websiteUrl;
  if (websiteUrl === undefined) {
    const { url } = await prompts({
      type: "text",
      name: "url",
      message: "What's your current website?",
      validate: (value) => {
        if (!value) return "Website URL is required";
        if (!isValidUrl(value)) {
          return "Please enter a valid URL (e.g., https://example.com)";
        }
        if (isReservedWebsite(value)) {
          return "Website one.ie is reserved for ONE Platform";
        }
        return true;
      },
    });

    if (!url) {
      console.log(chalk.yellow("\nCancelled."));
      return;
    }

    websiteUrl = url;
  }

  // Step 4: Website enhancement (optional)
  let websiteCloned = false;
  const { enhanceWebsite } = await prompts({
    type: "confirm",
    name: "enhanceWebsite",
    message: "Do you want to create a web app?",
    initial: true,
  });

  if (enhanceWebsite) {
    const currentPath = options.basePath || process.cwd();
    const webPath = path.join(currentPath, "web");

    // Check if web directory already exists
    if (await fs.pathExists(webPath)) {
      console.log(chalk.yellow("\n⚠ Web directory already exists, skipping clone.\n"));
    } else {
      const spinner = ora("Cloning web template from github.com/one-ie/web...").start();

      try {
        // Clone the web repository
        await execAsync(
          `git clone --depth 1 https://github.com/one-ie/web.git "${webPath}"`
        );

        // Remove .git directory so user can initialize their own repo
        await fs.remove(path.join(webPath, ".git"));

        // Create .env.local in web/ with organization settings
        const envContent = `# Organization Configuration
ORG_NAME=${organizationName}
ORG_WEBSITE=${websiteUrl}
ORG_FOLDER=${slugify(organizationName!)}
ONE_BACKEND=off

# Convex Backend (placeholder - update with your deployment)
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment
`;
        await fs.writeFile(path.join(webPath, ".env.local"), envContent, "utf-8");

        spinner.succeed("Web template cloned and configured!");
        websiteCloned = true;
      } catch (error: any) {
        // Check if web directory was created despite error
        if (await fs.pathExists(webPath)) {
          spinner.succeed("Web template cloned successfully!");
          websiteCloned = true;
        } else {
          spinner.fail("Failed to clone web template");
          console.log(chalk.yellow(`\n⚠ You can clone manually later:\n  git clone https://github.com/one-ie/web.git web\n`));
        }
      }
    }
  }

  // Step 5: Collect email
  let email = options.email;
  if (!email) {
    const { userEmail } = await prompts({
      type: "text",
      name: "userEmail",
      message: "What email should we use?",
      validate: (value) =>
        isValidEmail(value) ? true : "Please enter a valid email address",
    });

    if (!userEmail) {
      console.log(chalk.yellow("\nCancelled."));
      return;
    }

    email = userEmail;
  }

  console.log(chalk.green("\n✅ Information collected!\n"));

  // Generate org slug
  const orgSlug = slugify(organizationName!);
  const installationName = orgSlug;

  // Create installation folder
  const basePath = options.basePath || process.cwd();
  let installationPath: string | null = null;

  try {
    // Step 1: Sync platform files
    console.log(chalk.bold("\n📚 Setting up ONE Platform files...\n"));

    // Sync /one directory
    let spinner = ora("Copying /one directory (ontology, docs, specs)...").start();
    const oneSourcePath = path.join(path.dirname(new URL(import.meta.url).pathname), "../../one");
    const oneTargetPath = path.join(basePath, "one");

    if (await fs.pathExists(oneSourcePath)) {
      await fs.copy(oneSourcePath, oneTargetPath, { overwrite: true });
      spinner.succeed("Copied /one directory");
    } else {
      spinner.warn("/one directory not found in CLI package");
    }

    // Sync .claude directory
    spinner = ora("Copying .claude directory (agents, commands, hooks)...").start();
    const claudeSourcePath = path.join(path.dirname(new URL(import.meta.url).pathname), "../../.claude");
    const claudeTargetPath = path.join(basePath, ".claude");

    if (await fs.pathExists(claudeSourcePath)) {
      await fs.copy(claudeSourcePath, claudeTargetPath, { overwrite: true });
      spinner.succeed("Copied .claude directory");
    } else {
      spinner.warn(".claude directory not found in CLI package");
    }

    // Copy root documentation files
    spinner = ora("Copying documentation files...").start();
    const rootFiles = ["AGENTS.md", "CLAUDE.md", "README.md", "SECURITY.md", "LICENSE.md"];
    const cliRoot = path.join(path.dirname(new URL(import.meta.url).pathname), "../..");

    let copiedCount = 0;
    for (const file of rootFiles) {
      const sourcePath = path.join(cliRoot, file);
      const targetPath = path.join(basePath, file);

      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, targetPath, { overwrite: true });
        copiedCount++;
      }
    }
    spinner.succeed(`Copied ${copiedCount} documentation files`);

    // Step 2: Create installation folder
    spinner = ora(`Creating installation folder: /${installationName}`).start();
    installationPath = await createInstallationFolder(
      installationName,
      basePath
    );
    spinner.succeed(`Created installation folder: /${installationName}`);

    // Mirror ontology structure (minimal for onboarding)
    spinner = ora("Creating folder structure...").start();
    await mirrorOntologyStructure(installationPath);
    spinner.succeed("Created ontology subdirectories");

    // Create .onboarding.json handoff file
    spinner = ora("Creating .onboarding.json...").start();
    await createOnboardingFile(installationPath, {
      userName: userName!,
      userEmail: email!,
      organizationName: organizationName!,
      organizationSlug: orgSlug,
      websiteUrl: websiteUrl!,
    });
    spinner.succeed("Created .onboarding.json handoff file");

    // Update .env.local with org configuration
    spinner = ora("Updating .env.local...").start();
    await updateOrgEnvFile(
      {
        orgName: organizationName!,
        orgWebsite: websiteUrl!,
        orgFolder: installationName,
        backendEnabled: false, // Default to frontend-only mode
      },
      basePath
    );
    spinner.succeed(
      `Updated .env.local:\n      ORG_NAME=${organizationName}\n      ORG_WEBSITE=${websiteUrl}\n      ORG_FOLDER=${installationName}\n      ONE_BACKEND=off`
    );

    // Always exclude from git for onboarding
    spinner = ora("Updating .gitignore...").start();
    await updateGitignore(installationName, true, basePath);
    spinner.succeed(`Updated .gitignore to exclude /${installationName}/`);

    // Launch Claude Code (unless skipped)
    if (!options.skipClaudeLaunch) {
      await launchClaude(`/${installationName}`, websiteCloned);
    } else {
      console.log(chalk.green("\n✅ Setup Complete!\n"));

      console.log(chalk.bold("📁 Platform Files:\n"));
      console.log(`   /one/                 → Ontology, docs, specs`);
      console.log(`   /.claude/             → Agents, commands, hooks`);
      console.log(`   /${installationName}/ → Your organization folder`);
      if (websiteCloned) {
        console.log(`   /web/                 → Astro + React website`);
      }
      console.log(`   CLAUDE.md, AGENTS.md  → AI instructions`);
      console.log(`   README.md, LICENSE.md → Documentation\n`);

      console.log(chalk.bold("🏢 Organization:\n"));
      console.log(`   Name: ${organizationName}`);
      console.log(`   Website: ${websiteUrl}`);
      console.log(`   Folder: /${installationName}/\n`);

      if (websiteCloned) {
        console.log(chalk.bold("🚀 Next steps:\n"));
        console.log(chalk.cyan("  1. Start your website:"));
        console.log(chalk.gray("     cd web"));
        console.log(chalk.gray("     bun install"));
        console.log(chalk.gray("     bun run dev\n"));
        console.log(chalk.cyan("  2. Build features with AI:"));
        console.log(chalk.gray("     Run Claude Code and type /one\n"));
      } else {
        console.log(chalk.bold("🚀 Next steps:\n"));
        console.log(chalk.gray("   Run Claude Code and type /one\n"));
      }
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

