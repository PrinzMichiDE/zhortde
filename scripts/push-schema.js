#!/usr/bin/env node

/**
 * Push Schema zur Datenbank
 * Lädt .env.local und führt drizzle-kit push aus
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local nicht gefunden!');
  console.log('\n📝 Erstellen Sie .env.local mit:');
  console.log('npm run quickfix\n');
  process.exit(1);
}

// Parse .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  // Skip comments and empty lines
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
  
  // Remove surrounding quotes (both single and double)
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.substring(1, value.length - 1);
  }
  
  if (key && value) {
    envVars[key] = value;
  }
});

if (!envVars.DATABASE_URL && !envVars.POSTGRES_URL) {
  console.error('❌ DATABASE_URL oder POSTGRES_URL nicht in .env.local gefunden!');
  console.log('\n📝 Ihre .env.local sollte enthalten:');
  console.log('DATABASE_URL="postgresql://..."');
  console.log('\noder');
  console.log('POSTGRES_URL="postgresql://..."\n');
  process.exit(1);
}

const databaseUrl = envVars.DATABASE_URL || envVars.POSTGRES_URL;

// Validate it's a PostgreSQL URL
if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.error('❌ Ungültige DATABASE_URL!');
  console.log(`Gefunden: ${databaseUrl}`);
  console.log('\nMuss starten mit: postgres:// oder postgresql://\n');
  process.exit(1);
}

console.log('\n📊 Pushing schema to database...\n');
console.log(`Database: ${databaseUrl.replace(/:([^:@]+)@/, ':****@')}\n`);

try {
  // Set environment variable and run drizzle-kit push
  process.env.DATABASE_URL = databaseUrl;
  process.env.POSTGRES_URL = databaseUrl;
  
  execSync('drizzle-kit push', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      POSTGRES_URL: databaseUrl,
    }
  });
  
  console.log('\n✅ Schema erfolgreich gepusht!\n');
  console.log('🚀 Starten Sie jetzt den Dev-Server:');
  console.log('npm run dev\n');
} catch (error) {
  console.error('\n❌ Fehler beim Pushen des Schemas');
  process.exit(1);
}

