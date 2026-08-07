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

  it("adds and verifies private JavaScript readiness results", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0023_calm_arachne.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "javascript_readiness_result"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "javascript_readiness_result_user_unique"',
    );
    expect(releaseScript).toMatch(
      /javascript_readiness_result:\s*\[[\s\S]*?"correct_count",[\s\S]*?"recommended_lab_slug"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'javascript_readiness_result'[\s\S]*?\)/,
    );
  });

  it("adds and verifies private JavaScript mixed-review results", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0024_concerned_scourge.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "javascript_mixed_review_result"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "javascript_mixed_review_result_user_unique"',
    );
    expect(releaseScript).toMatch(
      /javascript_mixed_review_result:\s*\[[\s\S]*?"correct_count",[\s\S]*?"next_due_at"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'javascript_mixed_review_result'[\s\S]*?\)/,
    );
  });
});
