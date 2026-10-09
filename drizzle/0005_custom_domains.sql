CREATE TABLE IF NOT EXISTS "custom_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"domain" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"dns_records" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "custom_domains_user_id_domain_unique" UNIQUE("user_id", "domain")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_domains_user_id_idx" ON "custom_domains" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_domains_domain_idx" ON "custom_domains" USING btree ("domain");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
