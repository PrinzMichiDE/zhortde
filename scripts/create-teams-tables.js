#!/usr/bin/env node

/**
 * Erstellt die Teams-Tabellen falls sie nicht existieren
 * Kann direkt ausgeführt werden oder als Fallback verwendet werden
 */

const fs = require('fs');
const path = require('path');

// Versuche .env.local zu laden
const envPath = path.join(process.cwd(), '.env.local');
let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('#') || !line) return;
    
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) return;
    
    const key = line.substring(0, equalIndex).trim();
    let value = line.substring(equalIndex + 1).trim();
    
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    
    if (key && value) {
      envVars[key] = value;
    }
  });
  
  databaseUrl = databaseUrl || envVars.DATABASE_URL || envVars.POSTGRES_URL;
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL oder POSTGRES_URL nicht gefunden!');
  console.log('\n📝 Bitte setzen Sie die Umgebungsvariable:');
  console.log('export DATABASE_URL="postgresql://..."');
  console.log('\noder führen Sie aus:');
  console.log('npm run db:push\n');
  process.exit(1);
}

async function createTeamsTables() {
  // Dynamisch postgres importieren
  const postgres = (await import('postgres')).default;
  const sql = postgres(databaseUrl);
  
  try {
    console.log('\n📊 Erstelle Teams-Tabellen...\n');
    
    // Erstelle teams Tabelle
    await sql`
      CREATE TABLE IF NOT EXISTS "teams" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "owner_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Tabelle "teams" erstellt/überprüft');
    
    // Erstelle team_members Tabelle
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
    
    // Erstelle team_links Tabelle
    await sql`
      CREATE TABLE IF NOT EXISTS "team_links" (
        "id" serial PRIMARY KEY NOT NULL,
        "team_id" integer NOT NULL,
        "link_id" integer NOT NULL,
        "added_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Tabelle "team_links" erstellt/überprüft');
    
    // Füge Foreign Keys hinzu (mit Fehlerbehandlung)
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'teams_owner_id_users_id_fk'
          ) THEN
            ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" 
            FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
        END $$;
      `;
      console.log('✅ Foreign Key für teams.owner_id hinzugefügt/überprüft');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  Foreign Key für teams.owner_id bereits vorhanden');
      }
    }
    
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'team_members_team_id_teams_id_fk'
          ) THEN
            ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
        END $$;
      `;
      console.log('✅ Foreign Key für team_members.team_id hinzugefügt/überprüft');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  Foreign Key für team_members.team_id bereits vorhanden');
      }
    }
    
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'team_members_user_id_users_id_fk'
          ) THEN
            ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
        END $$;
      `;
      console.log('✅ Foreign Key für team_members.user_id hinzugefügt/überprüft');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  Foreign Key für team_members.user_id bereits vorhanden');
      }
    }
    
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'team_links_team_id_teams_id_fk'
          ) THEN
            ALTER TABLE "team_links" ADD CONSTRAINT "team_links_team_id_teams_id_fk" 
            FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
        END $$;
      `;
      console.log('✅ Foreign Key für team_links.team_id hinzugefügt/überprüft');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  Foreign Key für team_links.team_id bereits vorhanden');
      }
    }
    
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'team_links_link_id_links_id_fk'
          ) THEN
            ALTER TABLE "team_links" ADD CONSTRAINT "team_links_link_id_links_id_fk" 
            FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
        END $$;
      `;
      console.log('✅ Foreign Key für team_links.link_id hinzugefügt/überprüft');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.log('ℹ️  Foreign Key für team_links.link_id bereits vorhanden');
      }
    }
    
    console.log('\n✅ Alle Teams-Tabellen erfolgreich erstellt/überprüft!\n');
    
  } catch (error) {
    console.error('\n❌ Fehler beim Erstellen der Teams-Tabellen:');
    console.error(error.message);
    console.log('\n💡 Alternative: Führen Sie aus:');
    console.log('npm run db:push\n');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createTeamsTables();
