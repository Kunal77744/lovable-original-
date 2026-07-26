CREATE TABLE "lesson_artifact" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"html" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_artifact" ADD CONSTRAINT "lesson_artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_artifact" ADD CONSTRAINT "lesson_artifact_lesson_id_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_artifact_user_lesson_unique" ON "lesson_artifact" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_artifact_user_id_idx" ON "lesson_artifact" USING btree ("user_id");