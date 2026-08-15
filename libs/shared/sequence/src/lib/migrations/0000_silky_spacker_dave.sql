CREATE TABLE "sequence_counter" (
	"entity" text NOT NULL,
	"period" text NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sequence_counter_entity_period_pk" PRIMARY KEY("entity","period")
);
