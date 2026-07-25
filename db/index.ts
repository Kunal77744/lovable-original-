import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required for student accounts. Configure PostgreSQL before starting the app.",
    );
  }

  if (!database) {
    database = drizzle(neon(databaseUrl), { schema });
  }

  return database;
}
