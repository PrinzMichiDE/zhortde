#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Seed Statistics
 * Fügt initiale Fake-Werte in die stats Tabelle ein (nur wenn noch nicht vorhanden)
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const envVars = {};
  const envContent = fs.readFileSync(filePath, 'utf8');

  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (line.startsWith('#') || !line) {
      return;
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      return;
    }

    const key = line.substring(0, equalIndex).trim();
    let value = line.substring(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.substring(1, value.length - 1);
    }

    if (key && value) {
      envVars[key] = value;
    }
  });

  return envVars;
}

const envPath = path.join(process.cwd(), '.env.local');
const fileEnv = loadEnvFile(envPath);
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  fileEnv.DATABASE_URL ||
  fileEnv.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gefunden!');
  process.exit(1);
}

const postgres = require('postgres');

const INITIAL_VISITORS = 267843;
const INITIAL_LINKS = 71529;

async function seedStats() {
  console.log('\n📊 Seeding Statistics...\n');

  const sql = postgres(databaseUrl, {
    max: 1,
    onnotice: () => {},
  });

  try {
    await sql`
      INSERT INTO stats (key, value)
      VALUES
        ('visitors', ${INITIAL_VISITORS}),
        ('links', ${INITIAL_LINKS})
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('✓ Statistiken initialisiert (bestehende Werte bleiben erhalten)');

    const result = await sql`SELECT * FROM stats ORDER BY key`;

    console.log('\n📈 Aktuelle Statistiken:\n');
    result.forEach((row) => {
      const formatted = row.value.toLocaleString('de-DE');
      console.log(`  ${row.key}: ${formatted}`);
    });

    console.log('\n✅ Statistiken erfolgreich initialisiert!\n');
  } catch (error) {
    console.error('\n❌ Fehler:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedStats();
