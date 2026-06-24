CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "blog_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "blog_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_category_translation" (
	"blog_category_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_category_translation_blog_category_id_locale_pk" PRIMARY KEY("blog_category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "blog_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "blog_tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_tag_translation" (
	"blog_tag_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_tag_translation_blog_tag_id_locale_pk" PRIMARY KEY("blog_tag_id","locale")
);
--> statement-breakpoint
CREATE TABLE "blog_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category_id" uuid,
	"author_team_member_id" uuid,
	"cover_media_id" uuid,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"read_minutes" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_post_translation" (
	"blog_post_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text,
	"excerpt" text,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_translation_blog_post_id_locale_pk" PRIMARY KEY("blog_post_id","locale")
);
--> statement-breakpoint
CREATE TABLE "blog_post_tag" (
	"blog_post_id" uuid NOT NULL,
	"blog_tag_id" uuid NOT NULL,
	CONSTRAINT "blog_post_tag_blog_post_id_blog_tag_id_pk" PRIMARY KEY("blog_post_id","blog_tag_id")
);
--> statement-breakpoint
ALTER TABLE "blog_category_translation" ADD CONSTRAINT "blog_category_translation_blog_category_id_blog_category_id_fk" FOREIGN KEY ("blog_category_id") REFERENCES "public"."blog_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_tag_translation" ADD CONSTRAINT "blog_tag_translation_blog_tag_id_blog_tag_id_fk" FOREIGN KEY ("blog_tag_id") REFERENCES "public"."blog_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_category_id_blog_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_team_member_id_team_member_id_fk" FOREIGN KEY ("author_team_member_id") REFERENCES "public"."team_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_translation" ADD CONSTRAINT "blog_post_translation_blog_post_id_blog_post_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tag" ADD CONSTRAINT "blog_post_tag_blog_post_id_blog_post_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tag" ADD CONSTRAINT "blog_post_tag_blog_tag_id_blog_tag_id_fk" FOREIGN KEY ("blog_tag_id") REFERENCES "public"."blog_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_status_idx" ON "blog_post" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "blog_post_category_idx" ON "blog_post" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "blog_post_author_idx" ON "blog_post" USING btree ("author_team_member_id");--> statement-breakpoint
CREATE INDEX "blog_post_cover_media_idx" ON "blog_post" USING btree ("cover_media_id");