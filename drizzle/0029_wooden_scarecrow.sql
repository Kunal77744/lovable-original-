CREATE TABLE "project_review_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_slug" text NOT NULL,
	"status" text NOT NULL,
	"passed_checks" integer NOT NULL,
	"total_checks" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_review_attempt" ADD CONSTRAINT "project_review_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_review_attempt_user_id_idx" ON "project_review_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_review_attempt_user_created_at_idx" ON "project_review_attempt" USING btree ("user_id","created_at");
