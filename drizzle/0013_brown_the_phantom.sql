CREATE TABLE "coding_lab_exercise_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lab_slug" text NOT NULL,
	"exercise_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coding_lab_exercise_progress" ADD CONSTRAINT "coding_lab_exercise_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coding_lab_progress_user_lab_exercise_unique" ON "coding_lab_exercise_progress" USING btree ("user_id","lab_slug","exercise_id");--> statement-breakpoint
CREATE INDEX "coding_lab_progress_user_id_idx" ON "coding_lab_exercise_progress" USING btree ("user_id");