CREATE TYPE "public"."setting_requirement" AS ENUM('required', 'optional');--> statement-breakpoint
CREATE TYPE "public"."setting_scope" AS ENUM('global', 'client');--> statement-breakpoint
CREATE TYPE "public"."setting_type" AS ENUM('text', 'number', 'boolean', 'color', 'url', 'image', 'select', 'localized_text');--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"payload" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"group" text NOT NULL,
	"type" "setting_type" NOT NULL,
	"requirement" "setting_requirement" DEFAULT 'optional' NOT NULL,
	"scope" "setting_scope" DEFAULT 'global' NOT NULL,
	"options" jsonb,
	"default_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "setting_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "setting_value" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_id" uuid NOT NULL,
	"scope" "setting_scope" DEFAULT 'global' NOT NULL,
	"scope_id" text,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "setting_translation" (
	"setting_value_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "setting_translation_setting_value_id_locale_pk" PRIMARY KEY("setting_value_id","locale")
);
--> statement-breakpoint
ALTER TABLE "setting_value" ADD CONSTRAINT "setting_value_setting_id_setting_id_fk" FOREIGN KEY ("setting_id") REFERENCES "public"."setting"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setting_translation" ADD CONSTRAINT "setting_translation_setting_value_id_setting_value_id_fk" FOREIGN KEY ("setting_value_id") REFERENCES "public"."setting_value"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "setting_group_idx" ON "setting" USING btree ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_setting_value_global" ON "setting_value" USING btree ("setting_id") WHERE "setting_value"."scope" = 'global';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_setting_value_scoped" ON "setting_value" USING btree ("setting_id","scope","scope_id") WHERE "setting_value"."scope" <> 'global';