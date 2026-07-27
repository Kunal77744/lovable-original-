CREATE TABLE "coding_problem_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"code" text NOT NULL,
	"best_verdict" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"verdict" text NOT NULL,
	"passed_tests" integer NOT NULL,
	"total_tests" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coding_problem_progress" ADD CONSTRAINT "coding_problem_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_submission" ADD CONSTRAINT "coding_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coding_problem_progress_user_problem_unique" ON "coding_problem_progress" USING btree ("user_id","problem_slug");--> statement-breakpoint
CREATE INDEX "coding_problem_progress_user_id_idx" ON "coding_problem_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coding_submission_user_problem_idx" ON "coding_submission" USING btree ("user_id","problem_slug");--> statement-breakpoint
CREATE INDEX "coding_submission_user_id_idx" ON "coding_submission" USING btree ("user_id");