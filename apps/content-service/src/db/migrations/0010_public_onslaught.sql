ALTER TABLE "lead" ADD COLUMN "spam_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lead" ADD COLUMN "spam_signals" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "lead_spam_score_idx" ON "lead" USING btree ("spam_score");