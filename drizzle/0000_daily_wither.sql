CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"organization" varchar(255) NOT NULL,
	"incident_type" varchar(100) NOT NULL,
	"description" text,
	"severity" varchar(50) NOT NULL,
	"location" varchar(255),
	"injuries" integer DEFAULT 0,
	"fatalities" integer DEFAULT 0,
	"economic_loss" numeric(15, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "korgau_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"organization" varchar(255) NOT NULL,
	"observation_type" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"location" varchar(255),
	"corrective_action" text,
	"status" varchar(50) DEFAULT 'open',
	"created_at" timestamp DEFAULT now()
);
