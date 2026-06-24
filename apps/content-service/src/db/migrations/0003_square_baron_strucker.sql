CREATE TYPE "public"."portfolio_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "portfolio_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "portfolio_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "portfolio_category_translation" (
	"portfolio_category_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_category_translation_portfolio_category_id_locale_pk" PRIMARY KEY("portfolio_category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "portfolio_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category_id" uuid,
	"cover_media_id" uuid,
	"client_name" text,
	"project_url" text,
	"status" "portfolio_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "portfolio_project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "portfolio_project_translation" (
	"portfolio_project_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"summary" text,
	"challenge" text,
	"solution" text,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_project_translation_portfolio_project_id_locale_pk" PRIMARY KEY("portfolio_project_id","locale")
);
--> statement-breakpoint
ALTER TABLE "portfolio_category_translation" ADD CONSTRAINT "portfolio_category_translation_portfolio_category_id_portfolio_category_id_fk" FOREIGN KEY ("portfolio_category_id") REFERENCES "public"."portfolio_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_project" ADD CONSTRAINT "portfolio_project_category_id_portfolio_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."portfolio_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_project_translation" ADD CONSTRAINT "portfolio_project_translation_portfolio_project_id_portfolio_project_id_fk" FOREIGN KEY ("portfolio_project_id") REFERENCES "public"."portfolio_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portfolio_project_status_idx" ON "portfolio_project" USING btree ("status","sort_order");--> statement-breakpoint
CREATE INDEX "portfolio_project_category_idx" ON "portfolio_project" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "portfolio_project_featured_idx" ON "portfolio_project" USING btree ("featured","sort_order");--> statement-breakpoint
CREATE INDEX "portfolio_project_cover_media_idx" ON "portfolio_project" USING btree ("cover_media_id");