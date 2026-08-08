CREATE TABLE IF NOT EXISTS "coding_problem_test_case_set" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'coding_problem_test_case_set_user_id_user_id_fk'
			AND conrelid = 'coding_problem_test_case_set'::regclass
	) THEN
		ALTER TABLE "coding_problem_test_case_set"
			ADD CONSTRAINT "coding_problem_test_case_set_user_id_user_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coding_problem_test_case_set_user_problem_unique" ON "coding_problem_test_case_set" USING btree ("user_id","problem_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coding_problem_test_case_set_user_id_idx" ON "coding_problem_test_case_set" USING btree ("user_id");
