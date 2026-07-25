CREATE TABLE "early_access_signup" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"course_slug" text DEFAULT 'first-course' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "early_access_signup_email_course_unique" ON "early_access_signup" USING btree ("email","course_slug");