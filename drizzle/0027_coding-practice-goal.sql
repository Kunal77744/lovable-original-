CREATE TABLE IF NOT EXISTS "coding_practice_goal" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"target_active_days" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coding_practice_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coding_practice_goal_user_unique" ON "coding_practice_goal" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coding_practice_goal_user_id_idx" ON "coding_practice_goal" USING btree ("user_id");
