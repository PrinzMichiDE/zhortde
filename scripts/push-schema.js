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
  const match = line.match(/^([^=#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    
    // Remove quotes
    value = value.replace(/^["']|["']$/g, '');
    
    envVars[key] = value;
  }
});

if (!envVars.DATABASE_URL && !envVars.POSTGRES_URL) {
  console.error('❌ DATABASE_URL oder POSTGRES_URL nicht in .env.local gefunden!');
  process.exit(1);
}

const databaseUrl = envVars.DATABASE_URL || envVars.POSTGRES_URL;

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

