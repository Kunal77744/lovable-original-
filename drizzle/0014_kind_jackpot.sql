CREATE TABLE "css_practice_attempt" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_slug" text NOT NULL,
	"verdict" text NOT NULL,
	"passed_checks" integer NOT NULL,
	"total_checks" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "css_practice_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"challenge_slug" text NOT NULL,
	"css" text NOT NULL,
	"best_verdict" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "css_practice_attempt" ADD CONSTRAINT "css_practice_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "css_practice_progress" ADD CONSTRAINT "css_practice_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "css_practice_attempt_user_challenge_idx" ON "css_practice_attempt" USING btree ("user_id","challenge_slug");--> statement-breakpoint
CREATE INDEX "css_practice_attempt_user_id_idx" ON "css_practice_attempt" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "css_practice_progress_user_challenge_unique" ON "css_practice_progress" USING btree ("user_id","challenge_slug");--> statement-breakpoint
CREATE INDEX "css_practice_progress_user_id_idx" ON "css_practice_progress" USING btree ("user_id");