CREATE TABLE "integration_secret" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"ciphertext" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"last4" varchar(4),
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "integration_secret_key_uq" ON "integration_secret" USING btree ("key") WHERE "integration_secret"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "integration_secret_deleted_at_idx" ON "integration_secret" USING btree ("deleted_at");