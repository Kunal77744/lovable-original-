CREATE TABLE IF NOT EXISTS "timed_coding_challenge_result" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_set_id" text NOT NULL,
	"solved_count" integer NOT NULL,
	"elapsed_seconds" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "timed_coding_challenge_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "timed_coding_challenge_result_solved_count_check" CHECK ("solved_count" between 0 and 3),
	CONSTRAINT "timed_coding_challenge_result_elapsed_seconds_check" CHECK ("elapsed_seconds" between 0 and 1800)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "timed_coding_challenge_result_user_completed_idx" ON "timed_coding_challenge_result" USING btree ("user_id","completed_at");
