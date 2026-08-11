CREATE TABLE IF NOT EXISTS "lesson_quiz_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"score" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"total_count" integer NOT NULL,
	"passed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_quiz_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "lesson_quiz_attempt_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_quiz_attempt_user_lesson_idx" ON "lesson_quiz_attempt" USING btree ("user_id","lesson_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lesson_quiz_attempt_user_id_idx" ON "lesson_quiz_attempt" USING btree ("user_id");
