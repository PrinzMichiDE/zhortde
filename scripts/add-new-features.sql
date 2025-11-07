-- Zhort v2.0 Features Migration
-- Adds: Rate Limiting, Expiration, Password Protection

-- Add new columns to links table
ALTER TABLE "links" 
ADD COLUMN IF NOT EXISTS "password_hash" text,
ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

-- Add new columns to pastes table
ALTER TABLE "pastes" 
ADD COLUMN IF NOT EXISTS "password_hash" text,
ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"action" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for efficient rate limit queries
CREATE INDEX IF NOT EXISTS "rate_limits_identifier_action_idx" 
ON "rate_limits" ("identifier", "action", "window_start");

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS "links_expires_at_idx" 
ON "links" ("expires_at") WHERE "expires_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "pastes_expires_at_idx" 
ON "pastes" ("expires_at") WHERE "expires_at" IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'v2.0 features migration complete! ✅';
  RAISE NOTICE '- Rate limiting enabled';
  RAISE NOTICE '- Expiration support added';
  RAISE NOTICE '- Password protection ready';
END $$;

