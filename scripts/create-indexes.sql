-- Create indexes for better performance

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS "rate_limits_identifier_action_idx" 
ON "rate_limits" ("identifier", "action", "window_start");

-- Expiration indexes (partial indexes for better performance)
CREATE INDEX IF NOT EXISTS "links_expires_at_idx" 
ON "links" ("expires_at") WHERE "expires_at" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "pastes_expires_at_idx" 
ON "pastes" ("expires_at") WHERE "expires_at" IS NOT NULL;

-- Success message
SELECT 'Indexes created successfully!' as status;

