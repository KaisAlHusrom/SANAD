CREATE TABLE "testimonial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"company_name" text,
	"avatar_media_id" uuid,
	"rating" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "testimonial_translation" (
	"testimonial_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"quote" text,
	"author_role" text,
	"company_descriptor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "testimonial_translation_testimonial_id_locale_pk" PRIMARY KEY("testimonial_id","locale")
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"avatar_media_id" uuid,
	"email" text,
	"linkedin_url" text,
	"github_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "team_member_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_member_translation" (
	"team_member_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"name" text,
	"role" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_translation_team_member_id_locale_pk" PRIMARY KEY("team_member_id","locale")
);
--> statement-breakpoint
ALTER TABLE "testimonial_translation" ADD CONSTRAINT "testimonial_translation_testimonial_id_testimonial_id_fk" FOREIGN KEY ("testimonial_id") REFERENCES "public"."testimonial"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_translation" ADD CONSTRAINT "team_member_translation_team_member_id_team_member_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "testimonial_featured_idx" ON "testimonial" USING btree ("featured","sort_order");--> statement-breakpoint
CREATE INDEX "testimonial_avatar_media_idx" ON "testimonial" USING btree ("avatar_media_id");--> statement-breakpoint
CREATE INDEX "team_member_featured_idx" ON "team_member" USING btree ("featured","sort_order");--> statement-breakpoint
CREATE INDEX "team_member_avatar_media_idx" ON "team_member" USING btree ("avatar_media_id");