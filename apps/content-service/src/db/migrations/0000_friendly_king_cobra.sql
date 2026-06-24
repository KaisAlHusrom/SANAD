CREATE TYPE "public"."block_type" AS ENUM('text', 'richtext', 'stat', 'step', 'feature', 'image', 'cta');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('contact', 'request-project');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."page_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('hero', 'trust', 'services', 'process', 'work', 'stats', 'testimonials', 'blog', 'cta', 'richtext');--> statement-breakpoint
CREATE TYPE "public"."service_category" AS ENUM('core', 'support');--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"payload" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "page" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "page_status" DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "page_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_translation" (
	"page_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_translation_page_id_locale_pk" PRIMARY KEY("page_id","locale")
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"type" "section_type" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "section_translation" (
	"section_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"eyebrow" text,
	"title" text,
	"subtitle" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "section_translation_section_id_locale_pk" PRIMARY KEY("section_id","locale")
);
--> statement-breakpoint
CREATE TABLE "block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"type" "block_type" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image_media_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "block_translation" (
	"block_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "block_translation_block_id_locale_pk" PRIMARY KEY("block_id","locale")
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"icon_key" text,
	"category" "service_category" NOT NULL,
	"cover_media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "service_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "service_translation" (
	"service_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"summary" text,
	"detail_body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_translation_service_id_locale_pk" PRIMARY KEY("service_id","locale")
);
--> statement-breakpoint
CREATE TABLE "lead" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"budget" text,
	"project_type" text,
	"message" text NOT NULL,
	"source" "lead_source" DEFAULT 'contact' NOT NULL,
	"locale" text DEFAULT 'ar' NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "processed_message" (
	"consumer_id" text NOT NULL,
	"message_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_message_consumer_id_message_id_pk" PRIMARY KEY("consumer_id","message_id")
);
--> statement-breakpoint
ALTER TABLE "page_translation" ADD CONSTRAINT "page_translation_page_id_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_page_id_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_translation" ADD CONSTRAINT "section_translation_section_id_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_section_id_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_translation" ADD CONSTRAINT "block_translation_block_id_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_translation" ADD CONSTRAINT "service_translation_service_id_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_status_idx" ON "page" USING btree ("status");--> statement-breakpoint
CREATE INDEX "section_page_idx" ON "section" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "block_section_idx" ON "block" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "block_image_media_idx" ON "block" USING btree ("image_media_id");--> statement-breakpoint
CREATE INDEX "service_category_idx" ON "service" USING btree ("category");--> statement-breakpoint
CREATE INDEX "service_cover_media_idx" ON "service" USING btree ("cover_media_id");--> statement-breakpoint
CREATE INDEX "lead_status_idx" ON "lead" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_created_idx" ON "lead" USING btree ("created_at");