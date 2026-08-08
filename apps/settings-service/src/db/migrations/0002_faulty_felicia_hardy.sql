CREATE TABLE "integration_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability" varchar(32) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"field_key" varchar(64) NOT NULL,
	"value" text,
	"ciphertext" text,
	"iv" text,
	"auth_tag" text,
	"last4" varchar(4),
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integration_active_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability" varchar(32) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "integration_config_field_uq" ON "integration_config" USING btree ("capability","provider","field_key") WHERE "integration_config"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "integration_config_provider_idx" ON "integration_config" USING btree ("capability","provider");--> statement-breakpoint
CREATE INDEX "integration_config_deleted_at_idx" ON "integration_config" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_active_provider_capability_uq" ON "integration_active_provider" USING btree ("capability");--> statement-breakpoint
-- Backfill (hand-added): re-home the flat `integration_secret` rows onto the
-- capability→provider model. Both live keys map to SECRET fields in the new catalog, so the
-- AES-256-GCM ciphertext/iv/auth_tag/last4 carry over VERBATIM — same encryption key, no
-- re-encryption, no value lost. `integration_secret` is left in place (dropped in a later
-- migration once the new surface is proven).
INSERT INTO "integration_config"
  ("capability","provider","field_key","ciphertext","iv","auth_tag","last4","updated_by_user_id","created_at","updated_at")
SELECT 'email','smtp','password',
       s."ciphertext", s."iv", s."auth_tag", s."last4", s."updated_by_user_id", s."created_at", s."updated_at"
FROM "integration_secret" s
WHERE s."key" = 'SMTP_PASSWORD' AND s."deleted_at" IS NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "integration_config"
  ("capability","provider","field_key","ciphertext","iv","auth_tag","last4","updated_by_user_id","created_at","updated_at")
SELECT 'storage','r2','secretAccessKey',
       s."ciphertext", s."iv", s."auth_tag", s."last4", s."updated_by_user_id", s."created_at", s."updated_at"
FROM "integration_secret" s
WHERE s."key" = 'R2_SECRET_KEY' AND s."deleted_at" IS NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Each capability ships exactly one provider today, so make it active by default (the owner
-- never has to click "set active" for a sole provider). Unconfigured is still unconfigured:
-- the consumer resolves required fields and 503s until they are present.
INSERT INTO "integration_active_provider" ("capability","provider")
VALUES ('storage','r2'), ('email','smtp')
ON CONFLICT DO NOTHING;