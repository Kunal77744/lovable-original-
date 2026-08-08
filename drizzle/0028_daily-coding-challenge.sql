CREATE TABLE IF NOT EXISTS "daily_coding_challenge_completion" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_date" text NOT NULL,
	"problem_slug" text NOT NULL,
	"submission_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_coding_challenge_completion_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "daily_coding_challenge_completion_submission_id_coding_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."coding_submission"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_coding_challenge_user_date_unique" ON "daily_coding_challenge_completion" USING btree ("user_id","challenge_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_coding_challenge_user_id_idx" ON "daily_coding_challenge_completion" USING btree ("user_id");
