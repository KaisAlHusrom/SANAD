CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."notification_email_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_recipient_kind" AS ENUM('role', 'user', 'email');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_kind" "notification_recipient_kind" NOT NULL,
	"recipient" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"email_status" "notification_email_status",
	"sent_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_message" (
	"consumer_id" text NOT NULL,
	"message_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_message_consumer_id_message_id_pk" PRIMARY KEY("consumer_id","message_id")
);
--> statement-breakpoint
CREATE INDEX "notification_recipient_idx" ON "notification" USING btree ("recipient_kind","recipient");--> statement-breakpoint
CREATE INDEX "notification_channel_idx" ON "notification" USING btree ("channel");