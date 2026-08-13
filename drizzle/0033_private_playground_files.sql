DROP INDEX IF EXISTS "playground_file_user_unique";
--> statement-breakpoint
ALTER TABLE "playground_file" ADD COLUMN "name" text DEFAULT 'playground.js' NOT NULL;
--> statement-breakpoint
ALTER TABLE "playground_file" ADD COLUMN "slot" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "playground_file" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "playground_file_user_name_unique" ON "playground_file" USING btree ("user_id", "name");
--> statement-breakpoint
CREATE UNIQUE INDEX "playground_file_user_slot_unique" ON "playground_file" USING btree ("user_id", "slot");
--> statement-breakpoint
CREATE UNIQUE INDEX "playground_file_user_active_unique" ON "playground_file" USING btree ("user_id") WHERE "is_active" = true;
--> statement-breakpoint
ALTER TABLE "playground_file" ADD CONSTRAINT "playground_file_slot_bound" CHECK ("playground_file"."slot" between 1 and 6);
