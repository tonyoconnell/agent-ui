import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";
import chalk from "chalk";
import prompts from "prompts";

const execAsync = promisify(exec);

/**
 * Check if Claude Code CLI is installed
 */
async function isClaudeInstalled(): Promise<boolean> {
  try {
    await execAsync("which claude");
    return true;
  } catch {
    return false;
  }
}

/**
 * Launch Claude Code in the current directory (with user prompt)
 * @param installationPath Path to installation folder
 * @param websiteCloned Whether web template was cloned
 */
export async function launchClaude(
  installationPath: string,
  websiteCloned: boolean = false
): Promise<void> {
  console.log(chalk.cyan("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(chalk.green("✅ Setup Complete!"));
  console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

  console.log(`Created: ${installationPath}`);

  // Check if Claude Code is installed
  const claudeInstalled = await isClaudeInstalled();

  if (claudeInstalled) {
    // Ask if user wants to launch Claude Code
    const { launchNow } = await prompts({
      type: "confirm",
      name: "launchNow",
      message: "Would you like to launch Claude Code now?",
      initial: true,
    });

    if (launchNow) {
      console.log(chalk.cyan("\n🤖 Launching Claude Code...\n"));
      console.log(chalk.gray("When Claude starts, type:"));
      console.log(chalk.bold.cyan("  /one\n"));
      console.log(chalk.gray("This will analyze your website and build your platform.\n"));

      // Launch Claude Code
      const claude = spawn("claude", [], {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      claude.on("error", (err) => {
        console.error(
          chalk.red("\n✗ Failed to launch Claude Code:"),
          err.message
        );
      });
    } else {
      showManualInstructions(websiteCloned);
    }
  } else {
    showManualInstructions(websiteCloned, true);
  }
}

/**
 * Show manual instructions for starting the project
 */
function showManualInstructions(websiteCloned: boolean, showClaudeInstall: boolean = false) {
  if (showClaudeInstall) {
    console.log(chalk.yellow("\n⚠ Claude Code not found."));
    console.log(chalk.cyan("\nInstall Claude Code:"));
    console.log(chalk.gray("  https://www.claude.com/product/claude-code\n"));
  }

  console.log(chalk.cyan("Or use your preferred editor:"));
  console.log(chalk.gray("  Open this project in Cursor or VS Code\n"));

  if (websiteCloned) {
    console.log(chalk.bold("🚀 Start your website:\n"));
    console.log(chalk.cyan("  cd web"));
    console.log(chalk.cyan("  bun install"));
    console.log(chalk.cyan("  bun dev\n"));
    console.log(chalk.gray("  → http://localhost:4321\n"));
  }

  if (showClaudeInstall) {
    console.log(chalk.gray("After installing Claude Code, run:"));
    console.log(chalk.bold.cyan("  claude\n"));
  }

  console.log(chalk.gray("In Claude/Cursor/VS Code, type:"));
  console.log(chalk.bold.cyan("  /one\n"));
}
