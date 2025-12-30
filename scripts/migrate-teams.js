#!/usr/bin/env node

/**
 * Migration script to create teams tables
 * This script creates the teams, team_members, and team_links tables
 * if they don't already exist.
 */

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL oder POSTGRES_URL nicht gefunden!');
  console.log('\n📝 Bitte setzen Sie die Umgebungsvariable:');
  console.log('export DATABASE_URL="postgresql://..."');
  process.exit(1);
}

async function migrateTeams() {
  // Dynamically import postgres
  const postgres = (await import('postgres')).default;
  const sql = postgres(databaseUrl);
  
  try {
    console.log('\n📊 Erstelle Teams-Tabellen...\n');
    
    // Create teams table
    await sql`
      CREATE TABLE IF NOT EXISTS "teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "owner_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Tabelle "teams" erstellt/überprüft');
    
    // Create team_members table
    await sql`
      CREATE TABLE IF NOT EXISTS "team_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "role" text DEFAULT 'member' NOT NULL,
        "permissions" text,
        "joined_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Tabelle "team_members" erstellt/überprüft');
    
    // Create team_links table
    await sql`
      CREATE TABLE IF NOT EXISTS "team_links" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL,
        "link_id" integer NOT NULL,
        "added_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Tabelle "team_links" erstellt/überprüft');
    
    // Add foreign key constraints (with IF NOT EXISTS check)
    const constraints = [
      {
        name: 'teams_owner_id_users_id_fk',
        sql: sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'teams_owner_id_users_id_fk'
            ) THEN
              ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" 
              FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
          END $$;
        `
      },
      {
        name: 'team_members_team_id_teams_id_fk',
        sql: sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'team_members_team_id_teams_id_fk'
            ) THEN
              ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" 
              FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
          END $$;
        `
      },
      {
        name: 'team_members_user_id_users_id_fk',
        sql: sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'team_members_user_id_users_id_fk'
            ) THEN
              ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" 
              FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
          END $$;
        `
      },
      {
        name: 'team_links_team_id_teams_id_fk',
        sql: sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'team_links_team_id_teams_id_fk'
            ) THEN
              ALTER TABLE "team_links" ADD CONSTRAINT "team_links_team_id_teams_id_fk" 
              FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
          END $$;
        `
      },
      {
        name: 'team_links_link_id_links_id_fk',
        sql: sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'team_links_link_id_links_id_fk'
            ) THEN
              ALTER TABLE "team_links" ADD CONSTRAINT "team_links_link_id_links_id_fk" 
              FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
          END $$;
        `
      },
      {
        name: 'link_comments_team_id_teams_id_fk',
        sql: sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'link_comments_team_id_teams_id_fk'
            ) THEN
              ALTER TABLE "link_comments" ADD CONSTRAINT "link_comments_team_id_teams_id_fk" 
              FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
            END IF;
          END $$;
        `
      }
    ];
    
    for (const constraint of constraints) {
      try {
        await constraint.sql;
        console.log(`✅ Foreign Key "${constraint.name}" hinzugefügt/überprüft`);
      } catch (error) {
        const errorMsg = error?.message || String(error);
        if (!errorMsg.includes('already exists') && !errorMsg.includes('does not exist')) {
          console.log(`ℹ️  Foreign Key "${constraint.name}": ${errorMsg}`);
        }
      }
    }
    
    console.log('\n✅ Alle Teams-Tabellen erfolgreich erstellt/überprüft!\n');
    
  } catch (error) {
    console.error('\n❌ Fehler beim Erstellen der Teams-Tabellen:');
    console.error(error?.message || String(error));
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrateTeams();
