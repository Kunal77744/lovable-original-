CREATE TABLE IF NOT EXISTS "css_practice_note" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_slug" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "css_practice_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "css_practice_note_user_challenge_unique" ON "css_practice_note" USING btree ("user_id","challenge_slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "css_practice_note_user_id_idx" ON "css_practice_note" USING btree ("user_id");
