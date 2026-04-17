#!/usr/bin/env node
import prompts from "prompts";
import chalk from "chalk";
import ora from "ora";
import { syncOntologyFiles } from "./sync-ontology.js";
import { syncAgentDefinitions } from "./sync-agents.js";
import { copyClaudeConfig } from "./copy-claude-config.js";
import { createUserProfile } from "./create-user-profile.js";
import { createOrgProfile } from "./create-org-profile.js";
import { cloneWeb } from "./clone-web.js";
import { cloneThirdPartyDocs } from "./clone-docs.js";
import { displayBanner } from "./banner.js";
import { runInit } from "./commands/init.js";
import { runAgent } from "./commands/agent.js";
import {
  isAgentEnvironment,
  showAgentModeMessage,
} from "./lib/agent-detection.js";

// Substrate verb commands — map directly to src/commands/*.ts
const SUBSTRATE_COMMANDS = [
  "signal", "ask", "mark", "warn", "fade",
  "highways", "know", "recall", "reveal", "forget",
  "frontier", "select", "sync", "claw", "launch",
] as const;

type SubstrateCommand = (typeof SUBSTRATE_COMMANDS)[number];

async function main() {
  // Check for command line arguments
  const args = process.argv.slice(2);

  // Admin subcommands (monorepo-only)
  if (args[0] === "admin") {
    const { runAdmin } = await import("./admin/index.js");
    await runAdmin(args.slice(1));
    return;
  }

  // Substrate verb commands
  if (SUBSTRATE_COMMANDS.includes(args[0] as SubstrateCommand)) {
    const { run } = await import(`./commands/${args[0]}.js`);
    await run(args.slice(1));
    return;
  }

  // Handle passthrough commands (dev, build, deploy)
  if (args[0] === "dev" || args[0] === "build" || args[0] === "deploy") {
    if (args[0] === "deploy") {
      const { run } = await import("./commands/deploy.js");
      await run(args.slice(1));
      return;
    }
    const { execSync } = await import("child_process");
    const command = args[0];
    const commandArgs = args.slice(1).join(" ");
    try {
      execSync(`cd web && bun run ${command} ${commandArgs}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch {
      process.exit(1);
    }
    return;
  }

  // Handle commands
  if (args[0] === "agent") {
    const options = {
      quiet: args.includes("--quiet"),
      verbose: args.includes("--verbose"),
      dryRun: args.includes("--dry-run"),
      skipWeb: args.includes("--skip-web"),
    };
    await runAgent(options);
    return;
  }

  if (args[0] === "init") {
    await runInit();
    return;
  }

  if (args[0] === "setup") {
    await runFullSetup();
    return;
  }

  if (args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    return;
  }

  // Check if --interactive flag is present (explicit override)
  const forceInteractive = args.includes("--interactive");

  // Detect agent environment (unless explicitly --interactive)
  if (!forceInteractive && isAgentEnvironment()) {
    showAgentModeMessage();
    process.exit(1);
  }

  // Default: run onboarding (init)
  await runInit();
}

function showHelp(): void {
  console.log(`
oneie — ONE substrate CLI

SUBSTRATE VERBS
  signal <receiver> [data]    Emit a signal (L1)
  ask <receiver> [data]       Signal + wait for outcome (L1, blocking)
  mark <edge> [strength]      Strengthen a path (L2)
  warn <edge> [strength]      Raise resistance on a path (L2)
  fade [rate]                 Asymmetric path decay (L3)
  highways [--limit N]        Top weighted paths (L2/L6)
  know                        Promote highways → hypotheses (L6)
  recall [subject]            Query hypotheses (L6)
  reveal <uid>                Full memory card (L6)
  forget <uid>                GDPR erasure (all loops)
  frontier <uid>              Unexplored tag clusters (L7)
  select [type]               Probabilistic next unit (L1)
  sync                        Fire full tick — all L1-L7 loops

AGENTS
  agent [--dry-run]           Parse + sync agent markdown → TypeDB
  claw <agent-id>             Generate NanoClaw config for agent
  launch <agent-id>           Launch agent on substrate

PROJECT
  init                        Scaffold a new ONE project
  dev                         Start dev server (bun run dev)
  build                       Production build (bun run build)
  deploy                      Full 8-step deploy pipeline

ADMIN (monorepo only)
  admin build [package]       Build package(s) to dist/
  admin release [patch|minor|major]  Bump version + publish
  admin sync                  Sync monorepo files → cli/
  admin validate              Validate manifest paths exist

ENV
  ONEIE_API_URL    Substrate API base URL (default: https://api.one.ie)
  ONEIE_API_KEY    Bearer token for authenticated endpoints
`);
}

async function runFullSetup() {
  // Display welcome banner
  displayBanner();

  console.log(chalk.cyan("\n✨ Welcome to ONE Platform!\n"));
  console.log(
    "Let's set up your environment with the 6-dimension ontology.\n"
  );

  // Step 1: User profile
  console.log(chalk.bold("🧑 Step 1: Tell us about yourself\n"));

  const userAnswers = await prompts([
    {
      type: "text",
      name: "name",
      message: "What's your full name?",
      validate: (value) =>
        value.length > 0 ? true : "Name cannot be empty",
    },
    {
      type: "text",
      name: "email",
      message: "What's your email address?",
      validate: (value) =>
        value.includes("@") ? true : "Please enter a valid email",
    },
  ]);

  // Generate username from name
  const username = userAnswers.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Step 2: Organization profile
  console.log(chalk.bold("\n🏢 Step 2: Organization Setup\n"));

  const orgAnswers = await prompts([
    {
      type: "text",
      name: "name",
      message: "What's your organization name?",
      validate: (value) =>
        value.length > 0 ? true : "Organization name cannot be empty",
    },
    {
      type: "text",
      name: "website",
      message: "What's your organization website?",
      validate: (value) =>
        value.includes(".") ? true : "Please enter a valid website URL",
    },
  ]);

  // Generate slug and domain from org name and website
  const slug = orgAnswers.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Extract domain from website URL
  const domain = orgAnswers.website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");

  // Step 3: Sync ontology
  console.log(chalk.bold("\n📚 Step 3: Syncing ONE Ontology\n"));

  let spinner = ora("Copying ontology files from /one/*...").start();
  const ontologyResult = await syncOntologyFiles();
  spinner.succeed(`Copied ${ontologyResult.filesCopied} ontology files`);

  spinner = ora("Syncing agent definitions...").start();
  const agentsResult = await syncAgentDefinitions();
  spinner.succeed(
    `Synced ${agentsResult.agentsSynced} agent definitions to .claude/agents/`
  );

  spinner = ora("Copying Claude Code configuration...").start();
  await copyClaudeConfig();
  spinner.succeed("Synced .claude/hooks/ and .claude/commands/");

  // Step 4: Create profiles
  console.log(chalk.bold("\nCreating your profile...\n"));

  spinner = ora("Creating user profile...").start();
  const userProfilePath = await createUserProfile({
    name: userAnswers.name,
    email: userAnswers.email,
    username: username,
    website: orgAnswers.website,
  });
  spinner.succeed(`Created ${userProfilePath}`);

  spinner = ora("Creating organization profile...").start();
  const orgProfilePath = await createOrgProfile({
    name: orgAnswers.name,
    slug: slug,
    domain: domain,
    ownerName: userAnswers.name,
    ownerUsername: username,
  });
  spinner.succeed(`Created ${orgProfilePath}`);

  spinner = ora("Linking user to organization...").start();
  spinner.succeed(
    `Linked ${username} → owns → ${orgAnswers.name}`
  );
  spinner.succeed(
    `Linked ${username} → member_of → ${orgAnswers.name} (role: org_owner)`
  );

  // Step 5: Website setup (optional)
  console.log(chalk.bold("\n🌐 Step 4: Website Setup\n"));

  const { buildWebsite } = await prompts({
    type: "confirm",
    name: "buildWebsite",
    message: "Would you like to build a website?",
    initial: true,
  });

  if (buildWebsite) {
    spinner = ora("Cloning web repository...").start();
    const webResult = await cloneWeb({
      name: orgAnswers.name,
      slug: slug,
      domain: domain,
    });

    if (webResult.alreadyExists) {
      spinner.warn("Web directory already exists");
    } else {
      spinner.succeed("Cloned and configured web");
      console.log(
        chalk.gray("\nYour website is ready at: http://localhost:4321")
      );
      console.log(chalk.gray("Run: cd web && bun run dev\n"));
    }
  }

  // Step 6: Third-party docs (optional)
  console.log(chalk.bold("\n📖 Step 5: Third-Party Documentation\n"));

  const { cloneDocs } = await prompts({
    type: "confirm",
    name: "cloneDocs",
    message: "Would you like to clone third-party docs for AI context?",
    initial: true,
  });

  if (cloneDocs) {
    spinner = ora("Cloning documentation repositories...").start();
    const docsResults = await cloneThirdPartyDocs();
    const clonedCount = docsResults.filter((r) => r.cloned).length;
    spinner.succeed(`Cloned ${clonedCount} documentation repositories`);
  }

  // Step 7: Complete
  console.log(chalk.bold.green("\n✅ Setup Complete!\n"));

  console.log(chalk.bold("Your ONE environment is ready:\n"));

  console.log(chalk.cyan("📁 Project Structure:"));
  console.log("   /one/                 → 6-dimension ontology (100+ files)");
  if (buildWebsite) {
    console.log("   /web/                 → Astro + React website");
  }
  if (cloneDocs) {
    console.log("   /docs/                → Third-party documentation");
  }
  console.log("   /.claude/             → AI agent integration");
  console.log("   /cli/                 → CLI configuration\n");

  console.log(chalk.cyan("🧑 Your Profile:"));
  console.log(`   Name: ${userAnswers.name}`);
  console.log(`   Email: ${userAnswers.email}`);
  console.log(`   Username: ${username}`);
  console.log(`   Role: org_owner`);
  console.log(`   File: ${userProfilePath}\n`);

  console.log(chalk.cyan("🏢 Your Organization:"));
  console.log(`   Name: ${orgAnswers.name}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   File: ${orgProfilePath}\n`);

  console.log(chalk.bold("🚀 Next Steps:\n"));
  if (buildWebsite) {
    console.log("1. Start building:");
    console.log(chalk.gray("   cd web && bun run dev\n"));
  }
  console.log("2. Use AI agents:");
  console.log(chalk.gray("   claude\n"));
  console.log("3. Read the docs:");
  console.log(chalk.gray("   cat one/learning/ontology.md\n"));
  console.log("4. Create your first feature:");
  console.log(chalk.gray("   /one\n"));

  console.log(chalk.bold.green("Happy building! 🎉\n"));
}

main().catch((error) => {
  console.error(chalk.red("\n✗ Error:"), error.message);
  process.exit(1);
});
