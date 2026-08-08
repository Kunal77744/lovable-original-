CREATE TABLE IF NOT EXISTS "web_foundations_review_result" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"correct_count" integer NOT NULL,
	"total_count" integer NOT NULL,
	"next_due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "web_foundations_review_result" ADD CONSTRAINT "web_foundations_review_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "web_foundations_review_result_user_unique" ON "web_foundations_review_result" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "web_foundations_review_result_user_id_idx" ON "web_foundations_review_result" USING btree ("user_id");
