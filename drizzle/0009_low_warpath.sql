CREATE TABLE IF NOT EXISTS "playground_file" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'playground_file_user_id_user_id_fk'
			AND conrelid = 'public.playground_file'::regclass
	) THEN
		ALTER TABLE "playground_file"
			ADD CONSTRAINT "playground_file_user_id_user_id_fk"
			FOREIGN KEY ("user_id")
			REFERENCES "public"."user"("id")
			ON DELETE cascade
			ON UPDATE no action;
	END IF;
END
$$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "playground_file_user_unique" ON "playground_file" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "playground_file_user_id_idx" ON "playground_file" USING btree ("user_id");
