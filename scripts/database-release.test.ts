import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("database release contract", () => {
  it("orders and verifies the combined private-result, draft, and playground migrations", async () => {
    const [
      journalSource,
      timedMigration,
      projectMigration,
      quizMigration,
      guidedDraftMigration,
      playgroundFilesMigration,
      releaseScript,
    ] = await Promise.all([
      readFile(path.join(root, "drizzle/meta/_journal.json"), "utf8"),
      readFile(
        path.join(root, "drizzle/0029_timed-coding-challenge-results.sql"),
        "utf8",
      ),
      readFile(path.join(root, "drizzle/0030_wooden_scarecrow.sql"), "utf8"),
      readFile(path.join(root, "drizzle/0031_lesson-quiz-attempt.sql"), "utf8"),
      readFile(
        path.join(root, "drizzle/0032_private_guided_javascript_drafts.sql"),
        "utf8",
      ),
      readFile(
        path.join(root, "drizzle/0033_private_playground_files.sql"),
        "utf8",
      ),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);
    const journal = JSON.parse(journalSource) as {
      entries: Array<{ idx: number; tag: string }>;
    };

    expect(journal.entries.slice(-8)).toEqual([
      expect.objectContaining({
        idx: 29,
        tag: "0029_timed-coding-challenge-results",
      }),
      expect.objectContaining({ idx: 30, tag: "0030_wooden_scarecrow" }),
      expect.objectContaining({ idx: 31, tag: "0031_lesson-quiz-attempt" }),
      expect.objectContaining({
        idx: 32,
        tag: "0032_private_guided_javascript_drafts",
      }),
      expect.objectContaining({
        idx: 33,
        tag: "0033_private_playground_files",
      }),
      expect.objectContaining({
        idx: 34,
        tag: "0034_css-practice-notes",
      }),
      expect.objectContaining({
        idx: 35,
        tag: "0035_css-spaced-review",
      }),
      expect.objectContaining({
        idx: 36,
        tag: "0036_guided-javascript-attempt-notes",
      }),
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
    expect(guidedDraftMigration).toContain(
      'CREATE TABLE "coding_lab_exercise_draft"',
    );
    expect(playgroundFilesMigration).toContain(
      'ADD COLUMN "name" text DEFAULT \'playground.js\' NOT NULL',
    );
    expect(playgroundFilesMigration).toContain(
      'CREATE UNIQUE INDEX "playground_file_user_active_unique"',
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
    expect(releaseScript).toMatch(
      /coding_lab_exercise_draft:\s*\[[\s\S]*?"lab_slug",[\s\S]*?"exercise_id",[\s\S]*?"source"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'coding_lab_exercise_draft'[\s\S]*?\)/,
    );
    expect(releaseScript).toMatch(
      /playground_file:\s*\[[\s\S]*?"name",[\s\S]*?"slot",[\s\S]*?"is_active"/,
    );
  });

  it("keeps every combined-release learning record in the private export", async () => {
    const exportSource = await readFile(
      path.join(root, "db/learning-data-export.ts"),
      "utf8",
    );

    expect(exportSource).toMatch(
      /quizAttempts:\s*withoutAccountScope\(courseQuizAttempts\)/,
    );
    expect(exportSource).toMatch(
      /reviewAttempts:\s*withoutAccountScope\(projectReviewAttempts\)/,
    );
    expect(exportSource).toMatch(
      /timedChallengeResults:\s*withoutAccountScope\(timedChallengeResults\)/,
    );
    expect(exportSource).toMatch(
      /guidedExerciseDrafts:\s*withoutAccountScope\(guidedExerciseDrafts\)/,
    );
    expect(exportSource).toMatch(
      /guidedExerciseAttemptNotes:\s*withoutAccountScope\(\s*guidedExerciseAttemptNotes,?\s*\)/,
    );
  });

  it("adds and verifies private guided JavaScript attempt notes", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(
        path.join(root, "drizzle/0036_guided-javascript-attempt-notes.sql"),
        "utf8",
      ),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "coding_lab_exercise_note"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "coding_lab_note_user_lab_exercise_unique"',
    );
    expect(releaseScript).toMatch(
      /coding_lab_exercise_note:\s*\[[\s\S]*?"lab_slug",[\s\S]*?"exercise_id",[\s\S]*?"content"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'coding_lab_exercise_note'[\s\S]*?\)/,
    );
  });

  it("adds and verifies private CSS attempt notes", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0034_css-practice-notes.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "css_practice_note"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "css_practice_note_user_challenge_unique"',
    );
    expect(releaseScript).toMatch(
      /css_practice_note:\s*\[[\s\S]*?"challenge_slug",[\s\S]*?"content"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'css_practice_note'[\s\S]*?\)/,
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

  it("adds and verifies private CSS spaced-review results", async () => {
    const [migration, releaseScript] = await Promise.all([
      readFile(path.join(root, "drizzle/0035_css-spaced-review.sql"), "utf8"),
      readFile(path.join(root, "scripts/database-release.mjs"), "utf8"),
    ]);

    expect(migration).toContain(
      'CREATE TABLE IF NOT EXISTS "css_spaced_review_result"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS "css_spaced_review_result_user_unique"',
    );
    expect(releaseScript).toMatch(
      /css_spaced_review_result:\s*\[[\s\S]*?"correct_count",[\s\S]*?"next_due_at"/,
    );
    expect(releaseScript).toMatch(
      /table_name in \([\s\S]*?'css_spaced_review_result'[\s\S]*?\)/,
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
