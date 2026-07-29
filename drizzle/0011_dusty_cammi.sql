CREATE TABLE "guided_project_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_slug" text NOT NULL,
	"confidence" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guided_project_feedback" ADD CONSTRAINT "guided_project_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guided_project_feedback_user_slug_unique" ON "guided_project_feedback" USING btree ("user_id","project_slug");--> statement-breakpoint
CREATE INDEX "guided_project_feedback_user_id_idx" ON "guided_project_feedback" USING btree ("user_id");