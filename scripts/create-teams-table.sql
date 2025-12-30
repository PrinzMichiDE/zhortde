-- Create teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"permissions" text,
	"joined_at" timestamp DEFAULT now() NOT NULL
);

-- Create team_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS "team_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"link_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teams_owner_id_users_id_fk'
    ) THEN
        ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" 
        FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_members_team_id_teams_id_fk'
    ) THEN
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" 
        FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_members_user_id_users_id_fk'
    ) THEN
        ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_links_team_id_teams_id_fk'
    ) THEN
        ALTER TABLE "team_links" ADD CONSTRAINT "team_links_team_id_teams_id_fk" 
        FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_links_link_id_links_id_fk'
    ) THEN
        ALTER TABLE "team_links" ADD CONSTRAINT "team_links_link_id_links_id_fk" 
        FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
