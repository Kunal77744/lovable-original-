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
  "early_access_signup",
  "lesson",
  "lesson_progress",
  "rate_limit",
  "session",
  "user",
  "verification",
];

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

    if (
      migrationResult.count !== expectedMigrationCount ||
      missingTables.length > 0
    ) {
      console.error(
        "Database verification failed after migration. Deployment must remain paused.",
      );
      return 1;
    }

    console.log(
      `Database release ready: ${expectedMigrationCount} migrations recorded and ${requiredTables.length} required tables verified.`,
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
