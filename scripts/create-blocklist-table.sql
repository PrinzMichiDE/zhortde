-- Quick fix: Create blocked_domains table
-- Run this if you get error: relation "blocked_domains" does not exist

-- Create blocked_domains table
CREATE TABLE IF NOT EXISTS "blocked_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_domains_domain_unique" UNIQUE("domain")
);

-- Create index for fast lookups (important for performance!)
CREATE INDEX IF NOT EXISTS "blocked_domains_domain_idx" ON "blocked_domains" ("domain");

-- Verify table creation
DO $$
BEGIN
  RAISE NOTICE '✅ Table blocked_domains created successfully!';
  RAISE NOTICE 'The blocklist will be loaded automatically on first request (30-60 seconds)';
  RAISE NOTICE 'To load manually: POST /api/admin/blocklist (requires authentication)';
END $$;

