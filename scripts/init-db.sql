

-- Zhort Database Initialization Script
-- Run this script in your PostgreSQL database (e.g., Vercel Postgres)

-- Create stats table
CREATE TABLE IF NOT EXISTS "stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "stats_key_unique" UNIQUE("key")
);

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Create links table
CREATE TABLE IF NOT EXISTS "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_code" text NOT NULL,
	"long_url" text NOT NULL,
	"user_id" integer,
	"is_public" boolean DEFAULT true NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"password_hash" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "links_short_code_unique" UNIQUE("short_code")
);

-- Create pastes table
CREATE TABLE IF NOT EXISTS "pastes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"user_id" integer,
	"syntax_highlighting_language" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"password_hash" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pastes_slug_unique" UNIQUE("slug")
);

-- Create blocked_domains table for blocklist
CREATE TABLE IF NOT EXISTS "blocked_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_domains_domain_unique" UNIQUE("domain")
);

-- Create index for fast domain lookups
CREATE INDEX IF NOT EXISTS "blocked_domains_domain_idx" ON "blocked_domains" ("domain");

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"action" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS "rate_limits_identifier_action_idx" 
ON "rate_limits" ("identifier", "action", "window_start");

-- Create indexes for expiration queries
CREATE INDEX IF NOT EXISTS "links_expires_at_idx" 
ON "links" ("expires_at") WHERE "expires_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "pastes_expires_at_idx" 
ON "pastes" ("expires_at") WHERE "expires_at" IS NOT NULL;

-- Add foreign keys
ALTER TABLE "links" DROP CONSTRAINT IF EXISTS "links_user_id_users_id_fk";
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "pastes" DROP CONSTRAINT IF EXISTS "pastes_user_id_users_id_fk";
ALTER TABLE "pastes" ADD CONSTRAINT "pastes_user_id_users_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
  ON DELETE cascade ON UPDATE no action;

-- Initialize stats
INSERT INTO "stats" ("key", "value") 
VALUES ('visitors', 126819), ('links', 54428)
ON CONFLICT ("key") DO NOTHING;

-- Success message (PostgreSQL will show this)
DO $$
BEGIN
  RAISE NOTICE 'Database initialization complete! ✅';
END $$;

