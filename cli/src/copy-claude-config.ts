import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function copyClaudeConfig() {
  // Package root is one level up from dist/
  const packageRoot = path.join(__dirname, "..");
  const sourceDir = path.join(packageRoot, ".claude");
  const targetDir = path.join(process.cwd(), ".claude");

  // Create target directory
  await fs.mkdir(targetDir, { recursive: true });

  // Copy hooks/
  const hooksSource = path.join(sourceDir, "hooks");
  const hooksTarget = path.join(targetDir, "hooks");
  if (await fs.stat(hooksSource).catch(() => null)) {
    await fs.cp(hooksSource, hooksTarget, { recursive: true });
  }

  // Copy commands/
  const commandsSource = path.join(sourceDir, "commands");
  const commandsTarget = path.join(targetDir, "commands");
  if (await fs.stat(commandsSource).catch(() => null)) {
    await fs.cp(commandsSource, commandsTarget, { recursive: true });
  }

  // Copy settings if exists
  const settingsPath = path.join(sourceDir, "settings.json");
  if (await fs.stat(settingsPath).catch(() => null)) {
    await fs.copyFile(settingsPath, path.join(targetDir, "settings.json"));
  }

  console.log("✓ Copied Claude Code configuration");
}
