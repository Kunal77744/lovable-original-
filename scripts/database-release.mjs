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
  "coding_problem_progress",
  "coding_lab_exercise_progress",
  "coding_submission",
  "early_access_signup",
  "guided_project",
  "guided_project_feedback",
  "interview_drill_progress",
  "lesson",
  "lesson_artifact",
  "lesson_note",
  "lesson_progress",
  "learner_setting",
  "playground_file",
  "rate_limit",
  "session",
  "user",
  "verification",
];
const requiredColumns = {
  coding_lab_exercise_progress: [
    "id",
    "user_id",
    "lab_slug",
    "exercise_id",
    "completed_at",
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
    const presentTables = new Set(tableResults.map(({ tablename }) => tablename));
    const missingTables = requiredTables.filter(
      (tableName) => !presentTables.has(tableName),
    );
    const columnResults = await sql`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name in (
          'coding_lab_exercise_progress',
          'guided_project',
          'guided_project_feedback'
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
