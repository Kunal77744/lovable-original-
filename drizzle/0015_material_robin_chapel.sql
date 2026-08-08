CREATE TABLE "css_practice_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"path_slug" text NOT NULL,
	"usefulness" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "css_practice_feedback" ADD CONSTRAINT "css_practice_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "css_practice_feedback_user_path_unique" ON "css_practice_feedback" USING btree ("user_id","path_slug");--> statement-breakpoint
CREATE INDEX "css_practice_feedback_user_id_idx" ON "css_practice_feedback" USING btree ("user_id");