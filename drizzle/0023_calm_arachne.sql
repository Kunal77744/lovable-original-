CREATE TABLE IF NOT EXISTS "javascript_readiness_result" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"correct_count" integer NOT NULL,
	"total_count" integer NOT NULL,
	"recommended_lab_slug" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "javascript_readiness_result" ADD CONSTRAINT "javascript_readiness_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "javascript_readiness_result_user_unique" ON "javascript_readiness_result" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "javascript_readiness_result_user_id_idx" ON "javascript_readiness_result" USING btree ("user_id");
