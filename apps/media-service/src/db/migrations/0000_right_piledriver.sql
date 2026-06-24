CREATE TYPE "public"."media_asset_status" AS ENUM('pending', 'ready');--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"payload" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid,
	"key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"status" "media_asset_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "media_asset_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "media_asset_translation" (
	"media_asset_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"alt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_asset_translation_media_asset_id_locale_pk" PRIMARY KEY("media_asset_id","locale")
);
--> statement-breakpoint
ALTER TABLE "media_folder" ADD CONSTRAINT "media_folder_parent_id_media_folder_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_folder_id_media_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset_translation" ADD CONSTRAINT "media_asset_translation_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_folder_parent_idx" ON "media_folder" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "media_asset_folder_idx" ON "media_asset" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "media_asset_status_idx" ON "media_asset" USING btree ("status");