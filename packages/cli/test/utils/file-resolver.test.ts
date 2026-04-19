import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  fileExists,
  resolveFile,
  resolveFiles,
  loadFile,
  FileResolverCache,
  validateSecurePath,
} from "../../src/utils/file-resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_BASE_PATH = path.join(__dirname, "../.test-tmp");

describe("File Resolver", () => {
  beforeEach(async () => {
    // Create test directory structure
    await fs.mkdir(TEST_BASE_PATH, { recursive: true });

    // Create installation folder structure
    await fs.mkdir(path.join(TEST_BASE_PATH, "acme"), { recursive: true });
    await fs.mkdir(path.join(TEST_BASE_PATH, "acme/groups"), { recursive: true });
    await fs.mkdir(path.join(TEST_BASE_PATH, "acme/groups/engineering"), { recursive: true });
    await fs.mkdir(path.join(TEST_BASE_PATH, "acme/things"), { recursive: true });

    // Create global /one/ folder structure
    await fs.mkdir(path.join(TEST_BASE_PATH, "one"), { recursive: true });
    await fs.mkdir(path.join(TEST_BASE_PATH, "one/things"), { recursive: true });

    // Create test files
    await fs.writeFile(
      path.join(TEST_BASE_PATH, "acme/groups/engineering/sprint-guide.md"),
      "# Engineering Sprint Guide"
    );

    await fs.writeFile(
      path.join(TEST_BASE_PATH, "acme/things/vision.md"),
      "# Acme Vision"
    );

    await fs.writeFile(
      path.join(TEST_BASE_PATH, "one/things/vision.md"),
      "# Global Vision"
    );

    await fs.writeFile(
      path.join(TEST_BASE_PATH, "one/things/architecture.md"),
      "# Global Architecture"
    );
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_BASE_PATH, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("fileExists", () => {
    it("should return true for existing file", async () => {
      const exists = await fileExists(
        path.join(TEST_BASE_PATH, "acme/things/vision.md")
      );
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const exists = await fileExists(
        path.join(TEST_BASE_PATH, "acme/things/non-existent.md")
      );
      expect(exists).toBe(false);
    });
  });

  describe("validateSecurePath", () => {
    it("should accept paths within installation", async () => {
      const filePath = path.join(TEST_BASE_PATH, "acme/things/vision.md");
      await validateSecurePath(filePath, TEST_BASE_PATH);
      // Should not throw
    });

    it("should accept paths within /one/", async () => {
      const filePath = path.join(TEST_BASE_PATH, "one/things/vision.md");
      await validateSecurePath(filePath, TEST_BASE_PATH);
      // Should not throw
    });

    it("should reject path traversal", async () => {
      const filePath = path.join(TEST_BASE_PATH, "../../../etc/passwd");

      try {
        await validateSecurePath(filePath, TEST_BASE_PATH);
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("outside allowed directories");
      }
    });
  });

  describe("resolveFile", () => {
    it("should resolve group-specific file", async () => {
      const resolved = await resolveFile("sprint-guide.md", {
        installationName: "acme",
        groupId: "engineering",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("group");
      expect(resolved.path).toContain("acme/groups/engineering/sprint-guide.md");
    });

    it("should resolve installation-specific file", async () => {
      const resolved = await resolveFile("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("installation");
      expect(resolved.path).toContain("acme/things/vision.md");
    });

    it("should fall back to global file", async () => {
      const resolved = await resolveFile("things/architecture.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("global");
      expect(resolved.path).toContain("one/things/architecture.md");
    });

    it("should return non-existent file info", async () => {
      const resolved = await resolveFile("things/non-existent.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(false);
      expect(resolved.source).toBe("installation");
      expect(resolved.path).toContain("acme/things/non-existent.md");
    });

    it("should prioritize installation over global", async () => {
      const resolved = await resolveFile("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("installation");
      expect(resolved.path).toContain("acme/things/vision.md");
    });

    it("should not fall back to global if disabled", async () => {
      const resolved = await resolveFile("things/architecture.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
        fallbackToGlobal: false,
      });

      expect(resolved.exists).toBe(false);
      expect(resolved.source).toBe("installation");
    });

    it("should reject path traversal", async () => {
      try {
        await resolveFile("../../../etc/passwd", {
          installationName: "acme",
          basePath: TEST_BASE_PATH,
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("Path traversal not allowed");
      }
    });
  });

  describe("resolveFiles", () => {
    it("should resolve multiple files", async () => {
      const resolved = await resolveFiles(
        ["things/vision.md", "things/architecture.md"],
        {
          installationName: "acme",
          basePath: TEST_BASE_PATH,
        }
      );

      expect(resolved.length).toBe(2);
      expect(resolved[0].exists).toBe(true);
      expect(resolved[0].source).toBe("installation");
      expect(resolved[1].exists).toBe(true);
      expect(resolved[1].source).toBe("global");
    });
  });

  describe("loadFile", () => {
    it("should load existing file content", async () => {
      const content = await loadFile("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(content).toBe("# Acme Vision");
    });

    it("should return null for non-existent file", async () => {
      const content = await loadFile("things/non-existent.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(content).toBe(null);
    });

    it("should load global file when no installation override", async () => {
      const content = await loadFile("things/architecture.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(content).toBe("# Global Architecture");
    });
  });

  describe("FileResolverCache", () => {
    it("should cache resolved files", async () => {
      const cache = new FileResolverCache();

      const resolved1 = await cache.resolve("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      const resolved2 = await cache.resolve("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved1).toEqual(resolved2);
      expect(resolved1.exists).toBe(true);
    });

    it("should differentiate by cache key", async () => {
      const cache = new FileResolverCache();

      const resolved1 = await cache.resolve("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      const resolved2 = await cache.resolve("things/vision.md", {
        installationName: "acme",
        groupId: "engineering",
        basePath: TEST_BASE_PATH,
      });

      // Different cache keys (with/without groupId)
      expect(resolved1.source).toBe("installation");
      expect(resolved2.source).toBe("installation"); // Still installation since no group-specific file
    });

    it("should clear cache", async () => {
      const cache = new FileResolverCache();

      await cache.resolve("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      cache.clear();

      // After clear, cache should be empty
      const resolved = await cache.resolve("things/vision.md", {
        installationName: "acme",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
    });
  });

  describe("Hierarchical resolution", () => {
    it("should resolve group file before installation", async () => {
      const resolved = await resolveFile("sprint-guide.md", {
        installationName: "acme",
        groupId: "engineering",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("group");
    });

    it("should fall back to installation when group file missing", async () => {
      const resolved = await resolveFile("things/vision.md", {
        installationName: "acme",
        groupId: "engineering",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("installation");
    });

    it("should fall back to global when both group and installation missing", async () => {
      const resolved = await resolveFile("things/architecture.md", {
        installationName: "acme",
        groupId: "engineering",
        basePath: TEST_BASE_PATH,
      });

      expect(resolved.exists).toBe(true);
      expect(resolved.source).toBe("global");
    });
  });
});
