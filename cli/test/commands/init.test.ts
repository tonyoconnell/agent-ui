import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  validateInstallationName,
  createInstallationFolder,
  mirrorOntologyStructure,
  createReadme,
  updateEnvFile,
  updateGitignore,
  rollbackInstallation,
} from "../../src/utils/installation-setup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_BASE_PATH = path.join(__dirname, "../.test-tmp");

describe("Installation Setup", () => {
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(TEST_BASE_PATH, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_BASE_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("validateInstallationName", () => {
    it("should accept valid lowercase names", () => {
      expect(validateInstallationName("acme")).toBe(true);
      expect(validateInstallationName("my-company")).toBe(true);
      expect(validateInstallationName("company123")).toBe(true);
      expect(validateInstallationName("my-company-123")).toBe(true);
    });

    it("should reject invalid names", () => {
      expect(validateInstallationName("ACME")).toBe(false); // Uppercase
      expect(validateInstallationName("my company")).toBe(false); // Space
      expect(validateInstallationName("my_company")).toBe(false); // Underscore
      expect(validateInstallationName("my.company")).toBe(false); // Dot
      expect(validateInstallationName("-my-company")).toBe(false); // Leading hyphen
      expect(validateInstallationName("my-company-")).toBe(false); // Trailing hyphen
      expect(validateInstallationName("")).toBe(false); // Empty
    });
  });

  describe("createInstallationFolder", () => {
    it("should create installation folder", async () => {
      const installationPath = await createInstallationFolder(
        "test-installation",
        TEST_BASE_PATH
      );

      expect(installationPath).toBe(
        path.join(TEST_BASE_PATH, "test-installation")
      );

      const stat = await fs.stat(installationPath);
      expect(stat.isDirectory()).toBe(true);
    });

    it("should reject invalid installation name", async () => {
      expect(async () => {
        await createInstallationFolder("INVALID", TEST_BASE_PATH);
      }).toThrow();
    });

    it("should reject existing folder", async () => {
      await createInstallationFolder("test-installation", TEST_BASE_PATH);

      expect(async () => {
        await createInstallationFolder("test-installation", TEST_BASE_PATH);
      }).toThrow(/already exists/);
    });
  });

  describe("mirrorOntologyStructure", () => {
    it("should create all 6 ontology subdirectories", async () => {
      const installationPath = await createInstallationFolder(
        "test-installation",
        TEST_BASE_PATH
      );

      await mirrorOntologyStructure(installationPath);

      const expectedDirs = [
        "groups",
        "people",
        "things",
        "connections",
        "events",
        "knowledge",
      ];

      for (const dir of expectedDirs) {
        const dirPath = path.join(installationPath, dir);
        const stat = await fs.stat(dirPath);
        expect(stat.isDirectory()).toBe(true);
      }
    });
  });

  describe("createReadme", () => {
    it("should create README with correct placeholders", async () => {
      const installationPath = await createInstallationFolder(
        "test-installation",
        TEST_BASE_PATH
      );

      await createReadme(
        installationPath,
        "Test Organization",
        "test-installation"
      );

      const readmePath = path.join(installationPath, "README.md");
      const readmeContent = await fs.readFile(readmePath, "utf-8");

      expect(readmeContent).toContain("# Test Organization Installation");
      expect(readmeContent).toContain("`test-installation`");
      expect(readmeContent).toContain("INSTALLATION_NAME=test-installation");
    });
  });

  describe("updateEnvFile", () => {
    it("should create .env.local with INSTALLATION_NAME", async () => {
      await updateEnvFile("test-installation", TEST_BASE_PATH);

      const envPath = path.join(TEST_BASE_PATH, ".env.local");
      const envContent = await fs.readFile(envPath, "utf-8");

      expect(envContent).toContain("INSTALLATION_NAME=test-installation");
    });

    it("should update existing INSTALLATION_NAME", async () => {
      const envPath = path.join(TEST_BASE_PATH, ".env.local");

      // Create initial .env.local
      await fs.writeFile(
        envPath,
        "INSTALLATION_NAME=old-installation\nOTHER_VAR=value\n",
        "utf-8"
      );

      await updateEnvFile("new-installation", TEST_BASE_PATH);

      const envContent = await fs.readFile(envPath, "utf-8");

      expect(envContent).toContain("INSTALLATION_NAME=new-installation");
      expect(envContent).toContain("OTHER_VAR=value");
      expect(envContent).not.toContain("old-installation");
    });

    it("should append to existing .env.local without INSTALLATION_NAME", async () => {
      const envPath = path.join(TEST_BASE_PATH, ".env.local");

      // Create initial .env.local
      await fs.writeFile(envPath, "OTHER_VAR=value\n", "utf-8");

      await updateEnvFile("test-installation", TEST_BASE_PATH);

      const envContent = await fs.readFile(envPath, "utf-8");

      expect(envContent).toContain("INSTALLATION_NAME=test-installation");
      expect(envContent).toContain("OTHER_VAR=value");
    });
  });

  describe("updateGitignore", () => {
    it("should add installation folder to .gitignore", async () => {
      await updateGitignore("test-installation", true, TEST_BASE_PATH);

      const gitignorePath = path.join(TEST_BASE_PATH, ".gitignore");
      const gitignoreContent = await fs.readFile(gitignorePath, "utf-8");

      expect(gitignoreContent).toContain("/test-installation/");
    });

    it("should not add if exclude is false", async () => {
      await updateGitignore("test-installation", false, TEST_BASE_PATH);

      const gitignorePath = path.join(TEST_BASE_PATH, ".gitignore");

      try {
        await fs.access(gitignorePath);
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe("ENOENT");
      }
    });

    it("should not duplicate existing entry", async () => {
      const gitignorePath = path.join(TEST_BASE_PATH, ".gitignore");

      // Create initial .gitignore
      await fs.writeFile(gitignorePath, "/test-installation/\n", "utf-8");

      await updateGitignore("test-installation", true, TEST_BASE_PATH);

      const gitignoreContent = await fs.readFile(gitignorePath, "utf-8");

      // Should only appear once
      const matches = gitignoreContent.match(/\/test-installation\//g);
      expect(matches?.length).toBe(1);
    });
  });

  describe("rollbackInstallation", () => {
    it("should remove installation folder", async () => {
      const installationPath = await createInstallationFolder(
        "test-installation",
        TEST_BASE_PATH
      );

      await mirrorOntologyStructure(installationPath);

      // Verify folder exists
      await fs.access(installationPath);

      // Rollback
      await rollbackInstallation(installationPath);

      // Verify folder is removed
      try {
        await fs.access(installationPath);
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.code).toBe("ENOENT");
      }
    });

    it("should handle non-existent folder gracefully", async () => {
      const nonExistentPath = path.join(TEST_BASE_PATH, "non-existent");

      // Should not throw
      await rollbackInstallation(nonExistentPath);
    });
  });

  describe("Full workflow", () => {
    it("should create complete installation folder", async () => {
      const installationName = "acme";
      const organizationName = "Acme Corp";

      // Create folder
      const installationPath = await createInstallationFolder(
        installationName,
        TEST_BASE_PATH
      );

      // Mirror ontology
      await mirrorOntologyStructure(installationPath);

      // Create README
      await createReadme(installationPath, organizationName, installationName);

      // Update .env.local
      await updateEnvFile(installationName, TEST_BASE_PATH);

      // Update .gitignore
      await updateGitignore(installationName, true, TEST_BASE_PATH);

      // Verify everything exists
      const expectedDirs = [
        "groups",
        "people",
        "things",
        "connections",
        "events",
        "knowledge",
      ];

      for (const dir of expectedDirs) {
        const dirPath = path.join(installationPath, dir);
        const stat = await fs.stat(dirPath);
        expect(stat.isDirectory()).toBe(true);
      }

      // Verify README
      const readmePath = path.join(installationPath, "README.md");
      await fs.access(readmePath);

      // Verify .env.local
      const envPath = path.join(TEST_BASE_PATH, ".env.local");
      const envContent = await fs.readFile(envPath, "utf-8");
      expect(envContent).toContain(`INSTALLATION_NAME=${installationName}`);

      // Verify .gitignore
      const gitignorePath = path.join(TEST_BASE_PATH, ".gitignore");
      const gitignoreContent = await fs.readFile(gitignorePath, "utf-8");
      expect(gitignoreContent).toContain(`/${installationName}/`);
    });

    it("should rollback on failure", async () => {
      const installationName = "test-rollback";

      let installationPath: string | null = null;

      try {
        installationPath = await createInstallationFolder(
          installationName,
          TEST_BASE_PATH
        );

        await mirrorOntologyStructure(installationPath);

        // Simulate failure
        throw new Error("Simulated failure");
      } catch (error: any) {
        if (installationPath) {
          await rollbackInstallation(installationPath);
        }

        expect(error.message).toBe("Simulated failure");
      }

      // Verify folder is removed
      if (installationPath) {
        try {
          await fs.access(installationPath);
          expect(false).toBe(true); // Should not reach here
        } catch (error: any) {
          expect(error.code).toBe("ENOENT");
        }
      }
    });
  });
});
