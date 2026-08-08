CREATE TABLE "practice_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"usefulness" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_feedback" ADD CONSTRAINT "practice_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_feedback_user_unique" ON "practice_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "practice_feedback_user_id_idx" ON "practice_feedback" USING btree ("user_id");