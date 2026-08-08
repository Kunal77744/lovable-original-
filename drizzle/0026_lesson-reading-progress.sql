ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "furthest_section" integer DEFAULT 0 NOT NULL;
