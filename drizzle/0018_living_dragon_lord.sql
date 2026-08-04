CREATE TABLE "coding_problem_note" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coding_problem_note" ADD CONSTRAINT "coding_problem_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coding_problem_note_user_problem_unique" ON "coding_problem_note" USING btree ("user_id","problem_slug");--> statement-breakpoint
CREATE INDEX "coding_problem_note_user_id_idx" ON "coding_problem_note" USING btree ("user_id");