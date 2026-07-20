CREATE TABLE IF NOT EXISTS "passkey_auth_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"challenge" text,
	"challenge_expires_at" timestamp,
	"login_token_hash" text,
	"login_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "passkey_auth_attempts_login_token_hash_unique" UNIQUE("login_token_hash")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "passkey_auth_attempts_challenge_expires_idx" ON "passkey_auth_attempts" USING btree ("challenge_expires_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "passkey_auth_attempts_token_expires_idx" ON "passkey_auth_attempts" USING btree ("login_token_expires_at");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passkey_auth_attempts" ADD CONSTRAINT "passkey_auth_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
