ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passkey_login_token_hash" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passkey_login_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passkey_challenge" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passkey_challenge_expires_at" timestamp;
