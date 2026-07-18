#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Seed Statistics
 * Fügt initiale Fake-Werte in die stats Tabelle ein
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local nicht gefunden!');
  console.log('Führen Sie aus: .\\scripts\\update-env.ps1\n');
  process.exit(1);
}

// Parse .env.local
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

const databaseUrl = envVars.DATABASE_URL || envVars.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gefunden!');
  process.exit(1);
}

// Import postgres
const postgres = require('postgres');

const INITIAL_VISITORS = 267843;
const INITIAL_LINKS = 71529;

async function seedStats() {
  console.log('\n📊 Seeding Statistics...\n');
  
  const sql = postgres(databaseUrl, {
    max: 1,
  });

  try {
    // Delete existing stats
    await sql`DELETE FROM stats WHERE key IN ('visitors', 'links')`;
    console.log('✓ Alte Statistiken gelöscht');

    // Insert new stats
    await sql`
      INSERT INTO stats (key, value) 
      VALUES 
        ('visitors', ${INITIAL_VISITORS}),
        ('links', ${INITIAL_LINKS})
    `;
    console.log('✓ Neue Statistiken eingefügt');

    // Verify
    const result = await sql`SELECT * FROM stats ORDER BY key`;
    
    console.log('\n📈 Aktuelle Statistiken:\n');
    result.forEach(row => {
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

