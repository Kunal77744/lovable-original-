ALTER TABLE "guided_project" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "guided_project" ADD COLUMN IF NOT EXISTS "completion_id" text;
