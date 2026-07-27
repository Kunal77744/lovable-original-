CREATE TABLE IF NOT EXISTS "interview_drill_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"drill_slug" text NOT NULL,
	"answers" text DEFAULT '{}' NOT NULL,
	"ratings" text DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'in-progress' NOT NULL,
	"current_question" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "interview_drill_progress"
		ADD CONSTRAINT "interview_drill_progress_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
		ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "interview_drill_user_slug_unique" ON "interview_drill_progress" USING btree ("user_id","drill_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interview_drill_user_id_idx" ON "interview_drill_progress" USING btree ("user_id");
