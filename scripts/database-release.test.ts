import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("database release contract", () => {
  it("orders and verifies the three combined private-result migrations", async () => {
    const [
      journalSource,
      timedMigration,
      projectMigration,
      quizMigration,
      releaseScript,
    ] = await Promise.all([
      readFile(path.join(root, "drizzle/meta/_journal.json"), "utf8"),
      readFile(
        path.join(root, "drizzle/0029_timed-coding-challenge-results.sql"),
        "utf8",
      ),
      readFile(path.join(root, "drizzle/0030_wooden_scarecrow.sql"), "utf8"),
      readFile(path.join(root, "drizzle/0031_lesson-quiz-attempt.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);
    const journal = JSON.parse(journalSource) as {
      entries: Array<{ idx: number; tag: string }>;
    };

    expect(journal.entries.slice(-3)).toEqual([
      expect.objectContaining({
        idx: 29,
        tag: "0029_timed-coding-challenge-results",
      }),
      expect.objectContaining({ idx: 30, tag: "0030_wooden_scarecrow" }),
      expect.objectContaining({ idx: 31, tag: "0031_lesson-quiz-attempt" }),
    ]);
    expect(timedMigration).toContain(
      'CREATE TABLE IF NOT EXISTS "timed_coding_challenge_result"',
    );
    expect(timedMigration).toContain(
      'CREATE INDEX IF NOT EXISTS "timed_coding_challenge_result_user_completed_idx"',
    );
    expect(projectMigration).toContain('CREATE TABLE "project_review_attempt"');
    expect(quizMigration).toContain(
      'CREATE TABLE IF NOT EXISTS "lesson_quiz_attempt"',
    );
    expect(releaseScript).toMatch(
      /timed_coding_challenge_result:\s*\[[\s\S]*?"challenge_set_id",[\s\S]*?"elapsed_seconds"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'timed_coding_challenge_result'[\s\S]*?\)/,
    );
    expect(releaseScript).toMatch(
      /project_review_attempt:\s*\[[\s\S]*?"passed_checks",[\s\S]*?"total_checks"/,
    );
    expect(releaseScript).toMatch(
      /lesson_quiz_attempt:\s*\[[\s\S]*?"correct_count",[\s\S]*?"total_count"/,
    );
  });

  it("adds and verifies private daily coding challenge completion", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0028_daily-coding-challenge.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "daily_coding_challenge_completion"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "daily_coding_challenge_user_date_unique"',
    );
    expect(releaseScript).toMatch(
      /daily_coding_challenge_completion:\s*\[[\s\S]*?"challenge_date",[\s\S]*?"submission_id"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'daily_coding_challenge_completion'[\s\S]*?\)/,
    );
  });

  it("adds and verifies the private weekly coding practice target", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0027_coding-practice-goal.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "coding_practice_goal"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "coding_practice_goal_user_unique"',
    );
    expect(releaseScript).toMatch(
      /coding_practice_goal:\s*\[[\s\S]*?"target_active_days",[\s\S]*?"updated_at"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'coding_practice_goal'[\s\S]*?\)/,
    );
  });

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

  it("adds and verifies private Web Foundations review results", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0025_web-foundations-review.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "web_foundations_review_result"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "web_foundations_review_result_user_unique"',
    );
    expect(releaseScript).toMatch(
      /web_foundations_review_result:\s*\[[\s\S]*?"correct_count",[\s\S]*?"next_due_at"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'web_foundations_review_result'[\s\S]*?\)/,
    );
  });

  it("adds and verifies the saved lesson reading checkpoint", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0026_lesson-reading-progress.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "furthest_section" integer DEFAULT 0 NOT NULL;',
    );
    expect(releaseScript).toMatch(
      /lesson_progress:\s*\[[\s\S]*?"quiz_score",\s*"furthest_section"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'lesson_progress'[\s\S]*?\)/,
    );
  });
});
