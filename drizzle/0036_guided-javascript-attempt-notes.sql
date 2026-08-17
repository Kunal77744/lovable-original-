CREATE TABLE IF NOT EXISTS "coding_lab_exercise_note" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lab_slug" text NOT NULL,
	"exercise_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coding_lab_exercise_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coding_lab_note_user_lab_exercise_unique" ON "coding_lab_exercise_note" USING btree ("user_id","lab_slug","exercise_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coding_lab_note_user_id_idx" ON "coding_lab_exercise_note" USING btree ("user_id");
