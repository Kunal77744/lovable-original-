import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const journalPath = new URL("../drizzle/meta/_journal.json", import.meta.url);
const requiredTables = [
  "account",
  "course",
  "course_assignment",
  "course_certificate",
  "course_feedback",
  "coding_problem_bookmark",
  "coding_practice_goal",
  "daily_coding_challenge_completion",
  "timed_coding_challenge_result",
  "coding_lab_exercise_progress",
  "coding_problem_progress",
  "coding_problem_test_case_set",
  "coding_submission",
  "css_practice_attempt",
  "css_practice_feedback",
  "css_practice_progress",
  "early_access_signup",
  "guided_project",
  "guided_project_feedback",
  "interview_drill_progress",
  "javascript_mixed_review_result",
  "javascript_readiness_result",
  "web_foundations_review_result",
  "lesson",
  "lesson_artifact",
  "lesson_note",
  "lesson_progress",
  "learner_setting",
  "playground_file",
  "practice_feedback",
  "rate_limit",
  "session",
  "user",
  "verification",
];
const requiredColumns = {
  timed_coding_challenge_result: [
    "id",
    "user_id",
    "challenge_set_id",
    "solved_count",
    "elapsed_seconds",
    "completed_at",
  ],
  daily_coding_challenge_completion: [
    "id",
    "user_id",
    "challenge_date",
    "problem_slug",
    "submission_id",
    "completed_at",
  ],
  coding_practice_goal: [
    "id",
    "user_id",
    "target_active_days",
    "created_at",
    "updated_at",
  ],
  coding_lab_exercise_progress: [
    "id",
    "user_id",
    "lab_slug",
    "exercise_id",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  coding_submission: [
    "id",
    "user_id",
    "problem_slug",
    "code",
    "verdict",
    "passed_tests",
    "total_tests",
    "created_at",
  ],
  coding_problem_test_case_set: [
    "id",
    "user_id",
    "problem_slug",
    "inputs",
    "expected_outputs",
    "created_at",
    "updated_at",
  ],
  css_practice_attempt: [
    "id",
    "user_id",
    "challenge_slug",
    "verdict",
    "passed_checks",
    "total_checks",
    "created_at",
  ],
  css_practice_progress: [
    "id",
    "user_id",
    "challenge_slug",
    "css",
    "best_verdict",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  css_practice_feedback: [
    "id",
    "user_id",
    "path_slug",
    "usefulness",
    "comment",
    "created_at",
    "updated_at",
  ],
  guided_project: [
    "id",
    "user_id",
    "project_slug",
    "html",
    "reviewed_html",
    "status",
    "review_checks",
    "submitted_at",
    "completed_at",
    "completion_id",
    "created_at",
    "updated_at",
  ],
  guided_project_feedback: [
    "id",
    "user_id",
    "project_slug",
    "confidence",
    "comment",
    "created_at",
    "updated_at",
  ],
  lesson_progress: [
    "id",
    "user_id",
    "lesson_id",
    "status",
    "quiz_score",
    "furthest_section",
    "started_at",
    "completed_at",
    "updated_at",
  ],
  javascript_readiness_result: [
    "id",
    "user_id",
    "correct_count",
    "total_count",
    "recommended_lab_slug",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  javascript_mixed_review_result: [
    "id",
    "user_id",
    "correct_count",
    "total_count",
    "next_due_at",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  web_foundations_review_result: [
    "id",
    "user_id",
    "correct_count",
    "total_count",
    "next_due_at",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  playground_file: [
    "id",
    "user_id",
    "code",
    "quick_checks",
    "created_at",
    "updated_at",
  ],
  practice_feedback: [
    "id",
    "user_id",
    "problem_slug",
    "usefulness",
    "comment",
    "created_at",
    "updated_at",
  ],
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. No database connection was attempted.",
    );
  }

  let parsed;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(
      "DATABASE_URL must be a valid PostgreSQL connection URL. No database connection was attempted.",
    );
  }

  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !parsed.hostname ||
    parsed.pathname === "/"
  ) {
    throw new Error(
      "DATABASE_URL must identify a PostgreSQL host and database. No database connection was attempted.",
    );
  }

  return databaseUrl;
}

async function getExpectedMigrationCount() {
  const journal = JSON.parse(await readFile(journalPath, "utf8"));

  if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
    throw new Error("The committed migration journal is empty or unreadable.");
  }

  return journal.entries.length;
}

async function run() {
  let databaseUrl;

  try {
    databaseUrl = getDatabaseUrl();
  } catch (error) {
    console.error(`Database preflight failed: ${error.message}`);
    return 1;
  }

  const sql = postgres(databaseUrl, {
    connect_timeout: 5,
    idle_timeout: 5,
    max: 1,
    onnotice: () => {},
    prepare: false,
  });

  try {
    await sql`select 1`;
  } catch {
    console.error(
      "Database preflight failed: the configured PostgreSQL database is unreachable or rejected the connection. No migrations were attempted.",
    );
    await sql.end({ timeout: 1 }).catch(() => {});
    return 1;
  }

  try {
    const expectedMigrationCount = await getExpectedMigrationCount();
    const database = drizzle(sql);

    await migrate(database, { migrationsFolder });

    const [migrationResult] = await sql`
      select count(*)::integer as count
      from drizzle.__drizzle_migrations
    `;
    const tableResults = await sql`
      select tablename
      from pg_catalog.pg_tables
      where schemaname = 'public'
    `;
    const presentTables = new Set(
      tableResults.map(({ tablename }) => tablename),
    );
    const missingTables = requiredTables.filter(
      (tableName) => !presentTables.has(tableName),
    );
    const columnResults = await sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name in (
          'coding_lab_exercise_progress',
          'coding_practice_goal',
          'daily_coding_challenge_completion',
          'timed_coding_challenge_result',
          'css_practice_attempt',
          'css_practice_feedback',
          'css_practice_progress',
          'coding_problem_test_case_set',
          'coding_submission',
          'guided_project',
          'guided_project_feedback',
          'lesson_progress',
          'javascript_mixed_review_result',
          'javascript_readiness_result',
          'web_foundations_review_result',
          'practice_feedback',
          'playground_file'
        )
    `;
    const presentColumns = new Set(
      columnResults.map(
        ({ table_name: tableName, column_name: columnName }) =>
          `${tableName}.${columnName}`,
      ),
    );
    const missingColumns = Object.entries(requiredColumns).flatMap(
      ([tableName, columnNames]) =>
        columnNames
          .filter(
            (columnName) => !presentColumns.has(`${tableName}.${columnName}`),
          )
          .map((columnName) => `${tableName}.${columnName}`),
    );

    if (
      migrationResult.count < expectedMigrationCount ||
      missingTables.length > 0 ||
      missingColumns.length > 0
    ) {
      console.error(
        "Database verification failed after migration. Deployment must remain paused.",
      );
      return 1;
    }

    console.log(
      `Database release ready: ${expectedMigrationCount} required migrations verified (${migrationResult.count} recorded total), ${requiredTables.length} required tables verified, and ${presentColumns.size} project columns inspected.`,
    );
    return 0;
  } catch {
    console.error(
      "Database migration failed. Deployment must remain paused while the database owner reviews the database logs.",
    );
    return 1;
  } finally {
    await sql.end({ timeout: 5 }).catch(() => {});
  }
}

process.exitCode = await run();
