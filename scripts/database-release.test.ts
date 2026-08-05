import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("database release contract", () => {
  it("adds and verifies the immutable coding submission source column", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0020_sleepy_kylun.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'ALTER TABLE "coding_submission" ADD COLUMN IF NOT EXISTS "code" text;',
    );
    expect(releaseScript).toMatch(
      /coding_submission:\s*\[[\s\S]*?"problem_slug",\s*"code",\s*"verdict"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'coding_submission'[\s\S]*?\)/,
    );
  });
});
